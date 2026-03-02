/**
 * Phase 4/5 — SUBDIR_TEMPLATE_DIRS expansion tests.
 *
 * Phase 4 expanded SUBDIR_TEMPLATE_DIRS in scaffolder.ts from
 *   new Set(["services"])
 * to
 *   new Set(["services", "infra", "dev-gateway", "packages"])
 *
 * Phase 5 further expanded it to include feature-gated workspace members:
 *   new Set(["services", "infra", "dev-gateway", "packages", "frontend", "auth", "e2e"])
 *
 * This file verifies that all subdirectory template dirs are correctly placed
 * inside a same-named subdirectory of the project root rather than being
 * merged into the root itself.
 *
 * Companion file test/phase4-templates.test.ts covers template file existence
 * and .hbs naming conventions (it uses the real filesystem; this file mocks
 * node:fs/promises so the two concerns must be separated).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { sep } from "node:path";
import type { ProjectConfig } from "../src/types.js";

// ---------------------------------------------------------------------------
// Hoisted mock setup — mirrors the pattern in scaffolder.test.ts
// ---------------------------------------------------------------------------

const {
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
  };
});

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
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

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
    gitInit: false,
    installDeps: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper: collect (src, dest) pairs from all copyDir calls
// ---------------------------------------------------------------------------

type CopyCall = { src: string; dest: string };

function collectCopyCalls(): CopyCall[] {
  return (mockCopyDir.mock.calls as [string, string, unknown, unknown][]).map(
    ([src, dest]) => ({ src, dest })
  );
}

/**
 * Returns true when a path ends with <segment> using either / or \\ separator.
 * Keeps assertions platform-independent (macOS/Linux vs Windows).
 */
function endsWithSegment(path: string, ...segments: string[]): boolean {
  const suffix = segments.join(sep);
  const suffixAlt = segments.join("/");
  const suffixAlt2 = segments.join("\\");
  return (
    path.endsWith(sep + suffix) ||
    path.endsWith("/" + suffixAlt) ||
    path.endsWith("\\" + suffixAlt2) ||
    path === suffix ||
    path === suffixAlt ||
    path === suffixAlt2
  );
}

// ---------------------------------------------------------------------------
// beforeEach shared reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  mockMkdir.mockResolvedValue(undefined);
  mockAccess.mockRejectedValue(new Error("ENOENT"));
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

// ---------------------------------------------------------------------------
// "infra" → projectDir/infra
// ---------------------------------------------------------------------------

