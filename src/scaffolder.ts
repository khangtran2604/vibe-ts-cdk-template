/**
 * Scaffolding engine for vibe-ts-cdk-template.
 *
 * Exports a single {@link scaffold} function that takes a fully-resolved
 * {@link ProjectConfig} and produces a scaffolded project directory on disk.
 *
 * Orchestration order:
 *  1. Resolve template root (ESM-safe, handles dist/ layout).
 *  2. Validate that the target directory does not already exist.
 *  3. Create the project directory.
 *  4. Copy template directories in the order prescribed by getTemplateDirs().
 *  5. Write pnpm-workspace.yaml programmatically.
 *  6. Write README.md programmatically.
 *  7. Optionally run git init.
 *  8. Optionally run pnpm install.
 *
 * Error policy: errors propagate to the caller (src/index.ts handles the outer
 * try/catch).  Nothing is swallowed silently.
 */

import { mkdir, access, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as clack from "@clack/prompts";
import { copyDir } from "./utils/fs.js";
import { initGit } from "./utils/git.js";
import { installDeps } from "./utils/pnpm.js";
import * as logger from "./utils/logger.js";
import {
  getTemplateDirs,
  getVariableMap,
  getWorkspaceEntries,
} from "./template-helpers.js";
import { generateReadme } from "./utils/readme.js";
import type { ProjectConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Template root resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the absolute path to the `templates/` directory at the monorepo
 * root.  Works correctly in both development (ts-node/tsx from src/) and
 * production (dist/index.js, one level below root).
 *
 * `import.meta.dirname` is available in Node 21+ (our target is Node 24) and
 * is equivalent to `path.dirname(fileURLToPath(import.meta.url))`.
 *
 * Layout:
 *   <root>/dist/index.js   → import.meta.dirname = <root>/dist
 *   <root>/templates/      → path.resolve(<root>/dist, "..", "templates")
 */
function resolveTemplateRoot(): string {
  // import.meta.dirname is Node 21+ — safe for our Node 24 target.
  // Fall back to the fileURLToPath approach for defensive coverage.
  const dir =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta as any).dirname ??
    dirname(fileURLToPath(import.meta.url));
  return join(dir, "..", "templates");
}

// ---------------------------------------------------------------------------
// Directory existence check
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the path already exists on disk (file or directory).
 * Uses `fs/promises.access` which throws if the path does not exist.
 */
async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// pnpm-workspace.yaml generator
// ---------------------------------------------------------------------------

/**
 * Serialises the workspace entries array into valid pnpm-workspace.yaml
 * content.
 *
 * Example output:
 * ```yaml
 * packages:
 *   - "infra"
 *   - "services/*"
 *   - "dev-gateway"
 *   - "packages/*"
 * ```
 *
 * @param entries - Ordered list of pnpm workspace glob patterns.
 * @returns The YAML file content as a string (includes trailing newline).
 */
function buildWorkspaceYaml(entries: string[]): string {
  const lines = entries.map((e) => `  - "${e}"`).join("\n");
  return `packages:\n${lines}\n`;
}

// ---------------------------------------------------------------------------
// Template subdirectory set
// ---------------------------------------------------------------------------

/**
 * Template dirs that should be placed inside a same-named subdirectory rather
 * than merged into the project root.
 *
 * - "services"    → projectDir/services/   (workspace glob: services/*)
 * - "infra"       → projectDir/infra/       (workspace member: infra)
 * - "dev-gateway" → projectDir/dev-gateway/ (workspace member: dev-gateway)
 * - "packages"    → projectDir/packages/    (workspace glob: packages/*)
 * - "frontend"    → projectDir/frontend/    (workspace member: frontend)
 * - "auth"        → projectDir/auth/        (workspace member: auth)
 * - "e2e"         → projectDir/e2e/         (workspace member: e2e)
 *
 * Template directories NOT in this set (base, database, cicd, monitoring,
 * extras) are merged directly into the project root so their contents appear
 * at the correct top-level paths.
 *
 * Expressed as a module-level constant so future additions are trivial and
 * the set is only allocated once across all scaffold() invocations.
 */
const SUBDIR_TEMPLATE_DIRS = new Set([
  "services",
  "infra",
  "dev-gateway",
  "packages",
  "frontend",
  "auth",
  "e2e",
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scaffold a new project from the resolved {@link ProjectConfig}.
 *
 * This is the single entry point called from `src/index.ts` after the
 * interactive-prompt phase has produced a complete config object.
 *
 * The function does NOT catch errors — any I/O or validation failure is
 * propagated to the caller, which is responsible for the outer try/catch and
 * appropriate user-facing messaging.
 *
 * @param config - Fully-resolved project configuration produced by runPrompts().
 * @throws {Error} When the target directory already exists.
 * @throws {Error} When any template copy or file write fails.
 */
export async function scaffold(config: ProjectConfig): Promise<void> {
  const templateRoot = resolveTemplateRoot();
  const projectDir = join(process.cwd(), config.projectName);

  // -------------------------------------------------------------------------
  // Step 1: Guard — target directory must not already exist.
  // -------------------------------------------------------------------------
  if (await pathExists(projectDir)) {
    throw new Error(
      `Directory "${config.projectName}" already exists in ${process.cwd()}. ` +
        `Choose a different project name or remove the existing directory.`
    );
  }

  // -------------------------------------------------------------------------
  // Step 2: Create project root directory.
  // -------------------------------------------------------------------------
  const createSpinner = clack.spinner();
  createSpinner.start(`Creating project directory "${config.projectName}"…`);
  await mkdir(projectDir, { recursive: true });
  createSpinner.stop(`Project directory created.`);

  // -------------------------------------------------------------------------
  // Step 3: Resolve template metadata.
  // -------------------------------------------------------------------------
  const templateDirs = getTemplateDirs(config.features);
  const variables = getVariableMap(config);

  logger.info(
    `Scaffolding preset "${config.preset}" with ${templateDirs.length} template ` +
      `${templateDirs.length === 1 ? "layer" : "layers"}…`
  );

  // -------------------------------------------------------------------------
  // Step 4: Copy template directories.
  //
  // Each template dir is copied to either:
  //   - A named subdirectory (infra, services, dev-gateway, packages)
  //     → see SUBDIR_TEMPLATE_DIRS above
  //   - The project root  (base, frontend, auth, e2e, database, cicd,
  //                        monitoring, extras)
  //
  // Subdirectory template dirs land inside a same-named folder so their
  // contents appear at the expected workspace paths (e.g. infra/src/index.ts,
  // services/health/src/index.ts).  Root template dirs are merged directly
  // into the project root.
  // -------------------------------------------------------------------------

  const copySpinner = clack.spinner();
  copySpinner.start("Copying template files…");

  for (const dir of templateDirs) {
    const srcDir = join(templateRoot, dir);
    const destDir = SUBDIR_TEMPLATE_DIRS.has(dir)
      ? join(projectDir, dir)
      : projectDir;

    await copyDir(srcDir, destDir, variables, config.features);
  }

  copySpinner.stop("Template files copied.");

  // -------------------------------------------------------------------------
  // Step 5: Write pnpm-workspace.yaml programmatically.
  //
  // NOT a template — the workspace entries vary by preset so we generate the
  // file from the resolved workspace entries list.
  // -------------------------------------------------------------------------
  const workspaceEntries = getWorkspaceEntries(config.features);
  const workspaceYaml = buildWorkspaceYaml(workspaceEntries);
  await writeFile(join(projectDir, "pnpm-workspace.yaml"), workspaceYaml, "utf8");
  logger.success("pnpm-workspace.yaml written.");

  // -------------------------------------------------------------------------
  // Step 6: Write README.md programmatically.
  //
  // Like pnpm-workspace.yaml, the README varies by preset and feature flags
  // so it is generated in code rather than from a template.
  // -------------------------------------------------------------------------
  const readmeContent = generateReadme(config);
  await writeFile(join(projectDir, "README.md"), readmeContent, "utf8");
  logger.success("README.md written.");

  // -------------------------------------------------------------------------
  // Step 7: Optional git init.
  // -------------------------------------------------------------------------
  if (config.gitInit) {
    await initGit(projectDir);
  } else {
    logger.info("Skipping git init (--no-git).");
  }

  // -------------------------------------------------------------------------
  // Step 8: Optional pnpm install.
  // -------------------------------------------------------------------------
  if (config.installDeps) {
    await installDeps(projectDir);
  } else {
    logger.info("Skipping dependency install (--no-install).");
  }
}
