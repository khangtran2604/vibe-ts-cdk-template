/**
 * Interactive prompt flow for the vibe-ts-cdk-template CLI.
 *
 * Collects every piece of information required to build a {@link ProjectConfig}
 * from the user, skipping prompts for values already supplied via CLI flags or
 * when the `-y` / `--yes` flag is present.
 *
 * Cancellation (Ctrl+C) is handled gracefully: each prompt result is checked
 * with {@link isCancel} immediately after being awaited.  A cancel triggers an
 * `outro` message and `process.exit(0)`.
 */

import * as clack from "@clack/prompts";
import { CLI_NAME, DEFAULT_REGION } from "./constants.js";
import { getFeatureFlags } from "./presets.js";
import type { Preset, ProjectConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Regex for a valid npm-compatible package name segment:
 * - Must be all lowercase.
 * - May contain alphanumeric characters, hyphens, and underscores.
 * - Must start and end with an alphanumeric character.
 * - No spaces, uppercase letters, or special characters.
 *
 * Matches directory-safe names as well, so the value can be used both as an
 * npm package name and as a filesystem directory name.
 */
const VALID_NAME_RE = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/;

/**
 * Validate a project name and return an error string on failure, or
 * `undefined` when the value is acceptable.
 *
 * Used both in the clack `validate` callback (which expects `string | Error |
 * undefined`) and for pre-validating names supplied via CLI flags before
 * entering the prompt loop.
 */
function validateProjectName(value: string | undefined): string | undefined {
  if (!value || value.trim() === "") {
    return "Project name is required.";
  }
  const trimmed = value.trim();
  if (trimmed !== trimmed.toLowerCase()) {
    return "Project name must be lowercase.";
  }
  if (trimmed.includes(" ")) {
    return "Project name must not contain spaces. Use hyphens instead (e.g. my-app).";
  }
  if (!VALID_NAME_RE.test(trimmed)) {
    return (
      "Project name may only contain lowercase letters, digits, hyphens, and " +
      "underscores, and must start and end with a letter or digit."
    );
  }
  return undefined;
}

/**
 * Regex for a valid AWS region identifier, e.g. us-east-1, eu-west-2,
 * ap-southeast-1.  Pattern: two lowercase letters, one or more dash-separated
 * lowercase word segments, ending with a single digit.
 */
const VALID_REGION_RE = /^[a-z]{2}(-[a-z]+)+-\d$/;

/**
 * Validate an AWS region string and return an error message on failure, or
 * `undefined` when the value is acceptable.
 *
 * Used both in the clack `validate` callback for the region prompt and for
 * pre-validating regions supplied via CLI flags.
 */
function validateRegion(value: string | undefined): string | undefined {
  if (!value || value.trim() === "") {
    return "AWS region is required.";
  }
  if (!VALID_REGION_RE.test(value)) {
    return 'AWS region must match the format "xx-xxxx-N" (e.g. us-east-1, eu-west-2).';
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Partial config type (from CLI flags)
// ---------------------------------------------------------------------------

/**
 * Values that may be pre-filled by CLI flags before the prompt loop starts.
 * All fields are optional; missing or `undefined` values are collected
 * interactively.
 */
export interface CliFlags {
  /** Positional argument: the first non-flag token on the command line. */
  projectName?: string;
  /** `--preset <preset>` flag. */
  preset?: Preset;
  /** `--region <aws-region>` flag (defaults to `DEFAULT_REGION` in commander). */
  region?: string;
  /** `--rds` boolean flag. */
  rds?: boolean;
  /** `--git` / `--no-git` flag (commander exposes as `git`). */
  git?: boolean;
  /** `--install` / `--no-install` flag (commander exposes as `install`). */
  install?: boolean;
  /** `-y` / `--yes` — skip all interactive prompts and accept defaults. */
  yes?: boolean;
}

// ---------------------------------------------------------------------------
// Cancellation helper
// ---------------------------------------------------------------------------

/**
 * Check whether a clack prompt result is a cancellation symbol and, if so,
 * display an `outro` message and exit the process cleanly.
 *
 * Called after every awaited prompt so that Ctrl+C is handled at the earliest
 * possible point.
 */
function handleCancel(value: unknown): void {
  if (clack.isCancel(value)) {
    clack.outro("Scaffolding cancelled. No files were written.");
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Run the full interactive prompt flow and return a complete
 * {@link ProjectConfig} ready for the scaffolding engine.
 *
 * @param flags - Partial configuration already provided via CLI flags.
 *   Any field set here (and truthy, or explicitly `false` for booleans) skips
 *   the corresponding prompt.
 *
 * @example
 * ```typescript
 * const config = await runPrompts({ preset: "minimal", yes: true });
 * ```
 */
export async function runPrompts(flags: CliFlags = {}): Promise<ProjectConfig> {
  const skipAll = flags.yes === true;

  // Default AWS region: honour the environment variable if set, otherwise fall
  // back to the compile-time constant.  Commander already injects DEFAULT_REGION
  // as the option default, but we re-read the env var here so the prompt shows
  // the right placeholder even when the flag is omitted.
  const defaultRegion =
    process.env["AWS_DEFAULT_REGION"] ?? DEFAULT_REGION;

  // -------------------------------------------------------------------------
  // Intro banner
  // -------------------------------------------------------------------------
  clack.intro(`${CLI_NAME} — scaffold a full-stack TypeScript AWS CDK monorepo`);

  // -------------------------------------------------------------------------
  // 1. Project name
  // -------------------------------------------------------------------------
  let projectName: string;

  if (flags.projectName !== undefined) {
    const nameError = validateProjectName(flags.projectName);
    if (nameError) {
      if (skipAll) {
        clack.log.error(
          `The supplied project name "${flags.projectName}" is invalid: ${nameError}`
        );
        process.exit(1);
      }
      clack.log.warn(
        `The supplied project name "${flags.projectName}" is invalid: ${nameError}`
      );
      const nameResult = await clack.text({
        message: "Project name",
        placeholder: "my-app",
        validate: validateProjectName,
      });
      handleCancel(nameResult);
      projectName = nameResult as string;
    } else {
      projectName = flags.projectName;
    }
  } else if (skipAll) {
    projectName = "my-app";
  } else {
    const nameResult = await clack.text({
      message: "Project name",
      placeholder: "my-app",
      validate: validateProjectName,
    });
    handleCancel(nameResult);
    projectName = nameResult as string;
  }

  // -------------------------------------------------------------------------
  // 2. Preset
  // -------------------------------------------------------------------------
  let preset: Preset;

  if (flags.preset !== undefined) {
    preset = flags.preset;
  } else if (skipAll) {
    preset = "minimal";
  } else {
    const presetResult = await clack.select<Preset>({
      message: "Which preset would you like to use?",
      options: [
        {
          value: "minimal",
          label: "Minimal",
          hint: "CDK + Services (Lambda + API Gateway)",
        },
        {
          value: "standard",
          label: "Standard",
          hint: "Minimal + Frontend (Vite React) + Auth (Cognito)",
        },
        {
          value: "full",
          label: "Full",
          hint: "Standard + Database, CI/CD, Monitoring, Pre-commit hooks",
        },
      ],
      initialValue: "minimal",
    });
    handleCancel(presetResult);
    preset = presetResult as Preset;
  }

  // -------------------------------------------------------------------------
  // 3. AWS region
  // -------------------------------------------------------------------------
  let awsRegion: string;

  // `flags.region` is always set by commander (it has a default value), so we
  // treat it as "already provided" only when the user explicitly supplied a
  // non-default value OR when skipAll is active.  When skipAll is false and the
  // region equals the default we still prompt so the user can confirm/change it.
  //
  // Rationale: the `--region` flag default is injected by commander even when
  // the user never typed `--region`, so we cannot use `!== undefined` here.
  // Instead, we skip the prompt when skipAll is true or when the caller passes
  // a region that differs from the compile-time default (indicating the user
  // consciously set it).
  const regionAlreadySet =
    flags.region !== undefined && flags.region !== DEFAULT_REGION;

  if (regionAlreadySet || skipAll) {
    const candidateRegion = flags.region ?? defaultRegion;
    const regionError = validateRegion(candidateRegion);
    if (regionError) {
      if (skipAll) {
        clack.log.error(
          `The supplied region "${candidateRegion}" is invalid: ${regionError}`
        );
        process.exit(1);
      }
      clack.log.warn(
        `The supplied region "${candidateRegion}" is invalid: ${regionError}`
      );
      const regionResult = await clack.text({
        message: "Target AWS region",
        placeholder: defaultRegion,
        defaultValue: defaultRegion,
        initialValue: defaultRegion,
        validate: validateRegion,
      });
      handleCancel(regionResult);
      awsRegion = (regionResult as string) || defaultRegion;
    } else {
      awsRegion = candidateRegion;
    }
  } else {
    const regionResult = await clack.text({
      message: "Target AWS region",
      placeholder: defaultRegion,
      defaultValue: defaultRegion,
      initialValue: flags.region ?? defaultRegion,
      validate: validateRegion,
    });
    handleCancel(regionResult);
    awsRegion = (regionResult as string) || defaultRegion;
  }

  // -------------------------------------------------------------------------
  // 4. RDS — only when preset is "full"
  // -------------------------------------------------------------------------
  let includeRds = false;

  if (preset === "full") {
    if (flags.rds !== undefined) {
      includeRds = flags.rds;
    } else if (skipAll) {
      includeRds = false;
    } else {
      const rdsResult = await clack.confirm({
        message: "Include RDS (Aurora Serverless v2) database?",
        initialValue: false,
      });
      handleCancel(rdsResult);
      includeRds = rdsResult as boolean;
    }
  }

  // -------------------------------------------------------------------------
  // 5. Git init
  // -------------------------------------------------------------------------
  let gitInit: boolean;

  // commander's --no-git flag maps to `git: false`; the default is `true`.
  // We skip the prompt when the user explicitly passed --no-git (git === false)
  // or --git (git === true, though that is the default).  The only case we want
  // to prompt is when `flags.git` is undefined (no flag was passed at all) and
  // skipAll is false.
  if (flags.git !== undefined) {
    gitInit = flags.git;
  } else if (skipAll) {
    gitInit = true;
  } else {
    const gitResult = await clack.confirm({
      message: "Initialise a git repository?",
      initialValue: true,
    });
    handleCancel(gitResult);
    gitInit = gitResult as boolean;
  }

  // -------------------------------------------------------------------------
  // 6. Install deps
  // -------------------------------------------------------------------------
  let installDeps: boolean;

  if (flags.install !== undefined) {
    installDeps = flags.install;
  } else if (skipAll) {
    installDeps = true;
  } else {
    const installResult = await clack.confirm({
      message: "Run pnpm install after scaffolding?",
      initialValue: true,
    });
    handleCancel(installResult);
    installDeps = installResult as boolean;
  }

  // -------------------------------------------------------------------------
  // Assemble config
  // -------------------------------------------------------------------------
  const config: ProjectConfig = {
    projectName,
    preset,
    awsRegion,
    features: getFeatureFlags(preset, { rds: includeRds }),
    gitInit,
    installDeps,
  };

  return config;
}
