/**
 * Programmatic README.md generator for scaffolded projects.
 *
 * The README is built in code (not from a template) because section content
 * varies significantly by preset and feature flags, and the `// @feature:X`
 * conditional system only works for JS/TS-style comments.
 *
 * Follows the same pattern as `pnpm-workspace.yaml` — generated in the
 * scaffolder after template files are copied.
 */

import type { ProjectConfig } from "../types.js";

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function header(config: ProjectConfig): string {
  return `# ${config.projectName}

A full-stack TypeScript AWS project scaffolded with [vibe-ts-cdk-template](https://github.com/anthropics/vibe-ts-cdk-template).

**Preset**: ${config.preset} · **Region**: ${config.awsRegion}`;
}

function prerequisites(): string {
  return `## Prerequisites

- [Node.js](https://nodejs.org/) 24.x LTS
- [pnpm](https://pnpm.io/) 10+
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html) (\`npm i -g aws-cdk\`)`;
}

function quickStart(config: ProjectConfig): string {
  return `## Quick Start

\`\`\`bash
cd ${config.projectName}
pnpm install
pnpm build
pnpm test
pnpm dev
\`\`\``;
}

function projectStructure(config: ProjectConfig): string {
  const { features } = config;
  const lines: string[] = [
    `${config.projectName}/`,
    "├── infra/                  # CDK infrastructure stacks",
    "├── services/",
    "│   ├── health/             # Health-check microservice (port 3001)",
    "│   └── users/              # Users microservice (port 3002)",
    "├── dev-gateway/            # Local dev proxy (port 3000)",
    "├── packages/",
    "│   ├── eslint-config/      # Shared ESLint configuration",
    "│   ├── lambda-utils/       # Lambda handler utilities",
    "│   ├── shared-types/       # Cross-service TypeScript types",
    "│   ├── tsconfig/           # Shared TypeScript configs",
    "│   └── utils/              # Shared utility functions",
  ];

  if (features.database) {
    lines.push(
      "│   ├── database-client/    # DynamoDB (+ RDS) client utilities"
    );
  }

  if (features.frontend) {
    lines.push(
      "├── frontend/               # Vite + React SPA (port 5173)"
    );
  }
  if (features.auth) {
    lines.push(
      "├── auth/                   # Cognito authorizer Lambda"
    );
  }
  if (features.e2e) {
    lines.push(
      "├── e2e/                    # Playwright end-to-end tests"
    );
  }
  if (features.cicd) {
    lines.push(
      "├── .github/workflows/      # GitHub Actions CI/CD"
    );
  }
  if (features.monitoring) {
    lines.push(
      "├── monitoring/             # CloudWatch dashboards & alarms"
    );
  }

  lines.push(
    "├── pnpm-workspace.yaml",
    "├── turbo.json",
    "└── package.json"
  );

  return `## Project Structure

\`\`\`
${lines.join("\n")}
\`\`\``;
}

function availableScripts(config: ProjectConfig): string {
  const { features } = config;

  let scripts = `## Available Scripts

### Root (via Turbo)

| Command | Description |
|---------|-------------|
| \`pnpm build\` | Build all packages and services |
| \`pnpm test\` | Run unit tests across all packages |
| \`pnpm dev\` | Start local development servers |
| \`pnpm lint\` | Lint all packages |
| \`pnpm typecheck\` | Type-check all packages |`;

  if (features.e2e) {
    scripts += `
| \`pnpm test:e2e\` | Run Playwright end-to-end tests |`;
  }

  scripts += `

### Infrastructure (infra/)

| Command | Description |
|---------|-------------|
| \`pnpm cdk synth\` | Synthesize CloudFormation templates |
| \`pnpm cdk deploy --all\` | Deploy all stacks |
| \`pnpm cdk diff\` | Preview infrastructure changes |
| \`pnpm cdk destroy --all\` | Tear down all stacks |`;

  return scripts;
}

function servicesSection(): string {
  return `## Services

Each service is an independent Lambda function behind its own API Gateway.

| Service | Local Port | Description |
|---------|-----------|-------------|
| health | 3001 | Health-check endpoint |
| users | 3002 | User management CRUD |

Services use [Hono](https://hono.dev/) as a dev-only server for local development. In production, the Lambda handler is the entry point — Hono is not deployed.

### Dev Gateway (port 3000)

The dev-gateway proxies requests to individual services during local development, providing a single entry point at \`http://localhost:3000\`.

| Route | Target |
|-------|--------|
| \`/api/health/*\` | http://localhost:3001 |
| \`/api/users/*\` | http://localhost:3002 |`;
}

