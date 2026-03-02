/**
 * Phase 4 — Template structure and variable-placeholder tests.
 *
 * This file has NO module mocks so it can hit the real filesystem.
 * It covers two concerns:
 *
 * 1. Directory / file existence — every template path that copyDir depends
 *    on for the minimal preset must be present.  A missing file here means
 *    the generated project would be incomplete or copyDir would throw at
 *    runtime.
 *
 * 2. .hbs naming convention — files with {{variable}} placeholders must carry
 *    the .hbs suffix so copyDir knows to apply substitution.  Static files
 *    must NOT contain {{...}} patterns.
 *
 * What is NOT tested here:
 *   - scaffold() orchestration           → test/scaffolder.test.ts
 *   - SUBDIR_TEMPLATE_DIRS placement     → test/phase4.test.ts
 *   - copyDir mechanics                  → test/utils/fs.test.ts
 *   - getTemplateDirs / getVariableMap   → test/template-helpers.test.ts
 */

import { describe, it, expect } from "vitest";
import { access, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Template root resolution
// ---------------------------------------------------------------------------

/**
 * Absolute path to templates/ at the repository root.
 * Uses fileURLToPath + dirname to be ESM-safe and work correctly regardless
 * of the working directory at test-run time.
 *
 * Layout:
 *   test/phase4-templates.test.ts  →  dirname = <root>/test
 *   templates/                     →  resolve(<root>/test, "..", "templates")
 */
const TEMPLATE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates"
);

// ---------------------------------------------------------------------------
// Filesystem helper
// ---------------------------------------------------------------------------

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Part 1: Template directory and file existence
// ---------------------------------------------------------------------------

describe("Phase 4 template structure — top-level directories", () => {
  it.each(["base", "infra", "services", "dev-gateway", "packages"])(
    "templates/%s/ should exist",
    async (dir) => {
      expect(await exists(join(TEMPLATE_ROOT, dir))).toBe(true);
    }
  );
});

describe("Phase 4 template structure — infra/", () => {
  it("templates/infra/package.json.hbs should exist", async () => {
    expect(await exists(join(TEMPLATE_ROOT, "infra", "package.json.hbs"))).toBe(true);
  });

  it("templates/infra/cdk.json should exist", async () => {
    expect(await exists(join(TEMPLATE_ROOT, "infra", "cdk.json"))).toBe(true);
  });

  it("templates/infra/tsconfig.json should exist", async () => {
    expect(await exists(join(TEMPLATE_ROOT, "infra", "tsconfig.json"))).toBe(true);
  });

  it("templates/infra/tsconfig.build.json should exist", async () => {
    expect(await exists(join(TEMPLATE_ROOT, "infra", "tsconfig.build.json"))).toBe(true);
  });

  it("templates/infra/src/index.ts.hbs should exist", async () => {
    expect(await exists(join(TEMPLATE_ROOT, "infra", "src", "index.ts.hbs"))).toBe(true);
  });

  it("templates/infra/src/config.ts.hbs should exist", async () => {
    expect(await exists(join(TEMPLATE_ROOT, "infra", "src", "config.ts.hbs"))).toBe(true);
  });

  it("templates/infra/src/stacks/base-stack.ts should exist", async () => {
    expect(
      await exists(join(TEMPLATE_ROOT, "infra", "src", "stacks", "base-stack.ts"))
    ).toBe(true);
  });

  it("templates/infra/src/stacks/modules/health-stack.ts.hbs should exist", async () => {
    expect(
      await exists(
        join(TEMPLATE_ROOT, "infra", "src", "stacks", "modules", "health-stack.ts.hbs")
      )
    ).toBe(true);
  });

  it("templates/infra/src/stacks/modules/users-stack.ts.hbs should exist", async () => {
    expect(
      await exists(
        join(TEMPLATE_ROOT, "infra", "src", "stacks", "modules", "users-stack.ts.hbs")
      )
    ).toBe(true);
  });
});

