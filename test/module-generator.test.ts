/**
 * Integration tests for generateModule() in src/module-generator.ts.
 *
 * Strategy:
 *  - Use real temp directories so file operations are fully exercised end-to-end.
 *  - Mock only `installDeps` (avoids real pnpm invocations) and `@clack/prompts`
 *    spinner (avoids console output during tests).
 *  - Mock `resolveTemplateRoot` to return the real templates/ directory in this
 *    repo while keeping `pathExists` real (real FS checks).
 *
 * Each test creates its own temp directory with the minimal scaffolded-project
 * structure that generateModule() requires, then inspects the actual files
 * written to disk.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import * as os from "node:os";
import { resolve as pathResolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Hoisted mock variables — must be declared via vi.hoisted() so they are
// available inside the vi.mock() factory closures, which are hoisted before
// imports by Vitest.
// ---------------------------------------------------------------------------
const { mockInstallDeps, mockSpinnerStart, mockSpinnerStop } = vi.hoisted(() => {
  const mockInstallDeps = vi.fn().mockResolvedValue({ success: true });
  const mockSpinnerStart = vi.fn();
  const mockSpinnerStop = vi.fn();
  return { mockInstallDeps, mockSpinnerStart, mockSpinnerStop };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Mock installDeps to avoid running real pnpm install.
vi.mock("../src/utils/pnpm.js", () => ({
  installDeps: mockInstallDeps,
}));

// Mock @clack/prompts spinner to suppress console output during tests.
vi.mock("@clack/prompts", () => ({
  spinner: () => ({
    start: mockSpinnerStart,
    stop: mockSpinnerStop,
  }),
}));

// Mock resolveTemplateRoot to point at the real templates/ directory in the
// repo root. pathExists is intentionally NOT mocked — it uses real FS checks.
vi.mock("../src/utils/paths.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/utils/paths.js")>();

  // Compute the repo root relative to this test file's location.
  // __dirname is not available in ESM; derive it from import.meta.url.
  const testFileDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = pathResolve(testFileDir, "..");
  const realTemplatesDir = join(repoRoot, "templates");

  return {
    ...original,
    resolveTemplateRoot: () => realTemplatesDir,
  };
});

// Import the module under test AFTER mocks are registered.
import { generateModule } from "../src/module-generator.js";
import type { ModuleConfig } from "../src/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The infra/src/index.ts content written into each temp project.
 * Contains both inject markers that generateModule() targets.
 */
const INFRA_INDEX_CONTENT = `#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { HealthStack } from "./stacks/modules/health-stack";
// @module-inject:import

const app = new cdk.App();
const stage = "dev";
const config = {};
const stackProps = {};

new HealthStack(app, \`test-app-HealthStack-\${stage}\`, {
  ...stackProps,
  stage,
  config,
});
// @module-inject:instance

app.synth();
`;

/**
 * The dev-gateway/src/gateway.ts content written into each temp project.
 * Contains the route inject marker that generateModule() targets.
 */
const GATEWAY_CONTENT = `const ROUTES: Record<string, string> = {
  "/health": "http://localhost:3001",
  "/users": "http://localhost:3002",
  // @module-inject:route
};
`;

/**
 * Creates the minimal directory structure required by generateModule() inside
 * the given temp directory.
 *
 * @param tempDir - Absolute path to the temp directory.
 * @param packageJsonName - The value of the "name" field in the root package.json.
 */
async function createScaffoldedProject(
  tempDir: string,
  packageJsonName = "test-app"
): Promise<void> {
  // services/ directory (initially empty — new module will be added here)
  await mkdir(join(tempDir, "services"), { recursive: true });

  // infra/src/ directory + index.ts with inject markers
  await mkdir(join(tempDir, "infra", "src"), { recursive: true });
  await writeFile(join(tempDir, "infra", "src", "index.ts"), INFRA_INDEX_CONTENT, "utf8");

  // dev-gateway/src/ directory + gateway.ts with inject marker
  await mkdir(join(tempDir, "dev-gateway", "src"), { recursive: true });
  await writeFile(join(tempDir, "dev-gateway", "src", "gateway.ts"), GATEWAY_CONTENT, "utf8");

  // pnpm-workspace.yaml (presence is expected by context detection)
  await writeFile(join(tempDir, "pnpm-workspace.yaml"), "packages:\n  - services/*\n", "utf8");

  // root package.json
  await writeFile(
    join(tempDir, "package.json"),
    JSON.stringify({ name: packageJsonName, version: "0.0.0" }),
    "utf8"
  );
}

/**
 * Factory for a minimal ModuleConfig targeting the given temp directory.
 */
