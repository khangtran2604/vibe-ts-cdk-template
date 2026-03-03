/**
 * Interactive prompt flow for the `module` subcommand.
 *
 * Collects the information required to build a {@link ModuleConfig} from the
 * user.  The module name comes from the CLI argument (not an interactive
 * prompt) and is validated here.  Remaining questions (install preference) are
 * either skipped when `-y` is active or presented as clack confirmations.
 *
 * Context detection ({@link detectProjectContext}, {@link scanNextPort},
 * {@link readProjectName}) is performed automatically — errors are shown as
 * readable messages rather than raw stack traces.
 */

import * as clack from "@clack/prompts";
import { join } from "node:path";
import {
  detectProjectContext,
  readProjectName,
  scanNextPort,
} from "./module-context.js";
import { toEntityName } from "./module-helpers.js";
import type { ModuleConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Regex for a valid kebab-case module name:
 * - Lowercase letters, digits, and hyphens only.
 * - Must start and end with a lowercase letter or digit (no leading/trailing
 *   hyphens).
 * - No underscores, uppercase letters, or spaces.
 */
const VALID_MODULE_NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

/**
 * Validates a module name and returns an error string on failure, or
 * `undefined` when the value is acceptable.
 */
function validateModuleName(value: string | undefined): string | undefined {
  if (!value || value.trim() === "") {
    return "Module name is required.";
  }
  const trimmed = value.trim();
  if (trimmed !== trimmed.toLowerCase()) {
    return "Module name must be lowercase.";
  }
  if (trimmed.includes("_")) {
    return "Module name must use hyphens, not underscores (e.g. order-items).";
  }
  if (trimmed.includes(" ")) {
    return "Module name must not contain spaces. Use hyphens instead (e.g. order-items).";
  }
  if (!VALID_MODULE_NAME_RE.test(trimmed)) {
    return (
      "Module name may only contain lowercase letters, digits, and hyphens, " +
      "and must start and end with a letter or digit."
    );
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Cancellation helper
// ---------------------------------------------------------------------------

/**
 * Check whether a clack prompt result is a cancellation symbol and, if so,
 * display an `outro` message and exit the process cleanly.
 */
function handleCancel(value: unknown): void {
  if (clack.isCancel(value)) {
    clack.outro("Module generation cancelled. No files were written.");
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Run the module prompt flow and return a complete {@link ModuleConfig} ready
 * for the module generator engine.
 *
 * @param name  - Module name from the CLI positional argument.
 * @param flags - Partial options already provided via CLI flags.
 *
 * @example
 * ```typescript
 * const config = await runModulePrompts("order-items", { yes: true });
 * ```
 */
export async function runModulePrompts(
  name: string,
  flags: { yes?: boolean; install?: boolean },
): Promise<ModuleConfig> {
  const skipAll = flags.yes === true;

  // -------------------------------------------------------------------------
  // Intro banner
  // -------------------------------------------------------------------------
  clack.intro("vibe-ts — generate a new CRUD service module");

  // -------------------------------------------------------------------------
  // 1. Validate module name
  // -------------------------------------------------------------------------
  const nameError = validateModuleName(name);
  if (nameError) {
    clack.log.error(`Invalid module name "${name}": ${nameError}`);
    clack.outro(
      'Module name must be kebab-case, e.g. "order-items" or "products".',
    );
    process.exit(1);
  }

  const moduleName = name.trim();

  // -------------------------------------------------------------------------
  // 2. Detect project context (validates we are inside a scaffolded project)
  // -------------------------------------------------------------------------
  const projectDir = process.cwd();

  const contextSpinner = clack.spinner();
  contextSpinner.start("Detecting project context…");

  let projectName: string;
  let port: number;

  try {
    await detectProjectContext(projectDir);
    [projectName, port] = await Promise.all([
      readProjectName(projectDir),
      scanNextPort(projectDir),
    ]);
    contextSpinner.stop("Project context detected.");
  } catch (err) {
    contextSpinner.stop("Project context detection failed.");
    const message =
      err instanceof Error ? err.message : "Unknown error detecting project.";
    clack.log.error(message);
    clack.outro(
      "Run this command from the root of a scaffolded project (one that contains infra/, services/, dev-gateway/, and pnpm-workspace.yaml).",
    );
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // 3. Derive entity name and resolve target directory
  // -------------------------------------------------------------------------
  const entityName = toEntityName(moduleName);
  const targetDir = join(projectDir, "services", moduleName);

  // -------------------------------------------------------------------------
  // 4. Show summary
  // -------------------------------------------------------------------------
  clack.note(
    [
      `Module name  : ${moduleName}`,
      `Entity name  : ${entityName}`,
      `Port         : ${port}`,
      `Target dir   : ${targetDir}`,
      `Project      : ${projectName}`,
    ].join("\n"),
    "Module to be generated",
  );

  // -------------------------------------------------------------------------
  // 5. Install deps
  // -------------------------------------------------------------------------
  let installDeps: boolean;

  if (flags.install !== undefined) {
    installDeps = flags.install;
  } else if (skipAll) {
    installDeps = true;
  } else {
    const installResult = await clack.confirm({
      message: "Run pnpm install after generation?",
      initialValue: true,
    });
    handleCancel(installResult);
    installDeps = installResult as boolean;
  }

  // -------------------------------------------------------------------------
  // 6. Assemble and return config
  // -------------------------------------------------------------------------
  return {
    moduleName,
    entityName,
    port,
    projectDir,
    projectName,
    installDeps,
  };
}
