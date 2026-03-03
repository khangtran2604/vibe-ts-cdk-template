/**
 * API documentation Phase 2 — service schema template tests.
 *
 * This file has NO module mocks so it can hit the real filesystem.
 * It covers six template files created or modified as part of the
 * API documentation feature (Phase 2):
 *
 *   1. templates/services/users/src/schemas/index.ts  (NEW)
 *      Zod schemas for the users microservice with .openapi() registration.
 *
 *   2. templates/services/users/src/types/index.ts  (NEW)
 *      Re-exports User, CreateUserBody, UpdateUserBody from schemas.
 *
 *   3. templates/services/users/package.json.hbs  (MODIFIED)
 *      Added zod and @asteasolutions/zod-to-openapi in dependencies.
 *
 *   4. templates/generators/module/src/schemas/index.ts.hbs  (NEW)
 *      Handlebars template that generates service schemas for any module.
 *      Uses {{EntityName}}, {{entityNameLower}}, {{moduleName}} placeholders.
 *
 *   5. templates/generators/module/src/types/index.ts.hbs  (NEW)
 *      Handlebars template that re-exports inferred types from schemas.
 *
 *   6. templates/generators/module/package.json.hbs  (MODIFIED)
 *      Added zod and @asteasolutions/zod-to-openapi in dependencies.
 *
 * What is NOT tested here:
 *   - scaffold() orchestration               → test/scaffolder.test.ts
 *   - copyDir mechanics                      → test/utils/fs.test.ts
 *   - getTemplateDirs / getVariableMap       → test/template-helpers.test.ts
 *   - Runtime behaviour of the Zod schemas   → these are template files that
 *     import from workspace packages not installed in this CLI repo;
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
 *   test/service-schemas.test.ts  →  dirname = <root>/test
 *   templates/                    →  resolve(<root>/test, "..", "templates")
 */
const TEMPLATE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates"
);

const USERS_SERVICE = join(TEMPLATE_ROOT, "services", "users");
const MODULE_GENERATOR = join(TEMPLATE_ROOT, "generators", "module");

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
// PART 1: templates/services/users/src/schemas/index.ts
// ===========================================================================

// ---------------------------------------------------------------------------
// 1a. File existence
// ---------------------------------------------------------------------------

describe("users service schemas — file existence", () => {
  it("templates/services/users/src/schemas/index.ts should exist", async () => {
    expect(
      await exists(join(USERS_SERVICE, "src", "schemas", "index.ts"))
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 1b. ESM imports
// ---------------------------------------------------------------------------

describe("users service schemas/index.ts — ESM imports", () => {
  it("imports z from zod", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain('from "zod"');
  });

  it("imports extendZodWithOpenApi from @asteasolutions/zod-to-openapi", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain('from "@asteasolutions/zod-to-openapi"');
  });
});

// ---------------------------------------------------------------------------
// 1c. extendZodWithOpenApi call
// ---------------------------------------------------------------------------

describe("users service schemas/index.ts — extendZodWithOpenApi call", () => {
  it("calls extendZodWithOpenApi(z) to register the .openapi() extension", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("extendZodWithOpenApi(z)");
  });
});

// ---------------------------------------------------------------------------
// 1d. UserSchema
// ---------------------------------------------------------------------------

describe("users service schemas/index.ts — UserSchema export", () => {
  it("exports UserSchema as a named const", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("export const UserSchema");
  });

  it("UserSchema has an id field using z.iso.uuid()", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("id: z.iso.uuid()");
  });

  it("UserSchema has a name field with min(1) validation", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("name: z.string().min(1)");
  });

  it("UserSchema has an email field using z.iso.email()", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("email: z.iso.email()");
  });

  it("UserSchema has a createdAt field using z.iso.datetime()", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("createdAt: z.iso.datetime()");
  });

  it("UserSchema has an updatedAt field using z.iso.datetime()", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("updatedAt: z.iso.datetime()");
  });

  it('UserSchema registers with .openapi("User")', async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain('.openapi("User")');
  });
});

// ---------------------------------------------------------------------------
// 1e. CreateUserBodySchema
// ---------------------------------------------------------------------------

