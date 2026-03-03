/**
 * Module generator for vibe-ts-cdk-template.
 *
 * Exports a single function, {@link generateModule}, that orchestrates the
 * creation of a new CRUD service module inside an already-scaffolded project:
 *
 *  1. Copy the module template tree into `services/<moduleName>/`
 *  2. Process the CDK stack template and write it to `infra/src/stacks/modules/`
 *  3. Inject the stack import into `infra/src/index.ts`
 *  4. Inject the stack instantiation into `infra/src/index.ts`
 *  5. Inject the dev-gateway route into `dev-gateway/src/gateway.ts`
 *  6. Optionally run `pnpm install`
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import * as clack from "@clack/prompts";

import type { ModuleConfig } from "./types.js";
import { resolveTemplateRoot, pathExists } from "./utils/paths.js";
import { copyDir, replaceVariables } from "./utils/fs.js";
import { installDeps } from "./utils/pnpm.js";
import { getModuleVariableMap, injectBeforeMarker, toPascalCase } from "./module-helpers.js";

/**
 * A "no features" FeatureFlags object used when copying module templates.
 *
 * Module templates do not use `// @feature:X` conditional lines, so all flags
 * are set to false.  This satisfies the `copyDir` signature without activating
 * any feature-gated content.
 */
const NO_FEATURES = {
  frontend: false,
  auth: false,
  e2e: false,
  database: false,
  rds: false,
  cicd: false,
  monitoring: false,
  hooks: false,
} as const;

// ---------------------------------------------------------------------------
// Marker constants — must match the markers present in template files
// ---------------------------------------------------------------------------

const MARKER_IMPORT = "// @module-inject:import";
const MARKER_INSTANCE = "// @module-inject:instance";
const MARKER_ROUTE = "// @module-inject:route";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a new CRUD service module inside an existing scaffolded project.
 *
 * Steps performed (in order):
 *  1. Resolve the template root and build the variable substitution map.
 *  2. Guard against re-generating an existing module.
 *  3. Copy `templates/generators/module/` to `services/<moduleName>/`.
 *  4. Process the CDK stack template and write it to
 *     `infra/src/stacks/modules/<moduleName>-stack.ts`.
 *  5. Inject the CDK import statement into `infra/src/index.ts`.
 *  6. Inject the CDK stack instantiation into `infra/src/index.ts`.
 *  7. Inject the dev-gateway route into `dev-gateway/src/gateway.ts`.
 *  8. Optionally run `pnpm install` when `config.installDeps` is true.
 *
 * @param config - Fully-resolved module configuration produced by the module
 *   prompt flow.
 * @throws {Error} When the module directory already exists (duplicate guard).
 * @throws {Error} When any required inject marker is missing from a target file.
 */
export async function generateModule(config: ModuleConfig): Promise<void> {
  const templateRoot = resolveTemplateRoot();
  const variables = getModuleVariableMap(config);
  const ModuleName = toPascalCase(config.moduleName);

  // -------------------------------------------------------------------------
  // Step 1 — Duplicate module guard
  // -------------------------------------------------------------------------
  const serviceDestDir = join(config.projectDir, "services", config.moduleName);

  if (await pathExists(serviceDestDir)) {
    throw new Error(
      `Module "${config.moduleName}" already exists at "${serviceDestDir}". ` +
        `Remove or rename the existing directory before regenerating.`
    );
  }

  // -------------------------------------------------------------------------
  // Step 2 — Copy module template tree into services/<moduleName>/
  // -------------------------------------------------------------------------
  const spinner = clack.spinner();
  spinner.start(`Generating service module "${config.moduleName}"…`);

  try {
    const moduleSrcDir = join(templateRoot, "generators", "module");
    await copyDir(moduleSrcDir, serviceDestDir, variables, NO_FEATURES);
    spinner.stop(`Service files written to services/${config.moduleName}/`);
  } catch (err) {
    spinner.stop("Failed to copy module template files.");
    throw err;
  }

  // -------------------------------------------------------------------------
  // Step 3 — Process the CDK stack template and write output file
  // -------------------------------------------------------------------------
  spinner.start("Generating CDK stack…");

  try {
    const stackTemplatePath = join(
      templateRoot,
      "generators",
      "infra-stack",
      "stack.ts.hbs"
    );
    const stackTemplateRaw = await readFile(stackTemplatePath, "utf8");
    const stackContent = replaceVariables(stackTemplateRaw, variables);

    const stackOutputDir = join(
      config.projectDir,
      "infra",
      "src",
      "stacks",
      "modules"
    );
    await mkdir(stackOutputDir, { recursive: true });

    const stackOutputPath = join(stackOutputDir, `${config.moduleName}-stack.ts`);
    await writeFile(stackOutputPath, stackContent, "utf8");

    spinner.stop(`CDK stack written to infra/src/stacks/modules/${config.moduleName}-stack.ts`);
  } catch (err) {
    spinner.stop("Failed to generate CDK stack.");
    throw err;
  }

  // -------------------------------------------------------------------------
  // Steps 4 & 5 — Inject import + instance into infra/src/index.ts
  // -------------------------------------------------------------------------
  spinner.start("Injecting CDK stack into infra/src/index.ts…");

  try {
    const infraIndexPath = join(config.projectDir, "infra", "src", "index.ts");
    let infraContent = await readFile(infraIndexPath, "utf8");

    // Inject import statement before the import marker.
    const importLine =
      `import { ${ModuleName}Stack } from "./stacks/modules/${config.moduleName}-stack";`;
    infraContent = injectBeforeMarker(infraContent, MARKER_IMPORT, importLine);

    // Inject stack instantiation before the instance marker.
    const instanceLine =
      `new ${ModuleName}Stack(app, \`${config.projectName}-${ModuleName}Stack-\${stage}\`, { ...stackProps, stage, config });`;
    infraContent = injectBeforeMarker(infraContent, MARKER_INSTANCE, instanceLine);

    await writeFile(infraIndexPath, infraContent, "utf8");
    spinner.stop("infra/src/index.ts updated.");
  } catch (err) {
    spinner.stop("Failed to update infra/src/index.ts.");
    throw err;
  }

  // -------------------------------------------------------------------------
  // Step 6 — Inject route into dev-gateway/src/gateway.ts
  // -------------------------------------------------------------------------
  spinner.start("Injecting route into dev-gateway/src/gateway.ts…");

  try {
    const gatewayPath = join(
      config.projectDir,
      "dev-gateway",
      "src",
      "gateway.ts"
    );
    let gatewayContent = await readFile(gatewayPath, "utf8");

    // The route entry — injectBeforeMarker will apply the marker's indentation.
    const routeLine = `"/${config.moduleName}": "http://localhost:${config.port}",`;
    gatewayContent = injectBeforeMarker(gatewayContent, MARKER_ROUTE, routeLine);

    await writeFile(gatewayPath, gatewayContent, "utf8");
    spinner.stop("dev-gateway/src/gateway.ts updated.");
  } catch (err) {
    spinner.stop("Failed to update dev-gateway/src/gateway.ts.");
    throw err;
  }

  // -------------------------------------------------------------------------
  // Step 7 — Optional pnpm install
  // -------------------------------------------------------------------------
  if (config.installDeps) {
    await installDeps(config.projectDir);
  }
}
