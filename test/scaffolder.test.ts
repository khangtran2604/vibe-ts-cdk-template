import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProjectConfig } from "../src/types.js";

// ---------------------------------------------------------------------------
// Hoisted mock setup
//
// vi.mock() factories are hoisted before all import statements.  All variables
// referenced inside factory closures must be initialised via vi.hoisted().
// ---------------------------------------------------------------------------
const {
  // node:fs/promises mocks
  mockMkdir,
  mockAccess,
  mockWriteFile,
  // Utility mocks
  mockCopyDir,
  mockInitGit,
  mockInstallDeps,
  // template-helpers mocks
  mockGetTemplateDirs,
  mockGetVariableMap,
  mockGetWorkspaceEntries,
  // @clack/prompts spinner
  mockSpinnerStart,
  mockSpinnerStop,
  mockSpinner,
  // logger mocks
  mockLoggerInfo,
  mockLoggerSuccess,
} = vi.hoisted(() => {
  const mockMkdir = vi.fn().mockResolvedValue(undefined);
  const mockAccess = vi.fn().mockRejectedValue(new Error("ENOENT"));
  const mockWriteFile = vi.fn().mockResolvedValue(undefined);

  const mockCopyDir = vi.fn().mockResolvedValue(undefined);
  const mockInitGit = vi.fn().mockResolvedValue({ success: true });
  const mockInstallDeps = vi.fn().mockResolvedValue({ success: true });

  const mockGetTemplateDirs = vi
    .fn()
    .mockReturnValue(["base", "infra", "services", "dev-gateway", "packages"]);
  const mockGetVariableMap = vi
    .fn()
    .mockReturnValue({ projectName: "my-app", awsRegion: "us-east-1" });
  const mockGetWorkspaceEntries = vi
    .fn()
    .mockReturnValue(["infra", "services/*", "dev-gateway", "packages/*"]);

  const mockSpinnerStart = vi.fn();
  const mockSpinnerStop = vi.fn();
  const mockSpinner = vi.fn(() => ({
    start: mockSpinnerStart,
    stop: mockSpinnerStop,
  }));

  const mockLoggerInfo = vi.fn();
  const mockLoggerSuccess = vi.fn();

  return {
    mockMkdir,
    mockAccess,
    mockWriteFile,
    mockCopyDir,
    mockInitGit,
    mockInstallDeps,
    mockGetTemplateDirs,
    mockGetVariableMap,
    mockGetWorkspaceEntries,
    mockSpinnerStart,
    mockSpinnerStop,
    mockSpinner,
    mockLoggerInfo,
    mockLoggerSuccess,
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("node:fs/promises", () => ({
  mkdir: mockMkdir,
  access: mockAccess,
  writeFile: mockWriteFile,
}));

vi.mock("../src/utils/fs.js", () => ({
  copyDir: mockCopyDir,
}));

vi.mock("../src/utils/git.js", () => ({
  initGit: mockInitGit,
}));

vi.mock("../src/utils/pnpm.js", () => ({
  installDeps: mockInstallDeps,
}));

vi.mock("../src/template-helpers.js", () => ({
  getTemplateDirs: mockGetTemplateDirs,
  getVariableMap: mockGetVariableMap,
  getWorkspaceEntries: mockGetWorkspaceEntries,
}));

vi.mock("@clack/prompts", () => ({
  spinner: mockSpinner,
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../src/utils/logger.js", () => ({
  info: mockLoggerInfo,
  success: mockLoggerSuccess,
  warn: vi.fn(),
  error: vi.fn(),
}));

// Import after mocks are in place.
import { scaffold } from "../src/scaffolder.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ALL_OFF = {
  frontend: false,
  auth: false,
  e2e: false,
  database: false,
  rds: false,
  cicd: false,
  monitoring: false,
  hooks: false,
};

function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: "my-app",
    preset: "minimal",
    awsRegion: "us-east-1",
    features: { ...ALL_OFF },
    gitInit: true,
    installDeps: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("scaffold", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-apply default resolved values after clearAllMocks resets them.
    mockMkdir.mockResolvedValue(undefined);
    mockAccess.mockRejectedValue(new Error("ENOENT")); // path does NOT exist
    mockWriteFile.mockResolvedValue(undefined);
    mockCopyDir.mockResolvedValue(undefined);
    mockInitGit.mockResolvedValue({ success: true });
    mockInstallDeps.mockResolvedValue({ success: true });

    mockGetTemplateDirs.mockReturnValue([
      "base",
      "infra",
      "services",
      "dev-gateway",
      "packages",
    ]);
    mockGetVariableMap.mockReturnValue({
      projectName: "my-app",
      awsRegion: "us-east-1",
    });
    mockGetWorkspaceEntries.mockReturnValue([
      "infra",
      "services/*",
      "dev-gateway",
      "packages/*",
    ]);

    mockSpinner.mockReturnValue({
      start: mockSpinnerStart,
      stop: mockSpinnerStop,
    });
  });

  // -------------------------------------------------------------------------
  // Directory existence guard
  // -------------------------------------------------------------------------
  describe("target directory already exists", () => {
    it("should throw when the target directory already exists", async () => {
      // Make access() resolve (path exists) instead of throwing.
      mockAccess.mockResolvedValue(undefined);

      await expect(scaffold(makeConfig())).rejects.toThrow(
        /already exists/
      );
    });

    it("should include the project name in the error message", async () => {
      mockAccess.mockResolvedValue(undefined);

      await expect(
        scaffold(makeConfig({ projectName: "existing-project" }))
      ).rejects.toThrow(/existing-project/);
    });

    it("should NOT create the project directory when it already exists", async () => {
      mockAccess.mockResolvedValue(undefined);

      try {
        await scaffold(makeConfig());
      } catch {
        // expected
      }

      expect(mockMkdir).not.toHaveBeenCalled();
    });

    it("should NOT call copyDir when the target directory already exists", async () => {
      mockAccess.mockResolvedValue(undefined);

      try {
        await scaffold(makeConfig());
      } catch {
        // expected
      }

      expect(mockCopyDir).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Project directory creation
  // -------------------------------------------------------------------------
  describe("project directory creation", () => {
    it("should create the project directory when it does not exist", async () => {
      await scaffold(makeConfig());

      expect(mockMkdir).toHaveBeenCalledOnce();
    });

    it("should create the directory with { recursive: true }", async () => {
      await scaffold(makeConfig());

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });

    it("should create a directory whose path ends with the project name", async () => {
      await scaffold(makeConfig({ projectName: "cool-api" }));

      const [[dirArg]] = mockMkdir.mock.calls as [[string, unknown]];
      expect(dirArg.endsWith("cool-api")).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Template directory copying
  // -------------------------------------------------------------------------
  describe("template directory copying", () => {
    it("should call copyDir once for each template dir returned by getTemplateDirs", async () => {
      const templateDirs = ["base", "infra", "services"];
      mockGetTemplateDirs.mockReturnValue(templateDirs);

      await scaffold(makeConfig());

      expect(mockCopyDir).toHaveBeenCalledTimes(templateDirs.length);
    });

    it("should pass the feature flags to getTemplateDirs", async () => {
      const features = { ...ALL_OFF, frontend: true };
      await scaffold(makeConfig({ features }));

      expect(mockGetTemplateDirs).toHaveBeenCalledWith(features);
    });

    it("should pass variables from getVariableMap to each copyDir call", async () => {
      const variables = { projectName: "my-app", awsRegion: "eu-west-1" };
      mockGetVariableMap.mockReturnValue(variables);
      mockGetTemplateDirs.mockReturnValue(["base"]);

      await scaffold(makeConfig());

      expect(mockCopyDir).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        variables,
        expect.anything()
      );
    });

    it("should pass feature flags to each copyDir call", async () => {
      const features = { ...ALL_OFF, auth: true };
      mockGetTemplateDirs.mockReturnValue(["base"]);

      await scaffold(makeConfig({ features }));

      expect(mockCopyDir).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.anything(),
        features
      );
    });

    it("should merge 'services' template dir into a projectDir/services subdirectory", async () => {
      mockGetTemplateDirs.mockReturnValue(["services"]);

      await scaffold(makeConfig({ projectName: "my-app" }));

      const [[, destArg]] = mockCopyDir.mock.calls as [[string, string, unknown, unknown]];
      expect(destArg.endsWith("my-app/services") || destArg.endsWith("my-app\\services")).toBe(true);
    });

    it("should merge non-services template dirs directly into the project root", async () => {
      mockGetTemplateDirs.mockReturnValue(["base"]);

      await scaffold(makeConfig({ projectName: "my-app" }));

      const [[, destArg]] = mockCopyDir.mock.calls as [[string, string, unknown, unknown]];
      // Destination must be the project root, NOT a named subdirectory.
      expect(destArg.endsWith("my-app")).toBe(true);
    });

    it("should copy template dirs in the order returned by getTemplateDirs", async () => {
      const templateDirs = ["base", "infra", "services", "dev-gateway"];
      mockGetTemplateDirs.mockReturnValue(templateDirs);

      await scaffold(makeConfig());

      // Extract the source paths from each copyDir call to verify order.
      const srcPaths = (mockCopyDir.mock.calls as [string, ...unknown[]][]).map(
        ([src]) => src
      );
      for (let i = 0; i < templateDirs.length; i++) {
        expect(srcPaths[i]).toContain(templateDirs[i]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // pnpm-workspace.yaml
  // -------------------------------------------------------------------------
  describe("pnpm-workspace.yaml generation", () => {
    it("should write pnpm-workspace.yaml to the project root", async () => {
      await scaffold(makeConfig({ projectName: "ws-test" }));

      const writeFileCall = mockWriteFile.mock.calls.find(
        ([path]: [string, ...unknown[]]) => path.endsWith("pnpm-workspace.yaml")
      );
      expect(writeFileCall).toBeDefined();
      expect(writeFileCall![0]).toContain("ws-test");
    });

    it("should write pnpm-workspace.yaml with utf8 encoding", async () => {
      await scaffold(makeConfig());

      const writeFileCall = mockWriteFile.mock.calls.find(
        ([path]: [string, ...unknown[]]) => path.endsWith("pnpm-workspace.yaml")
      );
      expect(writeFileCall![2]).toBe("utf8");
    });

    it("should include a 'packages:' header in the written yaml", async () => {
      await scaffold(makeConfig());

      const writeFileCall = mockWriteFile.mock.calls.find(
        ([path]: [string, ...unknown[]]) => path.endsWith("pnpm-workspace.yaml")
      );
      const content = writeFileCall![1] as string;
      expect(content).toContain("packages:");
    });

    it("should include each workspace entry as a quoted yaml list item", async () => {
      mockGetWorkspaceEntries.mockReturnValue(["infra", "services/*"]);

      await scaffold(makeConfig());

      const writeFileCall = mockWriteFile.mock.calls.find(
        ([path]: [string, ...unknown[]]) => path.endsWith("pnpm-workspace.yaml")
      );
      const content = writeFileCall![1] as string;
      expect(content).toContain('  - "infra"');
      expect(content).toContain('  - "services/*"');
    });

    it("should pass feature flags to getWorkspaceEntries", async () => {
      const features = { ...ALL_OFF, frontend: true, e2e: true };
      await scaffold(makeConfig({ features }));

      expect(mockGetWorkspaceEntries).toHaveBeenCalledWith(features);
    });

    it("should generate yaml with one entry per line and trailing newline", async () => {
      mockGetWorkspaceEntries.mockReturnValue(["infra", "services/*"]);

      await scaffold(makeConfig());

      const writeFileCall = mockWriteFile.mock.calls.find(
        ([path]: [string, ...unknown[]]) => path.endsWith("pnpm-workspace.yaml")
      );
      const content = writeFileCall![1] as string;
      // Expected shape:
      //   packages:\n  - "infra"\n  - "services/*"\n
      expect(content).toBe('packages:\n  - "infra"\n  - "services/*"\n');
    });

    it("should call logger.success after writing pnpm-workspace.yaml", async () => {
      await scaffold(makeConfig());

      expect(mockLoggerSuccess).toHaveBeenCalledWith(
        expect.stringContaining("pnpm-workspace.yaml")
      );
    });
  });

  // -------------------------------------------------------------------------
  // Git init (conditional)
  // -------------------------------------------------------------------------
  describe("git init", () => {
    it("should call initGit when config.gitInit is true", async () => {
      await scaffold(makeConfig({ gitInit: true }));

      expect(mockInitGit).toHaveBeenCalledOnce();
    });

    it("should call initGit with the project directory path", async () => {
      await scaffold(makeConfig({ projectName: "git-test", gitInit: true }));

      const [[dirArg]] = mockInitGit.mock.calls as [[string]];
      expect(dirArg.endsWith("git-test")).toBe(true);
    });

    it("should NOT call initGit when config.gitInit is false", async () => {
      await scaffold(makeConfig({ gitInit: false }));

      expect(mockInitGit).not.toHaveBeenCalled();
    });

    it("should log an info message when gitInit is false", async () => {
      await scaffold(makeConfig({ gitInit: false }));

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining("git init")
      );
    });
  });

  // -------------------------------------------------------------------------
  // pnpm install (conditional)
  // -------------------------------------------------------------------------
  describe("pnpm install", () => {
    it("should call installDeps when config.installDeps is true", async () => {
      await scaffold(makeConfig({ installDeps: true }));

      expect(mockInstallDeps).toHaveBeenCalledOnce();
    });

    it("should call installDeps with the project directory path", async () => {
      await scaffold(makeConfig({ projectName: "install-test", installDeps: true }));

      const [[dirArg]] = mockInstallDeps.mock.calls as [[string]];
      expect(dirArg.endsWith("install-test")).toBe(true);
    });

    it("should NOT call installDeps when config.installDeps is false", async () => {
      await scaffold(makeConfig({ installDeps: false }));

      expect(mockInstallDeps).not.toHaveBeenCalled();
    });

    it("should log an info message when installDeps is false", async () => {
      await scaffold(makeConfig({ installDeps: false }));

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining("install")
      );
    });
  });

  // -------------------------------------------------------------------------
  // Spinner usage
  // -------------------------------------------------------------------------
  describe("spinner usage", () => {
    it("should create at least two spinners (directory creation + file copy)", async () => {
      await scaffold(makeConfig());

      // Two separate spinner() factory calls are expected.
      expect(mockSpinner).toHaveBeenCalledTimes(2);
    });

    it("should start a spinner with a message mentioning directory creation", async () => {
      await scaffold(makeConfig());

      const startCalls = mockSpinnerStart.mock.calls as [string][];
      const dirSpinner = startCalls.find(([msg]) =>
        msg.toLowerCase().includes("director")
      );
      expect(dirSpinner).toBeDefined();
    });

    it("should start a spinner with a message mentioning template/copy", async () => {
      await scaffold(makeConfig());

      const startCalls = mockSpinnerStart.mock.calls as [string][];
      const copySpinner = startCalls.find(([msg]) =>
        msg.toLowerCase().includes("cop")
      );
      expect(copySpinner).toBeDefined();
    });

    it("should stop all started spinners", async () => {
      await scaffold(makeConfig());

      // Every start should be paired with a stop.
      expect(mockSpinnerStop).toHaveBeenCalledTimes(mockSpinnerStart.mock.calls.length);
    });
  });

  // -------------------------------------------------------------------------
  // Orchestration order
  // -------------------------------------------------------------------------
  describe("orchestration order", () => {
    it("should create the directory before copying templates", async () => {
      const callOrder: string[] = [];

      mockMkdir.mockImplementation(async () => {
        callOrder.push("mkdir");
      });
      mockCopyDir.mockImplementation(async () => {
        callOrder.push("copyDir");
      });

      await scaffold(makeConfig());

      const mkdirIdx = callOrder.indexOf("mkdir");
      const copyDirIdx = callOrder.indexOf("copyDir");
      expect(mkdirIdx).toBeLessThan(copyDirIdx);
    });

    it("should write pnpm-workspace.yaml after copying all template dirs", async () => {
      const callOrder: string[] = [];
      let copyCount = 0;
      const templateDirs = ["base", "infra", "services"];
      mockGetTemplateDirs.mockReturnValue(templateDirs);

      mockCopyDir.mockImplementation(async () => {
        callOrder.push(`copyDir-${copyCount++}`);
      });
      mockWriteFile.mockImplementation(async (path: string) => {
        if (path.endsWith("pnpm-workspace.yaml")) {
          callOrder.push("writeWorkspace");
        }
      });

      await scaffold(makeConfig());

      const lastCopyIdx = callOrder.lastIndexOf(`copyDir-${templateDirs.length - 1}`);
      const writeIdx = callOrder.indexOf("writeWorkspace");
      expect(lastCopyIdx).toBeLessThan(writeIdx);
    });

    it("should run initGit after writing pnpm-workspace.yaml", async () => {
      const callOrder: string[] = [];

      mockWriteFile.mockImplementation(async (path: string) => {
        if (path.endsWith("pnpm-workspace.yaml")) {
          callOrder.push("writeWorkspace");
        }
      });
      mockInitGit.mockImplementation(async () => {
        callOrder.push("initGit");
        return { success: true };
      });

      await scaffold(makeConfig({ gitInit: true }));

      const writeIdx = callOrder.indexOf("writeWorkspace");
      const gitIdx = callOrder.indexOf("initGit");
      expect(writeIdx).toBeLessThan(gitIdx);
    });

    it("should run installDeps after initGit when both are enabled", async () => {
      const callOrder: string[] = [];

      mockInitGit.mockImplementation(async () => {
        callOrder.push("initGit");
        return { success: true };
      });
      mockInstallDeps.mockImplementation(async () => {
        callOrder.push("installDeps");
        return { success: true };
      });

      await scaffold(makeConfig({ gitInit: true, installDeps: true }));

      const gitIdx = callOrder.indexOf("initGit");
      const installIdx = callOrder.indexOf("installDeps");
      expect(gitIdx).toBeLessThan(installIdx);
    });
  });

  // -------------------------------------------------------------------------
  // Error propagation
  // -------------------------------------------------------------------------
  describe("error propagation", () => {
    it("should propagate errors thrown by mkdir", async () => {
      mockMkdir.mockRejectedValue(new Error("EACCES: permission denied"));

      await expect(scaffold(makeConfig())).rejects.toThrow(
        "EACCES: permission denied"
      );
    });

    it("should propagate errors thrown by copyDir", async () => {
      mockCopyDir.mockRejectedValue(new Error("ENOSPC: no space left"));

      await expect(scaffold(makeConfig())).rejects.toThrow(
        "ENOSPC: no space left"
      );
    });

    it("should propagate errors thrown by writeFile (workspace yaml)", async () => {
      mockWriteFile.mockRejectedValue(new Error("EROFS: read-only filesystem"));

      await expect(scaffold(makeConfig())).rejects.toThrow(
        "EROFS: read-only filesystem"
      );
    });
  });
});
