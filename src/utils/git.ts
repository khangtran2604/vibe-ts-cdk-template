/**
 * Git utility for the scaffolding engine.
 *
 * Provides a single exported function, {@link initGit}, that runs `git init`
 * inside a generated project directory.  All subprocess work is done via
 * `node:child_process.exec` (async) so the event loop remains unblocked and
 * no output leaks to the terminal.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as logger from "./logger.js";

const execAsync = promisify(exec);

/** Shape returned by {@link initGit}. */
export interface GitResult {
  success: boolean;
  /** Human-readable error description, present only when `success` is false. */
  error?: string;
}

/**
 * Verify that the `git` binary is available on `$PATH`.
 *
 * Uses `git --version` which is fast, safe, and exits 0 on every Git version
 * we care about.  A 5 000 ms timeout guards against a hung binary.
 */
async function isGitAvailable(): Promise<boolean> {
  try {
    await execAsync("git --version", { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialise a new git repository in the given directory.
 *
 * Steps:
 * 1. Check that `git` is on `$PATH`.
 * 2. Run `git init` with `cwd` set to `dir` so the repo is created there
 *    (async — does not block the event loop).
 * 3. Return `{ success: true }` on success or `{ success: false, error }` on
 *    any failure (missing binary, non-zero exit, etc.).
 *
 * User-facing feedback is emitted via the logger so the caller does not need
 * to duplicate messaging around this call.
 *
 * @param dir - Absolute path to the directory in which to run `git init`.
 *
 * @example
 * ```typescript
 * const result = await initGit("/path/to/my-app");
 * if (!result.success) {
 *   logger.warn(`git init skipped: ${result.error}`);
 * }
 * ```
 */
export async function initGit(dir: string): Promise<GitResult> {
  if (!(await isGitAvailable())) {
    const msg =
      "git is not installed or not on $PATH — skipping git init.\n" +
      "  Install git: https://git-scm.com/downloads";
    logger.warn(msg);
    return { success: false, error: msg };
  }

  try {
    // A 15 s timeout is generous for `git init` (it completes in milliseconds
    // under normal conditions) but avoids a hang on pathological setups.
    // stdout/stderr are captured so hints like "Using 'master' as initial
    // branch name…" don't clutter the CLI output.
    await execAsync("git init", { cwd: dir, timeout: 15_000 });
    logger.success("Git repository initialised.");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error during git init.";
    const userMessage = `git init failed: ${message}`;
    logger.error(userMessage);
    return { success: false, error: userMessage };
  }
}