describe("SUBDIR_TEMPLATE_DIRS — 'infra' placement (Phase 4 addition)", () => {
  it("should copy 'infra' into projectDir/infra, not the project root", async () => {
    mockGetTemplateDirs.mockReturnValue(["infra"]);

    await scaffold(makeConfig({ projectName: "my-app" }));

    const [call] = collectCopyCalls();
    expect(endsWithSegment(call.dest, "my-app", "infra")).toBe(true);
  });

  it("should NOT merge 'infra' directly into the project root", async () => {
    mockGetTemplateDirs.mockReturnValue(["infra"]);

    await scaffold(makeConfig({ projectName: "my-app" }));

    const [call] = collectCopyCalls();
    // Destination must end with "my-app/infra", so it must NOT end with just "my-app".
    expect(endsWithSegment(call.dest, "my-app")).toBe(false);
  });

  it("should reflect the project name in the infra destination path", async () => {
    mockGetTemplateDirs.mockReturnValue(["infra"]);

    await scaffold(makeConfig({ projectName: "cool-api" }));

    const [call] = collectCopyCalls();
    expect(endsWithSegment(call.dest, "cool-api", "infra")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// "dev-gateway" → projectDir/dev-gateway
// ---------------------------------------------------------------------------

describe("SUBDIR_TEMPLATE_DIRS — 'dev-gateway' placement (Phase 4 addition)", () => {
  it("should copy 'dev-gateway' into projectDir/dev-gateway, not the project root", async () => {
    mockGetTemplateDirs.mockReturnValue(["dev-gateway"]);

    await scaffold(makeConfig({ projectName: "my-app" }));

    const [call] = collectCopyCalls();
    expect(endsWithSegment(call.dest, "my-app", "dev-gateway")).toBe(true);
  });

  it("should NOT merge 'dev-gateway' directly into the project root", async () => {
    mockGetTemplateDirs.mockReturnValue(["dev-gateway"]);

    await scaffold(makeConfig({ projectName: "my-app" }));

    const [call] = collectCopyCalls();
    expect(endsWithSegment(call.dest, "my-app")).toBe(false);
  });

  it("should reflect the project name in the dev-gateway destination path", async () => {
    mockGetTemplateDirs.mockReturnValue(["dev-gateway"]);

    await scaffold(makeConfig({ projectName: "my-service" }));

    const [call] = collectCopyCalls();
    expect(endsWithSegment(call.dest, "my-service", "dev-gateway")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// "packages" → projectDir/packages
// ---------------------------------------------------------------------------

describe("SUBDIR_TEMPLATE_DIRS — 'packages' placement (Phase 4 addition)", () => {
  it("should copy 'packages' into projectDir/packages, not the project root", async () => {
    mockGetTemplateDirs.mockReturnValue(["packages"]);

    await scaffold(makeConfig({ projectName: "my-app" }));

    const [call] = collectCopyCalls();
    expect(endsWithSegment(call.dest, "my-app", "packages")).toBe(true);
  });

  it("should NOT merge 'packages' directly into the project root", async () => {
    mockGetTemplateDirs.mockReturnValue(["packages"]);

    await scaffold(makeConfig({ projectName: "my-app" }));

    const [call] = collectCopyCalls();
    expect(endsWithSegment(call.dest, "my-app")).toBe(false);
  });

  it("should reflect the project name in the packages destination path", async () => {
    mockGetTemplateDirs.mockReturnValue(["packages"]);

    await scaffold(makeConfig({ projectName: "mono-repo" }));

    const [call] = collectCopyCalls();
    expect(endsWithSegment(call.dest, "mono-repo", "packages")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// "services" still routes to projectDir/services (regression guard)
// ---------------------------------------------------------------------------

describe("SUBDIR_TEMPLATE_DIRS — 'services' placement (regression guard)", () => {
  it("should still copy 'services' into projectDir/services after Phase 4 expansion", async () => {
    mockGetTemplateDirs.mockReturnValue(["services"]);

    await scaffold(makeConfig({ projectName: "my-app" }));

    const [call] = collectCopyCalls();
    expect(endsWithSegment(call.dest, "my-app", "services")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Root-only template dirs are NOT in SUBDIR_TEMPLATE_DIRS (regression guard)
// ---------------------------------------------------------------------------

describe("SUBDIR_TEMPLATE_DIRS — root-only dirs stay at project root", () => {
  // "frontend", "auth", "e2e" are no longer root-only — they were moved into
  // SUBDIR_TEMPLATE_DIRS in Phase 5 so they land in their own workspace
  // subdirectory (e.g. projectDir/frontend/).
  it.each(["base", "database", "cicd", "monitoring", "extras"])(
    "should copy '%s' directly into the project root",
    async (dir) => {
      mockGetTemplateDirs.mockReturnValue([dir]);

      await scaffold(makeConfig({ projectName: "my-app" }));

      const [call] = collectCopyCalls();
      // Destination ends with "my-app" and does NOT end with "my-app/<dir>".
      expect(endsWithSegment(call.dest, "my-app")).toBe(true);
      expect(endsWithSegment(call.dest, "my-app", dir)).toBe(false);
    }
  );
});

// ---------------------------------------------------------------------------
// Phase 5: "frontend", "auth", "e2e" → projectDir/<dir>
// ---------------------------------------------------------------------------

describe("SUBDIR_TEMPLATE_DIRS — Phase 5 feature dirs placed in subdirectories", () => {
  it.each(["frontend", "auth", "e2e"])(
    "should copy '%s' into projectDir/%s, not the project root",
    async (dir) => {
      mockGetTemplateDirs.mockReturnValue([dir]);

      await scaffold(makeConfig({ projectName: "my-app" }));

      const [call] = collectCopyCalls();
      expect(endsWithSegment(call.dest, "my-app", dir)).toBe(true);
    }
  );

  it.each(["frontend", "auth", "e2e"])(
    "should NOT merge '%s' directly into the project root",
    async (dir) => {
      mockGetTemplateDirs.mockReturnValue([dir]);

      await scaffold(makeConfig({ projectName: "my-app" }));

      const [call] = collectCopyCalls();
      // Must end with "my-app/<dir>", NOT just "my-app".
      expect(endsWithSegment(call.dest, "my-app")).toBe(false);
    }
  );

  it("should copy 'frontend', 'auth', and 'e2e' into same-named subdirs in a combined run", async () => {
    const featureDirs = ["frontend", "auth", "e2e"];
    mockGetTemplateDirs.mockReturnValue(featureDirs);

    await scaffold(makeConfig({ projectName: "std-app" }));

    const calls = collectCopyCalls();
    for (const dir of featureDirs) {
      const match = calls.find(
        (c) => c.src.endsWith(`/${dir}`) || c.src.endsWith(`\\${dir}`)
      );
      expect(match, `copyDir call for '${dir}' not found`).toBeDefined();
      expect(
        endsWithSegment(match!.dest, "std-app", dir),
        `'${dir}' should be in projectDir/${dir}, got: ${match!.dest}`
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Full minimal preset — all five dirs receive the correct destination each time
// ---------------------------------------------------------------------------

describe("SUBDIR_TEMPLATE_DIRS — minimal preset full run", () => {
  it("should produce five copyDir calls for the five minimal template dirs", async () => {
    mockGetTemplateDirs.mockReturnValue([
      "base",
      "infra",
      "services",
      "dev-gateway",
      "packages",
    ]);

    await scaffold(makeConfig({ projectName: "my-app" }));

    expect(mockCopyDir).toHaveBeenCalledTimes(5);
  });

  it("should place 'base' at the project root and 'infra' in a subdirectory within the same run", async () => {
    mockGetTemplateDirs.mockReturnValue(["base", "infra"]);

    await scaffold(makeConfig({ projectName: "my-app" }));

    const calls = collectCopyCalls();
    const baseCall = calls.find(
      (c) => c.src.endsWith("/base") || c.src.endsWith("\\base")
    );
    const infraCall = calls.find(
      (c) => c.src.endsWith("/infra") || c.src.endsWith("\\infra")
    );

    expect(baseCall).toBeDefined();
    expect(infraCall).toBeDefined();

    // base → project root (ends with "my-app", not "my-app/base")
    expect(endsWithSegment(baseCall!.dest, "my-app")).toBe(true);
    expect(endsWithSegment(baseCall!.dest, "my-app", "base")).toBe(false);

    // infra → subdirectory
    expect(endsWithSegment(infraCall!.dest, "my-app", "infra")).toBe(true);
  });

  it("should place all seven SUBDIR dirs in same-named subdirectories within the same run", async () => {
    const subdirDirs = [
      "infra",
      "services",
      "dev-gateway",
      "packages",
      "frontend",
      "auth",
      "e2e",
    ];
    mockGetTemplateDirs.mockReturnValue(subdirDirs);

    await scaffold(makeConfig({ projectName: "proj" }));

    const calls = collectCopyCalls();

    for (const dir of subdirDirs) {
      const match = calls.find(
        (c) => c.src.endsWith(`/${dir}`) || c.src.endsWith(`\\${dir}`)
      );
      expect(match, `copyDir call for '${dir}' not found`).toBeDefined();
      expect(
        endsWithSegment(match!.dest, "proj", dir),
        `'${dir}' should be in projectDir/${dir}, got: ${match!.dest}`
      ).toBe(true);
    }
  });
});
