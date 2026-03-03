/**
 * The three project complexity presets offered by the CLI.
 *
 * - minimal  – CDK + Lambda + API Gateway only
 * - standard – adds Vite/React frontend, Cognito auth, and Playwright e2e
 * - full     – adds DynamoDB/RDS, GitHub Actions CI/CD, CloudWatch monitoring,
 *              and Husky/lint-staged git hooks
 */
export type Preset = "minimal" | "standard" | "full";

/**
 * Feature flags derived from the chosen preset (and any overrides the user
 * selects during prompts).  Each flag controls whether the corresponding
 * template directory is copied into the generated project.
 *
 * Kept intentionally flat — no nested objects — so they are trivial to
 * spread, serialize, and pass through the scaffolder pipeline.
 */
export interface FeatureFlags {
  /** Vite + React frontend application (standard+) */
  frontend: boolean;
  /** Cognito user-pool authorizer (standard+) */
  auth: boolean;
  /** Playwright end-to-end test suite (standard+) */
  e2e: boolean;
  /** DynamoDB table constructs (full) */
  database: boolean;
  /** RDS (Aurora Serverless v2) constructs — requires database:true (full) */
  rds: boolean;
  /** GitHub Actions CI/CD workflows (full) */
  cicd: boolean;
  /** CloudWatch dashboards and alarms (full) */
  monitoring: boolean;
  /** Husky + lint-staged pre-commit hooks (full) */
  hooks: boolean;
}

/**
 * The single configuration object passed from the interactive-prompt phase to
 * the scaffolding engine.  Every piece of user-supplied information lives here
 * so the scaffolder is a pure function of this config.
 */
export interface ProjectConfig {
  /** Slugified directory name for the generated project (e.g. "my-app") */
  projectName: string;
  /** Complexity preset selected by the user */
  preset: Preset;
  /** AWS region to target (e.g. "us-east-1") */
  awsRegion: string;
  /** Resolved feature flags for this configuration */
  features: FeatureFlags;
  /** Whether to run `git init` in the generated project */
  gitInit: boolean;
  /** Whether to run `pnpm install` after scaffolding */
  installDeps: boolean;
}

/**
 * Controls which CRUD endpoints require authentication via the Cognito
 * authorizer.  Each boolean flag maps to one API Gateway method.
 *
 * When all flags are `false` the module behaves exactly like an unprotected
 * module — no authorizer resources are created.
 */
export interface ProtectedEndpoints {
  list: boolean;
  get: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

/**
 * Configuration for generating a new CRUD service module inside an existing
 * scaffolded project.  Produced by the module prompts and consumed by the
 * module generator engine.
 */
export interface ModuleConfig {
  /** kebab-case module name, e.g. "order-items" */
  moduleName: string;
  /** PascalCase singular entity name, e.g. "OrderItem" */
  entityName: string;
  /** Dev-server port (auto-assigned), e.g. 3003 */
  port: number;
  /** Absolute path to the scaffolded project root */
  projectDir: string;
  /** Project name from root package.json */
  projectName: string;
  /** Whether to run pnpm install after generation */
  installDeps: boolean;
  /** Per-endpoint auth protection config; absent means fully unprotected */
  protectedEndpoints?: ProtectedEndpoints;
}
