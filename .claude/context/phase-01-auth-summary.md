# Phase 1 Summary: Core Types and Helpers (amber-shield)

## Completed On
2026-03-03

## What Was Built

- `src/types.ts` — Added `ProtectedEndpoints` interface (list/get/create/update/delete booleans) and optional `protectedEndpoints` field on `ModuleConfig`
- `src/module-context.ts` — Added `detectAuthSupport(projectDir)` that checks for `auth/` directory via `pathExists`
- `src/module-helpers.ts` — Extended `getModuleVariableMap()` with 6 auth variables; added `authMethodOptions()` and `buildAuthorizerSetup()` helpers

## Key APIs (for downstream tasks)

- `ProtectedEndpoints` — interface with `list`, `get`, `create`, `update`, `delete` boolean fields
- `ModuleConfig.protectedEndpoints?: ProtectedEndpoints` — optional field, absent = fully unprotected
- `detectAuthSupport(projectDir: string): Promise<boolean>` — checks if `auth/` exists in project root
- `getModuleVariableMap(config)` — now returns 14 keys (8 original + 6 auth): `authorizerSetup`, `listAuthOptions`, `getAuthOptions`, `createAuthOptions`, `updateAuthOptions`, `deleteAuthOptions`
- `authorizerSetup` contains `{{projectName}}` and `{{ModuleName}}` placeholders resolved in same replaceAll pass

## Patterns Established

- Auth variables use empty string `""` when not protected — templates can include `{{authorizerSetup}}` unconditionally
- Per-endpoint auth options (e.g. `{{createAuthOptions}}`) produce `, { authorizer, authorizationType: ... }` string that appends directly to `addMethod()` calls
- `buildAuthorizerSetup()` imports existing authorizer Lambda via `cdk.Fn.importValue` — no new Lambda created

## Decisions Made

- `protectedEndpoints` is optional on `ModuleConfig` (not required with defaults) to avoid breaking existing module generation flow
- Auth detection is structural (directory existence) not functional (stack deployment check)

## Dependencies Added
None

## Known Limitations
- `detectAuthSupport` only checks directory existence, not that the auth stack is correctly configured/deployed
