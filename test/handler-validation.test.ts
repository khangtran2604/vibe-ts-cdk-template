/**
 * Phase 3 — Handler validation migration tests.
 *
 * This file has NO module mocks so it can hit the real filesystem.
 * It covers four handler files that were migrated from manual typeof-based
 * validation to Zod safeParse() in Phase 3 of the API documentation feature:
 *
 *   1. templates/services/users/src/handlers/create-user.ts
 *      POST /users — creates a user with Zod-validated body.
 *
 *   2. templates/services/users/src/handlers/update-user.ts
 *      PUT /users/:id — partially updates a user with Zod-validated body.
 *
 *   3. templates/generators/module/src/handlers/create.ts.hbs
 *      Handlebars template for the create handler of any generated module.
 *
 *   4. templates/generators/module/src/handlers/update.ts.hbs
 *      Handlebars template for the update handler of any generated module.
 *
 * All four files were changed to:
 *   - Import the Zod schema from "../schemas/index.js" (not "../types/index.js")
 *   - Call Schema.safeParse(parsedBody) instead of manual typeof checks
 *   - Return VALIDATION_ERROR with a fieldErrors map built from Zod issues
 *   - Use "_root" as the fallback key when issue.path is empty
 *   - Apply .trim() / .trim().toLowerCase() normalisations in the success path
 *
 * What is NOT tested here:
 *   - scaffold() orchestration              → test/scaffolder.test.ts
 *   - copyDir mechanics                     → test/utils/fs.test.ts
 *   - Zod schema definitions themselves     → test/service-schemas.test.ts
 *   - Runtime behaviour of handlers         → must live in a generated project
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
 *   test/handler-validation.test.ts  →  dirname = <root>/test
 *   templates/                       →  resolve(<root>/test, "..", "templates")
 */
const TEMPLATE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates"
);

const USERS_HANDLERS = join(
  TEMPLATE_ROOT,
  "services",
  "users",
  "src",
  "handlers"
);
const MODULE_HANDLERS = join(
  TEMPLATE_ROOT,
  "generators",
  "module",
  "src",
  "handlers"
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

// ===========================================================================
// PART 1: templates/services/users/src/handlers/create-user.ts
// ===========================================================================

// ---------------------------------------------------------------------------
// 1a. File existence
// ---------------------------------------------------------------------------

describe("users create-user handler — file existence", () => {
  it("templates/services/users/src/handlers/create-user.ts should exist", async () => {
    expect(await exists(join(USERS_HANDLERS, "create-user.ts"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 1b. Schema imports — must come from schemas, not types
// ---------------------------------------------------------------------------

describe("users create-user handler — schema imports", () => {
  it("imports CreateUserBodySchema from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).toContain('CreateUserBodySchema');
    expect(raw).toContain('"../schemas/index.js"');
  });

  it("imports User type from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    // The User type import should reference schemas, not types
    const schemasImportMatch = raw.match(
      /from\s+"\.\.\/schemas\/index\.js"/g
    );
    expect(schemasImportMatch).not.toBeNull();
    expect(raw).toContain("User");
  });

  it("does NOT import from ../types/index.js", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).not.toContain('"../types/index.js"');
  });
});

// ---------------------------------------------------------------------------
// 1c. Zod safeParse usage
// ---------------------------------------------------------------------------

describe("users create-user handler — Zod safeParse validation", () => {
  it("calls CreateUserBodySchema.safeParse(parsedBody)", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).toContain("CreateUserBodySchema.safeParse(parsedBody)");
  });

  it("builds fieldErrors map from parsed.error.issues", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).toContain("fieldErrors");
    expect(raw).toContain("parsed.error.issues");
  });

  it("uses _root as fallback key when issue.path is empty", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).toContain('"_root"');
    expect(raw).toContain("issue.path.length");
  });

  it("returns VALIDATION_ERROR code on failed validation", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).toContain('"VALIDATION_ERROR"');
  });
});

// ---------------------------------------------------------------------------
// 1d. No manual typeof checks
// ---------------------------------------------------------------------------

describe("users create-user handler — no manual typeof validation", () => {
  it("does NOT contain manual typeof name check", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).not.toContain("typeof name");
  });

  it("does NOT contain manual typeof email check", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).not.toContain("typeof email");
  });
});

// ---------------------------------------------------------------------------
// 1e. String normalisation in the success path
// ---------------------------------------------------------------------------

describe("users create-user handler — string normalisation", () => {
  it("applies name.trim() when constructing the user object", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).toContain("name.trim()");
  });

  it("applies email.trim().toLowerCase() when constructing the user object", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "create-user.ts"),
      "utf8"
    );
    expect(raw).toContain("email.trim().toLowerCase()");
  });
});

