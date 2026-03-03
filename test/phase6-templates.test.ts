/**
 * Phase 6 — Template structure and variable-placeholder tests.
 *
 * This file has NO module mocks so it can hit the real filesystem.
 * It covers two concerns:
 *
 * 1. Directory / file existence — every template path that copyDir depends
 *    on for the full preset must be present.  A missing file here means
 *    the generated project would be incomplete or copyDir would throw at
 *    runtime.
 *
 * 2. .hbs naming convention — files with {{variable}} placeholders must carry
 *    the .hbs suffix so copyDir knows to apply substitution.  Static files
 *    must NOT contain {{...}} patterns.
 *
 * Template directories covered (all full-preset additions):
 *   templates/database/         DynamoDB shared client package
 *   templates/cicd/             GitHub Actions CI/CD workflows
 *   templates/monitoring/       CloudWatch structured logger package
 *   templates/extras/           Husky pre-commit hook + lint-staged config
 *   templates/infra/src/stacks/modules/database-stack.ts.hbs
 *   templates/infra/src/stacks/modules/monitoring-stack.ts.hbs
 *
 * What is NOT tested here:
 *   - scaffold() orchestration              → test/scaffolder.test.ts
 *   - SUBDIR_TEMPLATE_DIRS placement        → test/phase4.test.ts
 *   - copyDir mechanics                     → test/utils/fs.test.ts
 *   - getTemplateDirs / getVariableMap      → test/template-helpers.test.ts
 */

import { describe, it, expect } from "vitest";
import { access, readFile, stat } from "node:fs/promises";
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
 *   test/phase6-templates.test.ts  →  dirname = <root>/test
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

