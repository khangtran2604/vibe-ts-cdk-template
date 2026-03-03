/**
 * Unit tests for src/module-prompts.ts
 *
 * Strategy:
 *  - Mock @clack/prompts so no TTY interaction occurs and outputs are captured.
 *  - Mock detectProjectContext, readProjectName, scanNextPort so tests run
 *    without touching the filesystem.
 *  - Mock process.cwd() to return a stable path.
 *  - Spy on process.exit() and convert it into a thrown error so the action
 *    handler does not halt the test process.
 *
 * Coverage:
 *  - validateModuleName — happy paths and all failure branches
 *  - detectProjectContext failure → exit(1)
 *  - -y flag skips clack.confirm and applies installDeps: true
 *  - --no-install (flags.install = false) sets installDeps: false without prompting
 *  - flags.install = true sets installDeps: true without prompting
 *  - Prompt flow (no -y, no --no-install) calls clack.confirm
 *  - User cancels install prompt → exit(0)
 *  - Returned ModuleConfig has correct shape and values
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ModuleConfig } from "../src/types.js";

// ---------------------------------------------------------------------------
// Hoisted mock setup
//
// vi.mock() factories are hoisted before all import statements. All variables
// referenced inside factory closures must be initialised via vi.hoisted().
// ---------------------------------------------------------------------------
const {
  mockIntro,
  mockOutro,
  mockNote,
  mockLogError,
  mockConfirm,
  mockIsCancel,
  mockSpinnerStart,
  mockSpinnerStop,
  mockSpinnerFactory,
  mockDetectProjectContext,
  mockReadProjectName,
  mockScanNextPort,
} = vi.hoisted(() => {
  const mockSpinnerStart = vi.fn();
  const mockSpinnerStop = vi.fn();
  const mockSpinnerFactory = vi.fn(() => ({
    start: mockSpinnerStart,
    stop: mockSpinnerStop,
  }));

  return {
    mockIntro: vi.fn(),
    mockOutro: vi.fn(),
    mockNote: vi.fn(),
    mockLogError: vi.fn(),
    mockConfirm: vi.fn().mockResolvedValue(true),
    mockIsCancel: vi.fn().mockReturnValue(false),
    mockSpinnerStart,
    mockSpinnerStop,
    mockSpinnerFactory,
    mockDetectProjectContext: vi.fn().mockResolvedValue(undefined),
    mockReadProjectName: vi.fn().mockResolvedValue("my-app"),
    mockScanNextPort: vi.fn().mockResolvedValue(3003),
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: mockIntro,
  outro: mockOutro,
  note: mockNote,
  log: { error: mockLogError },
  confirm: mockConfirm,
  isCancel: mockIsCancel,
  spinner: mockSpinnerFactory,
}));

vi.mock("../src/module-context.js", () => ({
  detectProjectContext: mockDetectProjectContext,
  readProjectName: mockReadProjectName,
  scanNextPort: mockScanNextPort,
}));

// Import after mocks are in place.
import { runModulePrompts } from "../src/module-prompts.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A throwable error class used to intercept process.exit() calls so the test
 * process itself does not terminate when the implementation calls process.exit.
 */
class ExitError extends Error {
  constructor(public readonly code: number) {
    super(`process.exit(${code})`);
  }
}

/**
 * Installs a process.exit spy that throws ExitError instead of terminating.
 * Returns the spy so callers can assert against it.
 */
function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(
    (code?: number | string | null) => {
      throw new ExitError(typeof code === "number" ? code : 1);
    },
  );
}

/**
 * Calls runModulePrompts and captures any ExitError thrown by the mocked
 * process.exit so tests can assert on exit behaviour.
 */