function makeConfig(
  tempDir: string,
  overrides: Partial<ModuleConfig> = {}
): ModuleConfig {
  return {
    moduleName: "order-items",
    entityName: "OrderItem",
    port: 3003,
    projectDir: tempDir,
    projectName: "test-app",
    installDeps: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test state — tempDir is created/destroyed around each test.
// ---------------------------------------------------------------------------

let tempDir: string;

beforeEach(async () => {
  vi.clearAllMocks();
  tempDir = await mkdtemp(join(os.tmpdir(), "vibe-module-gen-test-"));
  await createScaffoldedProject(tempDir);
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Happy path — file operations
// ---------------------------------------------------------------------------

describe("generateModule — service files", () => {
  it("should copy service files into services/<moduleName>/", async () => {
    await generateModule(makeConfig(tempDir));

    const serviceDir = join(tempDir, "services", "order-items");
    // The module template tree must have been copied — check for package.json
    // which every module has.
    const pkgJson = await readFile(join(serviceDir, "package.json"), "utf8");
    expect(pkgJson).toBeTruthy();
  });

  it("should substitute {{moduleName}} in service files", async () => {
    await generateModule(makeConfig(tempDir));

    const pkgJson = await readFile(
      join(tempDir, "services", "order-items", "package.json"),
      "utf8"
    );
    expect(pkgJson).toContain("order-items");
    expect(pkgJson).not.toContain("{{moduleName}}");
  });

  it("should substitute {{port}} in service files", async () => {
    await generateModule(makeConfig(tempDir));

    // dev-server.ts should contain the assigned port number.
    const devServer = await readFile(
      join(tempDir, "services", "order-items", "src", "dev-server.ts"),
      "utf8"
    );
    expect(devServer).toContain("3003");
    expect(devServer).not.toContain("{{port}}");
  });

  it("should substitute {{EntityName}} in service files", async () => {
    await generateModule(makeConfig(tempDir));

    // Inspect a handler file — all use {{EntityName}}.
    const createHandler = await readFile(
      join(tempDir, "services", "order-items", "src", "handlers", "create.ts"),
      "utf8"
    );
    expect(createHandler).toContain("OrderItem");
    expect(createHandler).not.toContain("{{EntityName}}");
  });

  it("should create src/schemas/index.ts in the generated module", async () => {
    await generateModule(makeConfig(tempDir));

    const schemasPath = join(
      tempDir,
      "services",
      "order-items",
      "src",
      "schemas",
      "index.ts"
    );
    const content = await readFile(schemasPath, "utf8");
    expect(content).toBeTruthy();
  });

  it("should substitute {{EntityName}} in src/schemas/index.ts", async () => {
    await generateModule(makeConfig(tempDir));

    const content = await readFile(
      join(tempDir, "services", "order-items", "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(content).toContain("OrderItem");
    expect(content).not.toContain("{{EntityName}}");
  });

  it("should create src/openapi.ts in the generated module", async () => {
    await generateModule(makeConfig(tempDir));

    const openapiPath = join(
      tempDir,
      "services",
      "order-items",
      "src",
      "openapi.ts"
    );
    const content = await readFile(openapiPath, "utf8");
    expect(content).toBeTruthy();
  });

  it("should substitute {{moduleName}} in src/openapi.ts", async () => {
    await generateModule(makeConfig(tempDir));

    const content = await readFile(
      join(tempDir, "services", "order-items", "src", "openapi.ts"),
      "utf8"
    );
    expect(content).toContain("order-items");
    expect(content).not.toContain("{{moduleName}}");
  });

  it("should substitute {{projectName}} in src/openapi.ts", async () => {
    await generateModule(makeConfig(tempDir));

    const content = await readFile(
      join(tempDir, "services", "order-items", "src", "openapi.ts"),
      "utf8"
    );
    expect(content).toContain("test-app");
    expect(content).not.toContain("{{projectName}}");
  });

  it("should create src/generate-spec.ts in the generated module", async () => {
    await generateModule(makeConfig(tempDir));

    const genSpecPath = join(
      tempDir,
      "services",
      "order-items",
      "src",
      "generate-spec.ts"
    );
    const content = await readFile(genSpecPath, "utf8");
    expect(content).toBeTruthy();
  });

  it("should substitute {{EntityName}} in src/generate-spec.ts", async () => {
    await generateModule(makeConfig(tempDir));

    const content = await readFile(
      join(tempDir, "services", "order-items", "src", "generate-spec.ts"),
      "utf8"
    );
    expect(content).toContain("OrderItem");
    expect(content).not.toContain("{{EntityName}}");
  });
});

// ---------------------------------------------------------------------------
// Happy path — CDK stack file
// ---------------------------------------------------------------------------

describe("generateModule — CDK stack file", () => {
  it("should create the CDK stack file at infra/src/stacks/modules/<moduleName>-stack.ts", async () => {
    await generateModule(makeConfig(tempDir));

    const stackPath = join(
      tempDir,
      "infra",
      "src",
      "stacks",
      "modules",
      "order-items-stack.ts"
    );
    const stackContent = await readFile(stackPath, "utf8");
    expect(stackContent).toBeTruthy();
  });

  it("should substitute {{ModuleName}} in the CDK stack file", async () => {
    await generateModule(makeConfig(tempDir));

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    // The class name should be OrderItemsStack.
    expect(stackContent).toContain("OrderItemsStack");
    expect(stackContent).not.toContain("{{ModuleName}}");
  });

  it("should substitute {{moduleName}} in the CDK stack file", async () => {
    await generateModule(makeConfig(tempDir));

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).toContain("order-items");
    expect(stackContent).not.toContain("{{moduleName}}");
  });

  it("should substitute {{projectName}} in the CDK stack file", async () => {
    await generateModule(makeConfig(tempDir));

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).toContain("test-app");
    expect(stackContent).not.toContain("{{projectName}}");
  });
});

// ---------------------------------------------------------------------------
// Happy path — infra/src/index.ts injection
// ---------------------------------------------------------------------------

describe("generateModule — infra/src/index.ts injection", () => {
  it("should inject the import line before the // @module-inject:import marker", async () => {
    await generateModule(makeConfig(tempDir));

    const infraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    const lines = infraContent.split("\n");
    const markerIdx = lines.findIndex((l: string) => l.includes("// @module-inject:import"));

    // The marker must still be present.
    expect(markerIdx).toBeGreaterThan(-1);

    // The line immediately before the marker should be our import.
    const importLine = lines[markerIdx - 1];
    expect(importLine).toContain("OrderItemsStack");
    expect(importLine).toContain("./stacks/modules/order-items-stack");
  });

  it("should keep the // @module-inject:import marker intact after injection", async () => {
    await generateModule(makeConfig(tempDir));

    const infraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    expect(infraContent).toContain("// @module-inject:import");
  });

  it("should inject the correct import statement format", async () => {
    await generateModule(makeConfig(tempDir));

    const infraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    expect(infraContent).toMatch(
      /import \{ OrderItemsStack \} from "\.\/stacks\/modules\/order-items-stack";/
    );
  });

  it("should inject the instance line before the // @module-inject:instance marker", async () => {
    await generateModule(makeConfig(tempDir));

    const infraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    const lines = infraContent.split("\n");
    const markerIdx = lines.findIndex((l: string) => l.includes("// @module-inject:instance"));

    expect(markerIdx).toBeGreaterThan(-1);

    const instanceLine = lines[markerIdx - 1];
    expect(instanceLine).toContain("OrderItemsStack");
    expect(instanceLine).toContain("test-app");
  });

  it("should keep the // @module-inject:instance marker intact after injection", async () => {
    await generateModule(makeConfig(tempDir));

    const infraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    expect(infraContent).toContain("// @module-inject:instance");
  });

  it("should inject the correct instantiation statement format with template literal", async () => {
    await generateModule(makeConfig(tempDir));

    const infraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    // The instance line uses a template literal: `test-app-OrderItemsStack-${stage}`
    expect(infraContent).toMatch(
      /new OrderItemsStack\(app, `test-app-OrderItemsStack-\$\{stage\}`,/
    );
  });
});

// ---------------------------------------------------------------------------
// Happy path — dev-gateway/src/gateway.ts injection
// ---------------------------------------------------------------------------

describe("generateModule — dev-gateway/src/gateway.ts injection", () => {
  it("should inject the route line before the // @module-inject:route marker", async () => {
    await generateModule(makeConfig(tempDir));

    const gatewayContent = await readFile(
      join(tempDir, "dev-gateway", "src", "gateway.ts"),
      "utf8"
    );
    const lines = gatewayContent.split("\n");
    const markerIdx = lines.findIndex((l: string) => l.includes("// @module-inject:route"));

    expect(markerIdx).toBeGreaterThan(-1);

    const routeLine = lines[markerIdx - 1];
    expect(routeLine).toContain("/order-items");
    expect(routeLine).toContain("3003");
  });

  it("should keep the // @module-inject:route marker intact after injection", async () => {
    await generateModule(makeConfig(tempDir));

    const gatewayContent = await readFile(
      join(tempDir, "dev-gateway", "src", "gateway.ts"),
      "utf8"
    );
    expect(gatewayContent).toContain("// @module-inject:route");
  });

  it("should inject the correct route entry format", async () => {
    await generateModule(makeConfig(tempDir));

    const gatewayContent = await readFile(
      join(tempDir, "dev-gateway", "src", "gateway.ts"),
      "utf8"
    );
    expect(gatewayContent).toMatch(/["']\/order-items["']: ["']http:\/\/localhost:3003["'],/);
  });

  it("should inherit the indentation of the marker line", async () => {
    await generateModule(makeConfig(tempDir));

    const gatewayContent = await readFile(
      join(tempDir, "dev-gateway", "src", "gateway.ts"),
      "utf8"
    );
    const lines = gatewayContent.split("\n");
    const markerIdx = lines.findIndex((l: string) => l.includes("// @module-inject:route"));
    // The marker in GATEWAY_CONTENT has 2-space indent; the inserted route should too.
    const insertedLine = lines[markerIdx - 1]!;
    expect(insertedLine).toMatch(/^\s+/);
  });
});

// ---------------------------------------------------------------------------
// Injection correctness — content patterns
// ---------------------------------------------------------------------------

describe("generateModule — injection content patterns", () => {
  it("should use PascalCase for the import identifier (OrderItemsStack not order-items-stack)", async () => {
    await generateModule(makeConfig(tempDir));

    const infraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    expect(infraContent).toContain("OrderItemsStack");
  });

  it("should use kebab-case for the import module path", async () => {
    await generateModule(makeConfig(tempDir));

    const infraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    expect(infraContent).toContain("order-items-stack");
  });

  it("should use the port number from config in the route entry", async () => {
    const config = makeConfig(tempDir, { port: 3099 });
    await generateModule(config);

    const gatewayContent = await readFile(
      join(tempDir, "dev-gateway", "src", "gateway.ts"),
      "utf8"
    );
    expect(gatewayContent).toContain("3099");
  });

  it("should use the project name from config in the instance line", async () => {
    await mkdir(join(tempDir, "services", "orders"), { recursive: true });

    // Create a new project with a different name and a fresh temp dir for this test.
    const otherTempDir = await mkdtemp(join(os.tmpdir(), "vibe-module-gen-proj-name-"));
    try {
      await createScaffoldedProject(otherTempDir, "my-cool-app");
      const config = makeConfig(otherTempDir, {
        moduleName: "orders",
        entityName: "Order",
        port: 3003,
        projectName: "my-cool-app",
      });
      await generateModule(config);

      const infraContent = await readFile(
        join(otherTempDir, "infra", "src", "index.ts"),
        "utf8"
      );
      expect(infraContent).toContain("my-cool-app-OrdersStack");
    } finally {
      await rm(otherTempDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// Duplicate module guard
// ---------------------------------------------------------------------------

describe("generateModule — duplicate guard", () => {
  it("should throw when services/<moduleName>/ already exists", async () => {
    // Pre-create the directory to simulate a module that already exists.
    await mkdir(join(tempDir, "services", "order-items"), { recursive: true });

    await expect(generateModule(makeConfig(tempDir))).rejects.toThrow();
  });

  it("should include the module name in the error message", async () => {
    await mkdir(join(tempDir, "services", "order-items"), { recursive: true });

    await expect(generateModule(makeConfig(tempDir))).rejects.toThrow(
      /order-items/
    );
  });

  it("should include the path in the error message", async () => {
    await mkdir(join(tempDir, "services", "order-items"), { recursive: true });

    await expect(generateModule(makeConfig(tempDir))).rejects.toThrow(
      /order-items/
    );
    await expect(generateModule(makeConfig(tempDir))).rejects.toThrow(
      /services/
    );
  });

  it("should not modify any existing files when the guard fires", async () => {
    await mkdir(join(tempDir, "services", "order-items"), { recursive: true });

    const originalInfraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );

    await generateModule(makeConfig(tempDir)).catch(() => {
      // Expected to throw — swallow the error.
    });

    const infraContentAfter = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    // The infra index must not have been touched.
    expect(infraContentAfter).toBe(originalInfraContent);
  });
});

// ---------------------------------------------------------------------------
// installDeps flag
// ---------------------------------------------------------------------------

describe("generateModule — installDeps flag", () => {
  it("should call installDeps with the project directory when installDeps: true", async () => {
    await generateModule(makeConfig(tempDir, { installDeps: true }));

    expect(mockInstallDeps).toHaveBeenCalledTimes(1);
    expect(mockInstallDeps).toHaveBeenCalledWith(tempDir);
  });

  it("should NOT call installDeps when installDeps: false", async () => {
    await generateModule(makeConfig(tempDir, { installDeps: false }));

    expect(mockInstallDeps).not.toHaveBeenCalled();
  });

  it("should NOT call installDeps when installDeps is omitted (defaults to false)", async () => {
    const config: ModuleConfig = {
      moduleName: "orders",
      entityName: "Order",
      port: 3004,
      projectDir: tempDir,
      projectName: "test-app",
      installDeps: false,
    };
    await generateModule(config);

    expect(mockInstallDeps).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Spinner interaction
// ---------------------------------------------------------------------------

describe("generateModule — spinner", () => {
  it("should call spinner.start at least once", async () => {
    await generateModule(makeConfig(tempDir));

    expect(mockSpinnerStart).toHaveBeenCalled();
  });

  it("should call spinner.stop at least once", async () => {
    await generateModule(makeConfig(tempDir));

    expect(mockSpinnerStop).toHaveBeenCalled();
  });

  it("should call spinner.start and spinner.stop the same number of times", async () => {
    await generateModule(makeConfig(tempDir));

    expect(mockSpinnerStart).toHaveBeenCalledTimes(mockSpinnerStop.mock.calls.length);
  });
});

// ---------------------------------------------------------------------------
// Multi-module scenario — markers survive repeated injections
// ---------------------------------------------------------------------------

describe("generateModule — multiple modules injected sequentially", () => {
  it("should allow a second module to be injected after the first", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );
    await generateModule(
      makeConfig(tempDir, { moduleName: "products", entityName: "Product", port: 3004 })
    );

    const infraContent = await readFile(
      join(tempDir, "infra", "src", "index.ts"),
      "utf8"
    );
    expect(infraContent).toContain("OrdersStack");
    expect(infraContent).toContain("ProductsStack");
    // Both markers must still be intact for future injections.
    expect(infraContent).toContain("// @module-inject:import");
    expect(infraContent).toContain("// @module-inject:instance");
  });

  it("should add two separate route entries to gateway.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );
    await generateModule(
      makeConfig(tempDir, { moduleName: "products", entityName: "Product", port: 3004 })
    );

    const gatewayContent = await readFile(
      join(tempDir, "dev-gateway", "src", "gateway.ts"),
      "utf8"
    );
    expect(gatewayContent).toContain("/orders");
    expect(gatewayContent).toContain("3003");
    expect(gatewayContent).toContain("/products");
    expect(gatewayContent).toContain("3004");
    expect(gatewayContent).toContain("// @module-inject:route");
  });
});

// ---------------------------------------------------------------------------
// Protected endpoints — CDK stack auth variables
// ---------------------------------------------------------------------------

describe("generateModule — protected endpoints", () => {
  it("should include TokenAuthorizer in the stack file when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).toContain("TokenAuthorizer");
  });

  it("should include Fn.importValue in the stack file when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).toContain("Fn.importValue");
  });

  it("should include authorizationType: apigateway.AuthorizationType.CUSTOM when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).toContain("authorizationType: apigateway.AuthorizationType.CUSTOM");
  });

  it("should include the AuthorizerFunctionArn export name pattern in the authorizerSetup block", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    // The authorizerSetup block includes a Fn.importValue call whose argument
    // contains the "AuthorizerFunctionArn" suffix — this string is hardcoded
    // inside buildAuthorizerSetup() and must survive the substitution pass.
    expect(stackContent).toContain("AuthorizerFunctionArn");
  });

  it("should add the authorizer reference to every protected addMethod call", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    // authMethodOptions produces "authorizer," inside the method options object —
    // one occurrence per protected endpoint (5 endpoints → 5 occurrences).
    const authorizerOccurrences = (stackContent.match(/\bauthorizer,/g) ?? []).length;
    expect(authorizerOccurrences).toBe(5);
  });

  it("should resolve {{projectName}} inside the authorizerSetup block to the actual project name", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    // The authorizerSetup block embeds {{projectName}} — it must be resolved
    // to the actual project name during variable substitution.
    expect(stackContent).toContain("test-app-AuthorizerFunctionArn");
    expect(stackContent).not.toContain("{{projectName}}");
  });

  it("should resolve {{ModuleName}} inside the authorizerSetup block to the actual module name", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    // The authorizerSetup block embeds {{ModuleName}} — it must be resolved.
    expect(stackContent).toContain("OrderItemsAuthorizer");
    expect(stackContent).not.toContain("{{ModuleName}}");
  });
});

// ---------------------------------------------------------------------------
// Unprotected endpoints — no authorizer code in stack file
// ---------------------------------------------------------------------------

describe("generateModule — unprotected endpoints (default)", () => {
  it("should NOT include TokenAuthorizer in the stack file when protectedEndpoints is omitted", async () => {
    await generateModule(makeConfig(tempDir));

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).not.toContain("TokenAuthorizer");
  });

  it("should NOT include Fn.importValue in the stack file when protectedEndpoints is omitted", async () => {
    await generateModule(makeConfig(tempDir));

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).not.toContain("Fn.importValue");
  });

  it("should NOT include authorizationType in the stack file when protectedEndpoints is omitted", async () => {
    await generateModule(makeConfig(tempDir));

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).not.toContain("authorizationType");
  });

  it("should NOT include TokenAuthorizer when all protectedEndpoints flags are false", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: false,
          update: false,
          delete: false,
        },
      })
    );

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).not.toContain("TokenAuthorizer");
    expect(stackContent).not.toContain("authorizationType");
  });

  it("should leave no extra blank lines from empty auth variable substitution", async () => {
    await generateModule(makeConfig(tempDir));

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    // Empty string substitution for inline placeholders ({{authorizerSetup}},
    // {{listAuthOptions}}, etc.) must not produce consecutive triple newlines
    // (i.e. two blank lines in a row), which would indicate a spurious blank
    // line was injected by the empty replacement.
    expect(stackContent).not.toContain("\n\n\n");
  });

  it("should leave no residual {{auth*}} placeholder tokens in the unprotected stack file", async () => {
    await generateModule(makeConfig(tempDir));

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    expect(stackContent).not.toMatch(/\{\{auth\w+\}\}/);
  });

  it("should produce addMethod calls without an options argument when unprotected", async () => {
    await generateModule(makeConfig(tempDir));

    const stackContent = await readFile(
      join(tempDir, "infra", "src", "stacks", "modules", "order-items-stack.ts"),
      "utf8"
    );
    // Every addMethod call should close with `{ proxy: true })` on the same line
    // (no trailing comma leading into an options block).
    const addMethodCalls = stackContent.match(/\.addMethod\([\s\S]*?\)/g) ?? [];
    // There should be exactly 5 addMethod calls (list, create, get, update, delete).
    expect(addMethodCalls.length).toBe(5);
    // None should reference an authorizer.
    expect(stackContent).not.toContain("authorizer,");
  });
});