describe("Phase 6 template structure — top-level directories", () => {
  it.each(["database", "cicd", "monitoring", "extras"])(
    "templates/%s/ should exist",
    async (dir) => {
      expect(await exists(join(TEMPLATE_ROOT, dir))).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// database/
// ---------------------------------------------------------------------------

describe("Phase 6 template structure — database/packages/database-client/", () => {
  const db = join(TEMPLATE_ROOT, "database", "packages", "database-client");

  it("templates/database/packages/database-client/ should exist", async () => {
    expect(await exists(db)).toBe(true);
  });

  it("templates/database/packages/database-client/package.json.hbs should exist", async () => {
    expect(await exists(join(db, "package.json.hbs"))).toBe(true);
  });

  it("templates/database/packages/database-client/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(db, "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/database/packages/database-client/vitest.config.ts should exist", async () => {
    expect(await exists(join(db, "vitest.config.ts"))).toBe(true);
  });

  it.each(["src/index.ts", "src/dynamo-client.ts", "src/types.ts"])(
    "templates/database/packages/database-client/%s should exist",
    async (file) => {
      expect(await exists(join(db, file))).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// cicd/
// ---------------------------------------------------------------------------

describe("Phase 6 template structure — cicd/_github/workflows/", () => {
  const workflows = join(TEMPLATE_ROOT, "cicd", "_github", "workflows");

  it("templates/cicd/_github/workflows/ should exist", async () => {
    expect(await exists(workflows)).toBe(true);
  });

  it.each(["ci.yml", "deploy-staging.yml", "deploy-production.yml"])(
    "templates/cicd/_github/workflows/%s should exist",
    async (file) => {
      expect(await exists(join(workflows, file))).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// monitoring/
// ---------------------------------------------------------------------------

describe("Phase 6 template structure — monitoring/packages/monitoring/", () => {
  const mon = join(TEMPLATE_ROOT, "monitoring", "packages", "monitoring");

  it("templates/monitoring/packages/monitoring/ should exist", async () => {
    expect(await exists(mon)).toBe(true);
  });

  it("templates/monitoring/packages/monitoring/package.json.hbs should exist", async () => {
    expect(await exists(join(mon, "package.json.hbs"))).toBe(true);
  });

  it("templates/monitoring/packages/monitoring/tsconfig.json.hbs should exist", async () => {
    expect(await exists(join(mon, "tsconfig.json.hbs"))).toBe(true);
  });

  it("templates/monitoring/packages/monitoring/vitest.config.ts should exist", async () => {
    expect(await exists(join(mon, "vitest.config.ts"))).toBe(true);
  });

  it.each(["src/index.ts", "src/logger.ts", "src/types.ts"])(
    "templates/monitoring/packages/monitoring/%s should exist",
    async (file) => {
      expect(await exists(join(mon, file))).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// extras/
// ---------------------------------------------------------------------------

describe("Phase 6 template structure — extras/", () => {
  const ex = join(TEMPLATE_ROOT, "extras");

  it("templates/extras/_husky/pre-commit should exist", async () => {
    expect(await exists(join(ex, "_husky", "pre-commit"))).toBe(true);
  });

  it("templates/extras/lint-staged.config.js should exist", async () => {
    expect(await exists(join(ex, "lint-staged.config.js"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// infra/src/stacks/modules — Phase 6 additions
// ---------------------------------------------------------------------------

describe("Phase 6 template structure — infra/src/stacks/modules/ Phase 6 additions", () => {
  const modules = join(TEMPLATE_ROOT, "infra", "src", "stacks", "modules");

  it("templates/infra/src/stacks/modules/database-stack.ts.hbs should exist", async () => {
    expect(await exists(join(modules, "database-stack.ts.hbs"))).toBe(true);
  });

  it("templates/infra/src/stacks/modules/monitoring-stack.ts.hbs should exist", async () => {
    expect(await exists(join(modules, "monitoring-stack.ts.hbs"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Part 2: Template content — key strings and placeholders
// ---------------------------------------------------------------------------

describe("Phase 6 database/packages/database-client/package.json.hbs content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "database",
    "packages",
    "database-client",
    "package.json.hbs"
  );

  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("{{projectName}}");
  });

  it("lists @aws-sdk/client-dynamodb as a dependency", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain('"@aws-sdk/client-dynamodb"');
  });

  it("lists @aws-sdk/lib-dynamodb as a dependency", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain('"@aws-sdk/lib-dynamodb"');
  });

  it("contains build script", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain('"build"');
  });

  it("contains test script", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain('"test"');
  });
});

describe("Phase 6 database/packages/database-client/tsconfig.json.hbs content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "database",
    "packages",
    "database-client",
    "tsconfig.json.hbs"
  );

  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("{{projectName}}");
  });

  it("extends the node tsconfig preset via {{projectName}}", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("node.json");
  });
});

describe("Phase 6 database/packages/database-client/vitest.config.ts content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "database",
    "packages",
    "database-client",
    "vitest.config.ts"
  );

  it("has passWithNoTests: true", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("passWithNoTests");
  });

  it("uses defineConfig from vitest/config", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("defineConfig");
  });
});

describe("Phase 6 database/packages/database-client/src/index.ts content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "database",
    "packages",
    "database-client",
    "src",
    "index.ts"
  );

  it("re-exports getDocumentClient from dynamo-client", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("getDocumentClient");
  });

  it("re-exports getUsersTableName from dynamo-client", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("getUsersTableName");
  });

  it("re-exports DynamoItem type from types", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("DynamoItem");
  });

  it("re-exports UserItem type from types", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("UserItem");
  });

  it("re-exports CreateUserInput type from types", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("CreateUserInput");
  });
});

describe("Phase 6 database/packages/database-client/src/dynamo-client.ts content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "database",
    "packages",
    "database-client",
    "src",
    "dynamo-client.ts"
  );

  it("exports getDocumentClient function", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("export function getDocumentClient");
  });

  it("exports getUsersTableName function", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("export function getUsersTableName");
  });

  it("imports DynamoDBClient from @aws-sdk/client-dynamodb", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("@aws-sdk/client-dynamodb");
  });

  it("imports DynamoDBDocumentClient from @aws-sdk/lib-dynamodb", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("@aws-sdk/lib-dynamodb");
  });
});

