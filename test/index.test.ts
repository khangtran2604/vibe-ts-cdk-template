import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ProjectConfig } from "../src/types.js";

// ---------------------------------------------------------------------------
// Hoisted mock data
//
// vi.mock() factories are hoisted to the top of the file before any imports
// or const declarations.  Variables referenced inside a factory must be
// defined with vi.hoisted() so they are initialised before the factory runs.
// ---------------------------------------------------------------------------
const { MOCK_CONFIG, mockRunPrompts, mockClack, mockScaffold } = vi.hoisted(() => {
  const MOCK_CONFIG: ProjectConfig = {
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
  };

  const mockRunPrompts = vi.fn().mockResolvedValue(MOCK_CONFIG);

  const mockScaffold = vi.fn().mockResolvedValue(undefined);

  const mockClack = {
    intro: vi.fn(),
    outro: vi.fn(),
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    text: vi.fn(),
    select: vi.fn(),
    confirm: vi.fn(),
    isCancel: vi.fn(() => false),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  };

  return { MOCK_CONFIG, mockRunPrompts, mockClack, mockScaffold };
});

// Mock @clack/prompts so intro/outro/log.info are no-ops during tests.
vi.mock("@clack/prompts", () => mockClack);

// Mock src/prompts.ts so runPrompts() resolves instantly without any TTY
// interaction.  The spy is defined in vi.hoisted() above.
vi.mock("../src/prompts.js", () => ({
  runPrompts: mockRunPrompts,
}));

// Mock src/scaffolder.ts so scaffold() does not attempt real filesystem
// operations during unit tests.  The spy is defined in vi.hoisted() above.
vi.mock("../src/scaffolder.js", () => ({
  scaffold: mockScaffold,
}));

// Import the module under test AFTER setting up mocks.
import { createProgram } from "../src/index.js";

/**
 * Helper that builds a fresh program with exitOverride() enabled (so Commander
 * throws instead of calling process.exit) and parses the supplied argument
 * tokens.  `{ from: "user" }` tells Commander that the array does NOT include
 * the node/script path entries, so we can pass flags directly.
 */
async function parse(args: string[]) {
  const program = createProgram();
  program.exitOverride(); // throw CommanderError instead of process.exit()
  await program.parseAsync(args, { from: "user" });
  return program;
}