// ---------------------------------------------------------------------------
// localAuth middleware — generated app.ts (all endpoints protected)
// ---------------------------------------------------------------------------

describe("generateModule — app.ts localAuth (all endpoints protected)", () => {
  it("should import localAuth from the lambda-utils package when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).toContain('import { localAuth } from "@test-app/lambda-utils"');
  });

  it("should declare the auth constant when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).toContain("const auth = localAuth();");
  });

  it("should prefix every route handler with auth middleware when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    // All 5 route registrations must use the auth middleware.
    const authMiddlewareOccurrences = (appContent.match(/auth, lambdaToHono\(/g) ?? []).length;
    expect(authMiddlewareOccurrences).toBe(5);
  });

  it("should not leave any {{localAuthImport}} placeholder when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).not.toContain("{{localAuthImport}}");
  });

  it("should not leave any {{localAuthConst}} placeholder when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).not.toContain("{{localAuthConst}}");
  });

  it("should not leave any {{xxxAuthMiddleware}} placeholder when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).not.toMatch(/\{\{\w+AuthMiddleware\}\}/);
  });
});

// ---------------------------------------------------------------------------
// localAuth middleware — generated app.ts (no endpoints protected)
// ---------------------------------------------------------------------------

describe("generateModule — app.ts localAuth (no endpoints protected)", () => {
  it("should NOT import localAuth when protectedEndpoints is omitted", async () => {
    await generateModule(makeConfig(tempDir));

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).not.toContain("localAuth");
  });

  it("should NOT declare the auth constant when protectedEndpoints is omitted", async () => {
    await generateModule(makeConfig(tempDir));

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).not.toContain("const auth = localAuth()");
  });

  it("should use bare lambdaToHono() calls without auth prefix when protectedEndpoints is omitted", async () => {
    await generateModule(makeConfig(tempDir));

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    // No route should have the auth middleware prefix.
    expect(appContent).not.toContain("auth, lambdaToHono(");
  });

  it("should contain bare lambdaToHono(createOrderItem) without auth prefix when protectedEndpoints is omitted", async () => {
    await generateModule(makeConfig(tempDir));

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).toContain("lambdaToHono(createOrderItem)");
  });

  it("should NOT import localAuth when all protectedEndpoints flags are false", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: false,
          update: false,
          delete: false,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).not.toContain("localAuth");
  });

  it("should not leave any residual placeholder tokens when protectedEndpoints is omitted", async () => {
    await generateModule(makeConfig(tempDir));

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).not.toMatch(/\{\{localAuth\w*\}\}/);
    expect(appContent).not.toMatch(/\{\{\w+AuthMiddleware\}\}/);
  });
});

