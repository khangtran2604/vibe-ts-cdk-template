# Phase 2 Summary: Template and CLI Integration (amber-shield)

## Completed On
2026-03-03

## What Was Built

- `templates/generators/infra-stack/stack.ts.hbs` — Added `{{authorizerSetup}}` placeholder after API Gateway creation and `{{*AuthOptions}}` placeholders in all 5 `addMethod()` calls
- `src/module-prompts.ts` — Added `--protected` flag handling: auth support validation, multiselect endpoint picker, summary line, `protectedEndpoints` in returned config
- `src/index.ts` — Registered `--protected` option on module subcommand; fixed missing `pnpm build` in scaffold outro "Next steps"

## Key APIs (for downstream tasks)

- `runModulePrompts(name, flags)` — `flags` now accepts `protected?: boolean`; returns `ModuleConfig` with optional `protectedEndpoints`
- Module subcommand: `vibe-ts module <name> --protected [-y] [--no-install]`
- Template placeholders: `{{authorizerSetup}}`, `{{listAuthOptions}}`, `{{getAuthOptions}}`, `{{createAuthOptions}}`, `{{updateAuthOptions}}`, `{{deleteAuthOptions}}`

## Patterns Established

- Template placeholders resolve to empty strings when unprotected — no `@feature:` conditionals needed for auth
- Auth method options use multi-line join format for clean CDK code formatting
- `clack.multiselect` with `initialValues` for pre-selecting all endpoints; `required: true` prevents zero selection
- Auth validation gates (`detectAuthSupport`) run early to fail fast before any prompts

## Decisions Made

- `--protected` defaults to `false` (opt-in, not opt-out) — no `--no-protected` counterpart needed
- With `-y`, all 5 endpoints are protected by default (no interactive selection)
- Scaffold outro now always includes `pnpm build` step for all presets

## Dependencies Added
None

## Known Limitations
- `detectAuthSupport` only checks `auth/` directory existence, not that auth stack is correctly configured or deployed
