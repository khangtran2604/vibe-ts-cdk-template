import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ProjectConfig } from "../src/types.js";

// ---------------------------------------------------------------------------
// Hoisted mock data
//
// vi.mock() factories are hoisted to the top of the module before any imports
// or const declarations.  Variables referenced inside a factory must be
// defined with vi.hoisted() so they are initialised before the factory runs.
// ---------------------------------------------------------------------------
const { mockClack } = vi.hoisted(() => {
  const mockClack = {
    intro: vi.fn(),
    outro: vi.fn(),
    log: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    },
    text: vi.fn(),
    select: vi.fn(),
    confirm: vi.fn(),
    // By default, nothing is a cancel symbol.
    isCancel: vi.fn(() => false),
  };
  return { mockClack };
});

// Mock @clack/prompts with the stub object defined above.
vi.mock("@clack/prompts", () => mockClack);

// Import the modules under test AFTER setting up mocks.
import { runPrompts } from "../src/prompts.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the expected minimal ProjectConfig returned under --yes with no extra flags. */
function makeMinimalConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: "my-app",
    preset: "minimal",
    awsRegion: "us-east-1",
    features: {
      frontend: false,
      auth: false,
      e2e: false,
      database: false,
      rds: false,
      cicd: false,
      monitoring: false,
      hooks: false,
    },
    gitInit: true,
    installDeps: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Ensure isCancel always returns false (not cancelled) by default.
  mockClack.isCancel.mockReturnValue(false);
  // Default text / select / confirm return sensible values so tests that do
  // trigger prompts do not hang with undefined results.
  mockClack.text.mockResolvedValue("my-app");
  mockClack.select.mockResolvedValue("minimal");
  mockClack.confirm.mockResolvedValue(true);
  // Remove AWS_DEFAULT_REGION from the environment for deterministic behaviour.
  delete process.env["AWS_DEFAULT_REGION"];
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env["AWS_DEFAULT_REGION"];
});

// ---------------------------------------------------------------------------
// validateProjectName — tested indirectly via runPrompts({ yes: true })
//
// When a caller passes an invalid projectName together with yes:true the
// function calls clack.log.error and process.exit(1) immediately.  We spy on
// process.exit to intercept the call without terminating the test runner.
// ---------------------------------------------------------------------------

