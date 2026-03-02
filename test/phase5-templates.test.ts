/**
 * Phase 5 — Template structure and variable-placeholder tests.
 *
 * This file has NO module mocks so it can hit the real filesystem.
 * It covers two concerns:
 *
 * 1. Directory / file existence — every template path that copyDir depends
 *    on for the standard preset must be present.  A missing file here means
 *    the generated project would be incomplete or copyDir would throw at
 *    runtime.
 *
 * 2. .hbs naming convention — files with {{variable}} placeholders must carry
 *    the .hbs suffix so copyDir knows to apply substitution.  Static files
 *    must NOT contain {{...}} patterns.
 *
 * Template directories covered (all standard-preset additions):
 *   templates/frontend/         Vite + React SPA
 *   templates/auth/             Cognito JWT Lambda authorizer
 *   templates/e2e/              Playwright end-to-end tests
 *   templates/infra/src/stacks/modules/auth-stack.ts.hbs
 *   templates/infra/src/stacks/modules/frontend-stack.ts.hbs
 *
 * What is NOT tested here:
 *   - scaffold() orchestration              → test/scaffolder.test.ts
 *   - SUBDIR_TEMPLATE_DIRS placement        → test/phase4.test.ts
 *   - copyDir mechanics                     → test/utils/fs.test.ts
 *   - getTemplateDirs / getVariableMap      → test/template-helpers.test.ts
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
 *   test/phase5-templates.test.ts  →  dirname = <root>/test
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

describe("Phase 5 template structure — top-level directories", () => {
  it.each(["frontend", "auth", "e2e"])(
    "templates/%s/ should exist",
    async (dir) => {
      expect(await exists(join(TEMPLATE_ROOT, dir))).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// frontend/
// ---------------------------------------------------------------------------

describe("Phase 5 template structure — frontend/", () => {
  const fe = join(TEMPLATE_ROOT, "frontend");

  it("templates/frontend/package.json.hbs should exist", async () => {
    expect(await exists(join(fe, "package.json.hbs"))).toBe(true);
  });

  it("templates/frontend/vite.config.ts should exist", async () => {
    expect(await exists(join(fe, "vite.config.ts"))).toBe(true);
  });

  it("templates/frontend/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(fe, "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/frontend/index.html.hbs should exist", async () => {
    expect(await exists(join(fe, "index.html.hbs"))).toBe(true);
  });

  it("templates/frontend/_env.development should exist", async () => {
    expect(await exists(join(fe, "_env.development"))).toBe(true);
  });

  it("templates/frontend/_env.production should exist", async () => {
    expect(await exists(join(fe, "_env.production"))).toBe(true);
  });

  it.each(["src/main.tsx", "src/App.tsx", "src/vite-env.d.ts"])(
    "templates/frontend/%s should exist",
    async (file) => {
      expect(await exists(join(fe, file))).toBe(true);
    }
  );

  it("templates/frontend/src/features/home/HomePage.tsx should exist", async () => {
    expect(
      await exists(join(fe, "src", "features", "home", "HomePage.tsx"))
    ).toBe(true);
  });

  it("templates/frontend/src/shared/lib/api.ts should exist", async () => {
    expect(await exists(join(fe, "src", "shared", "lib", "api.ts"))).toBe(true);
  });

  it("templates/frontend/src/assets/logo.svg should exist", async () => {
    expect(await exists(join(fe, "src", "assets", "logo.svg"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// auth/
// ---------------------------------------------------------------------------

describe("Phase 5 template structure — auth/", () => {
  const au = join(TEMPLATE_ROOT, "auth");

  it("templates/auth/package.json.hbs should exist", async () => {
    expect(await exists(join(au, "package.json.hbs"))).toBe(true);
  });

  it("templates/auth/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(au, "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/auth/vitest.config.ts should exist", async () => {
    expect(await exists(join(au, "vitest.config.ts"))).toBe(true);
  });

  it("templates/auth/src/authorizer.ts should exist", async () => {
    expect(await exists(join(au, "src", "authorizer.ts"))).toBe(true);
  });

  it("templates/auth/src/__tests__/authorizer.test.ts should exist", async () => {
    expect(
      await exists(join(au, "src", "__tests__", "authorizer.test.ts"))
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// e2e/
// ---------------------------------------------------------------------------

describe("Phase 5 template structure — e2e/", () => {
  const e2e = join(TEMPLATE_ROOT, "e2e");

  it("templates/e2e/package.json.hbs should exist", async () => {
    expect(await exists(join(e2e, "package.json.hbs"))).toBe(true);
  });

  it("templates/e2e/playwright.config.ts.hbs should exist", async () => {
    expect(await exists(join(e2e, "playwright.config.ts.hbs"))).toBe(true);
  });

  it("templates/e2e/tests/home.spec.ts should exist", async () => {
    expect(await exists(join(e2e, "tests", "home.spec.ts"))).toBe(true);
  });

  it("templates/e2e/tests/fixtures/base.ts should exist", async () => {
    expect(await exists(join(e2e, "tests", "fixtures", "base.ts"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// infra/src/stacks/modules — Phase 5 additions
// ---------------------------------------------------------------------------

describe("Phase 5 template structure — infra/src/stacks/modules/ Phase 5 additions", () => {
  const modules = join(TEMPLATE_ROOT, "infra", "src", "stacks", "modules");

  it("templates/infra/src/stacks/modules/auth-stack.ts.hbs should exist", async () => {
    expect(await exists(join(modules, "auth-stack.ts.hbs"))).toBe(true);
  });

  it("templates/infra/src/stacks/modules/frontend-stack.ts.hbs should exist", async () => {
    expect(await exists(join(modules, "frontend-stack.ts.hbs"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Part 2: Template content — key strings and placeholders
// ---------------------------------------------------------------------------

describe("Phase 5 frontend/package.json.hbs content", () => {
  let content: string;

  it("contains {{projectName}} placeholder", async () => {
    content = await readFile(
      join(TEMPLATE_ROOT, "frontend", "package.json.hbs"),
      "utf8"
    );
    expect(content).toContain("{{projectName}}");
  });

  it("contains dev script", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"dev"');
  });

  it("contains build script", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"build"');
  });

  it("lists react as a dependency", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"react"');
  });

  it("lists react-dom as a dependency", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"react-dom"');
  });

  it("lists react-router as a dependency", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"react-router"');
  });

  it("lists vite as a devDependency", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"vite"');
  });
});

describe("Phase 5 frontend/vite.config.ts content", () => {
  it("imports react plugin", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "vite.config.ts"),
      "utf8"
    );
    expect(raw).toContain('@vitejs/plugin-react');
  });

  it("configures port 5173", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "vite.config.ts"),
      "utf8"
    );
    expect(raw).toContain("5173");
  });
});

describe("Phase 5 frontend/tsconfig.json.hbs content", () => {
  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "tsconfig.json.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });

  it("extends the react tsconfig preset via {{projectName}}", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "tsconfig.json.hbs"),
      "utf8"
    );
    expect(raw).toContain("react.json");
  });
});

describe("Phase 5 frontend/index.html.hbs content", () => {
  it("contains {{projectName}} placeholder in title", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "index.html.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });

  it("contains <div id=\"root\">", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "index.html.hbs"),
      "utf8"
    );
    expect(raw).toContain('<div id="root">');
  });
});

describe("Phase 5 frontend env files content", () => {
  it("_env.development sets VITE_API_URL to localhost:3000", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "_env.development"),
      "utf8"
    );
    expect(raw).toContain("VITE_API_URL=http://localhost:3000");
  });

  it("_env.production contains VITE_API_URL", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "_env.production"),
      "utf8"
    );
    expect(raw).toContain("VITE_API_URL");
  });
});

describe("Phase 5 frontend/src/features/home/HomePage.tsx content", () => {
  it("contains Welcome heading text", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "frontend",
        "src",
        "features",
        "home",
        "HomePage.tsx"
      ),
      "utf8"
    );
    expect(raw).toContain("Welcome");
  });
});

describe("Phase 5 frontend/src/shared/lib/api.ts content", () => {
  it("references VITE_API_URL", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "frontend", "src", "shared", "lib", "api.ts"),
      "utf8"
    );
    expect(raw).toContain("VITE_API_URL");
  });
});

describe("Phase 5 auth/package.json.hbs content", () => {
  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "auth", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });

  it("lists aws-jwt-verify as a dependency", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "auth", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"aws-jwt-verify"');
  });
});

describe("Phase 5 auth/tsconfig.json.hbs content", () => {
  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "auth", "tsconfig.json.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });

  it("extends the node tsconfig preset", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "auth", "tsconfig.json.hbs"),
      "utf8"
    );
    expect(raw).toContain("node.json");
  });
});

describe("Phase 5 auth/src/authorizer.ts content", () => {
  it("imports CognitoJwtVerifier", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "auth", "src", "authorizer.ts"),
      "utf8"
    );
    expect(raw).toContain("CognitoJwtVerifier");
  });

  it("exports handler function", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "auth", "src", "authorizer.ts"),
      "utf8"
    );
    expect(raw).toContain("export async function handler");
  });
});

describe("Phase 5 e2e/package.json.hbs content", () => {
  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "e2e", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });

  it("lists @playwright/test as a devDependency", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "e2e", "package.json.hbs"),
      "utf8"
    );
    expect(raw).toContain('"@playwright/test"');
  });
});

describe("Phase 5 e2e/playwright.config.ts.hbs content", () => {
  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "e2e", "playwright.config.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });

  it("configures baseURL to localhost:5173", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "e2e", "playwright.config.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("localhost:5173");
  });

  it("includes chromium in the projects list", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "e2e", "playwright.config.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("chromium");
  });

  it("defines a webServer configuration", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "e2e", "playwright.config.ts.hbs"),
      "utf8"
    );
    expect(raw).toContain("webServer");
  });
});

describe("Phase 5 e2e/tests/home.spec.ts content", () => {
  it("contains home page tests", async () => {
    const raw = await readFile(
      join(TEMPLATE_ROOT, "e2e", "tests", "home.spec.ts"),
      "utf8"
    );
    expect(raw).toContain("Home page");
  });
});

describe("Phase 5 infra/src/stacks/modules/auth-stack.ts.hbs content", () => {
  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "auth-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });

  it("defines the AuthStack class", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "auth-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("AuthStack");
  });

  it("extends ServiceStack", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "auth-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("ServiceStack");
  });

  it("creates a Cognito UserPool", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "auth-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("UserPool");
  });

  it("creates a Cognito UserPoolClient", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "auth-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("UserPoolClient");
  });

  it("emits CfnOutput exports", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "auth-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("CfnOutput");
  });
});

describe("Phase 5 infra/src/stacks/modules/frontend-stack.ts.hbs content", () => {
  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "frontend-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("{{projectName}}");
  });

  it("defines the FrontendStack class", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "frontend-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("FrontendStack");
  });

  it("extends ServiceStack", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "frontend-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("ServiceStack");
  });

  it("creates an S3 Bucket", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "frontend-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("s3.Bucket");
  });

  it("creates a CloudFront Distribution", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "frontend-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("Distribution");
  });

  it("emits CfnOutput exports", async () => {
    const raw = await readFile(
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "frontend-stack.ts.hbs"
      ),
      "utf8"
    );
    expect(raw).toContain("CfnOutput");
  });
});

// ---------------------------------------------------------------------------
// Part 3: .hbs files contain expected {{variable}} placeholders
//
// Reading the raw source of each .hbs file and asserting it still contains at
// least one {{placeholder}}.  This catches the case where a file was
// accidentally rendered (placeholders substituted) and committed as the source.
// ---------------------------------------------------------------------------

describe("Phase 5 .hbs files contain {{variable}} placeholders", () => {
  const checks: [string, string, string][] = [
    // frontend
    [
      "frontend/package.json.hbs",
      join(TEMPLATE_ROOT, "frontend", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "frontend/tsconfig.json.hbs",
      join(TEMPLATE_ROOT, "frontend", "tsconfig.json.hbs"),
      "{{projectName}}",
    ],
    [
      "frontend/index.html.hbs",
      join(TEMPLATE_ROOT, "frontend", "index.html.hbs"),
      "{{projectName}}",
    ],
    // auth
    [
      "auth/package.json.hbs",
      join(TEMPLATE_ROOT, "auth", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "auth/tsconfig.json.hbs",
      join(TEMPLATE_ROOT, "auth", "tsconfig.json.hbs"),
      "{{projectName}}",
    ],
    // e2e
    [
      "e2e/package.json.hbs",
      join(TEMPLATE_ROOT, "e2e", "package.json.hbs"),
      "{{projectName}}",
    ],
    [
      "e2e/playwright.config.ts.hbs",
      join(TEMPLATE_ROOT, "e2e", "playwright.config.ts.hbs"),
      "{{projectName}}",
    ],
    // infra Phase 5 additions
    [
      "infra/src/stacks/modules/auth-stack.ts.hbs",
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "auth-stack.ts.hbs"
      ),
      "{{projectName}}",
    ],
    [
      "infra/src/stacks/modules/frontend-stack.ts.hbs",
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "frontend-stack.ts.hbs"
      ),
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
// Part 4: Static (non-.hbs) template files must NOT contain {{...}} patterns
//
// A {{variable}} in a non-.hbs file would be silently left un-substituted
// in the generated project because copyDir only applies variable substitution
// when the source filename ends with .hbs.
// ---------------------------------------------------------------------------

describe("Phase 5 static template files have no un-substituted {{}} placeholders", () => {
  const staticFiles: [string, string][] = [
    // frontend static files
    [
      "frontend/vite.config.ts",
      join(TEMPLATE_ROOT, "frontend", "vite.config.ts"),
    ],
    [
      "frontend/_env.development",
      join(TEMPLATE_ROOT, "frontend", "_env.development"),
    ],
    [
      "frontend/_env.production",
      join(TEMPLATE_ROOT, "frontend", "_env.production"),
    ],
    [
      "frontend/src/main.tsx",
      join(TEMPLATE_ROOT, "frontend", "src", "main.tsx"),
    ],
    [
      "frontend/src/App.tsx",
      join(TEMPLATE_ROOT, "frontend", "src", "App.tsx"),
    ],
    [
      "frontend/src/vite-env.d.ts",
      join(TEMPLATE_ROOT, "frontend", "src", "vite-env.d.ts"),
    ],
    [
      "frontend/src/features/home/HomePage.tsx",
      join(
        TEMPLATE_ROOT,
        "frontend",
        "src",
        "features",
        "home",
        "HomePage.tsx"
      ),
    ],
    [
      "frontend/src/shared/lib/api.ts",
      join(TEMPLATE_ROOT, "frontend", "src", "shared", "lib", "api.ts"),
    ],
    // auth static files
    [
      "auth/vitest.config.ts",
      join(TEMPLATE_ROOT, "auth", "vitest.config.ts"),
    ],
    [
      "auth/src/authorizer.ts",
      join(TEMPLATE_ROOT, "auth", "src", "authorizer.ts"),
    ],
    [
      "auth/src/__tests__/authorizer.test.ts",
      join(TEMPLATE_ROOT, "auth", "src", "__tests__", "authorizer.test.ts"),
    ],
    // e2e static files
    [
      "e2e/tests/home.spec.ts",
      join(TEMPLATE_ROOT, "e2e", "tests", "home.spec.ts"),
    ],
    [
      "e2e/tests/fixtures/base.ts",
      join(TEMPLATE_ROOT, "e2e", "tests", "fixtures", "base.ts"),
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