// ---------------------------------------------------------------------------
// localAuth middleware — generated app.ts (mixed protection)
// ---------------------------------------------------------------------------

describe("generateModule — app.ts localAuth (mixed protection: create and delete only)", () => {
  it("should import localAuth when at least one endpoint is protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: true,
          update: false,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).toContain('import { localAuth } from "@test-app/lambda-utils"');
  });

  it("should declare the auth constant when at least one endpoint is protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: true,
          update: false,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).toContain("const auth = localAuth();");
  });

  it("should prefix the app.post (create) route with auth middleware", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: true,
          update: false,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).toContain("auth, lambdaToHono(createOrderItem)");
  });

  it("should prefix the app.delete route with auth middleware", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: true,
          update: false,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).toContain("auth, lambdaToHono(deleteOrderItem)");
  });

  it("should NOT prefix the app.get (single item) route with auth middleware", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: true,
          update: false,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    // The get route should use bare lambdaToHono without auth prefix.
    expect(appContent).toContain("lambdaToHono(getOrderItem)");
    expect(appContent).not.toContain("auth, lambdaToHono(getOrderItem)");
  });

  it("should NOT prefix the app.put (update) route with auth middleware", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: true,
          update: false,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).toContain("lambdaToHono(updateOrderItem)");
    expect(appContent).not.toContain("auth, lambdaToHono(updateOrderItem)");
  });

  it("should NOT prefix the app.get (list) route with auth middleware", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: true,
          update: false,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).toContain("lambdaToHono(listOrderItems)");
    expect(appContent).not.toContain("auth, lambdaToHono(listOrderItems)");
  });

  it("should produce exactly 2 auth-prefixed route calls for create+delete mixed protection", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: true,
          update: false,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    const authMiddlewareOccurrences = (appContent.match(/auth, lambdaToHono\(/g) ?? []).length;
    expect(authMiddlewareOccurrences).toBe(2);
  });

  it("should not leave any residual placeholder tokens in mixed-protection app.ts", async () => {
    await generateModule(
      makeConfig(tempDir, {
        protectedEndpoints: {
          list: false,
          get: false,
          create: true,
          update: false,
          delete: true,
        },
      })
    );

    const appContent = await readFile(
      join(tempDir, "services", "order-items", "src", "app.ts"),
      "utf8"
    );
    expect(appContent).not.toMatch(/\{\{localAuth\w*\}\}/);
    expect(appContent).not.toMatch(/\{\{\w+AuthMiddleware\}\}/);
  });
});

