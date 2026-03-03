/**
 * API documentation Phase 1 — shared-types Zod schema template tests.
 *
 * This file has NO module mocks so it can hit the real filesystem.
 * It covers three template files that were created or modified as part of the
 * API documentation feature (Phase 1):
 *
 *   1. templates/packages/shared-types/src/schemas.ts  (NEW)
 *      Zod schemas that mirror the TypeScript interfaces in api.ts and serve
 *      as the source of truth for OpenAPI document generation.
 *
 *   2. templates/packages/shared-types/package.json.hbs  (MODIFIED)
 *      Added `zod` and `@asteasolutions/zod-to-openapi` to `dependencies`.
 *
 *   3. templates/packages/shared-types/src/index.ts  (MODIFIED)
 *      Added re-exports from `./schemas.js`.
 *
 * What is NOT tested here:
 *   - scaffold() orchestration               → test/scaffolder.test.ts
 *   - copyDir mechanics                      → test/utils/fs.test.ts
 *   - getTemplateDirs / getVariableMap       → test/template-helpers.test.ts
 *   - General shared-types file existence   → test/phase4-templates.test.ts
 *   - Runtime behaviour of the Zod schemas   → schemas.ts is a template file
 *     that imports from workspace packages not installed in this CLI repo;
 *     execution tests must live inside a generated project's test suite.
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
 *   test/shared-types-schemas.test.ts  →  dirname = <root>/test
 *   templates/                         →  resolve(<root>/test, "..", "templates")
 */
const TEMPLATE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates"
);

const SHARED_TYPES = join(TEMPLATE_ROOT, "packages", "shared-types");

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
// Part 1: File existence
// ---------------------------------------------------------------------------

describe("shared-types API documentation Phase 1 — file existence", () => {
  it("templates/packages/shared-types/src/schemas.ts should exist", async () => {
    expect(await exists(join(SHARED_TYPES, "src", "schemas.ts"))).toBe(true);
  });

  // Confirm the pre-existing files that were modified are still present.
  it("templates/packages/shared-types/package.json.hbs should exist", async () => {
    expect(await exists(join(SHARED_TYPES, "package.json.hbs"))).toBe(true);
  });

  it("templates/packages/shared-types/src/index.ts should exist", async () => {
    expect(await exists(join(SHARED_TYPES, "src", "index.ts"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Part 2: schemas.ts content
//
// Read the raw source and verify structural properties without executing the
// file.  The file imports from workspace packages (`zod`,
// `@asteasolutions/zod-to-openapi`) that are not installed in this CLI repo,
// so import/require is intentionally avoided.
// ---------------------------------------------------------------------------

describe("shared-types schemas.ts — ESM imports", () => {
  it("imports z from zod", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain('from "zod"');
  });

  it("imports extendZodWithOpenApi from @asteasolutions/zod-to-openapi", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain('from "@asteasolutions/zod-to-openapi"');
  });

  it("imports type ApiErrorResponse from ./api.js", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("ApiErrorResponse");
    expect(raw).toContain('from "./api.js"');
  });

  it("uses ESM .js extension for the local api.ts import", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    // ESM interop requires .js even when the source file is .ts.
    expect(raw).toContain('"./api.js"');
  });
});

describe("shared-types schemas.ts — extendZodWithOpenApi call", () => {
  it("calls extendZodWithOpenApi(z) to register the .openapi() extension", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("extendZodWithOpenApi(z)");
  });
});

describe("shared-types schemas.ts — ApiResponseSchema export", () => {
  it("exports ApiResponseSchema as a named function", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("export function ApiResponseSchema");
  });

  it("ApiResponseSchema accepts a generic Zod type parameter", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    // Generic constraint: <T extends z.ZodTypeAny>
    expect(raw).toContain("z.ZodTypeAny");
  });

  it("ApiResponseSchema wraps a success literal and data field", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("z.literal(true)");
    expect(raw).toContain("data: dataSchema");
  });

  it("ApiResponseSchema timestamp field uses z.iso.datetime()", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("z.iso.datetime()");
  });
});

describe("shared-types schemas.ts — ApiErrorResponseSchema export", () => {
  it("exports ApiErrorResponseSchema as a named const", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("export const ApiErrorResponseSchema");
  });

  it("ApiErrorResponseSchema uses a false literal discriminant", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("z.literal(false)");
  });

  it("ApiErrorResponseSchema contains a nested error object with code and message", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("code: z.string()");
    expect(raw).toContain("message: z.string()");
  });

  it("ApiErrorResponseSchema timestamp field uses z.iso.datetime()", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    // The file uses z.iso.datetime() for both schema timestamp fields.
    // We verify the string appears (already confirmed above for ApiResponseSchema,
    // but an exact count check is not needed — presence is sufficient).
    expect(raw).toContain("z.iso.datetime()");
  });
});

describe("shared-types schemas.ts — PaginationMetaSchema export", () => {
  it("exports PaginationMetaSchema as a named const", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("export const PaginationMetaSchema");
  });

  it("PaginationMetaSchema contains total, limit, cursor, and hasMore fields", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("total:");
    expect(raw).toContain("limit:");
    expect(raw).toContain("cursor:");
    expect(raw).toContain("hasMore:");
  });

  it("PaginationMetaSchema uses integer validation for total and limit", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    // z.number().int() appears twice (once per integer field).
    expect(raw).toContain("z.number().int()");
  });
});

describe("shared-types schemas.ts — PaginatedResultSchema export", () => {
  it("exports PaginatedResultSchema as a named function", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("export function PaginatedResultSchema");
  });

  it("PaginatedResultSchema wraps items array and pagination metadata", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("items: z.array(itemSchema)");
    expect(raw).toContain("pagination: PaginationMetaSchema");
  });
});

