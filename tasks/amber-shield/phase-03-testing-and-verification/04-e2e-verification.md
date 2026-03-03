# Task: End-to-End Verification of Protected Module Feature

## ID
3.4

## Description
Run the full end-to-end verification sequence from the plan: build the CLI, scaffold a standard project, generate a protected module, and verify the output. Also generate an unprotected module and confirm existing behavior is unchanged. This is a manual verification step to confirm everything works in a real environment.

## Dependencies
- Task 3.3: All automated tests must pass first

## Inputs
- Built CLI (`pnpm build`)
- Verification commands from the plan

## Outputs / Deliverables
- Confirmation that all verification steps pass
- Any bug reports filed as follow-up tasks if issues are found

## Acceptance Criteria
- [ ] `pnpm build && pnpm test` passes (all unit + integration tests green)
- [ ] `pnpm build && node dist/index.js --preset standard -y` succeeds
- [ ] In generated project: `node ../dist/index.js module orders --protected -y` succeeds
- [ ] `infra/src/stacks/modules/orders-stack.ts` contains `TokenAuthorizer` and `Fn.importValue`
- [ ] `node ../dist/index.js module products -y` succeeds (unprotected)
- [ ] `infra/src/stacks/modules/products-stack.ts` has NO authorizer code
- [ ] Generated project builds successfully (`pnpm install && pnpm build`)

## Implementation Notes
Run the exact verification commands from the plan:

```bash
pnpm build && pnpm test

pnpm build && node dist/index.js --preset standard -y
cd my-app
node ../dist/index.js module orders --protected -y
# Verify: infra/src/stacks/modules/orders-stack.ts contains TokenAuthorizer + Fn.importValue

node ../dist/index.js module products -y
# Verify: infra/src/stacks/modules/products-stack.ts has NO authorizer code
```

Clean up generated project directories after verification.

## Estimated Complexity
Low -- Running predefined commands and checking output. Time is mostly waiting for builds.

## Status
- [ ] Not Started