describe("CLI (src/index.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply default resolved values after clearAllMocks resets implementations.
    mockRunPrompts.mockResolvedValue(MOCK_CONFIG);
    mockScaffold.mockResolvedValue(undefined);
    // Re-apply spinner factory so each test gets fresh start/stop spies.
    mockClack.spinner.mockReturnValue({ start: vi.fn(), stop: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // --help
  // ---------------------------------------------------------------------------
  describe("--help", () => {
    it("should throw a commander exit(0) when --help is passed", async () => {
      const program = createProgram();
      program.exitOverride();

      let err: Error | undefined;
      try {
        await program.parseAsync(["--help"], { from: "user" });
      } catch (e) {
        err = e as Error;
      }

      expect(err).toBeDefined();
      // Commander throws a CommanderError with exitCode 0 for --help
      expect((err as NodeJS.ErrnoException & { exitCode?: number }).exitCode).toBe(0);
    });

    it("should include the program name in help output", async () => {
      const program = createProgram();
      program.exitOverride();

      try {
        await program.parseAsync(["--help"], { from: "user" });
      } catch {
        // expected
      }

      const helpText = program.helpInformation();
      expect(helpText).toContain("vibe-ts-cdk-template");
    });

    it("should document --preset in help output", async () => {
      const program = createProgram();
      const helpText = program.helpInformation();
      expect(helpText).toContain("--preset");
    });

    it("should document --region in help output", async () => {
      const program = createProgram();
      const helpText = program.helpInformation();
      expect(helpText).toContain("--region");
    });

    it("should document --rds in help output", async () => {
      const program = createProgram();
      const helpText = program.helpInformation();
      expect(helpText).toContain("--rds");
    });

    it("should document --no-git in help output", async () => {
      const program = createProgram();
      const helpText = program.helpInformation();
      expect(helpText).toContain("--no-git");
    });

    it("should document -y / --yes in help output", async () => {
      const program = createProgram();
      const helpText = program.helpInformation();
      expect(helpText).toContain("--yes");
    });
  });

  // ---------------------------------------------------------------------------
  // --version
  // ---------------------------------------------------------------------------
  describe("--version / -V", () => {
    it("should throw a commander exit(0) when --version is passed", async () => {
      const program = createProgram();
      program.exitOverride();

      let err: Error | undefined;
      try {
        await program.parseAsync(["--version"], { from: "user" });
      } catch (e) {
        err = e as Error;
      }

      expect(err).toBeDefined();
      expect((err as NodeJS.ErrnoException & { exitCode?: number }).exitCode).toBe(0);
    });

    it("should throw a commander exit(0) when -V is passed", async () => {
      const program = createProgram();
      program.exitOverride();

      let err: Error | undefined;
      try {
        await program.parseAsync(["-V"], { from: "user" });
      } catch (e) {
        err = e as Error;
      }

      expect(err).toBeDefined();
      expect((err as NodeJS.ErrnoException & { exitCode?: number }).exitCode).toBe(0);
    });

    it("should report version 0.1.0", () => {
      const program = createProgram();
      expect(program.version()).toBe("0.1.0");
    });
  });

  // ---------------------------------------------------------------------------
  // --preset
  // ---------------------------------------------------------------------------
  describe("--preset", () => {
    it('should accept "minimal" preset', async () => {
      const program = await parse(["--preset", "minimal", "-y"]);
      expect(program.opts().preset).toBe("minimal");
    });

    it('should accept "standard" preset', async () => {
      const program = await parse(["--preset", "standard", "-y"]);
      expect(program.opts().preset).toBe("standard");
    });

    it('should accept "full" preset', async () => {
      const program = await parse(["--preset", "full", "-y"]);
      expect(program.opts().preset).toBe("full");
    });

    it("should be undefined when --preset is not provided", async () => {
      const program = await parse(["-y"]);
      expect(program.opts().preset).toBeUndefined();
    });

    it('should throw an error when an invalid preset is supplied', async () => {
      const program = createProgram();
      program.exitOverride();

      let err: Error | undefined;
      try {
        await program.parseAsync(["--preset", "invalid"], { from: "user" });
      } catch (e) {
        err = e as Error;
      }

      expect(err).toBeDefined();
      // Commander exits with code 1 for invalid argument errors
      expect((err as NodeJS.ErrnoException & { exitCode?: number }).exitCode).toBe(1);
    });

    it('should include the invalid value in the error message', async () => {
      const program = createProgram();
      program.exitOverride();

      let err: Error | undefined;
      try {
        await program.parseAsync(["--preset", "mega"], { from: "user" });
      } catch (e) {
        err = e as Error;
      }

      expect(err?.message).toContain("mega");
    });

    it('should include valid choices in the error message', async () => {
      const program = createProgram();
      program.exitOverride();

      let err: Error | undefined;
      try {
        await program.parseAsync(["--preset", "ultra"], { from: "user" });
      } catch (e) {
        err = e as Error;
      }

      // The InvalidArgumentError message lists minimal, standard, full
      expect(err?.message).toContain("minimal");
    });
  });

  // ---------------------------------------------------------------------------
  // --region
  // ---------------------------------------------------------------------------
  describe("--region", () => {
    it('should default to "us-east-1" when --region is not provided', async () => {
      const program = await parse(["-y"]);
      expect(program.opts().region).toBe("us-east-1");
    });

    it("should accept a custom region override", async () => {
      const program = await parse(["--region", "us-west-2", "-y"]);
      expect(program.opts().region).toBe("us-west-2");
    });

    it("should accept eu-central-1 as a region", async () => {
      const program = await parse(["--region", "eu-central-1", "-y"]);
      expect(program.opts().region).toBe("eu-central-1");
    });

    it("should accept ap-southeast-1 as a region", async () => {
      const program = await parse(["--region", "ap-southeast-1", "-y"]);
      expect(program.opts().region).toBe("ap-southeast-1");
    });
  });

  // ---------------------------------------------------------------------------
  // --rds
  // ---------------------------------------------------------------------------
  describe("--rds", () => {
    it("should default rds to false when flag is absent", async () => {
      const program = await parse(["-y"]);
      expect(program.opts().rds).toBe(false);
    });

    it("should set rds to true when --rds flag is present", async () => {
      const program = await parse(["--rds", "-y"]);
      expect(program.opts().rds).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // --no-git
  // ---------------------------------------------------------------------------
  describe("--no-git", () => {
    it("should default git to true when --no-git is absent", async () => {
      const program = await parse(["-y"]);
      expect(program.opts().git).toBe(true);
    });

    it("should set git to false when --no-git is provided", async () => {
      const program = await parse(["--no-git", "-y"]);
      expect(program.opts().git).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // --no-install
  // ---------------------------------------------------------------------------
  describe("--no-install", () => {
    it("should default install to true when --no-install is absent", async () => {
      const program = await parse(["-y"]);
      expect(program.opts().install).toBe(true);
    });

    it("should set install to false when --no-install is provided", async () => {
      const program = await parse(["--no-install", "-y"]);
      expect(program.opts().install).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // -y / --yes
  // ---------------------------------------------------------------------------
  describe("-y / --yes", () => {
    it("should default yes to false when neither -y nor --yes is provided", async () => {
      const program = await parse([]);
      expect(program.opts().yes).toBe(false);
    });

    it("should set yes to true when -y flag is provided", async () => {
      const program = await parse(["-y"]);
      expect(program.opts().yes).toBe(true);
    });

    it("should set yes to true when --yes flag is provided", async () => {
      const program = await parse(["--yes"]);
      expect(program.opts().yes).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Positional argument: [project-name]
  // ---------------------------------------------------------------------------
  describe("[project-name] positional argument", () => {
    it("should be undefined when no positional argument is provided", async () => {
      const program = await parse(["-y"]);
      expect(program.args[0]).toBeUndefined();
    });

    it("should capture the project name as the first positional argument", async () => {
      const program = await parse(["my-awesome-app", "-y"]);
      expect(program.args[0]).toBe("my-awesome-app");
    });

    it("should capture a slugified project name with hyphens", async () => {
      const program = await parse(["hello-world-app"]);
      expect(program.args[0]).toBe("hello-world-app");
    });
  });

  // ---------------------------------------------------------------------------
  // Action handler — verifies flags are forwarded to runPrompts correctly
  // ---------------------------------------------------------------------------
  describe("action handler", () => {
    it("should call runPrompts with projectName and preset flags", async () => {
      await parse(["my-project", "--preset", "minimal", "-y"]);

      expect(mockRunPrompts).toHaveBeenCalledOnce();
      expect(mockRunPrompts).toHaveBeenCalledWith(
        expect.objectContaining({
          projectName: "my-project",
          preset: "minimal",
          yes: true,
        })
      );
    });

    it("should forward region flag to runPrompts", async () => {
      await parse(["--region", "eu-west-1", "-y"]);

      expect(mockRunPrompts).toHaveBeenCalledWith(
        expect.objectContaining({ region: "eu-west-1" })
      );
    });

    it("should forward git:true to runPrompts by default", async () => {
      await parse(["-y"]);

      expect(mockRunPrompts).toHaveBeenCalledWith(
        expect.objectContaining({ git: true })
      );
    });

    it("should forward git:false to runPrompts when --no-git is used", async () => {
      await parse(["--no-git", "-y"]);

      expect(mockRunPrompts).toHaveBeenCalledWith(
        expect.objectContaining({ git: false })
      );
    });

    it("should forward rds:false to runPrompts by default", async () => {
      await parse(["-y"]);

      expect(mockRunPrompts).toHaveBeenCalledWith(
        expect.objectContaining({ rds: false })
      );
    });

    it("should forward rds:true to runPrompts when --rds is used", async () => {
      await parse(["--rds", "-y"]);

      expect(mockRunPrompts).toHaveBeenCalledWith(
        expect.objectContaining({ rds: true })
      );
    });

    it("should call scaffold with the resolved ProjectConfig", async () => {
      await parse(["--preset", "minimal", "-y"]);

      expect(mockScaffold).toHaveBeenCalledOnce();
      expect(mockScaffold).toHaveBeenCalledWith(
        expect.objectContaining({
          projectName: MOCK_CONFIG.projectName,
          preset: MOCK_CONFIG.preset,
          features: MOCK_CONFIG.features,
        })
      );
    });

    it("should call clack.outro with 'Next steps' after scaffolding", async () => {
      await parse(["--preset", "minimal", "-y"]);

      expect(mockClack.outro).toHaveBeenCalledOnce();
      const [outroMessage] = mockClack.outro.mock.calls[0] as [string];
      expect(outroMessage).toContain("Next steps");
      expect(outroMessage).toContain(MOCK_CONFIG.projectName);
    });

    it("should include pnpm install in outro when --no-install is used", async () => {
      mockRunPrompts.mockResolvedValue({ ...MOCK_CONFIG, installDeps: false });
      await parse(["--preset", "minimal", "--no-install", "-y"]);

      const [outroMessage] = mockClack.outro.mock.calls[0] as [string];
      expect(outroMessage).toContain("pnpm install");
    });

    it("should not include pnpm install in outro when install is enabled", async () => {
      await parse(["--preset", "minimal", "-y"]);

      const [outroMessage] = mockClack.outro.mock.calls[0] as [string];
      // The outro should suggest pnpm dev but NOT a bare pnpm install step
      expect(outroMessage).toContain("pnpm dev");
      expect(outroMessage).not.toContain("pnpm install");
    });

    it("should call clack.log.error and exit(1) when scaffold throws", async () => {
      mockScaffold.mockRejectedValue(new Error("Directory already exists"));

      // process.exit() must throw to prevent the action handler from continuing
      // past the catch block during tests (the real process.exit halts the
      // process, but mocks return undefined and allow execution to continue).
      class ExitError extends Error {
        constructor(public readonly code: number) {
          super(`process.exit(${code})`);
        }
      }
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(
        (code?: number | string | null) => {
          throw new ExitError(typeof code === "number" ? code : 1);
        }
      );

      let caughtErr: unknown;
      try {
        await parse(["--preset", "minimal", "-y"]);
      } catch (e) {
        caughtErr = e;
      }

      expect(mockClack.log.error).toHaveBeenCalledOnce();
      expect(mockClack.log.error).toHaveBeenCalledWith(
        expect.stringContaining("Directory already exists")
      );
      // Verify exit was called with code 1 (ExitError carries the code)
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect((caughtErr as ExitError).code).toBe(1);

      exitSpy.mockRestore();
    });
  });
});