describe("users service schemas/index.ts — CreateUserBodySchema export", () => {
  it("exports CreateUserBodySchema as a named const", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("export const CreateUserBodySchema");
  });

  it("CreateUserBodySchema has a name field with min(1) validation", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    // The schema contains at least one name: z.string().min(1) occurrence
    expect(raw).toContain("name: z.string().min(1)");
  });

  it("CreateUserBodySchema has an email field using z.iso.email()", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("email: z.iso.email()");
  });

  it("CreateUserBodySchema does NOT contain id, createdAt, or updatedAt fields", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    // Extract only the CreateUserBodySchema definition block.
    // It appears between "export const CreateUserBodySchema" and ".openapi("CreateUserBody")"
    const start = raw.indexOf("export const CreateUserBodySchema");
    const end = raw.indexOf('.openapi("CreateUserBody")');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const block = raw.slice(start, end);
    expect(block).not.toContain("id:");
    expect(block).not.toContain("createdAt:");
    expect(block).not.toContain("updatedAt:");
  });

  it('CreateUserBodySchema registers with .openapi("CreateUserBody")', async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain('.openapi("CreateUserBody")');
  });
});

// ---------------------------------------------------------------------------
// 1f. UpdateUserBodySchema
// ---------------------------------------------------------------------------

describe("users service schemas/index.ts — UpdateUserBodySchema export", () => {
  it("exports UpdateUserBodySchema as a named const", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("export const UpdateUserBodySchema");
  });

  it("UpdateUserBodySchema has an optional name field", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("name: z.string().min(1).optional()");
  });

  it("UpdateUserBodySchema has an optional email field", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("email: z.iso.email().optional()");
  });

  it('UpdateUserBodySchema registers with .openapi("UpdateUserBody")', async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain('.openapi("UpdateUserBody")');
  });
});

// ---------------------------------------------------------------------------
// 1g. Inferred TypeScript types
// ---------------------------------------------------------------------------

describe("users service schemas/index.ts — inferred TypeScript types", () => {
  it("exports type User via z.infer<typeof UserSchema>", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("export type User = z.infer<typeof UserSchema>");
  });

  it("exports type CreateUserBody via z.infer<typeof CreateUserBodySchema>", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain(
      "export type CreateUserBody = z.infer<typeof CreateUserBodySchema>"
    );
  });

  it("exports type UpdateUserBody via z.infer<typeof UpdateUserBodySchema>", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).toContain(
      "export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>"
    );
  });
});

// ---------------------------------------------------------------------------
// 1h. No unsubstituted template placeholders
// ---------------------------------------------------------------------------

describe("users service schemas/index.ts — no {{variable}} placeholders", () => {
  it("is a static file and must not contain unsubstituted {{}} placeholders", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "schemas", "index.ts"),
      "utf8"
    );
    expect(raw).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
  });
});

// ===========================================================================
// PART 2: templates/services/users/src/types/index.ts
// ===========================================================================

describe("users service types — file existence", () => {
  it("templates/services/users/src/types/index.ts should exist", async () => {
    expect(
      await exists(join(USERS_SERVICE, "src", "types", "index.ts"))
    ).toBe(true);
  });
});

describe("users service types/index.ts — re-exports from schemas", () => {
  it("re-exports type User from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "types", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("User");
    expect(raw).toContain('"../schemas/index.js"');
  });

  it("re-exports type CreateUserBody from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "types", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("CreateUserBody");
  });

  it("re-exports type UpdateUserBody from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "types", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("UpdateUserBody");
  });

  it("uses ESM .js extension for the schemas import path", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "types", "index.ts"),
      "utf8"
    );
    expect(raw).toContain('"../schemas/index.js"');
  });

  it("uses type-only re-exports (export type)", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "types", "index.ts"),
      "utf8"
    );
    expect(raw).toContain("export type");
  });
});

describe("users service types/index.ts — no {{variable}} placeholders", () => {
  it("is a static file and must not contain unsubstituted {{}} placeholders", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "src", "types", "index.ts"),
      "utf8"
    );
    expect(raw).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
  });
});

// ===========================================================================
// PART 3: templates/services/users/package.json.hbs
// ===========================================================================

describe("users service package.json.hbs — file existence", () => {
  it("templates/services/users/package.json.hbs should exist", async () => {
    expect(await exists(join(USERS_SERVICE, "package.json.hbs"))).toBe(true);
  });
});

