# Task: Create CDK infrastructure templates

## ID
4.1

## Description
Create the `templates/infra/` directory with CDK stack templates. This includes the CDK app entry point, stage-based config, and the stack-per-service modules for health and users. The infra templates use `// @feature:X` conditionals for optional stacks (frontend, auth, database, monitoring).

## Dependencies
- Task 3.5: Base templates must exist (infra references root config patterns)
- Task 3.1: fs.ts must handle `.hbs` and `// @feature:X` processing

## Inputs
- CDK architecture from PLAN.md: stack-per-service, stage-based config
- Generated project structure for `infra/` directory
- Variables: `{{projectName}}`, `{{awsRegion}}`
- Feature conditionals for optional stack imports

## Outputs / Deliverables
- `templates/infra/package.json.hbs`
- `templates/infra/cdk.json`
- `templates/infra/tsconfig.json`
- `templates/infra/src/index.ts.hbs` -- CDK app entry with `// @feature:X` imports
- `templates/infra/src/config.ts.hbs` -- Stage config (dev, staging, prod)
- `templates/infra/src/stacks/modules/health-stack.ts.hbs`
- `templates/infra/src/stacks/modules/users-stack.ts.hbs`

## Acceptance Criteria
- [ ] `infra/package.json.hbs` has `aws-cdk-lib` and `constructs` as dependencies (latest stable versions)
- [ ] `cdk.json` has correct `app` entry: `"npx ts-node src/index.ts"` or equivalent
- [ ] `index.ts.hbs` reads stage from context: `app.node.tryGetContext("stage")`
- [ ] `config.ts.hbs` has placeholder configs for dev, staging, prod with `{{awsRegion}}`
- [ ] `health-stack.ts.hbs` creates an API Gateway + Lambda for health endpoint
- [ ] `users-stack.ts.hbs` creates an API Gateway + CRUD Lambdas for users
- [ ] Each service stack has its own API Gateway (not shared)
- [ ] `// @feature:frontend`, `// @feature:auth`, `// @feature:database`, `// @feature:monitoring` conditionals in index.ts.hbs

## Implementation Notes
- Use `aws-cdk-lib` constructs: `RestApi`, `LambdaIntegration`, `NodejsFunction` or `Function`
- Each stack should accept `stage` as a prop to vary naming/config
- Lambda code path should reference the service workspace: `../services/health/src/handlers/health.ts`
- Use `cdk.RemovalPolicy.DESTROY` for dev stage resources
- Stack naming convention: `{{projectName}}-{Service}Stack-{stage}`

## Estimated Complexity
High -- Requires CDK knowledge and careful template design with conditionals

## Status
- [ ] Not Started
