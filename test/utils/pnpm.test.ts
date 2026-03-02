import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock setup
//
// All references used inside vi.mock() factories must be created with
// vi.hoisted() so they are initialised before the factory runs.
// ---------------------------------------------------------------------------
const {
  mockExecAsync,
  mockSpinnerStart,
  mockSpinnerStop,
  mockSpinner,
  mockLoggerWarn,
  mockLoggerError,
} = vi.hoisted(() => {
  const mockExecAsync = vi.fn();

  // Spinner instance methods — shared across the module's single spinner call.
  const mockSpinnerStart = vi.fn();
  const mockSpinnerStop = vi.fn();
  const mockSpinner = vi.fn(() => ({
    start: mockSpinnerStart,
    stop: mockSpinnerStop,
  }));

  const mockLoggerWarn = vi.fn();
  const mockLoggerError = vi.fn();

  return {
    mockExecAsync,
    mockSpinnerStart,
    mockSpinnerStop,
    mockSpinner,
    mockLoggerWarn,
    mockLoggerError,
  };
});

// Mock node:child_process — same promisify-compatible pattern as git.test.ts.
// pnpm.ts does:  const execAsync = promisify(exec);
// We intercept exec at the module level and funnel calls through mockExecAsync.
vi.mock("node:child_process", () => ({
  exec: (
    cmd: string,
    opts: unknown,
    callback: (err: Error | null, result?: unknown) => void
  ) => {
    mockExecAsync(cmd, opts)
      .then((result: unknown) => callback(null, result))
      .catch((err: Error) => callback(err));
  },
}));

