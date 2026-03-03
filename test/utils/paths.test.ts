import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock setup
//
// vi.mock() factories are hoisted before all import statements. All variables
// referenced inside factory closures must be initialised via vi.hoisted().
// ---------------------------------------------------------------------------
const { mockAccess } = vi.hoisted(() => {
  const mockAccess = vi.fn();
  return { mockAccess };
});

// ---------------------------------------------------------------------------
// Module mock for node:fs/promises
// ---------------------------------------------------------------------------

vi.mock("node:fs/promises", () => ({
  access: mockAccess,
}));

// Import after mocks are in place.
import { pathExists, resolveTemplateRoot } from "../../src/utils/paths.js";

// ---------------------------------------------------------------------------
// pathExists
// ---------------------------------------------------------------------------

describe("pathExists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("path exists on disk", () => {
    it("should return true when access resolves (path exists)", async () => {
      mockAccess.mockResolvedValue(undefined);
      const result = await pathExists("/some/existing/path");
      expect(result).toBe(true);
    });

    it("should call access with the provided path", async () => {
      mockAccess.mockResolvedValue(undefined);
      await pathExists("/home/user/project");
      expect(mockAccess).toHaveBeenCalledWith("/home/user/project");
    });

    it("should return true for any path when access resolves", async () => {
      mockAccess.mockResolvedValue(undefined);
      const result = await pathExists("/any/arbitrary/path");
      expect(result).toBe(true);
    });
  });

  describe("path does not exist on disk", () => {
    it("should return false when access rejects with ENOENT", async () => {
      const err = Object.assign(new Error("ENOENT: no such file or directory"), {
        code: "ENOENT",
      });
      mockAccess.mockRejectedValue(err);
      const result = await pathExists("/nonexistent/path");
      expect(result).toBe(false);
    });

    it("should return false when access rejects with EACCES (permission denied)", async () => {
      const err = Object.assign(new Error("EACCES: permission denied"), {
        code: "EACCES",
      });
      mockAccess.mockRejectedValue(err);
      const result = await pathExists("/restricted/path");
      expect(result).toBe(false);
    });

    it("should return false for any access rejection regardless of error type", async () => {
      mockAccess.mockRejectedValue(new Error("some unexpected error"));
      const result = await pathExists("/whatever");
      expect(result).toBe(false);
    });
  });

  describe("never throws", () => {
    it("should not throw even when access rejects", async () => {
      mockAccess.mockRejectedValue(new Error("ENOENT"));
      await expect(pathExists("/missing")).resolves.toBe(false);
    });

    it("should resolve (not reject) regardless of the access outcome", async () => {
      mockAccess.mockRejectedValue(new Error("any error"));
      const promise = pathExists("/some/path");
      await expect(promise).resolves.toBeDefined();
    });
  });

  describe("return value is always a boolean", () => {
    it("should return a boolean true (not a truthy value) on success", async () => {
      mockAccess.mockResolvedValue(undefined);
      const result = await pathExists("/exists");
      expect(result).toBe(true);
      expect(typeof result).toBe("boolean");
    });

    it("should return a boolean false (not a falsy value) on failure", async () => {
      mockAccess.mockRejectedValue(new Error("ENOENT"));
      const result = await pathExists("/missing");
      expect(result).toBe(false);
      expect(typeof result).toBe("boolean");
    });
  });
});

// ---------------------------------------------------------------------------
// resolveTemplateRoot
// ---------------------------------------------------------------------------

describe("resolveTemplateRoot", () => {
  it("should return a string", () => {
    const result = resolveTemplateRoot();
    expect(typeof result).toBe("string");
  });

  it("should return a path ending with 'templates'", () => {
    const result = resolveTemplateRoot();
    // Normalise any trailing separator before checking.
    const normalised = result.replace(/[\\/]+$/, "");
    expect(normalised.endsWith("templates")).toBe(true);
  });

  it("should return an absolute path (starts with / or drive letter on Windows)", () => {
    const result = resolveTemplateRoot();
    // An absolute path on POSIX starts with '/'; on Windows it starts with a
    // drive letter followed by ':' (e.g. 'C:').
    const isAbsolute = result.startsWith("/") || /^[A-Za-z]:/.test(result);
    expect(isAbsolute).toBe(true);
  });

  it("should return the same value on repeated calls (deterministic)", () => {
    expect(resolveTemplateRoot()).toBe(resolveTemplateRoot());
  });

  it("should not include 'dist' as the final path segment", () => {
    const result = resolveTemplateRoot();
    const segments = result.split(/[\\/]/);
    const lastNonEmpty = segments.filter(Boolean).at(-1);
    expect(lastNonEmpty).toBe("templates");
  });
});
