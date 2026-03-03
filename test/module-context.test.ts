import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock setup
//
// vi.mock() factories are hoisted before all import statements. All variables
// referenced inside factory closures must be initialised via vi.hoisted().
// ---------------------------------------------------------------------------
const { mockReadFile, mockReaddir, mockPathExists } = vi.hoisted(() => {
  const mockReadFile = vi.fn();
  const mockReaddir = vi.fn();
  const mockPathExists = vi.fn();

  return { mockReadFile, mockReaddir, mockPathExists };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("node:fs/promises", () => ({
  readFile: mockReadFile,
  readdir: mockReaddir,
}));

vi.mock("../src/utils/paths.js", () => ({
  pathExists: mockPathExists,
}));

// Import after mocks are in place.
import {
  detectProjectContext,
  readProjectName,
  scanNextPort,
  detectAuthSupport,
} from "../src/module-context.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Make all four structural markers exist in the project directory. */
function allMarkersExist() {
  mockPathExists.mockResolvedValue(true);
}

/** Make only specific paths exist; everything else returns false. */
function onlyExist(...existingLabels: string[]) {
  mockPathExists.mockImplementation(async (p: string) => {
    return existingLabels.some((label) => p.includes(label));
  });
}

/** Build a fake Dirent object with isDirectory returning a fixed value. */
function makeDirent(name: string, isDir = true) {
  return { name, isDirectory: () => isDir };
}

// ---------------------------------------------------------------------------
// detectProjectContext
// ---------------------------------------------------------------------------

describe("detectProjectContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Happy path — all markers present
  // -------------------------------------------------------------------------
  describe("all required paths exist", () => {
    it("should resolve without throwing when all four markers are present", async () => {
      allMarkersExist();
      await expect(detectProjectContext("/home/user/my-app")).resolves.toBeUndefined();
    });

    it("should check for infra/", async () => {
      allMarkersExist();
      await detectProjectContext("/home/user/my-app");
      expect(mockPathExists).toHaveBeenCalledWith(
        expect.stringContaining("infra")
      );
    });

    it("should check for services/", async () => {
      allMarkersExist();
      await detectProjectContext("/home/user/my-app");
      expect(mockPathExists).toHaveBeenCalledWith(
        expect.stringContaining("services")
      );
    });

    it("should check for dev-gateway/", async () => {
      allMarkersExist();
      await detectProjectContext("/home/user/my-app");
      expect(mockPathExists).toHaveBeenCalledWith(
        expect.stringContaining("dev-gateway")
      );
    });

    it("should check for pnpm-workspace.yaml", async () => {
      allMarkersExist();
      await detectProjectContext("/home/user/my-app");
      expect(mockPathExists).toHaveBeenCalledWith(
        expect.stringContaining("pnpm-workspace.yaml")
      );
    });

    it("should run all four checks (call pathExists exactly four times)", async () => {
      allMarkersExist();
      await detectProjectContext("/home/user/my-app");
      expect(mockPathExists).toHaveBeenCalledTimes(4);
    });
  });

  // -------------------------------------------------------------------------
  // Single missing marker
  // -------------------------------------------------------------------------
  describe("one required path is missing", () => {
    it("should throw when infra/ is missing", async () => {
      onlyExist("services", "dev-gateway", "pnpm-workspace.yaml");
      await expect(detectProjectContext("/home/user/my-app")).rejects.toThrow();
    });

    it("should mention 'infra/' in the error message when infra is missing", async () => {
      onlyExist("services", "dev-gateway", "pnpm-workspace.yaml");
      await expect(
        detectProjectContext("/home/user/my-app")
      ).rejects.toThrow(/infra\//);
    });

    it("should throw when services/ is missing", async () => {
      onlyExist("infra", "dev-gateway", "pnpm-workspace.yaml");
      await expect(detectProjectContext("/home/user/my-app")).rejects.toThrow(/services\//);
    });

    it("should throw when dev-gateway/ is missing", async () => {
      onlyExist("infra", "services", "pnpm-workspace.yaml");
      await expect(detectProjectContext("/home/user/my-app")).rejects.toThrow(/dev-gateway\//);
    });

    it("should throw when pnpm-workspace.yaml is missing", async () => {
      onlyExist("infra", "services", "dev-gateway");
      await expect(
        detectProjectContext("/home/user/my-app")
      ).rejects.toThrow(/pnpm-workspace\.yaml/);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple missing markers — error lists ALL of them
  // -------------------------------------------------------------------------
  describe("multiple required paths are missing", () => {
    it("should list all missing paths in a single error", async () => {
      onlyExist("infra"); // services, dev-gateway, pnpm-workspace.yaml missing
      const error = await detectProjectContext("/home/user/my-app").catch((e) => e as Error);
      expect(error.message).toMatch(/services\//);
      expect(error.message).toMatch(/dev-gateway\//);
      expect(error.message).toMatch(/pnpm-workspace\.yaml/);
    });

    it("should throw when all four markers are missing", async () => {
      mockPathExists.mockResolvedValue(false);
      const error = await detectProjectContext("/home/user/my-app").catch((e) => e as Error);
      expect(error.message).toMatch(/infra\//);
      expect(error.message).toMatch(/services\//);
      expect(error.message).toMatch(/dev-gateway\//);
      expect(error.message).toMatch(/pnpm-workspace\.yaml/);
    });

    it("should include the projectDir in the error message", async () => {
      mockPathExists.mockResolvedValue(false);
      await expect(
        detectProjectContext("/home/user/my-app")
      ).rejects.toThrow(/\/home\/user\/my-app/);
    });
  });
});

// ---------------------------------------------------------------------------
// readProjectName
// ---------------------------------------------------------------------------

describe("readProjectName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------
  describe("valid package.json with a name field", () => {
    it("should return the name field from package.json", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: "my-app" }));
      const result = await readProjectName("/home/user/my-app");
      expect(result).toBe("my-app");
    });

    it("should read package.json from the given projectDir", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: "my-app" }));
      await readProjectName("/home/user/my-app");
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining("package.json"),
        "utf8"
      );
    });

    it("should read the package.json located inside projectDir", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: "my-app" }));
      await readProjectName("/home/user/my-app");
      const [[pathArg]] = mockReadFile.mock.calls as [[string, string]];
      expect(pathArg).toContain("my-app");
      expect(pathArg).toContain("package.json");
    });

    it("should return the correct name for a project with a scoped name", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: "@my-org/my-app" }));
      const result = await readProjectName("/home/user/my-app");
      expect(result).toBe("@my-org/my-app");
    });

    it("should ignore extra fields in package.json and return only name", async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ name: "cool-project", version: "1.0.0", private: true })
      );
      const result = await readProjectName("/home/user/my-app");
      expect(result).toBe("cool-project");
    });
  });

  // -------------------------------------------------------------------------
  // Missing / unreadable package.json
  // -------------------------------------------------------------------------
  describe("package.json does not exist or cannot be read", () => {
    it("should throw when readFile rejects (file missing)", async () => {
      mockReadFile.mockRejectedValue(new Error("ENOENT: no such file or directory"));
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should include the path and hint in the error message", async () => {
      mockReadFile.mockRejectedValue(new Error("ENOENT"));
      await expect(
        readProjectName("/home/user/my-app")
      ).rejects.toThrow(/package\.json/);
    });

    it("should mention the projectDir in the error message", async () => {
      mockReadFile.mockRejectedValue(new Error("ENOENT"));
      await expect(
        readProjectName("/home/user/my-app")
      ).rejects.toThrow(/my-app/);
    });
  });

  // -------------------------------------------------------------------------
  // Malformed JSON
  // -------------------------------------------------------------------------
  describe("package.json contains invalid JSON", () => {
    it("should throw when package.json is not valid JSON", async () => {
      mockReadFile.mockResolvedValue("{ not: valid json }}}");
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should mention package.json in the parse error", async () => {
      mockReadFile.mockResolvedValue("totally invalid");
      await expect(
        readProjectName("/home/user/my-app")
      ).rejects.toThrow(/package\.json/);
    });
  });

  // -------------------------------------------------------------------------
  // Missing or invalid name field
  // -------------------------------------------------------------------------
  describe("package.json exists but has no valid name field", () => {
    it("should throw when package.json has no name field", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ version: "1.0.0" }));
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should throw when name field is an empty string", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: "" }));
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should throw when name field is null", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: null }));
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should throw when name field is a number", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: 42 }));
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should throw when name field is an object", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: {} }));
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should throw when package.json is an empty object", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}));
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should throw when package.json root is a JSON array", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify([]));
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should throw when package.json root is a JSON primitive", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify("just a string"));
      await expect(readProjectName("/home/user/my-app")).rejects.toThrow();
    });

    it("should mention 'name' in the validation error message", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ version: "1.0.0" }));
      await expect(
        readProjectName("/home/user/my-app")
      ).rejects.toThrow(/name/);
    });
  });
});

