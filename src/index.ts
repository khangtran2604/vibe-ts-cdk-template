/**
 * CLI entry point for vibe-ts-cdk-template.
 *
 * Phase wiring plan:
 *   Phase 2 — wire in @clack/prompts interactive flow (src/prompts.ts) to
 *             collect any values not supplied via flags.  DONE.
 *   Phase 3 — scaffold engine (src/scaffolder.ts) wired in.  DONE.
 */

import * as clack from "@clack/prompts";
import { Command, InvalidArgumentError } from "commander";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CLI_NAME, CLI_VERSION, DEFAULT_REGION } from "./constants.js";
import { type CliFlags, runPrompts } from "./prompts.js";
import { scaffold } from "./scaffolder.js";
import type { Preset } from "./types.js";

const VALID_PRESETS: Preset[] = ["minimal", "standard", "full"];

/**
 * Validate that the value supplied to --preset is one of the three recognised
 * presets.  Commander calls this synchronously; throwing InvalidArgumentError
 * causes commander to print "error: option '--preset <preset>' argument
 * '<value>' is invalid. ..." and exit with code 1.
 */
function parsePreset(value: string): Preset {
  if (!VALID_PRESETS.includes(value as Preset)) {
    throw new InvalidArgumentError(
      `"${value}" is not a valid preset. Choose one of: ${VALID_PRESETS.join(", ")}.`
    );
  }
  return value as Preset;
}

/**
 * Build and return the Commander program instance.
 *
 * Exported so tests can call `.parseAsync(["node", "cli", ...args])` on a
 * fresh instance without triggering `program.parse()` at import time.
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .version(CLI_VERSION, "-V, --version", "Output the CLI version")
    .description("Scaffold a full-stack TypeScript AWS CDK monorepo")
    // Optional positional argument — user may also set the name via prompts.
    .argument("[project-name]", "Directory name for the generated project")
    .option(
      "--preset <preset>",
      `Complexity preset: ${VALID_PRESETS.join(" | ")}`,
      parsePreset
    )
    .option(
      "--region <aws-region>",
      "Target AWS region",
      DEFAULT_REGION
    )
    .option("--rds", "Include RDS (Aurora Serverless v2) database — full preset", false)
    .option("--no-git", "Skip git initialisation in the generated project")
    .option("--no-install", "Skip running pnpm install after scaffolding")
    .option("-y, --yes", "Accept all defaults; skip interactive prompts", false)
    .action(async (projectName: string | undefined, options: {
      preset?: Preset;
      region: string;
      rds: boolean;
      git: boolean;
      install: boolean;
      yes: boolean;
    }) => {
      // Build a CliFlags object from commander's parsed options, forwarding
      // every value that the user may have explicitly supplied.
      const cliFlags: CliFlags = {
        projectName,
        preset: options.preset,
        region: options.region,
        rds: options.rds,
        git: options.git,
        install: options.install,
        yes: options.yes,
      };

      // Run the interactive prompt flow.  runPrompts() skips each individual
      // prompt when the corresponding flag value is already set (or when
      // --yes is active), and returns a complete ProjectConfig including
      // resolved feature flags.
      const config = await runPrompts(cliFlags);

      // Run the scaffolding engine.  Errors are caught here so we can display
      // a user-friendly message via clack before exiting with a non-zero code.
      //
      // A SIGINT handler is registered for the duration of the scaffold call so
      // that Ctrl+C during file copying or pnpm install exits cleanly (with an
      // outro message) rather than leaving a broken spinner on screen.
      const onSigint = () => {
        clack.outro("Scaffolding cancelled.");
        process.exit(0);
      };
      process.on("SIGINT", onSigint);
      try {
        await scaffold(config);
      } catch (err: unknown) {
        clack.log.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      } finally {
        process.off("SIGINT", onSigint);
      }

      // Build the contextual "Next steps" outro message.
      // When --no-install was used, remind the user to run pnpm install first.
      // When the preset is "full", e2e tests are available so pnpm test is included.
      const baseSteps = config.installDeps
        ? [`  cd ${config.projectName}`, `  pnpm dev`]
        : [`  cd ${config.projectName}`, `  pnpm install`, `  pnpm dev`];

      if (config.preset === "full") {
        baseSteps.push(`  pnpm test`);
      }
      baseSteps.push(`  pnpm cdk deploy --all`);

      const nextSteps = baseSteps;

      clack.outro(`Done! Next steps:\n${nextSteps.join("\n")}`);
    });

  return program;
}

// Only invoke parseAsync() when this module is the process entry point.
// Comparing realpath-resolved paths handles symlinks (npx, npm link) correctly
// and avoids false positives from the endsWith approach used previously.
const isMain = (() => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const entryFile = realpathSync(process.argv[1] ?? "");
    return thisFile === entryFile;
  } catch {
    return false;
  }
})();

if (isMain) {
  createProgram()
    .parseAsync()
    .catch((err: unknown) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
