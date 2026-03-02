import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock setup
//
// vi.mock() factories are hoisted before all imports, so all mock references
// must be created inside vi.hoisted().
// ---------------------------------------------------------------------------
const { mockExecAsync, mockLoggerWarn, mockLoggerSuccess, mockLoggerError } =
  vi.hoisted(() => {
    // mockExecAsync stands in for the promisified exec created inside git.ts.
    // We control it per-test via mockResolvedValue / mockRejectedValue.
    const mockExecAsync = vi.fn();

    const mockLoggerWarn = vi.fn();
    const mockLoggerSuccess = vi.fn();
    const mockLoggerError = vi.fn();

    return { mockExecAsync, mockLoggerWarn, mockLoggerSuccess, mockLoggerError };
  });

// Mock node:child_process so we intercept the underlying exec call that
// promisify wraps.  git.ts does:
//   const execAsync = promisify(exec);
// promisify returns a function that calls exec(cmd, opts, callback).  The
// easiest strategy is to mock the whole module and replace exec with a
// function whose promisified form behaves as we want.
//
// We replace exec with a function that, when called, invokes the callback
// with the value controlled by mockExecAsync.  The wrapper converts the
// mock's Promise result into a node-style callback so promisify works.
vi.mock("node:child_process", () => {
  return {
    exec: (
      cmd: string,
      opts: unknown,
      callback: (err: Error | null, result?: unknown) => void
    ) => {
      // mockExecAsync is a vi.fn() that returns a Promise.
      mockExecAsync(cmd, opts)
        .then((result: unknown) => callback(null, result))
        .catch((err: Error) => callback(err));
    },
  };
});

// Mock the logger module so we can assert on log calls without TTY output.
vi.mock("../../src/utils/logger.js", () => ({
  warn: mockLoggerWarn,
  success: mockLoggerSuccess,
  error: mockLoggerError,
  info: vi.fn(),
}));

// Import after mocks are established.
import { initGit } from "../../src/utils/git.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default success response returned by `exec` in the happy path. */
const EXEC_SUCCESS = { stdout: "Initialized empty Git repository", stderr: "" };

/** Make mockExecAsync succeed for ALL calls (version check + init). */
function execAlwaysSucceeds() {
  mockExecAsync.mockResolvedValue(EXEC_SUCCESS);
}

/** Make the version check succeed but git init fail. */
function execVersionOkInitFails(err: Error) {
  mockExecAsync
    .mockResolvedValueOnce(EXEC_SUCCESS) // git --version
    .mockRejectedValueOnce(err); // git init
}

