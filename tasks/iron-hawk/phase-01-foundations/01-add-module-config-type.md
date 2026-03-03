# Task: Add ModuleConfig Type

## ID
1.1

## Description
Add the `ModuleConfig` interface to `src/types.ts`. This interface defines the configuration shape for generating a new CRUD service module and is consumed by the module generator, prompts, and CLI integration.

## Dependencies
None

## Inputs
- Existing `src/types.ts` file with `ProjectConfig`, `Preset`, and `FeatureFlags` types

## Outputs / Deliverables
- Updated `src/types.ts` with exported `ModuleConfig` interface

## Acceptance Criteria
- [ ] `ModuleConfig` interface is exported from `src/types.ts`
- [ ] Interface contains: `moduleName` (string, kebab-case), `entityName` (string, PascalCase singular), `port` (number), `projectDir` (string, absolute path), `projectName` (string), `installDeps` (boolean)
- [ ] Existing types are not modified or broken
- [ ] Build succeeds (`pnpm build`)

## Implementation Notes
```ts
export interface ModuleConfig {
  moduleName: string;    // kebab-case: "order-items"
  entityName: string;    // PascalCase singular: "OrderItem"
  port: number;          // auto-assigned: 3003
  projectDir: string;    // absolute path to project root
  projectName: string;   // from root package.json
  installDeps: boolean;
}
```

## Estimated Complexity
Low -- Adding a single interface to an existing file.

## Status
- [ ] Not Started