async function runAndCatchExit(
  name: string,
  flags: { yes?: boolean; install?: boolean },
): Promise<{ config?: ModuleConfig; exitError?: ExitError }> {
  try {
    const config = await runModulePrompts(name, flags);
    return { config };
  } catch (e) {
    if (e instanceof ExitError) {
      return { exitError: e };
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Setup and teardown
// ---------------------------------------------------------------------------

let exitSpy: ReturnType<typeof mockProcessExit>;
let cwdSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();

  // Re-apply default resolved values that clearAllMocks() would reset.
  mockDetectProjectContext.mockResolvedValue(undefined);
  mockReadProjectName.mockResolvedValue("my-app");
  mockScanNextPort.mockResolvedValue(3003);
  mockConfirm.mockResolvedValue(true);
  mockIsCancel.mockReturnValue(false);
  mockSpinnerFactory.mockReturnValue({
    start: mockSpinnerStart,
    stop: mockSpinnerStop,
  });

  // Stable cwd so targetDir is deterministic.
  cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/home/user/my-app");

  exitSpy = mockProcessExit();
});

afterEach(() => {
  exitSpy.mockRestore();
  cwdSpy.mockRestore();
});

// ---------------------------------------------------------------------------
// validateModuleName — tested indirectly via runModulePrompts
// ---------------------------------------------------------------------------

describe("validateModuleName (via runModulePrompts)", () => {
  // -------------------------------------------------------------------------
  // Valid names — should NOT exit
  // -------------------------------------------------------------------------
  describe("valid kebab-case names", () => {
    it("should accept a simple single-word name like 'orders'", async () => {
      const { config } = await runAndCatchExit("orders", { yes: true });
      expect(config).toBeDefined();
      expect(config?.moduleName).toBe("orders");
    });

    it("should accept a hyphenated name like 'order-items'", async () => {
      const { config } = await runAndCatchExit("order-items", { yes: true });
      expect(config).toBeDefined();
      expect(config?.moduleName).toBe("order-items");
    });

    it("should accept a name containing digits like 'api2'", async () => {
      const { config } = await runAndCatchExit("api2", { yes: true });
      expect(config).toBeDefined();
      expect(config?.moduleName).toBe("api2");
    });

    it("should accept a name that starts and ends with digits like '1-to-1'", async () => {
      const { config } = await runAndCatchExit("1-to-1", { yes: true });
      expect(config).toBeDefined();
    });

    it("should NOT call process.exit for a valid name", async () => {
      await runAndCatchExit("products", { yes: true });
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Invalid names — should exit(1)
  // -------------------------------------------------------------------------
  describe("invalid names — should call process.exit(1)", () => {
    it("should exit(1) for an empty string", async () => {
      const { exitError } = await runAndCatchExit("", { yes: true });
      expect(exitError).toBeInstanceOf(ExitError);
      expect(exitError?.code).toBe(1);
    });

    it("should log an error for an empty string", async () => {
      await runAndCatchExit("", { yes: true });
      expect(mockLogError).toHaveBeenCalledOnce();
    });

    it("should exit(1) when name contains uppercase letters", async () => {
      const { exitError } = await runAndCatchExit("Orders", { yes: true });
      expect(exitError?.code).toBe(1);
    });

    it("should log an error mentioning 'lowercase' when name has uppercase letters", async () => {
      await runAndCatchExit("Orders", { yes: true });
      const [errMsg] = mockLogError.mock.calls[0] as [string];
      expect(errMsg).toMatch(/lowercase/i);
    });

    it("should exit(1) when name contains an underscore", async () => {
      const { exitError } = await runAndCatchExit("order_items", { yes: true });
      expect(exitError?.code).toBe(1);
    });

    it("should log an error mentioning 'hyphens' when name has underscores", async () => {
      await runAndCatchExit("order_items", { yes: true });
      const [errMsg] = mockLogError.mock.calls[0] as [string];
      expect(errMsg).toMatch(/hyphen/i);
    });

    it("should exit(1) when name contains spaces", async () => {
      const { exitError } = await runAndCatchExit("order items", { yes: true });
      expect(exitError?.code).toBe(1);
    });

    it("should log an error mentioning 'spaces' when name has spaces", async () => {
      await runAndCatchExit("order items", { yes: true });
      const [errMsg] = mockLogError.mock.calls[0] as [string];
      expect(errMsg).toMatch(/space/i);
    });

    it("should exit(1) when name has a leading hyphen", async () => {
      const { exitError } = await runAndCatchExit("-orders", { yes: true });
      expect(exitError?.code).toBe(1);
    });

    it("should exit(1) when name has a trailing hyphen", async () => {
      const { exitError } = await runAndCatchExit("orders-", { yes: true });
      expect(exitError?.code).toBe(1);
    });

    it("should call clack.outro with a kebab-case hint after a name validation failure", async () => {
      await runAndCatchExit("Orders", { yes: true });
      expect(mockOutro).toHaveBeenCalledOnce();
      const [outroMsg] = mockOutro.mock.calls[0] as [string];
      expect(outroMsg).toMatch(/kebab-case/i);
    });

    it("should NOT call detectProjectContext when the name is invalid", async () => {
      await runAndCatchExit("Bad_Name", { yes: true });
      expect(mockDetectProjectContext).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Context detection failures
// ---------------------------------------------------------------------------

describe("project context detection", () => {
  it("should call detectProjectContext with process.cwd()", async () => {
    await runAndCatchExit("orders", { yes: true });
    expect(mockDetectProjectContext).toHaveBeenCalledWith("/home/user/my-app");
  });

  it("should call readProjectName after successful detection", async () => {
    await runAndCatchExit("orders", { yes: true });
    expect(mockReadProjectName).toHaveBeenCalledWith("/home/user/my-app");
  });

  it("should call scanNextPort after successful detection", async () => {
    await runAndCatchExit("orders", { yes: true });
    expect(mockScanNextPort).toHaveBeenCalledWith("/home/user/my-app");
  });

  it("should exit(1) when detectProjectContext throws", async () => {
    mockDetectProjectContext.mockRejectedValue(
      new Error("Not a valid scaffolded project"),
    );
    const { exitError } = await runAndCatchExit("orders", { yes: true });
    expect(exitError?.code).toBe(1);
  });

  it("should log the error message when detectProjectContext throws", async () => {
    mockDetectProjectContext.mockRejectedValue(
      new Error("Not a valid scaffolded project"),
    );
    await runAndCatchExit("orders", { yes: true });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.stringContaining("Not a valid scaffolded project"),
    );
  });

  it("should call clack.outro with instructions when detection fails", async () => {
    mockDetectProjectContext.mockRejectedValue(new Error("Missing infra/"));
    await runAndCatchExit("orders", { yes: true });
    expect(mockOutro).toHaveBeenCalledOnce();
    const [outroMsg] = mockOutro.mock.calls[0] as [string];
    expect(outroMsg).toMatch(/infra\//i);
  });

  it("should exit(1) when readProjectName throws", async () => {
    mockReadProjectName.mockRejectedValue(
      new Error("Cannot read package.json"),
    );
    const { exitError } = await runAndCatchExit("orders", { yes: true });
    expect(exitError?.code).toBe(1);
  });

  it("should display a generic message when a non-Error is thrown during detection", async () => {
    mockDetectProjectContext.mockRejectedValue("some string error");
    await runAndCatchExit("orders", { yes: true });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.stringContaining("Unknown error"),
    );
  });
});

// ---------------------------------------------------------------------------
// -y / yes flag — skips interactive prompt
// ---------------------------------------------------------------------------

describe("-y / yes flag", () => {
  it("should return a config when yes:true without calling clack.confirm", async () => {
    const { config } = await runAndCatchExit("orders", { yes: true });
    expect(config).toBeDefined();
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it("should set installDeps:true by default when yes:true", async () => {
    const { config } = await runAndCatchExit("orders", { yes: true });
    expect(config?.installDeps).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// --no-install / flags.install
// ---------------------------------------------------------------------------

describe("flags.install", () => {
  it("should set installDeps:false when flags.install is false (--no-install)", async () => {
    const { config } = await runAndCatchExit("orders", { install: false });
    expect(config?.installDeps).toBe(false);
  });

  it("should NOT call clack.confirm when flags.install is explicitly false", async () => {
    await runAndCatchExit("orders", { install: false });
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it("should set installDeps:true when flags.install is true without prompting", async () => {
    const { config } = await runAndCatchExit("orders", { install: true });
    expect(config?.installDeps).toBe(true);
  });

  it("should NOT call clack.confirm when flags.install is explicitly true", async () => {
    await runAndCatchExit("orders", { install: true });
    expect(mockConfirm).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Interactive install prompt (no -y, no --no-install)
// ---------------------------------------------------------------------------

describe("interactive install prompt", () => {
  it("should call clack.confirm when neither yes nor install flag is set", async () => {
    mockConfirm.mockResolvedValue(true);
    await runAndCatchExit("orders", {});
    expect(mockConfirm).toHaveBeenCalledOnce();
  });

  it("should ask about pnpm install in the confirm prompt", async () => {
    mockConfirm.mockResolvedValue(true);
    await runAndCatchExit("orders", {});
    const [promptOpts] = mockConfirm.mock.calls[0] as [{ message: string }];
    expect(promptOpts.message).toMatch(/pnpm install/i);
  });

  it("should set installDeps:true when user confirms pnpm install", async () => {
    mockConfirm.mockResolvedValue(true);
    const { config } = await runAndCatchExit("orders", {});
    expect(config?.installDeps).toBe(true);
  });

  it("should set installDeps:false when user declines pnpm install", async () => {
    mockConfirm.mockResolvedValue(false);
    const { config } = await runAndCatchExit("orders", {});
    expect(config?.installDeps).toBe(false);
  });

  it("should exit(0) when user cancels the install prompt", async () => {
    const cancelSymbol = Symbol("cancel");
    mockIsCancel.mockReturnValue(true);
    mockConfirm.mockResolvedValue(cancelSymbol);

    const { exitError } = await runAndCatchExit("orders", {});
    expect(exitError?.code).toBe(0);
  });

  it("should call clack.outro with a cancellation message when user cancels", async () => {
    const cancelSymbol = Symbol("cancel");
    mockIsCancel.mockReturnValue(true);
    mockConfirm.mockResolvedValue(cancelSymbol);

    await runAndCatchExit("orders", {});
    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining("cancelled"),
    );
  });
});

// ---------------------------------------------------------------------------
// Entity name derivation
// ---------------------------------------------------------------------------

describe("entity name derivation", () => {
  it("should derive entityName 'Order' from module name 'orders'", async () => {
    const { config } = await runAndCatchExit("orders", { yes: true });
    expect(config?.entityName).toBe("Order");
  });

  it("should derive entityName 'OrderItem' from module name 'order-items'", async () => {
    const { config } = await runAndCatchExit("order-items", { yes: true });
    expect(config?.entityName).toBe("OrderItem");
  });

  it("should derive entityName 'Category' from module name 'categories'", async () => {
    const { config } = await runAndCatchExit("categories", { yes: true });
    expect(config?.entityName).toBe("Category");
  });

  it("should derive entityName 'Status' from module name 'statuses'", async () => {
    const { config } = await runAndCatchExit("statuses", { yes: true });
    expect(config?.entityName).toBe("Status");
  });
});

// ---------------------------------------------------------------------------
// Returned ModuleConfig shape and values
// ---------------------------------------------------------------------------

describe("returned ModuleConfig", () => {
  it("should include the trimmed module name", async () => {
    const { config } = await runAndCatchExit("orders", { yes: true });
    expect(config?.moduleName).toBe("orders");
  });

  it("should include the port returned by scanNextPort", async () => {
    mockScanNextPort.mockResolvedValue(3005);
    const { config } = await runAndCatchExit("orders", { yes: true });
    expect(config?.port).toBe(3005);
  });

  it("should set projectDir to process.cwd()", async () => {
    const { config } = await runAndCatchExit("orders", { yes: true });
    expect(config?.projectDir).toBe("/home/user/my-app");
  });

  it("should set projectName to the value returned by readProjectName", async () => {
    mockReadProjectName.mockResolvedValue("cool-api");
    const { config } = await runAndCatchExit("orders", { yes: true });
    expect(config?.projectName).toBe("cool-api");
  });

  it("should produce a complete ModuleConfig with all required keys", async () => {
    const { config } = await runAndCatchExit("orders", { yes: true });
    expect(config).toMatchObject<ModuleConfig>({
      moduleName: expect.any(String),
      entityName: expect.any(String),
      port: expect.any(Number),
      projectDir: expect.any(String),
      projectName: expect.any(String),
      installDeps: expect.any(Boolean),
    });
  });
});

// ---------------------------------------------------------------------------
// Intro / spinner display
// ---------------------------------------------------------------------------

describe("clack intro and spinner", () => {
  it("should call clack.intro when runModulePrompts is invoked", async () => {
    await runAndCatchExit("orders", { yes: true });
    expect(mockIntro).toHaveBeenCalledOnce();
  });

  it("should call spinner.start to indicate detection is in progress", async () => {
    await runAndCatchExit("orders", { yes: true });
    expect(mockSpinnerStart).toHaveBeenCalledOnce();
  });

  it("should call spinner.stop after detection completes", async () => {
    await runAndCatchExit("orders", { yes: true });
    expect(mockSpinnerStop).toHaveBeenCalledOnce();
  });

  it("should call clack.note to display the summary before prompting", async () => {
    await runAndCatchExit("orders", { yes: true });
    expect(mockNote).toHaveBeenCalledOnce();
  });

  it("should include the module name in the summary note", async () => {
    await runAndCatchExit("orders", { yes: true });
    const [noteContent] = mockNote.mock.calls[0] as [string];
    expect(noteContent).toContain("orders");
  });

  it("should include the port in the summary note", async () => {
    mockScanNextPort.mockResolvedValue(3007);
    await runAndCatchExit("orders", { yes: true });
    const [noteContent] = mockNote.mock.calls[0] as [string];
    expect(noteContent).toContain("3007");
  });
});