// ---------------------------------------------------------------------------
// scanNextPort
// ---------------------------------------------------------------------------

describe("scanNextPort", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // services/ does not exist — default port
  // -------------------------------------------------------------------------
  describe("services/ directory does not exist", () => {
    it("should return 3001 when services/ directory does not exist", async () => {
      mockPathExists.mockResolvedValue(false);
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3001);
    });

    it("should check for the services/ directory inside projectDir", async () => {
      mockPathExists.mockResolvedValue(false);
      await scanNextPort("/home/user/my-app");
      expect(mockPathExists).toHaveBeenCalledWith(
        expect.stringContaining("services")
      );
    });
  });

  // -------------------------------------------------------------------------
  // services/ exists but is empty
  // -------------------------------------------------------------------------
  describe("services/ directory exists but has no subdirectories", () => {
    it("should return 3001 when services/ has no subdirectories", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([]);
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3001);
    });

    it("should return 3001 when services/ only contains files (not directories)", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([makeDirent("README.md", false)]);
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3001);
    });
  });

  // -------------------------------------------------------------------------
  // services/ exists but readdir fails
  // -------------------------------------------------------------------------
  describe("readdir throws for the services/ directory", () => {
    it("should return 3001 when readdir throws", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockRejectedValue(new Error("EACCES: permission denied"));
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3001);
    });
  });

  // -------------------------------------------------------------------------
  // Single service with a dev-server port
  // -------------------------------------------------------------------------
  describe("single service with a recognisable port declaration", () => {
    it("should return max port + 1 when one service has port 3001", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([makeDirent("health")]);
      mockReadFile.mockResolvedValue("const PORT = 3001;\n");
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3002);
    });

    it("should read the dev-server.ts file from the correct path", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([makeDirent("health")]);
      mockReadFile.mockResolvedValue("const PORT = 3001;\n");
      await scanNextPort("/home/user/my-app");
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining("dev-server.ts"),
        "utf8"
      );
    });

    it("should construct the dev-server path as services/<name>/src/dev-server.ts", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([makeDirent("health")]);
      mockReadFile.mockResolvedValue("const PORT = 3001;\n");
      await scanNextPort("/home/user/my-app");
      const [[pathArg]] = mockReadFile.mock.calls as [[string, string]];
      expect(pathArg).toContain("health");
      expect(pathArg).toContain("src");
      expect(pathArg).toContain("dev-server.ts");
    });

    it("should match 'const PORT = 3002' without a trailing semicolon", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([makeDirent("users")]);
      mockReadFile.mockResolvedValue("const PORT = 3002\n");
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3003);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple services — returns max + 1
  // -------------------------------------------------------------------------
  describe("multiple services — returns highest port + 1", () => {
    it("should return 3003 when health=3001 and users=3002", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([
        makeDirent("health"),
        makeDirent("users"),
      ]);
      mockReadFile
        .mockResolvedValueOnce("const PORT = 3001;\n") // health
        .mockResolvedValueOnce("const PORT = 3002;\n"); // users
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3003);
    });

    it("should return 4000 when one service uses port 3999", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([
        makeDirent("svc-a"),
        makeDirent("svc-b"),
      ]);
      mockReadFile
        .mockResolvedValueOnce("const PORT = 3001;\n")
        .mockResolvedValueOnce("const PORT = 3999;\n");
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(4000);
    });
  });

  // -------------------------------------------------------------------------
  // Services with no port declarations
  // -------------------------------------------------------------------------
  describe("service dev-server.ts has no port declaration", () => {
    it("should return 3001 when no dev-server.ts has a recognisable PORT", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([makeDirent("svc-a")]);
      mockReadFile.mockResolvedValue("// no PORT here\n");
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3001);
    });

    it("should return max+1 for services that do declare a port when others do not", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([
        makeDirent("svc-no-port"),
        makeDirent("svc-with-port"),
      ]);
      mockReadFile
        .mockResolvedValueOnce("// no PORT here\n")
        .mockResolvedValueOnce("const PORT = 3005;\n");
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3006);
    });
  });

  // -------------------------------------------------------------------------
  // dev-server.ts file is missing for a service
  // -------------------------------------------------------------------------
  describe("dev-server.ts does not exist for a service", () => {
    it("should skip services whose dev-server.ts cannot be read", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([
        makeDirent("no-server"),
        makeDirent("with-server"),
      ]);
      mockReadFile
        .mockRejectedValueOnce(new Error("ENOENT"))   // no-server/src/dev-server.ts missing
        .mockResolvedValueOnce("const PORT = 3004;\n"); // with-server/src/dev-server.ts
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3005);
    });

    it("should return 3001 when all services lack a readable dev-server.ts", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([makeDirent("svc-a"), makeDirent("svc-b")]);
      mockReadFile.mockRejectedValue(new Error("ENOENT"));
      const port = await scanNextPort("/home/user/my-app");
      expect(port).toBe(3001);
    });
  });

  // -------------------------------------------------------------------------
  // Non-directory entries in services/ are ignored
  // -------------------------------------------------------------------------
  describe("non-directory entries in services/ are ignored", () => {
    it("should ignore files alongside service directories", async () => {
      mockPathExists.mockResolvedValue(true);
      mockReaddir.mockResolvedValue([
        makeDirent("health", true),
        makeDirent("README.md", false),
      ]);
      mockReadFile.mockResolvedValue("const PORT = 3001;\n");
      const port = await scanNextPort("/home/user/my-app");
      // Only 'health' is a directory; README.md should not generate a readFile call for dev-server.ts.
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(port).toBe(3002);
    });
  });
});

