# Task: Configure tsup build tool

## ID
1.3

## Description
Create `tsup.config.ts` to build the CLI as an ESM bundle with a shebang banner. tsup bundles the CLI source into a single distributable file that can be executed directly via the `bin` entry in package.json.

## Dependencies
- Task 1.1: package.json must exist with tsup as a devDependency

## Inputs
- Entry point: `src/index.ts`
- Output format: ESM
- Target: Node 24
- Shebang required: `#!/usr/bin/env node`

## Outputs / Deliverables
- `tsup.config.ts` at project root

## Acceptance Criteria
- [ ] `tsup.config.ts` exists with correct configuration
- [ ] Entry point is `src/index.ts`
- [ ] Output format is `["esm"]`
- [ ] Target is `"node24"`
- [ ] Banner includes `#!/usr/bin/env node` shebang for the JS output
- [ ] `pnpm build` produces `dist/index.js` (once entry point exists)
- [ ] Built file starts with `#!/usr/bin/env node`

## Implementation Notes
- Use `banner: { js: "#!/usr/bin/env node" }` in tsup config
- Set `clean: true` to clear dist/ before each build
- Consider `dts: false` since this is a CLI tool, not a library -- no need for declaration files
- Do not bundle node_modules dependencies -- they should be resolved at runtime from `node_modules`

## Estimated Complexity
Low -- Straightforward tsup configuration

## Status
- [ ] Not Started