describe("Phase 6 database/packages/database-client/src/types.ts content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "database",
    "packages",
    "database-client",
    "src",
    "types.ts"
  );

  it("exports DynamoItem interface", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("export interface DynamoItem");
  });

  it("exports UserItem interface", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("export interface UserItem");
  });

  it("exports CreateUserInput interface", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("export interface CreateUserInput");
  });

  it("DynamoItem has pk and sk fields", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("pk:");
    expect(raw).toContain("sk:");
  });
});

// ---------------------------------------------------------------------------
// cicd workflow content
// ---------------------------------------------------------------------------

describe("Phase 6 cicd/_github/workflows/ci.yml content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "cicd",
    "_github",
    "workflows",
    "ci.yml"
  );

  it("triggers on pull_request", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("pull_request");
  });

  it("installs dependencies with pnpm install", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("pnpm install");
  });

  it("runs turbo lint", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("pnpm turbo lint");
  });

  it("runs turbo build", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("pnpm turbo build");
  });

  it("runs turbo test", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("pnpm turbo test");
  });

  it("uses Node 24", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain('"24"');
  });
});

describe("Phase 6 cicd/_github/workflows/deploy-staging.yml content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "cicd",
    "_github",
    "workflows",
    "deploy-staging.yml"
  );

  it("triggers on push to main", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("push");
    expect(raw).toContain("main");
  });

  it("uses AWS OIDC credentials action", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("aws-actions/configure-aws-credentials");
  });

  it("uses role-to-assume for OIDC authentication", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("role-to-assume");
  });

  it("deploys with stage=staging", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("stage=staging");
  });

  it("runs cdk deploy", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("cdk deploy");
  });

  it("uses id-token: write permission for OIDC", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("id-token: write");
  });
});

describe("Phase 6 cicd/_github/workflows/deploy-production.yml content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "cicd",
    "_github",
    "workflows",
    "deploy-production.yml"
  );

  it("triggers on workflow_dispatch", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("workflow_dispatch");
  });

  it("uses environment: production", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("environment: production");
  });

  it("deploys with stage=prod", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("stage=prod");
  });

  it("uses --require-approval broadening", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("--require-approval broadening");
  });

  it("uses id-token: write permission for OIDC", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("id-token: write");
  });

  it("runs cdk deploy", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("cdk deploy");
  });
});

// ---------------------------------------------------------------------------
// monitoring package content
// ---------------------------------------------------------------------------

describe("Phase 6 monitoring/packages/monitoring/package.json.hbs content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "monitoring",
    "packages",
    "monitoring",
    "package.json.hbs"
  );

  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("{{projectName}}");
  });

  it("contains build script", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain('"build"');
  });

  it("contains test script", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain('"test"');
  });
});

describe("Phase 6 monitoring/packages/monitoring/tsconfig.json.hbs content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "monitoring",
    "packages",
    "monitoring",
    "tsconfig.json.hbs"
  );

  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("{{projectName}}");
  });

  it("extends the node tsconfig preset via {{projectName}}", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("node.json");
  });
});

describe("Phase 6 monitoring/packages/monitoring/vitest.config.ts content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "monitoring",
    "packages",
    "monitoring",
    "vitest.config.ts"
  );

  it("has passWithNoTests", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("passWithNoTests");
  });

  it("uses defineConfig from vitest/config", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("defineConfig");
  });
});

describe("Phase 6 monitoring/packages/monitoring/src/index.ts content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "monitoring",
    "packages",
    "monitoring",
    "src",
    "index.ts"
  );

  it("re-exports createLogger from logger", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("createLogger");
  });

  it("re-exports Logger type from types", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("Logger");
  });

  it("re-exports LogLevel type from types", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("LogLevel");
  });
});

describe("Phase 6 monitoring/packages/monitoring/src/logger.ts content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "monitoring",
    "packages",
    "monitoring",
    "src",
    "logger.ts"
  );

  it("exports createLogger function", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("export function createLogger");
  });

  it("accepts a serviceName parameter", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("serviceName");
  });
});

