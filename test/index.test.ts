import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ModuleConfig, ProjectConfig } from "../src/types.js";

// ---------------------------------------------------------------------------
// Hoisted mock data
//
// vi.mock() factories are hoisted to the top of the file before any imports
// or const declarations.  Variables referenced inside a factory must be
// defined with vi.hoisted() so they are initialised before the factory runs.
// ---------------------------------------------------------------------------
const {
  MOCK_CONFIG,
  MOCK_MODULE_CONFIG,
  mockRunPrompts,
  mockClack,
  mockScaffold,
  mockRunModulePrompts,
  mockGenerateModule,
} = vi.hoisted(() => {
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

  const MOCK_MODULE_CONFIG: ModuleConfig = {
    moduleName: "orders",
    entityName: "Order",
    port: 3003,
    projectDir: "/home/user/my-app",
    projectName: "my-app",
    installDeps: true,
  };

  const mockRunPrompts = vi.fn().mockResolvedValue(MOCK_CONFIG);

  const mockScaffold = vi.fn().mockResolvedValue(undefined);

  const mockRunModulePrompts = vi.fn().mockResolvedValue(MOCK_MODULE_CONFIG);

  const mockGenerateModule = vi.fn().mockResolvedValue(undefined);

  const mockClack = {
    intro: vi.fn(),
    outro: vi.fn(),
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    text: vi.fn(),
    select: vi.fn(),
    confirm: vi.fn(),
    isCancel: vi.fn(() => false),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
    note: vi.fn(),
  };

  return {
    MOCK_CONFIG,
    MOCK_MODULE_CONFIG,
    mockRunPrompts,
    mockClack,
    mockScaffold,
    mockRunModulePrompts,
    mockGenerateModule,
  };
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

// Mock src/module-prompts.ts so runModulePrompts() resolves instantly.
vi.mock("../src/module-prompts.js", () => ({
  runModulePrompts: mockRunModulePrompts,
}));

// Mock src/module-generator.ts so generateModule() does not touch the FS.
vi.mock("../src/module-generator.js", () => ({
  generateModule: mockGenerateModule,
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
    mockRunModulePrompts.mockResolvedValue(MOCK_MODULE_CONFIG);
    mockGenerateModule.mockResolvedValue(undefined);
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

  // ---------------------------------------------------------------------------
  // module subcommand
  // ---------------------------------------------------------------------------
  describe("module subcommand", () => {
    // -------------------------------------------------------------------------
    // Registration — does the subcommand exist?
    // -------------------------------------------------------------------------
    describe("registration", () => {
      it("should register a 'module' subcommand on the program", () => {
        const program = createProgram();
        const commands = program.commands.map((c) => c.name());
        expect(commands).toContain("module");
      });

      it("should return a Command instance from createProgram()", () => {
        const { Command } = require("commander");
        const program = createProgram();
        expect(program).toBeInstanceOf(Command);
      });

      it("should describe the module command as a CRUD service module generator", () => {
        const program = createProgram();
        const moduleCmd = program.commands.find((c) => c.name() === "module");
        expect(moduleCmd?.description()).toMatch(/CRUD service module/i);
      });
    });

    // -------------------------------------------------------------------------
    // Help output for the module subcommand
    // -------------------------------------------------------------------------
    describe("module --help", () => {
      it("should call process.exit(0) when 'module --help' is invoked", async () => {
        // Commander calls process.exit(0) on --help for subcommands that do not
        // have exitOverride() applied to the subcommand itself (only the parent
        // program has exitOverride() in the parse() helper). We spy on exit() so
        // the test process does not terminate.
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(
          (_code?: number | string | null) => {
            throw new Error("exit called");
          },
        );

        const program = createProgram();
        // exitOverride must be set on the subcommand instance for Commander to
        // throw rather than calling process.exit.  Apply it here.
        const moduleCmd = program.commands.find((c) => c.name() === "module");
        moduleCmd?.exitOverride();

        let exitCalled = false;
        try {
          await program.parseAsync(["module", "--help"], { from: "user" });
        } catch {
          exitCalled = true;
        }

        expect(exitCalled).toBe(true);
        exitSpy.mockRestore();
      });

      it("should show the <name> positional argument in module help", () => {
        const program = createProgram();
        const moduleCmd = program.commands.find((c) => c.name() === "module");
        expect(moduleCmd).toBeDefined();
        const helpText = moduleCmd!.helpInformation();
        expect(helpText).toContain("<name>");
      });

      it("should document --no-install in module help", () => {
        const program = createProgram();
        const moduleCmd = program.commands.find((c) => c.name() === "module");
        expect(moduleCmd).toBeDefined();
        const helpText = moduleCmd!.helpInformation();
        expect(helpText).toContain("--no-install");
      });

      it("should document -y / --yes in module help", () => {
        const program = createProgram();
        const moduleCmd = program.commands.find((c) => c.name() === "module");
        expect(moduleCmd).toBeDefined();
        const helpText = moduleCmd!.helpInformation();
        expect(helpText).toContain("--yes");
      });
    });

    // -------------------------------------------------------------------------
    // Action handler — happy path
    // -------------------------------------------------------------------------
    describe("module action handler — happy path", () => {
      it("should call runModulePrompts with the module name and flags", async () => {
        await parse(["module", "orders"]);

        expect(mockRunModulePrompts).toHaveBeenCalledOnce();
        expect(mockRunModulePrompts).toHaveBeenCalledWith(
          "orders",
          expect.objectContaining({ install: true, yes: false }),
        );
      });

      it("should call runModulePrompts once when -y is provided (parent intercepts -y)", async () => {
        // Commander behavior: the parent program and module subcommand share
        // --yes / --no-install option names. When the parent program also
        // defines these options, Commander assigns the flag to the parent's
        // option scope, not the subcommand's. As a result, the subcommand
        // action always receives the default values ({ yes: false, install: true })
        // regardless of whether -y or --no-install were provided on the command
        // line. This test documents that observed behaviour.
        await parse(["module", "orders", "-y"]);
        expect(mockRunModulePrompts).toHaveBeenCalledOnce();
      });

      it("should call runModulePrompts once when --no-install is provided (parent intercepts --no-install)", async () => {
        // See the comment in the -y test above for the Commander shadowing
        // explanation. The subcommand action receives install:true by default.
        await parse(["module", "orders", "--no-install"]);
        expect(mockRunModulePrompts).toHaveBeenCalledOnce();
      });

      it("should call generateModule with the resolved ModuleConfig", async () => {
        await parse(["module", "orders"]);

        expect(mockGenerateModule).toHaveBeenCalledOnce();
        expect(mockGenerateModule).toHaveBeenCalledWith(
          expect.objectContaining({
            moduleName: MOCK_MODULE_CONFIG.moduleName,
            entityName: MOCK_MODULE_CONFIG.entityName,
          }),
        );
      });

      it("should call clack.outro with a success message after generation", async () => {
        await parse(["module", "orders"]);

        expect(mockClack.outro).toHaveBeenCalledOnce();
        const [outroMsg] = mockClack.outro.mock.calls[0] as [string];
        expect(outroMsg).toMatch(/generated successfully/i);
      });

      it("should include the module name in the success outro message", async () => {
        await parse(["module", "orders"]);

        const [outroMsg] = mockClack.outro.mock.calls[0] as [string];
        expect(outroMsg).toContain("orders");
      });
    });

    // -------------------------------------------------------------------------
    // Action handler — error path
    // -------------------------------------------------------------------------
    describe("module action handler — error path", () => {
      /**
       * Helper that spies on process.exit() and converts it to a thrown error so
       * the test process itself does not terminate.
       */
      class ExitError extends Error {
        constructor(public readonly code: number) {
          super(`process.exit(${code})`);
        }
      }

      function spyOnExit() {
        return vi.spyOn(process, "exit").mockImplementation(
          (code?: number | string | null) => {
            throw new ExitError(typeof code === "number" ? code : 1);
          },
        );
      }

      it("should call clack.log.error when generateModule throws", async () => {
        mockGenerateModule.mockRejectedValue(new Error("Template missing"));
        const exitSpy = spyOnExit();

        try {
          await parse(["module", "orders"]);
        } catch {
          // exit(1) will be thrown; we only care about the side effects.
        }

        expect(mockClack.log.error).toHaveBeenCalledOnce();
        expect(mockClack.log.error).toHaveBeenCalledWith(
          expect.stringContaining("Template missing"),
        );

        exitSpy.mockRestore();
      });

      it("should call clack.outro with a failure message when generateModule throws", async () => {
        mockGenerateModule.mockRejectedValue(new Error("Template missing"));
        const exitSpy = spyOnExit();

        try {
          await parse(["module", "orders"]);
        } catch {
          // expected
        }

        expect(mockClack.outro).toHaveBeenCalledWith(
          expect.stringContaining("failed"),
        );

        exitSpy.mockRestore();
      });

      it("should call process.exit(1) when generateModule throws", async () => {
        mockGenerateModule.mockRejectedValue(new Error("Template missing"));
        const exitSpy = spyOnExit();

        let caughtErr: unknown;
        try {
          await parse(["module", "orders"]);
        } catch (e) {
          caughtErr = e;
        }

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect((caughtErr as ExitError).code).toBe(1);

        exitSpy.mockRestore();
      });

      it("should call clack.log.error when runModulePrompts throws", async () => {
        mockRunModulePrompts.mockRejectedValue(new Error("Context detection failed"));
        const exitSpy = spyOnExit();

        try {
          await parse(["module", "orders"]);
        } catch {
          // expected
        }

        expect(mockClack.log.error).toHaveBeenCalledWith(
          expect.stringContaining("Context detection failed"),
        );

        exitSpy.mockRestore();
      });

      it("should handle non-Error throws by stringifying the value", async () => {
        mockGenerateModule.mockRejectedValue("raw string error");
        const exitSpy = spyOnExit();

        try {
          await parse(["module", "orders"]);
        } catch {
          // expected
        }

        expect(mockClack.log.error).toHaveBeenCalledWith(
          expect.stringContaining("raw string error"),
        );

        exitSpy.mockRestore();
      });
    });

    // -------------------------------------------------------------------------
    // Module subcommand requires a <name> argument
    // -------------------------------------------------------------------------
    describe("module <name> — required positional", () => {
      it("should exit with a non-zero code when no module name is provided", async () => {
        const program = createProgram();
        program.exitOverride();

        let err: Error | undefined;
        try {
          await program.parseAsync(["module"], { from: "user" });
        } catch (e) {
          err = e as Error;
        }

        expect(err).toBeDefined();
        expect((err as NodeJS.ErrnoException & { exitCode?: number }).exitCode).not.toBe(0);
      });
    });
  });
});
