# Task: Write module-generator and CLI Integration Tests

## ID
5.3

## Description
Write integration tests for the module generator and verify the CLI subcommand registration. The generator tests should use a temporary directory with a mock scaffolded project to verify the full generation flow end-to-end.

## Dependencies
- Task 3.1: Module generator must be implemented
- Task 4.2: CLI subcommand must be registered

## Inputs
- `src/module-generator.ts` with `generateModule()`
- `src/index.ts` with `module` subcommand
- Template files from `templates/generators/`

## Outputs / Deliverables
- New file `test/module-generator.test.ts`
- Updated `test/index.test.ts` (or new test verifying subcommand registration)

## Acceptance Criteria
- [ ] Generator test creates a temp directory mimicking a scaffolded project (with markers in infra/index.ts and dev-gateway/gateway.ts)
- [ ] Generator test runs `generateModule()` and verifies:
  - Service directory created with correct files
  - CDK stack written to correct location
  - Import injected into infra/src/index.ts
  - Instance injected into infra/src/index.ts
  - Route injected into dev-gateway/src/gateway.ts
  - All `{{variable}}` placeholders are replaced (no remaining `{{` in output files)
- [ ] Generator test verifies duplicate module guard throws
- [ ] CLI test verifies `module` subcommand is registered and appears in help output
- [ ] Temp directories are cleaned up after tests
- [ ] All tests pass: `pnpm test`

## Implementation Notes
- Use `fs.mkdtemp` to create a temporary directory for each test.
- Set up the temp dir with minimal files that the generator expects: `infra/src/index.ts` (with markers), `dev-gateway/src/gateway.ts` (with marker), `package.json`, `pnpm-workspace.yaml`, `services/` directory.
- Use vitest's `afterEach` to clean up temp directories.
- For the CLI registration test, you can import the program and check its commands, or run the CLI with `--help` and verify output contains "module".

## Estimated Complexity
High -- Integration tests require significant setup with temp directories and verification of multiple generated files.

## Status
- [x] Complete