describe("users service package.json.hbs — zod dependency", () => {
  it("lists zod in dependencies", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"zod"');
  });

  it("zod version is a valid semver string", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "package.json.hbs"),
      "utf8"
    );
    const match = raw.match(/"zod"\s*:\s*"([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("zod is placed in dependencies (not devDependencies)", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "package.json.hbs"),
      "utf8"
    );
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

describe("users service package.json.hbs — @asteasolutions/zod-to-openapi dependency", () => {
  it("lists @asteasolutions/zod-to-openapi in dependencies", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"@asteasolutions/zod-to-openapi"');
  });

  it("@asteasolutions/zod-to-openapi version is a valid semver string", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "package.json.hbs"),
      "utf8"
    );
    const match = raw.match(/"@asteasolutions\/zod-to-openapi"\s*:\s*"([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("@asteasolutions/zod-to-openapi is placed in dependencies (not devDependencies)", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "package.json.hbs"),
      "utf8"
    );
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

describe("users service package.json.hbs — template placeholder integrity", () => {
  it("still contains {{projectName}} placeholder after dependency additions", async () => {
    const raw = await readFile(
      join(USERS_SERVICE, "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });
});

// ===========================================================================
// PART 4: templates/generators/module/src/schemas/index.ts.hbs
// ===========================================================================

describe("module generator schemas — file existence", () => {
  it("templates/generators/module/src/schemas/index.ts.hbs should exist", async () => {
    expect(
      await exists(
        join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs")
      )
    ).toBe(true);
  });
});

describe("module generator schemas/index.ts.hbs — ESM imports", () => {
  it("imports z from zod", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('from "zod"');
  });

  it("imports extendZodWithOpenApi from @asteasolutions/zod-to-openapi", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('from "@asteasolutions/zod-to-openapi"');
  });
});

describe("module generator schemas/index.ts.hbs — extendZodWithOpenApi call", () => {
  it("calls extendZodWithOpenApi(z) to register the .openapi() extension", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("extendZodWithOpenApi(z)");
  });
});

describe("module generator schemas/index.ts.hbs — EntitySchema export", () => {
  it("exports {{EntityName}}Schema using the EntityName placeholder", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("export const {{EntityName}}Schema");
  });

  it("EntitySchema has an id field using z.iso.uuid()", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("id: z.iso.uuid()");
  });

  it("EntitySchema has a name field with min(1) validation", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("name: z.string().min(1)");
  });

  it("EntitySchema does NOT have an email field (unlike users service)", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).not.toContain("email:");
  });

  it("EntitySchema has a createdAt field using z.iso.datetime()", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("createdAt: z.iso.datetime()");
  });

  it("EntitySchema has an updatedAt field using z.iso.datetime()", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("updatedAt: z.iso.datetime()");
  });

  it('EntitySchema registers with .openapi("{{EntityName}}")', async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('.openapi("{{EntityName}}")');
  });
});

describe("module generator schemas/index.ts.hbs — CreateEntityBodySchema export", () => {
  it("exports Create{{EntityName}}BodySchema using the EntityName placeholder", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("export const Create{{EntityName}}BodySchema");
  });

  it("CreateEntityBodySchema has a name field with min(1) validation", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("name: z.string().min(1)");
  });

  it("CreateEntityBodySchema does NOT contain id, createdAt, or updatedAt fields", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    // Extract just the Create...BodySchema block
    const start = raw.indexOf("export const Create{{EntityName}}BodySchema");
    const end = raw.indexOf('.openapi("Create{{EntityName}}Body")');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const block = raw.slice(start, end);
    expect(block).not.toContain("id:");
    expect(block).not.toContain("createdAt:");
    expect(block).not.toContain("updatedAt:");
  });

  it('CreateEntityBodySchema registers with .openapi("Create{{EntityName}}Body")', async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('.openapi("Create{{EntityName}}Body")');
  });
});

describe("module generator schemas/index.ts.hbs — UpdateEntityBodySchema export", () => {
  it("exports Update{{EntityName}}BodySchema using the EntityName placeholder", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("export const Update{{EntityName}}BodySchema");
  });

  it("UpdateEntityBodySchema has an optional name field", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("name: z.string().min(1).optional()");
  });

  it("UpdateEntityBodySchema does NOT have an optional email field (unlike users service)", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).not.toContain("email: z.iso.email().optional()");
  });

  it('UpdateEntityBodySchema registers with .openapi("Update{{EntityName}}Body")', async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('.openapi("Update{{EntityName}}Body")');
  });
});