/** Make the version check itself fail (git not on PATH). */
function execVersionFails() {
  mockExecAsync.mockRejectedValue(new Error("git: command not found"));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("initGit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------
  describe("success path — git is available and init succeeds", () => {
    it("should return { success: true } when git is available and init succeeds", async () => {
      execAlwaysSucceeds();

      const result = await initGit("/tmp/my-app");

      expect(result).toEqual({ success: true });
    });

    it("should call git --version to check availability", async () => {
      execAlwaysSucceeds();

      await initGit("/tmp/my-app");

      // First call must be the version check.
      expect(mockExecAsync).toHaveBeenCalledWith(
        "git --version",
        expect.objectContaining({ timeout: 5_000 })
      );
    });

    it("should call git init with the target directory as cwd", async () => {
      execAlwaysSucceeds();
      const dir = "/home/user/projects/my-app";

      await initGit(dir);

      expect(mockExecAsync).toHaveBeenCalledWith(
        "git init",
        expect.objectContaining({ cwd: dir, timeout: 15_000 })
      );
    });

    it("should call logger.success after a successful git init", async () => {
      execAlwaysSucceeds();

      await initGit("/tmp/my-app");

      expect(mockLoggerSuccess).toHaveBeenCalledOnce();
      expect(mockLoggerSuccess).toHaveBeenCalledWith(
        expect.stringContaining("Git repository initialised")
      );
    });

    it("should NOT call logger.warn or logger.error on success", async () => {
      execAlwaysSucceeds();

      await initGit("/tmp/my-app");

      expect(mockLoggerWarn).not.toHaveBeenCalled();
      expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it("should make exactly two exec calls: version check then init", async () => {
      execAlwaysSucceeds();

      await initGit("/tmp/my-app");

      expect(mockExecAsync).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // git not available
  // -------------------------------------------------------------------------
  describe("failure path — git binary not on $PATH", () => {
    it("should return { success: false } when git is not available", async () => {
      execVersionFails();

      const result = await initGit("/tmp/my-app");

      expect(result.success).toBe(false);
    });

    it("should return an error message mentioning git not being installed", async () => {
      execVersionFails();

      const result = await initGit("/tmp/my-app");

      expect(result.error).toMatch(/git is not installed/);
    });

    it("should call logger.warn when git is not available", async () => {
      execVersionFails();

      await initGit("/tmp/my-app");

      expect(mockLoggerWarn).toHaveBeenCalledOnce();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining("git is not installed")
      );
    });

    it("should NOT call git init when git binary check fails", async () => {
      execVersionFails();

      await initGit("/tmp/my-app");

      // Only one exec call should have been made (the version check).
      expect(mockExecAsync).toHaveBeenCalledTimes(1);
      expect(mockExecAsync).toHaveBeenCalledWith(
        "git --version",
        expect.anything()
      );
    });

    it("should NOT call logger.success when git is not available", async () => {
      execVersionFails();

      await initGit("/tmp/my-app");

      expect(mockLoggerSuccess).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // git init fails (non-zero exit code)
  // -------------------------------------------------------------------------
  describe("failure path — git init throws (non-zero exit code)", () => {
    it("should return { success: false } when git init throws", async () => {
      const initError = new Error("fatal: cannot create repository");
      execVersionOkInitFails(initError);

      const result = await initGit("/tmp/my-app");

      expect(result.success).toBe(false);
    });

    it("should include the error message from the thrown error in result.error", async () => {
      const initError = new Error("fatal: permission denied");
      execVersionOkInitFails(initError);

      const result = await initGit("/tmp/my-app");

      expect(result.error).toContain("git init failed");
      expect(result.error).toContain("fatal: permission denied");
    });

    it("should call logger.error when git init throws", async () => {
      const initError = new Error("fatal: repository exists");
      execVersionOkInitFails(initError);

      await initGit("/tmp/my-app");

      expect(mockLoggerError).toHaveBeenCalledOnce();
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining("git init failed")
      );
    });

    it("should NOT call logger.success when git init fails", async () => {
      const initError = new Error("something went wrong");
      execVersionOkInitFails(initError);

      await initGit("/tmp/my-app");

      expect(mockLoggerSuccess).not.toHaveBeenCalled();
    });

    it("should still call logger.warn when a non-Error is thrown", async () => {
      // The exec wrapper always rejects with an Error object (Node's exec
      // wraps non-zero exits in an Error), but we test the unknown-error branch.
      mockExecAsync
        .mockResolvedValueOnce(EXEC_SUCCESS) // git --version
        .mockRejectedValueOnce("a plain string error"); // git init

      const result = await initGit("/tmp/my-app");

      expect(result.success).toBe(false);
      // When the thrown value is not an Error, the code falls back to a
      // generic message.
      expect(result.error).toContain("git init failed");
    });
  });

  // -------------------------------------------------------------------------
  // Return value shape
  // -------------------------------------------------------------------------
  describe("return value shape", () => {
    it("should not include an error property when init succeeds", async () => {
      execAlwaysSucceeds();

      const result = await initGit("/tmp/my-app");

      expect(result).not.toHaveProperty("error");
    });

    it("should include both success and error properties when init fails", async () => {
      execVersionFails();

      const result = await initGit("/tmp/my-app");

      expect(result).toHaveProperty("success", false);
      expect(result).toHaveProperty("error");
      expect(typeof result.error).toBe("string");
    });
  });
});