// Mock @clack/prompts so spinner() returns our controllable instance.
vi.mock("@clack/prompts", () => ({
  spinner: mockSpinner,
  // Other clack exports used transitively (logger.ts re-exports these).
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the logger module so we can assert on warn/error calls without TTY.
vi.mock("../../src/utils/logger.js", () => ({
  warn: mockLoggerWarn,
  error: mockLoggerError,
  success: vi.fn(),
  info: vi.fn(),
}));

// Import the unit under test after all mocks are established.
import { installDeps } from "../../src/utils/pnpm.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EXEC_SUCCESS = { stdout: "", stderr: "" };

/** Both exec calls (version check + install) succeed. */
function execAlwaysSucceeds() {
  mockExecAsync.mockResolvedValue(EXEC_SUCCESS);
}

/** Version check succeeds; install rejects with the given error. */
function execVersionOkInstallFails(err: Error & { stderr?: string }) {
  mockExecAsync
    .mockResolvedValueOnce(EXEC_SUCCESS) // pnpm --version
    .mockRejectedValueOnce(err); // pnpm install
}

/** Version check itself fails (pnpm not on PATH). */
function execVersionFails() {
  mockExecAsync.mockRejectedValue(new Error("pnpm: command not found"));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("installDeps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply the spinner factory after clearAllMocks resets implementations.
    mockSpinner.mockReturnValue({
      start: mockSpinnerStart,
      stop: mockSpinnerStop,
    });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------
  describe("success path — pnpm is available and install succeeds", () => {
    it("should return { success: true } when pnpm is available and install succeeds", async () => {
      execAlwaysSucceeds();

      const result = await installDeps("/tmp/my-app");

      expect(result).toEqual({ success: true });
    });

    it("should check pnpm availability via pnpm --version", async () => {
      execAlwaysSucceeds();

      await installDeps("/tmp/my-app");

      expect(mockExecAsync).toHaveBeenCalledWith(
        "pnpm --version",
        expect.objectContaining({ timeout: 5_000 })
      );
    });

    it("should call pnpm install with the target directory as cwd", async () => {
      execAlwaysSucceeds();
      const dir = "/home/user/projects/my-app";

      await installDeps(dir);

      expect(mockExecAsync).toHaveBeenCalledWith(
        "pnpm install",
        expect.objectContaining({ cwd: dir, timeout: 120_000 })
      );
    });

    it("should make exactly two exec calls: version check then install", async () => {
      execAlwaysSucceeds();

      await installDeps("/tmp/my-app");

      expect(mockExecAsync).toHaveBeenCalledTimes(2);
    });

    it("should start the spinner before running pnpm install", async () => {
      execAlwaysSucceeds();

      await installDeps("/tmp/my-app");

      expect(mockSpinnerStart).toHaveBeenCalledOnce();
      expect(mockSpinnerStart).toHaveBeenCalledWith(
        expect.stringContaining("Installing dependencies")
      );
    });

    it("should stop the spinner after successful pnpm install", async () => {
      execAlwaysSucceeds();

      await installDeps("/tmp/my-app");

      expect(mockSpinnerStop).toHaveBeenCalledOnce();
      expect(mockSpinnerStop).toHaveBeenCalledWith(
        expect.stringContaining("installed")
      );
    });

    it("should NOT call logger.warn or logger.error on success", async () => {
      execAlwaysSucceeds();

      await installDeps("/tmp/my-app");

      expect(mockLoggerWarn).not.toHaveBeenCalled();
      expect(mockLoggerError).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // pnpm not available
  // -------------------------------------------------------------------------
  describe("failure path — pnpm binary not on $PATH", () => {
    it("should return { success: false } when pnpm is not available", async () => {
      execVersionFails();

      const result = await installDeps("/tmp/my-app");

      expect(result.success).toBe(false);
    });

    it("should return an error message mentioning pnpm not being installed", async () => {
      execVersionFails();

      const result = await installDeps("/tmp/my-app");

      expect(result.error).toMatch(/pnpm is not installed/);
    });

    it("should call logger.warn when pnpm is not available", async () => {
      execVersionFails();

      await installDeps("/tmp/my-app");

      expect(mockLoggerWarn).toHaveBeenCalledOnce();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("pnpm is not installed")
      );
    });

    it("should NOT start the spinner when pnpm is not available", async () => {
      execVersionFails();

      await installDeps("/tmp/my-app");

      expect(mockSpinnerStart).not.toHaveBeenCalled();
    });

    it("should NOT call pnpm install when the binary check fails", async () => {
      execVersionFails();

      await installDeps("/tmp/my-app");

      // Only one exec call: the version check.
      expect(mockExecAsync).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // pnpm install fails
  // -------------------------------------------------------------------------
  describe("failure path — pnpm install throws", () => {
    it("should return { success: false } when pnpm install throws", async () => {
      const err = Object.assign(new Error("install failed"), { stderr: "" });
      execVersionOkInstallFails(err);

      const result = await installDeps("/tmp/my-app");

      expect(result.success).toBe(false);
    });

    it("should include the error.message in result.error when stderr is empty", async () => {
      const err = Object.assign(new Error("ENOENT no such file"), {
        stderr: "",
      });
      execVersionOkInstallFails(err);

      const result = await installDeps("/tmp/my-app");

      expect(result.error).toContain("pnpm install failed");
      expect(result.error).toContain("ENOENT no such file");
    });

    it("should prefer stderr over error.message when stderr is non-empty", async () => {
      const err = Object.assign(new Error("generic error"), {
        stderr: "ERR_PNPM_WORKSPACE: No packages were found",
      });
      execVersionOkInstallFails(err);

      const result = await installDeps("/tmp/my-app");

      expect(result.error).toContain("ERR_PNPM_WORKSPACE");
      expect(result.error).not.toContain("generic error");
    });

    it("should call logger.error when pnpm install fails", async () => {
      const err = Object.assign(new Error("install error"), { stderr: "" });
      execVersionOkInstallFails(err);

      await installDeps("/tmp/my-app");

      expect(mockLoggerError).toHaveBeenCalledOnce();
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining("pnpm install failed")
      );
    });

    it("should stop the spinner even when pnpm install fails", async () => {
      const err = Object.assign(new Error("install error"), { stderr: "" });
      execVersionOkInstallFails(err);

      await installDeps("/tmp/my-app");

      expect(mockSpinnerStop).toHaveBeenCalledOnce();
      expect(mockSpinnerStop).toHaveBeenCalledWith(
        expect.stringContaining("failed")
      );
    });

    it("should handle a non-Error thrown value and fall back to generic message", async () => {
      mockExecAsync
        .mockResolvedValueOnce(EXEC_SUCCESS) // pnpm --version
        .mockRejectedValueOnce("plain string rejection"); // pnpm install

      const result = await installDeps("/tmp/my-app");

      expect(result.success).toBe(false);
      expect(result.error).toContain("pnpm install failed");
      expect(result.error).toContain("Unknown error");
    });
  });

  // -------------------------------------------------------------------------
  // Return value shape
  // -------------------------------------------------------------------------
  describe("return value shape", () => {
    it("should not include an error property when install succeeds", async () => {
      execAlwaysSucceeds();

      const result = await installDeps("/tmp/my-app");

      expect(result).not.toHaveProperty("error");
    });

    it("should include both success:false and a string error when install fails", async () => {
      execVersionFails();

      const result = await installDeps("/tmp/my-app");

      expect(result).toHaveProperty("success", false);
      expect(result).toHaveProperty("error");
      expect(typeof result.error).toBe("string");
    });
  });
});