// ---------------------------------------------------------------------------
// Template variable substitution — schemas/index.ts
// ---------------------------------------------------------------------------

describe("generateModule — schemas/index.ts variable substitution", () => {
  it("should generate schemas/index.ts for the orders module", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const schemasPath = join(tempDir, "services", "orders", "src", "schemas", "index.ts");
    const content = await readFile(schemasPath, "utf8");
    expect(content).toBeTruthy();
  });

  it("should contain OrderSchema (not {{EntityName}}Schema) in schemas/index.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(content).toContain("OrderSchema");
    expect(content).not.toContain("{{EntityName}}Schema");
  });

  it("should contain CreateOrderBodySchema in schemas/index.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(content).toContain("CreateOrderBodySchema");
    expect(content).not.toContain("Create{{EntityName}}BodySchema");
  });

  it("should contain UpdateOrderBodySchema in schemas/index.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(content).toContain("UpdateOrderBodySchema");
    expect(content).not.toContain("Update{{EntityName}}BodySchema");
  });

  it("should substitute {{entityNameLower}} in schemas/index.ts JSDoc comments", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "schemas", "index.ts"),
      "utf8"
    );
    // The JSDoc comments use {{entityNameLower}} — should become "order".
    expect(content).toContain("order");
    expect(content).not.toContain("{{entityNameLower}}");
  });

  it("should substitute {{moduleName}} in schemas/index.ts file header comment", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(content).toContain("orders");
    expect(content).not.toContain("{{moduleName}}");
  });

  it("should produce valid TypeScript type aliases in schemas/index.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "schemas", "index.ts"),
      "utf8"
    );
    // Inferred type aliases must reference concrete schema names.
    expect(content).toContain("export type Order = z.infer<typeof OrderSchema>");
    expect(content).toContain("export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>");
    expect(content).toContain("export type UpdateOrderBody = z.infer<typeof UpdateOrderBodySchema>");
  });

  it("should leave no unsubstituted {{...}} template variables in schemas/index.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(content).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it("should work correctly for a multi-word kebab-case module name (order-items)", async () => {
    await generateModule(makeConfig(tempDir));

    const content = await readFile(
      join(tempDir, "services", "order-items", "src", "schemas", "index.ts"),
      "utf8"
    );
    // EntityName is "OrderItem" for the "order-items" module.
    expect(content).toContain("OrderItemSchema");
    expect(content).toContain("CreateOrderItemBodySchema");
    expect(content).toContain("UpdateOrderItemBodySchema");
    // entityNameLower is "orderItem".
    expect(content).toContain("orderItem");
    expect(content).not.toMatch(/\{\{[^}]+\}\}/);
  });
});

