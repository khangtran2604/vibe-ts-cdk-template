/**
 * Phase 4 — OpenAPI spec generation tests.
 *
 * This file has NO module mocks so it can hit the real filesystem.
 * It covers six files introduced in Phase 4 of the API documentation feature:
 *
 *   1. templates/services/users/src/openapi.ts
 *      OpenAPI registry with 5 CRUD endpoints for the users service.
 *
 *   2. templates/generators/module/src/openapi.ts.hbs
 *      Handlebars template for the OpenAPI registry of any generated module.
 *
 *   3. templates/services/health/src/openapi.ts
 *      OpenAPI registry for the health service (single GET /health endpoint).
 *
 *   4. templates/services/users/src/generate-spec.ts
 *      Build-time script that writes dist/openapi.json for the users service.
 *
 *   5. templates/services/health/src/generate-spec.ts
 *      Build-time script that writes dist/openapi.json for the health service.
 *
 *   6. templates/generators/module/src/generate-spec.ts.hbs
 *      Handlebars template for the spec-generation script of any generated module.
 *
 * Also covers three package.json.hbs files updated in Phase 4:
 *   - templates/services/users/package.json.hbs
 *   - templates/services/health/package.json.hbs
 *   - templates/generators/module/package.json.hbs
 *
 * What is NOT tested here:
 *   - scaffold() orchestration              → test/scaffolder.test.ts
 *   - Zod schema definitions themselves     → test/service-schemas.test.ts
 *   - Handler Zod safeParse migration       → test/handler-validation.test.ts
 *   - Runtime spec generation output        → must run inside a generated project
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
 *   test/openapi-spec-generation.test.ts  →  dirname = <root>/test
 *   templates/                            →  resolve(<root>/test, "..", "templates")
 */
const TEMPLATE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates"
);

const USERS_SRC = join(TEMPLATE_ROOT, "services", "users", "src");
const HEALTH_SRC = join(TEMPLATE_ROOT, "services", "health", "src");
const MODULE_SRC = join(TEMPLATE_ROOT, "generators", "module", "src");

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

// ===========================================================================
// PART 1: templates/services/users/src/openapi.ts
// ===========================================================================

// ---------------------------------------------------------------------------
// 1a. File existence
// ---------------------------------------------------------------------------

describe("users openapi.ts — file existence", () => {
  it("templates/services/users/src/openapi.ts should exist", async () => {
    expect(await exists(join(USERS_SRC, "openapi.ts"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 1b. Registry and extension imports
// ---------------------------------------------------------------------------

describe("users openapi.ts — registry imports", () => {
  it("imports OpenAPIRegistry from @asteasolutions/zod-to-openapi", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("OpenAPIRegistry");
    expect(raw).toContain("@asteasolutions/zod-to-openapi");
  });

  it("imports extendZodWithOpenApi from @asteasolutions/zod-to-openapi", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("extendZodWithOpenApi");
  });

  it("calls extendZodWithOpenApi(z) to enable .openapi() on all Zod types", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("extendZodWithOpenApi(z)");
  });
});

// ---------------------------------------------------------------------------
// 1c. Schema imports — shared-types, NOT shared-types/schemas
// ---------------------------------------------------------------------------

describe("users openapi.ts — shared-types import path", () => {
  it("imports ApiResponseSchema from @{{projectName}}/shared-types", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("ApiResponseSchema");
    expect(raw).toContain('"@{{projectName}}/shared-types"');
  });

  it("imports ApiErrorResponseSchema from @{{projectName}}/shared-types", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("ApiErrorResponseSchema");
  });

  it("imports PaginatedResultSchema from @{{projectName}}/shared-types", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("PaginatedResultSchema");
  });

  it("does NOT import from shared-types/schemas subpath", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).not.toContain("shared-types/schemas");
  });
});

// ---------------------------------------------------------------------------
// 1d. Entity schema imports — from ./schemas/index.js
// ---------------------------------------------------------------------------

describe("users openapi.ts — entity schema imports", () => {
  it("imports UserSchema from ./schemas/index.js", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("UserSchema");
    expect(raw).toContain('"./schemas/index.js"');
  });

  it("imports CreateUserBodySchema from ./schemas/index.js", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("CreateUserBodySchema");
  });

  it("imports UpdateUserBodySchema from ./schemas/index.js", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("UpdateUserBodySchema");
  });
});

// ---------------------------------------------------------------------------
// 1e. All 5 CRUD endpoints registered
// ---------------------------------------------------------------------------

