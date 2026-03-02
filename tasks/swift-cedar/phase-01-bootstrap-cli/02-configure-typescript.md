# Task: Configure TypeScript with tsconfig.json

## ID
1.2

## Description
Create the `tsconfig.json` for the CLI tool with settings appropriate for a Node.js 24 ESM project. This configuration governs how TypeScript compiles the CLI source code and affects IDE support during development.

## Dependencies
- Task 1.1: package.json must exist with TypeScript as a devDependency

## Inputs
- Target: Node 24 (ES2024 features available)
- Module system: ESM (NodeNext)
- Source directory: `src/`
- Output directory: `dist/` (handled by tsup, but tsconfig still needed for IDE)

## Outputs / Deliverables
- `tsconfig.json` at project root

## Acceptance Criteria
- [ ] `tsconfig.json` exists with `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`
- [ ] `"target"` set to `"ES2024"` or higher
- [ ] `"strict": true` enabled
- [ ] `"outDir": "dist"` configured
- [ ] `"include"` covers `["src"]`
- [ ] `"exclude"` covers `["node_modules", "dist", "templates", "test"]`
- [ ] TypeScript `tsc --noEmit` passes (once source files exist)

## Implementation Notes
- tsup handles the actual build, but tsconfig.json is still needed for IDE support and type checking
- Use `"moduleResolution": "NodeNext"` to match the ESM module system
- Include `"skipLibCheck": true` for faster type checking
- Consider adding `"resolveJsonModule": true` if you need to import package.json for version info

## Estimated Complexity
Low -- Standard tsconfig for Node.js ESM project

## Status
- [ ] Not Started
