# Task: Create CI/CD template (GitHub Actions)

## ID
6.2

## Description
Create the `templates/cicd/` directory with GitHub Actions workflow files for continuous integration, staging deployment, and production deployment. Workflows should lint, test, build, and deploy the monorepo using CDK.

## Dependencies
- Task 4.6: Minimal preset verified (CI runs the same commands)

## Inputs
- CI/CD structure from PLAN.md: ci.yml, deploy-staging.yml, deploy-production.yml
- Turbo commands: build, test, lint

## Outputs / Deliverables
- `templates/cicd/_github/workflows/ci.yml` (underscore prefix for `.github`)
- `templates/cicd/_github/workflows/deploy-staging.yml`
- `templates/cicd/_github/workflows/deploy-production.yml`

## Acceptance Criteria
- [ ] `ci.yml` triggers on pull requests, runs: install, lint, build, test
- [ ] `deploy-staging.yml` triggers on push to main, deploys with `cdk deploy --all -c stage=staging`
- [ ] `deploy-production.yml` is manual trigger (workflow_dispatch), deploys with `-c stage=prod`
- [ ] All workflows use pnpm with caching for fast installs
- [ ] AWS credentials configured via GitHub OIDC or secrets
- [ ] Node version matches project requirements (24.x)
- [ ] Turbo caching is leveraged in CI

## Implementation Notes
- Use `pnpm/action-setup` and `actions/setup-node` with pnpm caching
- For AWS credentials, use `aws-actions/configure-aws-credentials` with OIDC (preferred) or secrets
- Production deployment should require manual approval (environment protection rules)
- Consider adding Turbo remote caching for faster CI builds
- Use `--concurrency` flag with turbo if needed to control CI resource usage

## Estimated Complexity
Medium -- Standard GitHub Actions patterns with AWS deployment

## Status
- [x] Complete
