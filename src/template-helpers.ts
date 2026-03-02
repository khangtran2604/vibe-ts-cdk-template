import type { FeatureFlags, ProjectConfig } from "./types.js";

/**
 * Returns the ordered list of template subdirectories to copy when
 * scaffolding a new project.  The scaffolding engine copies them in the
 * order returned so that later directories can override files from earlier
 * ones (e.g. a feature-specific package.json.hbs superseding the base one).
 *
 * The first five directories are always included regardless of the preset.
 * Subsequent directories are gated behind the corresponding feature flag.
 *
 * @param features - Resolved feature flags for the project being scaffolded.
 * @returns An ordered array of template subdirectory names.
 *
 * @example
 * // Minimal preset — no feature flags set
 * getTemplateDirs({ frontend: false, auth: false, ... })
 * // => ["base", "infra", "services", "dev-gateway", "packages"]
 *
 * @example
 * // Standard preset
 * getTemplateDirs({ frontend: true, auth: true, e2e: true, ... })
 * // => ["base", "infra", "services", "dev-gateway", "packages", "frontend", "auth", "e2e"]
 */
export function getTemplateDirs(features: FeatureFlags): string[] {
  // Core directories present for every preset.
  const dirs: string[] = ["base", "infra", "services", "dev-gateway", "packages"];

  // Feature-gated directories, added in a deliberate order so that later
  // directories may safely override files copied by earlier ones.
  if (features.frontend) dirs.push("frontend");
  if (features.auth) dirs.push("auth");
  if (features.e2e) dirs.push("e2e");
  if (features.database) dirs.push("database");
  if (features.cicd) dirs.push("cicd");
  if (features.monitoring) dirs.push("monitoring");

  // The "hooks" flag maps to the "extras" template directory (Husky +
  // lint-staged) rather than a directory named "hooks" to keep the template
  // name consistent with what is generated inside the project.
  if (features.hooks) dirs.push("extras");

  return dirs;
}

/**
 * Builds the variable substitution map used by the scaffolding engine when
 * processing `.hbs` template files.  Every `{{key}}` placeholder in a
 * template must have a corresponding entry here.
 *
 * The map is intentionally minimal at this stage and will grow as concrete
 * template files are authored.  All values are strings because the
 * substitution mechanism uses `String.replaceAll("{{key}}", value)`.
 *
 * @param config - The fully-resolved project configuration.
 * @returns A record mapping placeholder names to their replacement strings.
 *
 * @example
 * getVariableMap({ projectName: "my-app", awsRegion: "eu-west-1", ... })
 * // => { projectName: "my-app", awsRegion: "eu-west-1" }
 */
export function getVariableMap(config: ProjectConfig): Record<string, string> {
  return {
    projectName: config.projectName,
    awsRegion: config.awsRegion,
  };
}

/**
 * Returns the ordered list of pnpm workspace glob patterns to write into
 * `pnpm-workspace.yaml` for the generated project.
 *
 * The workspace file is built programmatically (not from a template) because
 * its contents vary by preset.  The scaffolding engine should use this list
 * directly when constructing the YAML.
 *
 * @param features - Resolved feature flags for the project being scaffolded.
 * @returns An ordered array of pnpm workspace glob patterns.
 *
 * @example
 * // Minimal preset
 * getWorkspaceEntries({ frontend: false, auth: false, e2e: false, ... })
 * // => ["infra", "services/*", "dev-gateway", "packages/*"]
 *
 * @example
 * // Standard preset
 * getWorkspaceEntries({ frontend: true, auth: true, e2e: true, ... })
 * // => ["infra", "services/*", "dev-gateway", "packages/*", "frontend", "auth", "e2e"]
 */
export function getWorkspaceEntries(features: FeatureFlags): string[] {
  // Core workspace members present for every preset.
  const entries: string[] = ["infra", "services/*", "dev-gateway", "packages/*"];

  // Optional workspace members added when their corresponding feature is
  // enabled.  Order matches the template directory order for consistency.
  if (features.frontend) entries.push("frontend");
  if (features.auth) entries.push("auth");
  if (features.e2e) entries.push("e2e");

  return entries;
}