// ===========================================================================
// PART 2: templates/services/users/src/handlers/update-user.ts
// ===========================================================================

// ---------------------------------------------------------------------------
// 2a. File existence
// ---------------------------------------------------------------------------

describe("users update-user handler — file existence", () => {
  it("templates/services/users/src/handlers/update-user.ts should exist", async () => {
    expect(await exists(join(USERS_HANDLERS, "update-user.ts"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2b. Schema imports — must come from schemas, not types
// ---------------------------------------------------------------------------

describe("users update-user handler — schema imports", () => {
  it("imports UpdateUserBodySchema from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).toContain("UpdateUserBodySchema");
    expect(raw).toContain('"../schemas/index.js"');
  });

  it("does NOT import UpdateUserBody type from ../types/index.js", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).not.toContain('"../types/index.js"');
  });

  it("does NOT import UpdateUserBody as a standalone type alias (removed in favour of schema inference)", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    // The bare UpdateUserBody type import (e.g. "import type { UpdateUserBody }")
    // is no longer present — validation is driven by the Zod schema directly.
    // We check the import declaration specifically to avoid false positives from
    // the schema name "UpdateUserBodySchema" which legitimately remains.
    expect(raw).not.toMatch(/import\s+type\s+\{[^}]*UpdateUserBody[^S]/);
  });
});

// ---------------------------------------------------------------------------
// 2c. Zod safeParse usage
// ---------------------------------------------------------------------------

describe("users update-user handler — Zod safeParse validation", () => {
  it("calls UpdateUserBodySchema.safeParse(parsedBody)", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).toContain("UpdateUserBodySchema.safeParse(parsedBody)");
  });

  it("builds fieldErrors map from parsed.error.issues", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).toContain("fieldErrors");
    expect(raw).toContain("parsed.error.issues");
  });

  it("uses _root as fallback key when issue.path is empty", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).toContain('"_root"');
    expect(raw).toContain("issue.path.length");
  });

  it("returns VALIDATION_ERROR code on failed validation", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).toContain('"VALIDATION_ERROR"');
  });
});

// ---------------------------------------------------------------------------
// 2d. No manual typeof checks
// ---------------------------------------------------------------------------

describe("users update-user handler — no manual typeof validation", () => {
  it("does NOT contain manual typeof body.name check", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).not.toContain("typeof body.name");
  });

  it("does NOT contain manual typeof body.email check", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).not.toContain("typeof body.email");
  });
});

// ---------------------------------------------------------------------------
// 2e. Path parameter and 404 logic preserved
// ---------------------------------------------------------------------------

describe("users update-user handler — path parameter and 404 logic", () => {
  it("extracts the id path parameter via event.pathParameters", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).toContain('event.pathParameters?.["id"]');
  });

  it("returns 400 when id path parameter is missing", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    // The guard block for a missing id must still be present
    expect(raw).toContain("Path parameter 'id' is required");
  });

  it("returns 404 when the user is not found", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).toContain('"NOT_FOUND"');
  });

  it("applies name.trim() in the partial update spread", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).toContain("parsed.data.name.trim()");
  });

  it("applies email.trim().toLowerCase() in the partial update spread", async () => {
    const raw = await readFile(
      join(USERS_HANDLERS, "update-user.ts"),
      "utf8"
    );
    expect(raw).toContain("parsed.data.email.trim().toLowerCase()");
  });
});

// ===========================================================================
// PART 3: templates/generators/module/src/handlers/create.ts.hbs
// ===========================================================================

// ---------------------------------------------------------------------------
// 3a. File existence
// ---------------------------------------------------------------------------

describe("module create handler template — file existence", () => {
  it("templates/generators/module/src/handlers/create.ts.hbs should exist", async () => {
    expect(await exists(join(MODULE_HANDLERS, "create.ts.hbs"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3b. Schema imports — must come from schemas, not types
// ---------------------------------------------------------------------------

describe("module create handler template — schema imports", () => {
  it("imports Create{{EntityName}}BodySchema from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("Create{{EntityName}}BodySchema");
    expect(raw).toContain('"../schemas/index.js"');
  });

  it("imports {{EntityName}} type from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    // Both the type and the schema come from schemas, not types
    const schemasImports = raw.match(/from\s+"\.\.\/schemas\/index\.js"/g);
    expect(schemasImports).not.toBeNull();
    expect(raw).toContain("{{EntityName}}");
  });

  it("does NOT import from ../types/index.js", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).not.toContain('"../types/index.js"');
  });
});

// ---------------------------------------------------------------------------
// 3c. Zod safeParse usage
// ---------------------------------------------------------------------------

describe("module create handler template — Zod safeParse validation", () => {
  it("calls Create{{EntityName}}BodySchema.safeParse(parsedBody)", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("Create{{EntityName}}BodySchema.safeParse(parsedBody)");
  });

  it("builds fieldErrors map from parsed.error.issues", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("fieldErrors");
    expect(raw).toContain("parsed.error.issues");
  });

  it("uses _root as fallback key when issue.path is empty", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('"_root"');
    expect(raw).toContain("issue.path.length");
  });

  it("returns VALIDATION_ERROR code on failed validation", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('"VALIDATION_ERROR"');
  });
});

