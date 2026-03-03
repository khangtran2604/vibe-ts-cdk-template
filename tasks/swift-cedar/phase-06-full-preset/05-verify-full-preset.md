# Task: Verify full preset end-to-end (with and without RDS)

## ID
6.5

## Description
Run the full verification loop for the full preset, both with and without the `--rds` flag. Verify all directories are generated, all workspaces build and test, and all conditional features are correctly processed.

## Dependencies
- Task 6.1: Database template
- Task 6.2: CI/CD template
- Task 6.3: Monitoring template
- Task 6.4: Extras template

## Inputs
- Built CLI (`pnpm build`)
- Verification commands from PLAN.md

## Outputs / Deliverables
- Verified working full preset (with and without RDS)
- Any bug fixes applied

## Acceptance Criteria
- [ ] `node dist/index.js --preset full -y` generates complete project without RDS
- [ ] `node dist/index.js --preset full --rds -y` generates complete project with RDS
- [ ] All directories present: infra, services, dev-gateway, packages, frontend, auth, e2e, database components, .github, .husky, monitoring utilities
- [ ] `pnpm install && pnpm build && pnpm test` succeeds for both variants
- [ ] CDK synth includes all stacks (including database, monitoring)
- [ ] RDS conditionals correctly included/excluded based on `--rds` flag
- [ ] GitHub Actions workflows are syntactically valid YAML
- [ ] Husky hooks have correct permissions
- [ ] lint-staged runs correctly on staged files
- [ ] No leftover `{{variable}}` or unprocessed `// @feature:X` lines

## Implementation Notes
- Test both `--rds` and without `--rds` to verify conditional processing
- Validate GitHub Actions YAML syntax (consider using `actionlint` if available)
- Check that database stack is only included in full preset, not standard
- Verify the complete pnpm-workspace.yaml has all entries for full preset

## Estimated Complexity
Medium -- Comprehensive verification of the most complex preset

## Status
- [x] Complete