// ---------------------------------------------------------------------------
// Template variable substitution — openapi.ts
// ---------------------------------------------------------------------------

describe("generateModule — openapi.ts variable substitution", () => {
  it("should generate openapi.ts for the orders module", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const openapiPath = join(tempDir, "services", "orders", "src", "openapi.ts");
    const content = await readFile(openapiPath, "utf8");
    expect(content).toBeTruthy();
  });

  it("should contain /orders path registrations in openapi.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "openapi.ts"),
      "utf8"
    );
    // Both the collection path and the item path must be present.
    expect(content).toContain('path: "/orders"');
    expect(content).toContain('path: "/orders/{id}"');
  });

  it("should import OrderSchema, CreateOrderBodySchema, UpdateOrderBodySchema in openapi.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "openapi.ts"),
      "utf8"
    );
    expect(content).toContain("OrderSchema");
    expect(content).toContain("CreateOrderBodySchema");
    expect(content).toContain("UpdateOrderBodySchema");
  });

  it("should not contain unresolved {{EntityName}} import placeholders in openapi.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "openapi.ts"),
      "utf8"
    );
    expect(content).not.toContain("{{EntityName}}Schema");
    expect(content).not.toContain("Create{{EntityName}}BodySchema");
    expect(content).not.toContain("Update{{EntityName}}BodySchema");
  });

  it("should register schemas using resolved entity names in openapi.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "openapi.ts"),
      "utf8"
    );
    expect(content).toContain('registry.register("Order",');
    expect(content).toContain('registry.register("CreateOrderBody",');
    expect(content).toContain('registry.register("UpdateOrderBody",');
  });

  it("should substitute {{projectName}} in the shared-types import path in openapi.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "openapi.ts"),
      "utf8"
    );
    expect(content).toContain("@test-app/shared-types");
    expect(content).not.toContain("{{projectName}}");
  });

  it("should leave no unsubstituted {{...}} template variables in openapi.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "openapi.ts"),
      "utf8"
    );
    expect(content).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it("should work correctly for a multi-word kebab-case module name in openapi.ts", async () => {
    await generateModule(makeConfig(tempDir));

    const content = await readFile(
      join(tempDir, "services", "order-items", "src", "openapi.ts"),
      "utf8"
    );
    expect(content).toContain('path: "/order-items"');
    expect(content).toContain('path: "/order-items/{id}"');
    expect(content).toContain("OrderItemSchema");
    expect(content).toContain("CreateOrderItemBodySchema");
    expect(content).not.toMatch(/\{\{[^}]+\}\}/);
  });
});