describe("Phase 4 template structure — services/health/", () => {
  const h = join(TEMPLATE_ROOT, "services", "health");

  it("templates/services/health/ should exist", async () => {
    expect(await exists(h)).toBe(true);
  });

  it("templates/services/health/package.json.hbs should exist", async () => {
    expect(await exists(join(h, "package.json.hbs"))).toBe(true);
  });

  it("templates/services/health/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(h, "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/services/health/vitest.config.ts should exist", async () => {
    expect(await exists(join(h, "vitest.config.ts"))).toBe(true);
  });

  it("templates/services/health/src/handlers/health.ts should exist", async () => {
    expect(await exists(join(h, "src", "handlers", "health.ts"))).toBe(true);
  });

  it("templates/services/health/src/dev-server.ts.hbs should exist", async () => {
    expect(await exists(join(h, "src", "dev-server.ts.hbs"))).toBe(true);
  });

  it("templates/services/health/src/__tests__/health.test.ts.hbs should exist", async () => {
    expect(await exists(join(h, "src", "__tests__", "health.test.ts.hbs"))).toBe(true);
  });
});

describe("Phase 4 template structure — services/users/", () => {
  const u = join(TEMPLATE_ROOT, "services", "users");

  it("templates/services/users/ should exist", async () => {
    expect(await exists(u)).toBe(true);
  });

  it("templates/services/users/package.json.hbs should exist", async () => {
    expect(await exists(join(u, "package.json.hbs"))).toBe(true);
  });

  it("templates/services/users/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(u, "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/services/users/vitest.config.ts should exist", async () => {
    expect(await exists(join(u, "vitest.config.ts"))).toBe(true);
  });

  it("templates/services/users/src/app.ts.hbs should exist", async () => {
    expect(await exists(join(u, "src", "app.ts.hbs"))).toBe(true);
  });

  it("templates/services/users/src/dev-server.ts.hbs should exist", async () => {
    expect(await exists(join(u, "src", "dev-server.ts.hbs"))).toBe(true);
  });

  it("templates/services/users/src/store.ts should exist", async () => {
    expect(await exists(join(u, "src", "store.ts"))).toBe(true);
  });

  it("templates/services/users/src/types/index.ts should exist", async () => {
    expect(await exists(join(u, "src", "types", "index.ts"))).toBe(true);
  });

  it.each([
    "create-user.ts",
    "delete-user.ts",
    "get-user.ts",
    "list-users.ts",
    "update-user.ts",
  ])("templates/services/users/src/handlers/%s should exist", async (handler) => {
    expect(await exists(join(u, "src", "handlers", handler))).toBe(true);
  });

  it("templates/services/users/src/__tests__/create-user.test.ts.hbs should exist", async () => {
    expect(await exists(join(u, "src", "__tests__", "create-user.test.ts.hbs"))).toBe(true);
  });

  it("templates/services/users/test/integration/api.test.ts should exist", async () => {
    expect(
      await exists(join(u, "test", "integration", "api.test.ts"))
    ).toBe(true);
  });
});

describe("Phase 4 template structure — dev-gateway/", () => {
  const gw = join(TEMPLATE_ROOT, "dev-gateway");

  it("templates/dev-gateway/package.json.hbs should exist", async () => {
    expect(await exists(join(gw, "package.json.hbs"))).toBe(true);
  });

  it("templates/dev-gateway/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(gw, "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/dev-gateway/src/gateway.ts should exist", async () => {
    expect(await exists(join(gw, "src", "gateway.ts"))).toBe(true);
  });
});

