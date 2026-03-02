import type { FeatureFlags, Preset } from "./types.js";

/**
 * Human-readable descriptions for each preset tier.  Consumed by the
 * interactive prompt to show the user what they are selecting.
 */
export const PRESET_DESCRIPTIONS: Record<Preset, string> = {
  minimal:
    "CDK + Lambda + API Gateway — infra, services, shared packages, and dev-gateway only",
  standard:
    "Minimal + Vite/React frontend, Cognito auth, and Playwright e2e tests",
  full: "Standard + DynamoDB, GitHub Actions CI/CD, CloudWatch monitoring, and Husky git hooks",
};

/**
 * Baseline FeatureFlags for each preset tier, before any user overrides are
 * applied.  Every entry is an exhaustive FeatureFlags object so TypeScript
 * will catch any new flag that has not been assigned to every preset.
 */
const PRESET_FLAGS: Record<Preset, FeatureFlags> = {
  minimal: {
    frontend: false,
    auth: false,
    e2e: false,
    database: false,
    rds: false,
    cicd: false,
    monitoring: false,
    hooks: false,
  },
  standard: {
    frontend: true,
    auth: true,
    e2e: true,
    database: false,
    rds: false,
    cicd: false,
    monitoring: false,
    hooks: false,
  },
  full: {
    frontend: true,
    auth: true,
    e2e: true,
    database: true,
    rds: false, // opt-in override — RDS adds cost and complexity
    cicd: true,
    monitoring: true,
    hooks: true,
  },
};

/**
 * Returns the {@link FeatureFlags} for the given preset, with any caller-
 * supplied overrides merged on top.
 *
 * The only override currently supported is `rds`, which is intentionally
 * off by default even in the full preset because Aurora Serverless v2
 * incurs additional AWS cost.  It is only relevant when `database` is
 * also `true` (i.e. the full preset).
 *
 * @param preset  - One of "minimal", "standard", or "full".
 * @param options - Optional per-flag overrides.  Currently only `rds`.
 * @returns A new FeatureFlags object — the base record is never mutated.
 *
 * @example
 * getFeatureFlags("full");                 // rds: false
 * getFeatureFlags("full", { rds: true });  // rds: true
 */
export function getFeatureFlags(
  preset: Preset,
  options?: { rds?: boolean }
): FeatureFlags {
  const base = PRESET_FLAGS[preset];
  return {
    ...base,
    // rds is only valid when database is also enabled (full preset).
    // Guard here so callers cannot accidentally produce { rds: true, database: false }.
    rds: base.database && (options?.rds ?? base.rds),
  };
}