// ---------------------------------------------------------------------------
// Template variable substitution — generate-spec.ts
// ---------------------------------------------------------------------------

describe("generateModule — generate-spec.ts variable substitution", () => {
  it("should generate generate-spec.ts for the orders module", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const specPath = join(tempDir, "services", "orders", "src", "generate-spec.ts");
    const content = await readFile(specPath, "utf8");
    expect(content).toBeTruthy();
  });

  it("should substitute {{EntityName}} in the API title in generate-spec.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "generate-spec.ts"),
      "utf8"
    );
    expect(content).toContain("Order Service API");
    expect(content).not.toContain("{{EntityName}}");
  });

  it("should leave no unsubstituted {{...}} template variables in generate-spec.ts", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "generate-spec.ts"),
      "utf8"
    );
    expect(content).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it("should work correctly for a multi-word kebab-case module name in generate-spec.ts", async () => {
    await generateModule(makeConfig(tempDir));

    const content = await readFile(
      join(tempDir, "services", "order-items", "src", "generate-spec.ts"),
      "utf8"
    );
    expect(content).toContain("OrderItem Service API");
    expect(content).not.toMatch(/\{\{[^}]+\}\}/);
  });
});

// ---------------------------------------------------------------------------
// No residual template variables — all generated service files
// ---------------------------------------------------------------------------