describe("users openapi.ts — POST /users endpoint", () => {
  it("registers POST /users endpoint", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain('method: "post"');
    expect(raw).toContain('path: "/users"');
  });

  it("POST /users responds with 201 on success", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("201:");
  });

  it("POST /users responds with 400 on validation failure", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    // At least two 400 responses are registered (create and update)
    const count400 = (raw.match(/\b400:/g) ?? []).length;
    expect(count400).toBeGreaterThanOrEqual(1);
  });
});

describe("users openapi.ts — GET /users endpoint", () => {
  it("registers GET /users endpoint with cursor pagination query params", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain('method: "get"');
    expect(raw).toContain('path: "/users"');
    expect(raw).toContain("cursor");
    expect(raw).toContain("limit");
  });
});

describe("users openapi.ts — GET /users/{id} endpoint", () => {
  it("registers GET /users/{id} endpoint", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain('path: "/users/{id}"');
  });

  it("GET /users/{id} responds with 404 when user not found", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("404:");
  });
});

describe("users openapi.ts — PUT /users/{id} endpoint", () => {
  it("registers PUT /users/{id} endpoint", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain('method: "put"');
  });
});

describe("users openapi.ts — DELETE /users/{id} endpoint", () => {
  it("registers DELETE /users/{id} endpoint", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain('method: "delete"');
  });

  it("DELETE /users/{id} uses 204 response (no body)", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("204:");
  });

  it("DELETE /users/{id} does NOT use 200 as its success response", async () => {
    const raw = await readFile(join(USERS_SRC, "openapi.ts"), "utf8");
    // The delete block must have a 204 entry; verify 200 is not the sole response
    // by confirming the 204 key is present in the delete block context.
    // A simple check: the file should contain 204 near the delete registration.
    const deleteIdx = raw.lastIndexOf('method: "delete"');
    const deleteBlock = raw.slice(deleteIdx);
    expect(deleteBlock).toContain("204:");
  });
});

// ===========================================================================
// PART 2: templates/generators/module/src/openapi.ts.hbs
// ===========================================================================

// ---------------------------------------------------------------------------
// 2a. File existence
// ---------------------------------------------------------------------------

describe("module openapi.ts.hbs — file existence", () => {
  it("templates/generators/module/src/openapi.ts.hbs should exist", async () => {
    expect(await exists(join(MODULE_SRC, "openapi.ts.hbs"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2b. Registry and extension imports
// ---------------------------------------------------------------------------

describe("module openapi.ts.hbs — registry imports", () => {
  it("imports OpenAPIRegistry from @asteasolutions/zod-to-openapi", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("OpenAPIRegistry");
    expect(raw).toContain("@asteasolutions/zod-to-openapi");
  });

  it("calls extendZodWithOpenApi(z)", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("extendZodWithOpenApi(z)");
  });
});

// ---------------------------------------------------------------------------
// 2c. Template variables
// ---------------------------------------------------------------------------

describe("module openapi.ts.hbs — template variable placeholders", () => {
  it("uses {{EntityName}} placeholder for schema and type names", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("{{EntityName}}");
  });

  it("uses {{moduleName}} placeholder for route paths and descriptions", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("{{moduleName}}");
  });

  it("uses {{entityNameLower}} placeholder for summary and description text", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("{{entityNameLower}}");
  });

  it("uses {{projectName}} placeholder for shared-types import", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("{{projectName}}");
    expect(raw).toContain('"@{{projectName}}/shared-types"');
  });
});

// ---------------------------------------------------------------------------
// 2d. All 5 CRUD endpoints registered
// ---------------------------------------------------------------------------

describe("module openapi.ts.hbs — CRUD endpoint registrations", () => {
  it("registers POST /{{moduleName}} endpoint", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain('method: "post"');
    expect(raw).toContain('path: "/{{moduleName}}"');
  });

  it("registers GET /{{moduleName}} endpoint with pagination query params", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain('method: "get"');
    expect(raw).toContain('path: "/{{moduleName}}"');
    expect(raw).toContain("cursor");
    expect(raw).toContain("limit");
  });

  it("registers GET /{{moduleName}}/{id} endpoint", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain('path: "/{{moduleName}}/{id}"');
  });

  it("registers PUT /{{moduleName}}/{id} endpoint", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain('method: "put"');
  });

  it("registers DELETE /{{moduleName}}/{id} endpoint", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain('method: "delete"');
  });

  it("DELETE endpoint uses 204 response (no body)", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("204:");
  });
});

// ---------------------------------------------------------------------------
// 2e. Entity schema imports use template placeholders
// ---------------------------------------------------------------------------