describe("Phase 4 template structure — packages/", () => {
  const p = join(TEMPLATE_ROOT, "packages");

  it.each(["lambda-utils", "shared-types", "utils", "eslint-config", "tsconfig"])(
    "templates/packages/%s/ should exist",
    async (pkg) => {
      expect(await exists(join(p, pkg))).toBe(true);
    }
  );

  it("templates/packages/lambda-utils/package.json.hbs should exist", async () => {
    expect(await exists(join(p, "lambda-utils", "package.json.hbs"))).toBe(true);
  });

  it("templates/packages/lambda-utils/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(p, "lambda-utils", "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/packages/lambda-utils/src/index.ts should exist", async () => {
    expect(await exists(join(p, "lambda-utils", "src", "index.ts"))).toBe(true);
  });

  it("templates/packages/lambda-utils/src/lambda-adapter.ts should exist", async () => {
    expect(
      await exists(join(p, "lambda-utils", "src", "lambda-adapter.ts"))
    ).toBe(true);
  });

  it("templates/packages/lambda-utils/src/middleware/error-handler.ts should exist", async () => {
    expect(
      await exists(join(p, "lambda-utils", "src", "middleware", "error-handler.ts"))
    ).toBe(true);
  });

  it("templates/packages/lambda-utils/src/test-utils/mock-event.ts should exist", async () => {
    expect(
      await exists(join(p, "lambda-utils", "src", "test-utils", "mock-event.ts"))
    ).toBe(true);
  });

  it("templates/packages/shared-types/package.json.hbs should exist", async () => {
    expect(await exists(join(p, "shared-types", "package.json.hbs"))).toBe(true);
  });

  it("templates/packages/shared-types/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(p, "shared-types", "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/packages/shared-types/src/index.ts should exist", async () => {
    expect(await exists(join(p, "shared-types", "src", "index.ts"))).toBe(true);
  });

  it("templates/packages/shared-types/src/api.ts should exist", async () => {
    expect(await exists(join(p, "shared-types", "src", "api.ts"))).toBe(true);
  });

  it("templates/packages/utils/package.json.hbs should exist", async () => {
    expect(await exists(join(p, "utils", "package.json.hbs"))).toBe(true);
  });

  it("templates/packages/utils/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(p, "utils", "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/packages/utils/src/index.ts should exist", async () => {
    expect(await exists(join(p, "utils", "src", "index.ts"))).toBe(true);
  });

  it("templates/packages/eslint-config/package.json.hbs should exist", async () => {
    expect(await exists(join(p, "eslint-config", "package.json.hbs"))).toBe(true);
  });

  it("templates/packages/eslint-config/src/index.js should exist", async () => {
    expect(await exists(join(p, "eslint-config", "src", "index.js"))).toBe(true);
  });

  it("templates/packages/tsconfig/package.json.hbs should exist", async () => {
    expect(await exists(join(p, "tsconfig", "package.json.hbs"))).toBe(true);
  });

  it.each(["base.json", "node.json", "react.json"])(
    "templates/packages/tsconfig/%s should exist",
    async (file) => {
      expect(await exists(join(p, "tsconfig", file))).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// Part 2: .hbs files contain expected {{variable}} placeholders
//
// Reading the raw source of each .hbs file and asserting it still contains at
// least one {{placeholder}}.  This catches the case where a file was
// accidentally rendered (placeholders substituted) and committed as the source.
// ---------------------------------------------------------------------------

describe("Phase 4 .hbs files contain {{variable}} placeholders", () => {
  const checks: [string, string, string][] = [
    // infra
    [
      "infra/package.json.hbs",
      join(TEMPLATE_ROOT, "infra", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "infra/src/config.ts.hbs",
      join(TEMPLATE_ROOT, "infra", "src", "config.ts.hbs"),
      "{{awsRegion}}",
    ],
    [
      "infra/src/index.ts.hbs",
      join(TEMPLATE_ROOT, "infra", "src", "index.ts.hbs"),
      "{{projectName}}",
    ],
    [
      "infra/src/stacks/modules/health-stack.ts.hbs",
      join(TEMPLATE_ROOT, "infra", "src", "stacks", "modules", "health-stack.ts.hbs"),
      "{{projectName}}",
    ],
    [
      "infra/src/stacks/modules/users-stack.ts.hbs",
      join(TEMPLATE_ROOT, "infra", "src", "stacks", "modules", "users-stack.ts.hbs"),
      "{{projectName}}",
    ],
    // services/health
    [
      "services/health/package.json.hbs",
      join(TEMPLATE_ROOT, "services", "health", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "services/health/tsconfig.json.hbs",
      join(TEMPLATE_ROOT, "services", "health", "tsconfig.json.hbs"),
      "{{projectName}}",
    ],
    [
      "services/health/src/dev-server.ts.hbs",
      join(TEMPLATE_ROOT, "services", "health", "src", "dev-server.ts.hbs"),
      "{{projectName}}",
    ],
    // services/users
    [
      "services/users/package.json.hbs",
      join(TEMPLATE_ROOT, "services", "users", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "services/users/tsconfig.json.hbs",
      join(TEMPLATE_ROOT, "services", "users", "tsconfig.json.hbs"),
      "{{projectName}}",
    ],
    [
      "services/users/src/app.ts.hbs",
      join(TEMPLATE_ROOT, "services", "users", "src", "app.ts.hbs"),
      "{{projectName}}",
    ],
    // Note: services/users/src/dev-server.ts.hbs does NOT reference {{projectName}}
    // because the users dev-server imports from "./app.js" rather than from
    // "@{{projectName}}/lambda-utils".  The .hbs suffix is present for consistency
    // with the rest of the service templates.  The tsconfig.json.hbs above carries
    // the {{projectName}} for this service directory.
    //
    // Therefore this entry is intentionally omitted from the placeholder checks.
    // The tsconfig and package.json.hbs entries above already cover the users service.
    //
    // Generated unit test files (renamed .hbs because they import from @{{projectName}}/*)
    [
      "services/health/src/__tests__/health.test.ts.hbs",
      join(TEMPLATE_ROOT, "services", "health", "src", "__tests__", "health.test.ts.hbs"),
      "{{projectName}}",
    ],
    [
      "services/users/src/__tests__/create-user.test.ts.hbs",
      join(TEMPLATE_ROOT, "services", "users", "src", "__tests__", "create-user.test.ts.hbs"),
      "{{projectName}}",
    ],
    // dev-gateway
    [
      "dev-gateway/package.json.hbs",
      join(TEMPLATE_ROOT, "dev-gateway", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "dev-gateway/tsconfig.json.hbs",
      join(TEMPLATE_ROOT, "dev-gateway", "tsconfig.json.hbs"),
      "{{projectName}}",
    ],
    // packages — each package.json.hbs references @{{projectName}}/<pkg-name>
    [
      "packages/lambda-utils/package.json.hbs",
      join(TEMPLATE_ROOT, "packages", "lambda-utils", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "packages/lambda-utils/tsconfig.json.hbs",
      join(TEMPLATE_ROOT, "packages", "lambda-utils", "tsconfig.json.hbs"),
      "{{projectName}}",
    ],
    [
      "packages/shared-types/package.json.hbs",
      join(TEMPLATE_ROOT, "packages", "shared-types", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "packages/shared-types/tsconfig.json.hbs",
      join(TEMPLATE_ROOT, "packages", "shared-types", "tsconfig.json.hbs"),
      "{{projectName}}",
    ],
    [
      "packages/utils/package.json.hbs",
      join(TEMPLATE_ROOT, "packages", "utils", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "packages/utils/tsconfig.json.hbs",
      join(TEMPLATE_ROOT, "packages", "utils", "tsconfig.json.hbs"),
      "{{projectName}}",
    ],
    [
      "packages/eslint-config/package.json.hbs",
      join(TEMPLATE_ROOT, "packages", "eslint-config", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "packages/tsconfig/package.json.hbs",
      join(TEMPLATE_ROOT, "packages", "tsconfig", "package.json.hbs"),
      "{{projectName}}",
    ],
  ];

  it.each(checks)(
    "%s should contain placeholder %s",
    async (_label, filePath, placeholder) => {
      const content = await readFile(filePath, "utf8");
      expect(content).toContain(placeholder);
    }
  );
});

// ---------------------------------------------------------------------------
// Part 3: Static (non-.hbs) template files must NOT contain {{...}} patterns
//
// A {{variable}} in a non-.hbs file would be silently left un-substituted
// in the generated project because copyDir only applies variable substitution
// when the source filename ends with .hbs.
// ---------------------------------------------------------------------------

describe("Phase 4 static template files have no un-substituted {{}} placeholders", () => {
  const staticFiles: [string, string][] = [
    ["infra/cdk.json", join(TEMPLATE_ROOT, "infra", "cdk.json")],
    ["infra/tsconfig.json", join(TEMPLATE_ROOT, "infra", "tsconfig.json")],
    ["infra/tsconfig.build.json", join(TEMPLATE_ROOT, "infra", "tsconfig.build.json")],
    [
      "infra/src/stacks/base-stack.ts",
      join(TEMPLATE_ROOT, "infra", "src", "stacks", "base-stack.ts"),
    ],
    [
      "services/health/vitest.config.ts",
      join(TEMPLATE_ROOT, "services", "health", "vitest.config.ts"),
    ],
    [
      "services/health/src/handlers/health.ts",
      join(TEMPLATE_ROOT, "services", "health", "src", "handlers", "health.ts"),
    ],
    // health.test.ts was renamed to health.test.ts.hbs (contains {{projectName}});
    // it is checked in the .hbs placeholder section above.
    [
      "services/users/vitest.config.ts",
      join(TEMPLATE_ROOT, "services", "users", "vitest.config.ts"),
    ],
    [
      "services/users/src/store.ts",
      join(TEMPLATE_ROOT, "services", "users", "src", "store.ts"),
    ],
    [
      "services/users/src/types/index.ts",
      join(TEMPLATE_ROOT, "services", "users", "src", "types", "index.ts"),
    ],
    [
      "dev-gateway/src/gateway.ts",
      join(TEMPLATE_ROOT, "dev-gateway", "src", "gateway.ts"),
    ],
    [
      "packages/lambda-utils/src/index.ts",
      join(TEMPLATE_ROOT, "packages", "lambda-utils", "src", "index.ts"),
    ],
    [
      "packages/lambda-utils/src/lambda-adapter.ts",
      join(TEMPLATE_ROOT, "packages", "lambda-utils", "src", "lambda-adapter.ts"),
    ],
    [
      "packages/lambda-utils/src/middleware/error-handler.ts",
      join(
        TEMPLATE_ROOT,
        "packages",
        "lambda-utils",
        "src",
        "middleware",
        "error-handler.ts"
      ),
    ],
    [
      "packages/lambda-utils/src/test-utils/mock-event.ts",
      join(
        TEMPLATE_ROOT,
        "packages",
        "lambda-utils",
        "src",
        "test-utils",
        "mock-event.ts"
      ),
    ],
    [
      "packages/shared-types/src/index.ts",
      join(TEMPLATE_ROOT, "packages", "shared-types", "src", "index.ts"),
    ],
    [
      "packages/shared-types/src/api.ts",
      join(TEMPLATE_ROOT, "packages", "shared-types", "src", "api.ts"),
    ],
    [
      "packages/utils/src/index.ts",
      join(TEMPLATE_ROOT, "packages", "utils", "src", "index.ts"),
    ],
    [
      "packages/eslint-config/src/index.js",
      join(TEMPLATE_ROOT, "packages", "eslint-config", "src", "index.js"),
    ],
    [
      "packages/tsconfig/base.json",
      join(TEMPLATE_ROOT, "packages", "tsconfig", "base.json"),
    ],
    [
      "packages/tsconfig/node.json",
      join(TEMPLATE_ROOT, "packages", "tsconfig", "node.json"),
    ],
    [
      "packages/tsconfig/react.json",
      join(TEMPLATE_ROOT, "packages", "tsconfig", "react.json"),
    ],
  ];

  it.each(staticFiles)(
    "%s should not contain {{variable}} placeholders",
    async (_label, filePath) => {
      const content = await readFile(filePath, "utf8");
      expect(content).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
    }
  );
});