describe("module generator schemas/index.ts.hbs — inferred TypeScript types", () => {
  it("exports type {{EntityName}} via z.infer<typeof {{EntityName}}Schema>", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain(
      "export type {{EntityName}} = z.infer<typeof {{EntityName}}Schema>"
    );
  });

  it("exports type Create{{EntityName}}Body via z.infer<typeof Create{{EntityName}}BodySchema>", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain(
      "export type Create{{EntityName}}Body = z.infer<typeof Create{{EntityName}}BodySchema>"
    );
  });

  it("exports type Update{{EntityName}}Body via z.infer<typeof Update{{EntityName}}BodySchema>", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain(
      "export type Update{{EntityName}}Body = z.infer<typeof Update{{EntityName}}BodySchema>"
    );
  });
});

describe("module generator schemas/index.ts.hbs — required template placeholders", () => {
  it("contains {{EntityName}} placeholder", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{EntityName}}");
  });

  it("contains {{entityNameLower}} placeholder", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{entityNameLower}}");
  });

  it("contains {{moduleName}} placeholder", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "schemas", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{moduleName}}");
  });
});

// ===========================================================================
// PART 5: templates/generators/module/src/types/index.ts.hbs
// ===========================================================================

describe("module generator types — file existence", () => {
  it("templates/generators/module/src/types/index.ts.hbs should exist", async () => {
    expect(
      await exists(join(MODULE_GENERATOR, "src", "types", "index.ts.hbs"))
    ).toBe(true);
  });
});

describe("module generator types/index.ts.hbs — re-exports from schemas", () => {
  it("re-exports type {{EntityName}} from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "types", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{EntityName}}");
    expect(raw).toContain('"../schemas/index.js"');
  });

  it("re-exports type Create{{EntityName}}Body from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "types", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("Create{{EntityName}}Body");
  });

  it("re-exports type Update{{EntityName}}Body from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "types", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("Update{{EntityName}}Body");
  });

  it("uses ESM .js extension for the schemas import path", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "types", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('"../schemas/index.js"');
  });

  it("uses type-only re-exports (export type)", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "types", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("export type");
  });
});

describe("module generator types/index.ts.hbs — required template placeholders", () => {
  it("contains {{EntityName}} placeholder", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "src", "types", "index.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{EntityName}}");
  });
});

// ===========================================================================
// PART 6: templates/generators/module/package.json.hbs
// ===========================================================================

describe("module generator package.json.hbs — file existence", () => {
  it("templates/generators/module/package.json.hbs should exist", async () => {
    expect(await exists(join(MODULE_GENERATOR, "package.json.hbs"))).toBe(true);
  });
});

describe("module generator package.json.hbs — zod dependency", () => {
  it("lists zod in dependencies", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"zod"');
  });

  it("zod version is a valid semver string", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "package.json.hbs"),
      "utf8"
    );
    const match = raw.match(/"zod"\s*:\s*"([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("zod is placed in dependencies (not devDependencies)", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "package.json.hbs"),
      "utf8"
    );
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

describe("module generator package.json.hbs — @asteasolutions/zod-to-openapi dependency", () => {
  it("lists @asteasolutions/zod-to-openapi in dependencies", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"@asteasolutions/zod-to-openapi"');
  });

  it("@asteasolutions/zod-to-openapi version is a valid semver string", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "package.json.hbs"),
      "utf8"
    );
    const match = raw.match(/"@asteasolutions\/zod-to-openapi"\s*:\s*"([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("@asteasolutions/zod-to-openapi is placed in dependencies (not devDependencies)", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "package.json.hbs"),
      "utf8"
    );
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

describe("module generator package.json.hbs — template placeholder integrity", () => {
  it("still contains {{projectName}} placeholder after dependency additions", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });

  it("still contains {{moduleName}} placeholder after dependency additions", async () => {
    const raw = await readFile(
      join(MODULE_GENERATOR, "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{moduleName}}");
  });
});