// ---------------------------------------------------------------------------
// 3d. No manual typeof checks
// ---------------------------------------------------------------------------

describe("module create handler template — no manual typeof validation", () => {
  it("does NOT contain manual typeof name check", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).not.toContain("typeof name");
  });
});

// ---------------------------------------------------------------------------
// 3e. String normalisation in the success path
// ---------------------------------------------------------------------------

describe("module create handler template — string normalisation", () => {
  it("applies name.trim() when constructing the item object", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("name.trim()");
  });
});

// ---------------------------------------------------------------------------
// 3f. Required template placeholders
// ---------------------------------------------------------------------------

describe("module create handler template — required template placeholders", () => {
  it("contains {{EntityName}} placeholder for schema and type names", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{EntityName}}");
  });

  it("contains {{entityNameLower}} placeholder for variable and repository names", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{entityNameLower}}");
  });

  it("contains {{moduleName}} placeholder for route path comments", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "create.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{moduleName}}");
  });
});

// ===========================================================================
// PART 4: templates/generators/module/src/handlers/update.ts.hbs
// ===========================================================================

// ---------------------------------------------------------------------------
// 4a. File existence
// ---------------------------------------------------------------------------

describe("module update handler template — file existence", () => {
  it("templates/generators/module/src/handlers/update.ts.hbs should exist", async () => {
    expect(await exists(join(MODULE_HANDLERS, "update.ts.hbs"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4b. Schema imports — must come from schemas, not types
// ---------------------------------------------------------------------------

describe("module update handler template — schema imports", () => {
  it("imports Update{{EntityName}}BodySchema from ../schemas/index.js", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("Update{{EntityName}}BodySchema");
    expect(raw).toContain('"../schemas/index.js"');
  });

  it("does NOT import from ../types/index.js", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).not.toContain('"../types/index.js"');
  });
});

// ---------------------------------------------------------------------------
// 4c. Zod safeParse usage
// ---------------------------------------------------------------------------

describe("module update handler template — Zod safeParse validation", () => {
  it("calls Update{{EntityName}}BodySchema.safeParse(parsedBody)", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("Update{{EntityName}}BodySchema.safeParse(parsedBody)");
  });

  it("builds fieldErrors map from parsed.error.issues", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("fieldErrors");
    expect(raw).toContain("parsed.error.issues");
  });

  it("uses _root as fallback key when issue.path is empty", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('"_root"');
    expect(raw).toContain("issue.path.length");
  });

  it("returns VALIDATION_ERROR code on failed validation", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('"VALIDATION_ERROR"');
  });
});

// ---------------------------------------------------------------------------
// 4d. No manual typeof checks
// ---------------------------------------------------------------------------

describe("module update handler template — no manual typeof validation", () => {
  it("does NOT contain manual typeof body.name check", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).not.toContain("typeof body.name");
  });
});

// ---------------------------------------------------------------------------
// 4e. Path parameter and 404 logic preserved
// ---------------------------------------------------------------------------

describe("module update handler template — path parameter and 404 logic", () => {
  it("extracts the id path parameter via event.pathParameters", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('event.pathParameters?.["id"]');
  });

  it("returns 400 when id path parameter is missing", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("Path parameter 'id' is required");
  });

  it("returns 404 when the entity is not found", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain('"NOT_FOUND"');
  });

  it("applies name.trim() in the partial update spread", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("parsed.data.name.trim()");
  });
});

// ---------------------------------------------------------------------------
// 4f. Required template placeholders
// ---------------------------------------------------------------------------

describe("module update handler template — required template placeholders", () => {
  it("contains {{EntityName}} placeholder for schema and entity type names", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{EntityName}}");
  });

  it("contains {{entityNameLower}} placeholder for variable and repository names", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{entityNameLower}}");
  });

  it("contains {{moduleName}} placeholder for route path comments", async () => {
    const raw = await readFile(
      join(MODULE_HANDLERS, "update.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{moduleName}}");
  });
});