describe("Phase 6 monitoring/packages/monitoring/src/types.ts content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "monitoring",
    "packages",
    "monitoring",
    "src",
    "types.ts"
  );

  it("exports LogLevel type", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("export type LogLevel");
  });

  it("exports Logger interface", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("export interface Logger");
  });
});

// ---------------------------------------------------------------------------
// extras content
// ---------------------------------------------------------------------------

describe("Phase 6 extras/_husky/pre-commit content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "extras",
    "_husky",
    "pre-commit"
  );

  it("contains lint-staged invocation", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("lint-staged");
  });
});

describe("Phase 6 extras/_husky/pre-commit file permissions", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "extras",
    "_husky",
    "pre-commit"
  );

  it("is executable (mode 755)", async () => {
    const info = await stat(filePath);
    // The mode includes the file type bits.  We only care about the permission
    // bits (lower 12 bits: 0o7777).  Mode 755 = 0o755 = 493 decimal.
    const permBits = info.mode & 0o777;
    expect(permBits).toBe(0o755);
  });
});

describe("Phase 6 extras/lint-staged.config.js content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "extras",
    "lint-staged.config.js"
  );

  it("configures eslint for .ts/.tsx files", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("eslint");
    expect(raw).toContain("ts,tsx");
  });

  it("configures prettier for supported file types", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("prettier");
  });

  it("uses ES module export syntax", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("export default");
  });
});

// ---------------------------------------------------------------------------
// infra stack module content — database-stack
// ---------------------------------------------------------------------------

describe("Phase 6 infra/src/stacks/modules/database-stack.ts.hbs content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "infra",
    "src",
    "stacks",
    "modules",
    "database-stack.ts.hbs"
  );

  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("{{projectName}}");
  });

  it("defines the DatabaseStack class", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("DatabaseStack");
  });

  it("extends ServiceStack", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("ServiceStack");
  });

  it("creates a DynamoDB Table with pk partition key", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("dynamodb.Table");
    expect(raw).toContain('"pk"');
  });

  it("creates a DynamoDB Table with sk sort key", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain('"sk"');
  });

  it("contains // @feature:rds conditional lines", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("// @feature:rds");
  });

  it("references removalPolicy for DynamoDB table", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("removalPolicy");
  });

  it("emits CfnOutput exports", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("CfnOutput");
  });
});

// ---------------------------------------------------------------------------
// infra stack module content — monitoring-stack
// ---------------------------------------------------------------------------

describe("Phase 6 infra/src/stacks/modules/monitoring-stack.ts.hbs content", () => {
  const filePath = join(
    TEMPLATE_ROOT,
    "infra",
    "src",
    "stacks",
    "modules",
    "monitoring-stack.ts.hbs"
  );

  it("contains {{projectName}} placeholder", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("{{projectName}}");
  });

  it("defines the MonitoringStack class", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("MonitoringStack");
  });

  it("extends ServiceStack", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("ServiceStack");
  });

  it("creates a CloudWatch Dashboard", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("cloudwatch.Dashboard");
  });

  it("creates CloudWatch alarms", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("cloudwatch.Alarm");
  });

  it("creates an SNS topic for alarm notifications", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("sns.Topic");
  });

  it("emits DashboardUrl CfnOutput", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("DashboardUrl");
    expect(raw).toContain("CfnOutput");
  });

  it("emits AlarmTopicArn CfnOutput", async () => {
    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("AlarmTopicArn");
  });
});

// ---------------------------------------------------------------------------
// Part 3: .hbs files contain expected {{variable}} placeholders
//
// Reading the raw source of each .hbs file and asserting it still contains at
// least one {{placeholder}}.  This catches the case where a file was
// accidentally rendered (placeholders substituted) and committed as the source.
// ---------------------------------------------------------------------------

