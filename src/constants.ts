/** The published npm package name, used in CLI help text and generated READMEs. */
export const CLI_NAME = "vibe-ts-cdk-template" as const;

/**
 * Semantic version of the CLI.  Keep in sync with package.json `version`.
 * Used by commander to respond to `--version`.
 */
export const CLI_VERSION = "0.1.0" as const;

/** AWS region used when the user does not supply one during prompts. */
export const DEFAULT_REGION = "us-east-1" as const;