function sharedPackages(config: ProjectConfig): string {
  const { features } = config;
  const rows = [
    "| lambda-utils | Lambda handler wrappers and middleware |",
    "| shared-types | Cross-service TypeScript type definitions |",
    "| utils | Shared utility functions |",
    "| tsconfig | Shared TypeScript configurations |",
    "| eslint-config | Shared ESLint configuration |",
  ];

  if (features.database) {
    rows.push("| database-client | DynamoDB (+ RDS) client utilities |");
  }

  return `## Shared Packages

Located under \`packages/\`, shared via pnpm workspace protocol.

| Package | Description |
|---------|-------------|
${rows.join("\n")}`;
}

function frontendSection(): string {
  return `## Frontend

Vite + React SPA served at \`http://localhost:5173\` during development.

\`\`\`bash
cd frontend
pnpm dev       # Start Vite dev server
pnpm build     # Production build
pnpm preview   # Preview production build
\`\`\`

The frontend proxies API requests to the dev-gateway during local development via Vite's proxy configuration.`;
}

function authSection(): string {
  return `## Authentication

Uses [Amazon Cognito](https://aws.amazon.com/cognito/) for user authentication.

- **User Pool** — created in the auth CDK stack
- **Authorizer Lambda** — validates JWT tokens on protected API routes
- **Frontend integration** — login/signup flows use the Cognito hosted UI

After deployment, configure the Cognito User Pool ID and App Client ID as environment variables.`;
}

function databaseSection(config: ProjectConfig): string {
  let content = `## Database

### DynamoDB

Each service gets its own DynamoDB table defined in the infrastructure stacks. Tables use on-demand billing by default.`;

  if (config.features.rds) {
    content += `

### RDS (Aurora Serverless v2)

Aurora Serverless v2 PostgreSQL is provisioned for relational data needs. The cluster auto-scales based on load and pauses when idle to reduce costs.

- **VPC** — Aurora runs inside a private subnet
- **RDS Proxy** — connection pooling for Lambda
- **Secrets Manager** — database credentials stored securely`;
  }

  return content;
}

function cicdSection(): string {
  return `## CI/CD

GitHub Actions workflows are located in \`.github/workflows/\`.

| Workflow | Trigger | Description |
|----------|---------|-------------|
| ci.yml | Push / PR | Lint, type-check, test |
| deploy.yml | Push to main | Deploy to dev stage |

Deployment stages: **dev** → **staging** → **prod**. Promote by merging to the corresponding branch or triggering a manual workflow dispatch.`;
}

function monitoringSection(): string {
  return `## Monitoring

CloudWatch dashboards and alarms are provisioned via CDK.

- **Dashboard** — API Gateway latency, Lambda errors, DynamoDB throttles
- **Alarms** — SNS notifications for error-rate thresholds
- **Log groups** — structured JSON logging from all Lambdas`;
}

function deploymentSection(config: ProjectConfig): string {
  const { features } = config;

  let content = `## Deployment

Deploy using the AWS CDK CLI. All stacks are deployed to the \`${config.awsRegion}\` region.

\`\`\`bash
cd infra

# Deploy all stacks to dev
pnpm cdk deploy --all -c stage=dev

# Deploy to staging
pnpm cdk deploy --all -c stage=staging

# Deploy to production
pnpm cdk deploy --all -c stage=prod
\`\`\`

### Stacks

| Stack | Resources |
|-------|-----------|
| \`{stage}-${config.projectName}-health\` | Health service Lambda + API Gateway |
| \`{stage}-${config.projectName}-users\` | Users service Lambda + API Gateway |`;

  if (features.auth) {
    content += `
| \`{stage}-${config.projectName}-auth\` | Cognito User Pool + Authorizer Lambda |`;
  }
  if (features.frontend) {
    content += `
| \`{stage}-${config.projectName}-frontend\` | S3 + CloudFront distribution |`;
  }
  if (features.database) {
    content += `
| \`{stage}-${config.projectName}-database\` | DynamoDB tables${config.features.rds ? " + Aurora Serverless v2" : ""} |`;
  }
  if (features.monitoring) {
    content += `
| \`{stage}-${config.projectName}-monitoring\` | CloudWatch dashboards + alarms |`;
  }

  return content;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate the full README.md content for a scaffolded project.
 *
 * Sections are included or omitted based on the project's feature flags so
 * each preset gets a tailored README.
 *
 * @param config - Fully-resolved project configuration.
 * @returns The README.md content as a string.
 */
export function generateReadme(config: ProjectConfig): string {
  const { features } = config;

  const sections: string[] = [
    header(config),
    prerequisites(),
    quickStart(config),
    projectStructure(config),
    availableScripts(config),
    servicesSection(),
    sharedPackages(config),
  ];

  if (features.frontend) sections.push(frontendSection());
  if (features.auth) sections.push(authSection());
  if (features.database) sections.push(databaseSection(config));
  if (features.cicd) sections.push(cicdSection());
  if (features.monitoring) sections.push(monitoringSection());

  sections.push(deploymentSection(config));

  return sections.join("\n\n") + "\n";
}