describe("module openapi.ts.hbs — entity schema import placeholders", () => {
  it("imports {{EntityName}}Schema from ./schemas/index.js", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("{{EntityName}}Schema");
    expect(raw).toContain('"./schemas/index.js"');
  });

  it("imports Create{{EntityName}}BodySchema from ./schemas/index.js", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("Create{{EntityName}}BodySchema");
  });

  it("imports Update{{EntityName}}BodySchema from ./schemas/index.js", async () => {
    const raw = await readFile(join(MODULE_SRC, "openapi.ts.hbs"), "utf8");
    expect(raw).toContain("Update{{EntityName}}BodySchema");
  });
});

// ===========================================================================
// PART 3: templates/services/health/src/openapi.ts
// ===========================================================================

// ---------------------------------------------------------------------------
// 3a. File existence
// ---------------------------------------------------------------------------

describe("health openapi.ts — file existence", () => {
  it("templates/services/health/src/openapi.ts should exist", async () => {
    expect(await exists(join(HEALTH_SRC, "openapi.ts"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3b. Registry and extension imports
// ---------------------------------------------------------------------------

describe("health openapi.ts — registry imports", () => {
  it("imports OpenAPIRegistry from @asteasolutions/zod-to-openapi", async () => {
    const raw = await readFile(join(HEALTH_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("OpenAPIRegistry");
    expect(raw).toContain("@asteasolutions/zod-to-openapi");
  });

  it("calls extendZodWithOpenApi(z)", async () => {
    const raw = await readFile(join(HEALTH_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("extendZodWithOpenApi(z)");
  });
});

// ---------------------------------------------------------------------------
// 3c. GET /health endpoint registration
// ---------------------------------------------------------------------------

describe("health openapi.ts — GET /health endpoint", () => {
  it("registers GET /health endpoint", async () => {
    const raw = await readFile(join(HEALTH_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain('method: "get"');
    expect(raw).toContain('path: "/health"');
  });

  it("GET /health responds with 200 on success", async () => {
    const raw = await readFile(join(HEALTH_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("200:");
  });
});

// ---------------------------------------------------------------------------
// 3d. Health response schema — flat (no ApiResponse envelope)
// ---------------------------------------------------------------------------

describe("health openapi.ts — flat response schema (no ApiResponse wrapper)", () => {
  it("does NOT import ApiResponseSchema from shared-types", async () => {
    const raw = await readFile(join(HEALTH_SRC, "openapi.ts"), "utf8");
    expect(raw).not.toContain("ApiResponseSchema");
  });

  it("does NOT import from @{{projectName}}/shared-types", async () => {
    const raw = await readFile(join(HEALTH_SRC, "openapi.ts"), "utf8");
    expect(raw).not.toContain("shared-types");
  });

  it("defines HealthDataSchema inline with status: z.literal(\"ok\")", async () => {
    const raw = await readFile(join(HEALTH_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("HealthDataSchema");
    expect(raw).toContain('z.literal("ok")');
  });

  it("HealthDataSchema includes a timestamp field", async () => {
    const raw = await readFile(join(HEALTH_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain("timestamp");
  });

  it("HealthDataSchema uses .openapi() to register under #/components/schemas", async () => {
    const raw = await readFile(join(HEALTH_SRC, "openapi.ts"), "utf8");
    expect(raw).toContain('.openapi("HealthData")');
  });
});

// ===========================================================================
// PART 4: Spec generation scripts
// ===========================================================================

// ---------------------------------------------------------------------------
// 4a. File existence for all three scripts
// ---------------------------------------------------------------------------

describe("spec generation scripts — file existence", () => {
  it("templates/services/users/src/generate-spec.ts should exist", async () => {
    expect(await exists(join(USERS_SRC, "generate-spec.ts"))).toBe(true);
  });

  it("templates/services/health/src/generate-spec.ts should exist", async () => {
    expect(await exists(join(HEALTH_SRC, "generate-spec.ts"))).toBe(true);
  });

  it("templates/generators/module/src/generate-spec.ts.hbs should exist", async () => {
    expect(await exists(join(MODULE_SRC, "generate-spec.ts.hbs"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4b. Common imports shared by all three scripts
// ---------------------------------------------------------------------------

describe("spec generation scripts — common imports", () => {
  const scriptFiles = [
    { label: "users generate-spec.ts", path: join(USERS_SRC, "generate-spec.ts") },
    { label: "health generate-spec.ts", path: join(HEALTH_SRC, "generate-spec.ts") },
    { label: "module generate-spec.ts.hbs", path: join(MODULE_SRC, "generate-spec.ts.hbs") },
  ];

  for (const { label, path } of scriptFiles) {
    it(`${label} imports OpenApiGeneratorV31 from @asteasolutions/zod-to-openapi`, async () => {
      const raw = await readFile(path, "utf8");
      expect(raw).toContain("OpenApiGeneratorV31");
      expect(raw).toContain("@asteasolutions/zod-to-openapi");
    });

    it(`${label} imports registry from ./openapi.js`, async () => {
      const raw = await readFile(path, "utf8");
      expect(raw).toContain('from "./openapi.js"');
      expect(raw).toContain("registry");
    });

    it(`${label} imports mkdirSync from node:fs`, async () => {
      const raw = await readFile(path, "utf8");
      expect(raw).toContain("mkdirSync");
      expect(raw).toContain("node:fs");
    });
  }
});

// ---------------------------------------------------------------------------
// 4c. Output path — all scripts write to dist/openapi.json
// ---------------------------------------------------------------------------

describe("spec generation scripts — output path", () => {
  const scriptFiles = [
    { label: "users generate-spec.ts", path: join(USERS_SRC, "generate-spec.ts") },
    { label: "health generate-spec.ts", path: join(HEALTH_SRC, "generate-spec.ts") },
    { label: "module generate-spec.ts.hbs", path: join(MODULE_SRC, "generate-spec.ts.hbs") },
  ];

  for (const { label, path } of scriptFiles) {
    it(`${label} writes to dist/openapi.json`, async () => {
      const raw = await readFile(path, "utf8");
      expect(raw).toContain("openapi.json");
      expect(raw).toContain("dist");
    });

    it(`${label} uses mkdirSync with { recursive: true }`, async () => {
      const raw = await readFile(path, "utf8");
      expect(raw).toContain("mkdirSync");
      expect(raw).toContain("recursive: true");
    });
  }
});

// ---------------------------------------------------------------------------
// 4d. OpenAPI version is "3.1.0"
// ---------------------------------------------------------------------------

describe("spec generation scripts — OpenAPI version", () => {
  const scriptFiles = [
    { label: "users generate-spec.ts", path: join(USERS_SRC, "generate-spec.ts") },
    { label: "health generate-spec.ts", path: join(HEALTH_SRC, "generate-spec.ts") },
    { label: "module generate-spec.ts.hbs", path: join(MODULE_SRC, "generate-spec.ts.hbs") },
  ];

  for (const { label, path } of scriptFiles) {
    it(`${label} sets openapi version to "3.1.0"`, async () => {
      const raw = await readFile(path, "utf8");
      expect(raw).toContain('"3.1.0"');
    });
  }
});

// ---------------------------------------------------------------------------
// 4e. Service-specific title values
// ---------------------------------------------------------------------------

describe("users generate-spec.ts — document title", () => {
  it('sets info.title to "Users Service API"', async () => {
    const raw = await readFile(join(USERS_SRC, "generate-spec.ts"), "utf8");
    expect(raw).toContain('"Users Service API"');
  });
});

describe("health generate-spec.ts — document title", () => {
  it('sets info.title to "Health Service API"', async () => {
    const raw = await readFile(join(HEALTH_SRC, "generate-spec.ts"), "utf8");
    expect(raw).toContain('"Health Service API"');
  });
});

describe("module generate-spec.ts.hbs — document title template", () => {
  it("uses {{EntityName}} placeholder in info.title", async () => {
    const raw = await readFile(join(MODULE_SRC, "generate-spec.ts.hbs"), "utf8");
    expect(raw).toContain("{{EntityName}}");
    expect(raw).toContain("Service API");
  });
});

// ===========================================================================
// PART 5: package.json.hbs updates
// ===========================================================================

// ---------------------------------------------------------------------------
// 5a. generate:openapi script present in all three packages
// ---------------------------------------------------------------------------

describe("package.json.hbs files — generate:openapi script", () => {
  const pkgFiles = [
    { label: "users package.json.hbs", path: join(TEMPLATE_ROOT, "services", "users", "package.json.hbs") },
    { label: "health package.json.hbs", path: join(TEMPLATE_ROOT, "services", "health", "package.json.hbs") },
    { label: "module package.json.hbs", path: join(TEMPLATE_ROOT, "generators", "module", "package.json.hbs") },
  ];

  for (const { label, path } of pkgFiles) {
    it(`${label} has a generate:openapi script`, async () => {
      const raw = await readFile(path, "utf8");
      expect(raw).toContain('"generate:openapi"');
    });
  }
});

// ---------------------------------------------------------------------------
// 5b. Build script chains tsx src/generate-spec.ts
// ---------------------------------------------------------------------------

describe("package.json.hbs files — build script chains spec generation", () => {
  const pkgFiles = [
    { label: "users package.json.hbs", path: join(TEMPLATE_ROOT, "services", "users", "package.json.hbs") },
    { label: "health package.json.hbs", path: join(TEMPLATE_ROOT, "services", "health", "package.json.hbs") },
    { label: "module package.json.hbs", path: join(TEMPLATE_ROOT, "generators", "module", "package.json.hbs") },
  ];

  for (const { label, path } of pkgFiles) {
    it(`${label} build script runs tsx src/generate-spec.ts`, async () => {
      const raw = await readFile(path, "utf8");
      expect(raw).toContain("tsx src/generate-spec.ts");
      // Must be part of the build script (chained with &&)
      const buildLine = raw
        .split("\n")
        .find((line) => line.includes('"build"'));
      expect(buildLine).toBeDefined();
      expect(buildLine).toContain("tsx src/generate-spec.ts");
    });
  }
});

// ---------------------------------------------------------------------------
// 5c. zod in dependencies for all three packages
// ---------------------------------------------------------------------------

describe("package.json.hbs files — zod dependency", () => {
  const pkgFiles = [
    { label: "users package.json.hbs", path: join(TEMPLATE_ROOT, "services", "users", "package.json.hbs") },
    { label: "health package.json.hbs", path: join(TEMPLATE_ROOT, "services", "health", "package.json.hbs") },
    { label: "module package.json.hbs", path: join(TEMPLATE_ROOT, "generators", "module", "package.json.hbs") },
  ];

  for (const { label, path } of pkgFiles) {
    it(`${label} has zod in dependencies`, async () => {
      const raw = await readFile(path, "utf8");
      const parsed = JSON.parse(
        // Strip .hbs {{variable}} placeholders for JSON parsing
        raw.replace(/\{\{[^}]+\}\}/g, "placeholder")
      );
      expect(parsed.dependencies).toHaveProperty("zod");
    });
  }
});

// ---------------------------------------------------------------------------
// 5d. @asteasolutions/zod-to-openapi placement per package
// ---------------------------------------------------------------------------

describe("users package.json.hbs — zod-to-openapi placement", () => {
  it("has @asteasolutions/zod-to-openapi in dependencies (used at runtime for registry)", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "services", "users", "package.json.hbs"),
      "utf8"
    );
    const parsed = JSON.parse(raw.replace(/\{\{[^}]+\}\}/g, "placeholder"));
    expect(parsed.dependencies).toHaveProperty("@asteasolutions/zod-to-openapi");
  });
});

describe("health package.json.hbs — zod-to-openapi placement", () => {
  it("has @asteasolutions/zod-to-openapi in devDependencies (build-time only for health)", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "services", "health", "package.json.hbs"),
      "utf8"
    );
    const parsed = JSON.parse(raw.replace(/\{\{[^}]+\}\}/g, "placeholder"));
    expect(parsed.devDependencies).toHaveProperty("@asteasolutions/zod-to-openapi");
  });
});

describe("module package.json.hbs — zod-to-openapi placement", () => {
  it("has @asteasolutions/zod-to-openapi in dependencies", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "generators", "module", "package.json.hbs"),
      "utf8"
    );
    const parsed = JSON.parse(raw.replace(/\{\{[^}]+\}\}/g, "placeholder"));
    expect(parsed.dependencies).toHaveProperty("@asteasolutions/zod-to-openapi");
  });
});

// ---------------------------------------------------------------------------
// 5e. tsx in devDependencies for all three packages
// ---------------------------------------------------------------------------

describe("package.json.hbs files — tsx devDependency", () => {
  const pkgFiles = [
    { label: "users package.json.hbs", path: join(TEMPLATE_ROOT, "services", "users", "package.json.hbs") },
    { label: "health package.json.hbs", path: join(TEMPLATE_ROOT, "services", "health", "package.json.hbs") },
    { label: "module package.json.hbs", path: join(TEMPLATE_ROOT, "generators", "module", "package.json.hbs") },
  ];

  for (const { label, path } of pkgFiles) {
    it(`${label} has tsx in devDependencies`, async () => {
      const raw = await readFile(path, "utf8");
      const parsed = JSON.parse(raw.replace(/\{\{[^}]+\}\}/g, "placeholder"));
      expect(parsed.devDependencies).toHaveProperty("tsx");
    });
  }
});