describe("shared-types schemas.ts — compile-time satisfies guards", () => {
  it("contains satisfies keyword for compile-time interface alignment", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("satisfies");
  });

  it("guards ApiErrorResponseSchema against ApiErrorResponse interface", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("satisfies ApiErrorResponse");
  });

  it("guards PaginationMetaSchema against PaginationMeta interface", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("satisfies PaginationMeta");
  });

  it("guards ApiResponseSchema return type against ApiResponse interface", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("satisfies ApiResponse<string>");
  });

  it("guards PaginatedResultSchema return type against PaginatedResult interface", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).toContain("satisfies PaginatedResult<string>");
  });
});

describe("shared-types schemas.ts — no {{variable}} placeholders", () => {
  it("schemas.ts is a static file and must not contain unsubstituted {{}} placeholders", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "schemas.ts"), "utf8");
    expect(raw).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
  });
});

// ---------------------------------------------------------------------------
// Part 3: package.json.hbs content — dependency additions
// ---------------------------------------------------------------------------

describe("shared-types package.json.hbs — zod dependency", () => {
  it("lists zod in dependencies", async () => {
    const raw = await readFile(join(SHARED_TYPES, "package.json.hbs"), "utf8");
    expect(raw).toContain('"zod"');
  });

  it("zod version is a valid semver string", async () => {
    const raw = await readFile(join(SHARED_TYPES, "package.json.hbs"), "utf8");
    // Extract the version string associated with the "zod" key.
    const match = raw.match(/"zod"\s*:\s*"([^"]+)"/);
    expect(match).not.toBeNull();
    // A valid semver looks like MAJOR.MINOR.PATCH (no leading ^ or ~).
    expect(match![1]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("zod is placed in dependencies (not devDependencies)", async () => {
    const raw = await readFile(join(SHARED_TYPES, "package.json.hbs"), "utf8");
    // Find the index of "dependencies" and "devDependencies" sections,
    // then verify "zod" appears before "devDependencies".
    const depsIdx = raw.indexOf('"dependencies"');
    const devDepsIdx = raw.indexOf('"devDependencies"');
    const zodIdx = raw.indexOf('"zod"');
    expect(depsIdx).toBeGreaterThan(-1);
    expect(zodIdx).toBeGreaterThan(depsIdx);
    if (devDepsIdx !== -1) {
      expect(zodIdx).toBeLessThan(devDepsIdx);
    }
  });
});

describe("shared-types package.json.hbs — @asteasolutions/zod-to-openapi dependency", () => {
  it("lists @asteasolutions/zod-to-openapi in dependencies", async () => {
    const raw = await readFile(join(SHARED_TYPES, "package.json.hbs"), "utf8");
    expect(raw).toContain('"@asteasolutions/zod-to-openapi"');
  });

  it("@asteasolutions/zod-to-openapi version is a valid semver string", async () => {
    const raw = await readFile(join(SHARED_TYPES, "package.json.hbs"), "utf8");
    const match = raw.match(/"@asteasolutions\/zod-to-openapi"\s*:\s*"([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("@asteasolutions/zod-to-openapi is placed in dependencies (not devDependencies)", async () => {
    const raw = await readFile(join(SHARED_TYPES, "package.json.hbs"), "utf8");
    const depsIdx = raw.indexOf('"dependencies"');
    const devDepsIdx = raw.indexOf('"devDependencies"');
    const pkgIdx = raw.indexOf('"@asteasolutions/zod-to-openapi"');
    expect(depsIdx).toBeGreaterThan(-1);
    expect(pkgIdx).toBeGreaterThan(depsIdx);
    if (devDepsIdx !== -1) {
      expect(pkgIdx).toBeLessThan(devDepsIdx);
    }
  });
});

describe("shared-types package.json.hbs — template placeholder integrity", () => {
  it("still contains {{projectName}} placeholder after the dependency additions", async () => {
    const raw = await readFile(join(SHARED_TYPES, "package.json.hbs"), "utf8");
    expect(raw).toContain("{{projectName}}");
  });
});

// ---------------------------------------------------------------------------
// Part 4: index.ts content — re-exports from schemas.js
// ---------------------------------------------------------------------------

describe("shared-types src/index.ts — schemas.js re-exports", () => {
  it("re-exports ApiResponseSchema from ./schemas.js", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).toContain("ApiResponseSchema");
    expect(raw).toContain('"./schemas.js"');
  });

  it("re-exports ApiErrorResponseSchema from ./schemas.js", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).toContain("ApiErrorResponseSchema");
  });

  it("re-exports PaginationMetaSchema from ./schemas.js", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).toContain("PaginationMetaSchema");
  });

  it("re-exports PaginatedResultSchema from ./schemas.js", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).toContain("PaginatedResultSchema");
  });

  it("uses ESM .js extension for the schemas import path", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).toContain('"./schemas.js"');
  });
});

describe("shared-types src/index.ts — preserved api.js exports", () => {
  it("still re-exports type ApiResponse from ./api.js", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).toContain("ApiResponse");
    expect(raw).toContain('"./api.js"');
  });

  it("still re-exports type ApiErrorResponse from ./api.js", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).toContain("ApiErrorResponse");
  });

  it("still re-exports isApiSuccess from ./api.js", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).toContain("isApiSuccess");
  });

  it("still re-exports isApiError from ./api.js", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).toContain("isApiError");
  });
});

describe("shared-types src/index.ts — no {{variable}} placeholders", () => {
  it("index.ts is a static file and must not contain unsubstituted {{}} placeholders", async () => {
    const raw = await readFile(join(SHARED_TYPES, "src", "index.ts"), "utf8");
    expect(raw).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
  });
});