describe("Phase 6 .hbs files contain {{variable}} placeholders", () => {
  const checks: [string, string, string][] = [
    // database
    [
      "database/packages/database-client/package.json.hbs",
      join(
        TEMPLATE_ROOT,
        "database",
        "packages",
        "database-client",
        "package.json.hbs"
      ),
      "{{projectName}}",
    ],
    [
      "database/packages/database-client/tsconfig.json.hbs",
      join(
        TEMPLATE_ROOT,
        "database",
        "packages",
        "database-client",
        "tsconfig.json.hbs"
      ),
      "{{projectName}}",
    ],
    // monitoring
    [
      "monitoring/packages/monitoring/package.json.hbs",
      join(
        TEMPLATE_ROOT,
        "monitoring",
        "packages",
        "monitoring",
        "package.json.hbs"
      ),
      "{{projectName}}",
    ],
    [
      "monitoring/packages/monitoring/tsconfig.json.hbs",
      join(
        TEMPLATE_ROOT,
        "monitoring",
        "packages",
        "monitoring",
        "tsconfig.json.hbs"
      ),
      "{{projectName}}",
    ],
    // infra Phase 6 additions
    [
      "infra/src/stacks/modules/database-stack.ts.hbs",
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "database-stack.ts.hbs"
      ),
      "{{projectName}}",
    ],
    [
      "infra/src/stacks/modules/monitoring-stack.ts.hbs",
      join(
        TEMPLATE_ROOT,
        "infra",
        "src",
        "stacks",
        "modules",
        "monitoring-stack.ts.hbs"
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

describe("Phase 6 static template files have no un-substituted {{}} placeholders", () => {
  const staticFiles: [string, string][] = [
    // database-client static files
    [
      "database/packages/database-client/vitest.config.ts",
      join(
        TEMPLATE_ROOT,
        "database",
        "packages",
        "database-client",
        "vitest.config.ts"
      ),
    ],
    [
      "database/packages/database-client/src/index.ts",
      join(
        TEMPLATE_ROOT,
        "database",
        "packages",
        "database-client",
        "src",
        "index.ts"
      ),
    ],
    [
      "database/packages/database-client/src/dynamo-client.ts",
      join(
        TEMPLATE_ROOT,
        "database",
        "packages",
        "database-client",
        "src",
        "dynamo-client.ts"
      ),
    ],
    [
      "database/packages/database-client/src/types.ts",
      join(
        TEMPLATE_ROOT,
        "database",
        "packages",
        "database-client",
        "src",
        "types.ts"
      ),
    ],
    // cicd static files (no .hbs — no {{}} substitution needed in CI workflows)
    [
      "cicd/_github/workflows/ci.yml",
      join(TEMPLATE_ROOT, "cicd", "_github", "workflows", "ci.yml"),
    ],
    [
      "cicd/_github/workflows/deploy-staging.yml",
      join(TEMPLATE_ROOT, "cicd", "_github", "workflows", "deploy-staging.yml"),
    ],
    [
      "cicd/_github/workflows/deploy-production.yml",
      join(
        TEMPLATE_ROOT,
        "cicd",
        "_github",
        "workflows",
        "deploy-production.yml"
      ),
    ],
    // monitoring static files
    [
      "monitoring/packages/monitoring/vitest.config.ts",
      join(
        TEMPLATE_ROOT,
        "monitoring",
        "packages",
        "monitoring",
        "vitest.config.ts"
      ),
    ],
    [
      "monitoring/packages/monitoring/src/index.ts",
      join(
        TEMPLATE_ROOT,
        "monitoring",
        "packages",
        "monitoring",
        "src",
        "index.ts"
      ),
    ],
    [
      "monitoring/packages/monitoring/src/logger.ts",
      join(
        TEMPLATE_ROOT,
        "monitoring",
        "packages",
        "monitoring",
        "src",
        "logger.ts"
      ),
    ],
    [
      "monitoring/packages/monitoring/src/types.ts",
      join(
        TEMPLATE_ROOT,
        "monitoring",
        "packages",
        "monitoring",
        "src",
        "types.ts"
      ),
    ],
    // extras static files
    [
      "extras/lint-staged.config.js",
      join(TEMPLATE_ROOT, "extras", "lint-staged.config.js"),
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