describe("generateModule — no residual {{...}} placeholders in any generated file", () => {
  /**
   * Returns the content of every file under `services/<moduleName>/src/` that
   * was copied from a `.hbs` template, keyed by their relative path from the
   * service root.  These are the files most likely to contain unsubstituted
   * placeholders if the variable map is incomplete.
   */
  async function readAllServiceFiles(
    serviceDir: string
  ): Promise<Array<{ path: string; content: string }>> {
    const filePaths = [
      join(serviceDir, "src", "schemas", "index.ts"),
      join(serviceDir, "src", "openapi.ts"),
      join(serviceDir, "src", "generate-spec.ts"),
      join(serviceDir, "src", "app.ts"),
      join(serviceDir, "src", "dev-server.ts"),
      join(serviceDir, "src", "store.ts"),
      join(serviceDir, "src", "types", "index.ts"),
      join(serviceDir, "src", "db", "repository.ts"),
      join(serviceDir, "src", "handlers", "create.ts"),
      join(serviceDir, "src", "handlers", "get.ts"),
      join(serviceDir, "src", "handlers", "list.ts"),
      join(serviceDir, "src", "handlers", "update.ts"),
      join(serviceDir, "src", "handlers", "delete.ts"),
    ];

    const results: Array<{ path: string; content: string }> = [];
    for (const filePath of filePaths) {
      const content = await readFile(filePath, "utf8");
      results.push({ path: filePath, content });
    }
    return results;
  }

  it("should leave no {{...}} placeholders in any generated service file for a simple module name", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const serviceDir = join(tempDir, "services", "orders");
    const files = await readAllServiceFiles(serviceDir);

    for (const { path, content } of files) {
      const match = content.match(/\{\{[^}]+\}\}/);
      expect(
        match,
        `Unsubstituted placeholder "${match?.[0]}" found in ${path}`
      ).toBeNull();
    }
  });

  it("should leave no {{...}} placeholders in any generated service file for a multi-word module name", async () => {
    await generateModule(makeConfig(tempDir));

    const serviceDir = join(tempDir, "services", "order-items");
    const files = await readAllServiceFiles(serviceDir);

    for (const { path, content } of files) {
      const match = content.match(/\{\{[^}]+\}\}/);
      expect(
        match,
        `Unsubstituted placeholder "${match?.[0]}" found in ${path}`
      ).toBeNull();
    }
  });

  it("should leave no {{...}} placeholders in any generated service file when all endpoints are protected", async () => {
    await generateModule(
      makeConfig(tempDir, {
        moduleName: "orders",
        entityName: "Order",
        port: 3003,
        protectedEndpoints: {
          list: true,
          get: true,
          create: true,
          update: true,
          delete: true,
        },
      })
    );

    const serviceDir = join(tempDir, "services", "orders");
    const files = await readAllServiceFiles(serviceDir);

    for (const { path, content } of files) {
      const match = content.match(/\{\{[^}]+\}\}/);
      expect(
        match,
        `Unsubstituted placeholder "${match?.[0]}" found in ${path}`
      ).toBeNull();
    }
  });

  it("should contain the module name in generated schemas/index.ts after substitution", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "schemas", "index.ts"),
      "utf8"
    );
    // The file header comment references the module name.
    expect(content).toContain("orders");
  });

  it("should contain /orders path in generated openapi.ts after substitution", async () => {
    await generateModule(
      makeConfig(tempDir, { moduleName: "orders", entityName: "Order", port: 3003 })
    );

    const content = await readFile(
      join(tempDir, "services", "orders", "src", "openapi.ts"),
      "utf8"
    );
    expect(content).toContain("/orders");
  });
});