// ---------------------------------------------------------------------------
// detectAuthSupport
// ---------------------------------------------------------------------------

describe("detectAuthSupport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // auth/ directory exists — standard+ preset
  // -------------------------------------------------------------------------
  describe("auth/ directory exists", () => {
    it("should return true when auth/ exists in the project root", async () => {
      mockPathExists.mockResolvedValue(true);
      const result = await detectAuthSupport("/home/user/my-app");
      expect(result).toBe(true);
    });

    it("should call pathExists with the auth/ path inside projectDir", async () => {
      mockPathExists.mockResolvedValue(true);
      await detectAuthSupport("/home/user/my-app");
      expect(mockPathExists).toHaveBeenCalledWith(
        expect.stringContaining("auth")
      );
    });

    it("should include the projectDir in the path passed to pathExists", async () => {
      mockPathExists.mockResolvedValue(true);
      await detectAuthSupport("/home/user/my-app");
      const [[pathArg]] = mockPathExists.mock.calls as [[string]];
      expect(pathArg).toContain("my-app");
    });

    it("should call pathExists exactly once", async () => {
      mockPathExists.mockResolvedValue(true);
      await detectAuthSupport("/home/user/my-app");
      expect(mockPathExists).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // auth/ directory does not exist — minimal preset
  // -------------------------------------------------------------------------
  describe("auth/ directory does not exist", () => {
    it("should return false when auth/ does not exist in the project root", async () => {
      mockPathExists.mockResolvedValue(false);
      const result = await detectAuthSupport("/home/user/my-app");
      expect(result).toBe(false);
    });

    it("should still call pathExists with the auth/ path even when the directory is absent", async () => {
      mockPathExists.mockResolvedValue(false);
      await detectAuthSupport("/home/user/my-app");
      expect(mockPathExists).toHaveBeenCalledWith(
        expect.stringContaining("auth")
      );
    });
  });

  // -------------------------------------------------------------------------
  // Correct path construction
  // -------------------------------------------------------------------------
  describe("path construction", () => {
    it("should join projectDir and 'auth' into the checked path", async () => {
      mockPathExists.mockResolvedValue(false);
      await detectAuthSupport("/home/user/my-project");
      const [[pathArg]] = mockPathExists.mock.calls as [[string]];
      // The resulting path must contain both the project dir segment and 'auth'.
      expect(pathArg).toContain("my-project");
      expect(pathArg).toContain("auth");
    });

    it("should work with a trailing-slash-free projectDir", async () => {
      mockPathExists.mockResolvedValue(true);
      await detectAuthSupport("/projects/app");
      const [[pathArg]] = mockPathExists.mock.calls as [[string]];
      expect(pathArg).toMatch(/app.*auth|auth/);
    });
  });
});