describe("validateProjectName (via runPrompts --yes edge cases)", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      // Throw so that execution stops after the exit call.
      throw new Error("process.exit called");
    }) as typeof process.exit);
  });

  it("should exit(1) when projectName is an empty string under --yes", async () => {
    await expect(
      runPrompts({ yes: true, projectName: "" })
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should exit(1) when projectName contains only spaces under --yes", async () => {
    await expect(
      runPrompts({ yes: true, projectName: "   " })
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should exit(1) when projectName contains uppercase letters under --yes", async () => {
    await expect(
      runPrompts({ yes: true, projectName: "INVALID" })
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should exit(1) when projectName contains a space under --yes", async () => {
    await expect(
      runPrompts({ yes: true, projectName: "my app" })
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should exit(1) when projectName starts with a hyphen under --yes", async () => {
    await expect(
      runPrompts({ yes: true, projectName: "-bad-start" })
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should exit(1) when projectName ends with a hyphen under --yes", async () => {
    await expect(
      runPrompts({ yes: true, projectName: "bad-end-" })
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should exit(1) when projectName contains special characters under --yes", async () => {
    await expect(
      runPrompts({ yes: true, projectName: "my@app" })
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should log an error message that includes the invalid name under --yes", async () => {
    await expect(
      runPrompts({ yes: true, projectName: "BAD_NAME" })
    ).rejects.toThrow("process.exit called");

    expect(mockClack.log.error).toHaveBeenCalledOnce();
    const [msg] = mockClack.log.error.mock.calls[0] as [string];
    expect(msg).toContain("BAD_NAME");
  });
});

// ---------------------------------------------------------------------------
// validateProjectName — valid names do NOT exit
// ---------------------------------------------------------------------------

describe("validateProjectName — valid names accepted under --yes", () => {
  it("should accept a simple lowercase name", async () => {
    const config = await runPrompts({ yes: true, projectName: "myapp" });
    expect(config.projectName).toBe("myapp");
  });

  it("should accept a hyphenated name", async () => {
    const config = await runPrompts({ yes: true, projectName: "my-app" });
    expect(config.projectName).toBe("my-app");
  });

  it("should accept a name with underscores", async () => {
    const config = await runPrompts({ yes: true, projectName: "my_app" });
    expect(config.projectName).toBe("my_app");
  });

  it("should accept a single-character name", async () => {
    const config = await runPrompts({ yes: true, projectName: "a" });
    expect(config.projectName).toBe("a");
  });

  it("should accept a name that is all digits", async () => {
    const config = await runPrompts({ yes: true, projectName: "123" });
    expect(config.projectName).toBe("123");
  });

  it("should accept a name that starts with a digit", async () => {
    const config = await runPrompts({ yes: true, projectName: "1app" });
    expect(config.projectName).toBe("1app");
  });
});

// ---------------------------------------------------------------------------
// validateRegion — invalid region under --yes
// ---------------------------------------------------------------------------

describe("validateRegion (via runPrompts --yes edge cases)", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as typeof process.exit);
  });

  it("should exit(1) when region is 'garbage' under --yes", async () => {
    await expect(
      runPrompts({ yes: true, region: "garbage" })
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should exit(1) when region is an empty string under --yes", async () => {
    // Pass a non-default invalid value so regionAlreadySet becomes true.
    await expect(
      runPrompts({ yes: true, region: "not-a-region" })
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should log an error message that includes the invalid region under --yes", async () => {
    await expect(
      runPrompts({ yes: true, region: "bad-region" })
    ).rejects.toThrow("process.exit called");

    expect(mockClack.log.error).toHaveBeenCalledOnce();
    const [msg] = mockClack.log.error.mock.calls[0] as [string];
    expect(msg).toContain("bad-region");
  });
});

// ---------------------------------------------------------------------------
// runPrompts({ yes: true }) — default config without prompting
// ---------------------------------------------------------------------------

describe("runPrompts({ yes: true })", () => {
  it("should return the default ProjectConfig without calling any prompt functions", async () => {
    const config = await runPrompts({ yes: true });

    expect(config).toEqual(makeMinimalConfig());

    // No interactive prompts should have been invoked.
    expect(mockClack.text).not.toHaveBeenCalled();
    expect(mockClack.select).not.toHaveBeenCalled();
    expect(mockClack.confirm).not.toHaveBeenCalled();
  });

  it("should display the intro banner", async () => {
    await runPrompts({ yes: true });

    expect(mockClack.intro).toHaveBeenCalledOnce();
    const [bannerText] = mockClack.intro.mock.calls[0] as [string];
    expect(bannerText).toContain("vibe-ts-cdk-template");
  });

  it("should default projectName to 'my-app'", async () => {
    const config = await runPrompts({ yes: true });
    expect(config.projectName).toBe("my-app");
  });

  it("should default preset to 'minimal'", async () => {
    const config = await runPrompts({ yes: true });
    expect(config.preset).toBe("minimal");
  });

  it("should default awsRegion to 'us-east-1'", async () => {
    const config = await runPrompts({ yes: true });
    expect(config.awsRegion).toBe("us-east-1");
  });

  it("should default gitInit to true", async () => {
    const config = await runPrompts({ yes: true });
    expect(config.gitInit).toBe(true);
  });

  it("should default installDeps to true", async () => {
    const config = await runPrompts({ yes: true });
    expect(config.installDeps).toBe(true);
  });

  it("should resolve all feature flags from the minimal preset", async () => {
    const config = await runPrompts({ yes: true });
    expect(config.features).toEqual({
      frontend: false,
      auth: false,
      e2e: false,
      database: false,
      rds: false,
      cicd: false,
      monitoring: false,
      hooks: false,
    });
  });

  it("should honour AWS_DEFAULT_REGION env variable as default region", async () => {
    process.env["AWS_DEFAULT_REGION"] = "eu-west-1";
    const config = await runPrompts({ yes: true });
    expect(config.awsRegion).toBe("eu-west-1");
  });
});

// ---------------------------------------------------------------------------
// runPrompts({ yes: true, preset: "full" })
// ---------------------------------------------------------------------------

describe("runPrompts({ yes: true, preset: 'full' })", () => {
  it("should return the full preset defaults", async () => {
    const config = await runPrompts({ yes: true, preset: "full" });

    expect(config.preset).toBe("full");
    expect(config.features.frontend).toBe(true);
    expect(config.features.auth).toBe(true);
    expect(config.features.e2e).toBe(true);
    expect(config.features.database).toBe(true);
    expect(config.features.cicd).toBe(true);
    expect(config.features.monitoring).toBe(true);
    expect(config.features.hooks).toBe(true);
  });

  it("should default rds to false even for full preset without --rds", async () => {
    const config = await runPrompts({ yes: true, preset: "full" });
    expect(config.features.rds).toBe(false);
  });

  it("should not call any prompt functions", async () => {
    await runPrompts({ yes: true, preset: "full" });

    expect(mockClack.text).not.toHaveBeenCalled();
    expect(mockClack.select).not.toHaveBeenCalled();
    expect(mockClack.confirm).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// runPrompts({ yes: true, preset: "full", rds: true })
// ---------------------------------------------------------------------------

describe("runPrompts({ yes: true, preset: 'full', rds: true })", () => {
  it("should enable rds when --rds flag is provided with full preset", async () => {
    const config = await runPrompts({ yes: true, preset: "full", rds: true });
    expect(config.features.rds).toBe(true);
  });

  it("should have database: true alongside rds: true", async () => {
    const config = await runPrompts({ yes: true, preset: "full", rds: true });
    expect(config.features.database).toBe(true);
    expect(config.features.rds).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runPrompts({ yes: true, preset: "standard" })
// ---------------------------------------------------------------------------

describe("runPrompts({ yes: true, preset: 'standard' })", () => {
  it("should return standard preset feature flags", async () => {
    const config = await runPrompts({ yes: true, preset: "standard" });

    expect(config.preset).toBe("standard");
    expect(config.features.frontend).toBe(true);
    expect(config.features.auth).toBe(true);
    expect(config.features.e2e).toBe(true);
    expect(config.features.database).toBe(false);
    expect(config.features.rds).toBe(false);
    expect(config.features.cicd).toBe(false);
    expect(config.features.monitoring).toBe(false);
    expect(config.features.hooks).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// runPrompts — flag forwarding (yes:true, explicit flags)
// ---------------------------------------------------------------------------

describe("runPrompts — explicit flag forwarding under --yes", () => {
  it("should use the supplied projectName", async () => {
    const config = await runPrompts({ yes: true, projectName: "hello-world" });
    expect(config.projectName).toBe("hello-world");
  });

  it("should use the supplied region when it differs from the default", async () => {
    const config = await runPrompts({ yes: true, region: "eu-central-1" });
    expect(config.awsRegion).toBe("eu-central-1");
  });

  it("should set gitInit to false when git: false is provided", async () => {
    const config = await runPrompts({ yes: true, git: false });
    expect(config.gitInit).toBe(false);
  });

  it("should set installDeps to false when install: false is provided", async () => {
    const config = await runPrompts({ yes: true, install: false });
    expect(config.installDeps).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// runPrompts — interactive mode (yes not set)
// ---------------------------------------------------------------------------

describe("runPrompts — interactive mode (yes: false / omitted)", () => {
  it("should call clack.text for the project name when no name is provided", async () => {
    mockClack.text.mockResolvedValueOnce("interactive-app"); // name
    mockClack.text.mockResolvedValueOnce("us-east-1");       // region
    mockClack.select.mockResolvedValueOnce("minimal");        // preset
    mockClack.confirm.mockResolvedValueOnce(true);            // gitInit
    mockClack.confirm.mockResolvedValueOnce(true);            // installDeps

    await runPrompts({});

    expect(mockClack.text).toHaveBeenCalled();
    const firstCallArgs = mockClack.text.mock.calls[0][0] as { message: string };
    expect(firstCallArgs.message).toContain("Project name");
  });

  it("should call clack.select for preset when no preset is provided", async () => {
    mockClack.text.mockResolvedValueOnce("my-proj");    // name
    mockClack.select.mockResolvedValueOnce("standard"); // preset
    mockClack.text.mockResolvedValueOnce("us-east-1"); // region
    mockClack.confirm.mockResolvedValueOnce(true);      // gitInit
    mockClack.confirm.mockResolvedValueOnce(true);      // installDeps

    await runPrompts({});

    expect(mockClack.select).toHaveBeenCalled();
  });

  it("should call clack.confirm for gitInit when git flag is not provided", async () => {
    mockClack.text.mockResolvedValueOnce("my-proj");   // name
    mockClack.select.mockResolvedValueOnce("minimal"); // preset
    mockClack.text.mockResolvedValueOnce("us-east-1");// region
    mockClack.confirm.mockResolvedValueOnce(true);     // gitInit
    mockClack.confirm.mockResolvedValueOnce(true);     // installDeps

    await runPrompts({});

    expect(mockClack.confirm).toHaveBeenCalled();
  });

  it("should call clack.confirm for installDeps when install flag is not provided", async () => {
    mockClack.text.mockResolvedValueOnce("my-proj");   // name
    mockClack.select.mockResolvedValueOnce("minimal"); // preset
    mockClack.text.mockResolvedValueOnce("us-east-1");// region
    mockClack.confirm.mockResolvedValueOnce(false);    // gitInit
    mockClack.confirm.mockResolvedValueOnce(false);    // installDeps

    const config = await runPrompts({});

    // Two confirms were called (git + install).
    expect(mockClack.confirm).toHaveBeenCalledTimes(2);
    expect(config.gitInit).toBe(false);
    expect(config.installDeps).toBe(false);
  });

  it("should call clack.confirm for rds when preset is full and rds flag is not provided", async () => {
    mockClack.text.mockResolvedValueOnce("my-proj"); // name
    mockClack.select.mockResolvedValueOnce("full");  // preset
    mockClack.text.mockResolvedValueOnce("us-east-1"); // region
    mockClack.confirm.mockResolvedValueOnce(true);   // rds
    mockClack.confirm.mockResolvedValueOnce(true);   // gitInit
    mockClack.confirm.mockResolvedValueOnce(true);   // installDeps

    const config = await runPrompts({});

    // Three confirms: rds, git, install.
    expect(mockClack.confirm).toHaveBeenCalledTimes(3);
    expect(config.features.rds).toBe(true);
  });

  it("should not call clack.confirm for rds when preset is minimal", async () => {
    mockClack.text.mockResolvedValueOnce("my-proj");    // name
    mockClack.select.mockResolvedValueOnce("minimal");  // preset
    mockClack.text.mockResolvedValueOnce("us-east-1"); // region
    mockClack.confirm.mockResolvedValueOnce(true);      // gitInit
    mockClack.confirm.mockResolvedValueOnce(true);      // installDeps

    await runPrompts({});

    // Only two confirms: git + install.
    expect(mockClack.confirm).toHaveBeenCalledTimes(2);
  });

  it("should not call clack.confirm for rds when preset is standard", async () => {
    mockClack.text.mockResolvedValueOnce("my-proj");    // name
    mockClack.select.mockResolvedValueOnce("standard"); // preset
    mockClack.text.mockResolvedValueOnce("us-east-1"); // region
    mockClack.confirm.mockResolvedValueOnce(true);      // gitInit
    mockClack.confirm.mockResolvedValueOnce(true);      // installDeps

    await runPrompts({});

    expect(mockClack.confirm).toHaveBeenCalledTimes(2);
  });

  it("should display the intro banner in interactive mode", async () => {
    mockClack.text.mockResolvedValue("my-proj");
    mockClack.select.mockResolvedValue("minimal");
    mockClack.confirm.mockResolvedValue(true);

    await runPrompts({});

    expect(mockClack.intro).toHaveBeenCalledOnce();
    const [bannerText] = mockClack.intro.mock.calls[0] as [string];
    expect(bannerText).toContain("vibe-ts-cdk-template");
  });
});

// ---------------------------------------------------------------------------
// runPrompts — cancellation handling
// ---------------------------------------------------------------------------

describe("runPrompts — cancellation handling", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as typeof process.exit);
  });

  it("should call outro and exit(0) when project name prompt is cancelled", async () => {
    // isCancel returns true for the first prompt result (project name).
    mockClack.isCancel.mockReturnValue(true);
    mockClack.text.mockResolvedValueOnce(Symbol("cancel")); // clack cancel symbol

    await expect(runPrompts({})).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(mockClack.outro).toHaveBeenCalledOnce();
    const [outroMsg] = mockClack.outro.mock.calls[0] as [string];
    expect(outroMsg).toContain("cancelled");
  });
});

// ---------------------------------------------------------------------------
// runPrompts — interactive fallback when invalid flag supplied without --yes
// ---------------------------------------------------------------------------

describe("runPrompts — interactive fallback for invalid flags (no --yes)", () => {
  it("should warn and re-prompt for project name when supplied name is invalid without --yes", async () => {
    // The invalid name triggers a warn + interactive re-prompt.
    mockClack.text.mockResolvedValueOnce("corrected-name"); // re-prompted name
    mockClack.select.mockResolvedValueOnce("minimal");       // preset
    mockClack.text.mockResolvedValueOnce("us-east-1");      // region
    mockClack.confirm.mockResolvedValueOnce(true);           // gitInit
    mockClack.confirm.mockResolvedValueOnce(true);           // installDeps

    const config = await runPrompts({ projectName: "INVALID_NAME" });

    expect(mockClack.log.warn).toHaveBeenCalledOnce();
    const [warnMsg] = mockClack.log.warn.mock.calls[0] as [string];
    expect(warnMsg).toContain("INVALID_NAME");
    expect(config.projectName).toBe("corrected-name");
  });

  it("should warn and re-prompt for region when supplied region is invalid without --yes", async () => {
    // A region that differs from DEFAULT_REGION makes regionAlreadySet true.
    mockClack.text.mockResolvedValueOnce("my-proj");   // name
    mockClack.select.mockResolvedValueOnce("minimal"); // preset
    // The invalid region triggers warn + re-prompt (second clack.text call).
    mockClack.text.mockResolvedValueOnce("us-east-1");// corrected region
    mockClack.confirm.mockResolvedValueOnce(true);     // gitInit
    mockClack.confirm.mockResolvedValueOnce(true);     // installDeps

    const config = await runPrompts({ region: "bad-region" });

    expect(mockClack.log.warn).toHaveBeenCalledOnce();
    const [warnMsg] = mockClack.log.warn.mock.calls[0] as [string];
    expect(warnMsg).toContain("bad-region");
    expect(config.awsRegion).toBe("us-east-1");
  });
});

// ---------------------------------------------------------------------------
// runPrompts — returned config shape
// ---------------------------------------------------------------------------

describe("runPrompts — returned config shape", () => {
  it("should return an object with all required ProjectConfig keys", async () => {
    const config = await runPrompts({ yes: true });

    expect(config).toHaveProperty("projectName");
    expect(config).toHaveProperty("preset");
    expect(config).toHaveProperty("awsRegion");
    expect(config).toHaveProperty("features");
    expect(config).toHaveProperty("gitInit");
    expect(config).toHaveProperty("installDeps");
  });

  it("should return features with all eight FeatureFlags keys", async () => {
    const { features } = await runPrompts({ yes: true });

    expect(features).toHaveProperty("frontend");
    expect(features).toHaveProperty("auth");
    expect(features).toHaveProperty("e2e");
    expect(features).toHaveProperty("database");
    expect(features).toHaveProperty("rds");
    expect(features).toHaveProperty("cicd");
    expect(features).toHaveProperty("monitoring");
    expect(features).toHaveProperty("hooks");
  });
});
