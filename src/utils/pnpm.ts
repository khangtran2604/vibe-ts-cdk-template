/**
 * pnpm utility for the scaffolding engine.
 *
 * Provides a single exported function, {@link installDeps}, that runs
 * `pnpm install` inside a generated project directory.  Because `pnpm install`
 * can take several seconds, the function wraps the operation in a clack spinner
 * so the user sees progress feedback.
 *
 * All subprocess work is done via `node:child_process.exec` (async) so the
 * event loop remains unblocked and the clack spinner can animate while pnpm
 * is running.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as clack from "@clack/prompts";
import * as logger from "./logger.js";

const execAsync = promisify(exec);

/** Shape returned by {@link installDeps}. */
export interface PnpmResult {
  success: boolean;
  /** Human-readable error description, present only when `success` is false. */
  error?: string;
}

/**
 * Verify that the `pnpm` binary is available on `$PATH`.
 *
 * Uses `pnpm --version` which is cheap and always exits 0 when pnpm is
 * installed.  A 5 000 ms timeout guards against a hung binary.
 */
async function isPnpmAvailable(): Promise<boolean> {
  try {
    await execAsync("pnpm --version", { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run `pnpm install` inside the given directory.
 *
 * Steps:
 * 1. Check that `pnpm` is on `$PATH`.
 * 2. Start a clack spinner (visible progress for a potentially slow step).
 * 3. Run `pnpm install` with `cwd` set to `dir` (async — does not block the
 *    event loop, so the spinner can animate).
 * 4. Stop the spinner and return `{ success: true }` on success or
 *    `{ success: false, error }` on any failure.
 *
 * @param dir - Absolute path to the directory in which to run `pnpm install`.
 *   This should be the root of the freshly-scaffolded monorepo (the directory
 *   that contains `pnpm-workspace.yaml`).
 *
 * @example
 * ```typescript
 * const result = await installDeps("/path/to/my-app");
 * if (!result.success) {
 *   logger.warn(`pnpm install skipped: ${result.error}`);
 * }
 * ```
 */
export async function installDeps(dir: string): Promise<PnpmResult> {
  if (!(await isPnpmAvailable())) {
    const msg =
      "pnpm is not installed or not on $PATH — skipping install.\n" +
      "  Install pnpm: https://pnpm.io/installation";
    logger.warn(msg);
    return { success: false, error: msg };
  }

  const spinner = clack.spinner();
  spinner.start("Installing dependencies with pnpm…");

  try {
    // `--frozen-lockfile` is intentionally omitted: the generated project has
    // no lockfile yet, so pnpm must resolve and write one on first install.
    //
    // A 120 s timeout covers slow network conditions without hanging forever.
    await execAsync("pnpm install", { cwd: dir, timeout: 120_000 });

    spinner.stop("Dependencies installed.");
    return { success: true };
  } catch (err: unknown) {
    // exec rejects with an Error that carries `stderr` as a string property.
    let detail = "Unknown error during pnpm install.";
    if (err instanceof Error) {
      const execErr = err as Error & { stderr?: string };
      detail =
        execErr.stderr && execErr.stderr.trim().length > 0
          ? execErr.stderr.trim()
          : err.message;
    }

    const userMessage = `pnpm install failed: ${detail}`;
    spinner.stop("Dependency installation failed.");
    logger.error(userMessage);
    return { success: false, error: userMessage };
  }
}
