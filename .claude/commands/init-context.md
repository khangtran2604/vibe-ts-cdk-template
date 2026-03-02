# Generate Project Context System

You are a project context architect. Read the project plan and generate a complete context system: a slim CLAUDE.md plus layered context files that agents can load selectively.

## Input

Read `PLAN.md` (or whatever planning document the user references) thoroughly. Understand the full scope: stack, architecture, conventions, presets, phases, and verification steps.

## Output

Generate these files in one pass:

```
CLAUDE.md                              # Slim overview (~80-100 lines)
.claude/context/
  conventions.md                       # Code conventions, patterns, formats
  architecture.md                      # Project structure, architecture decisions
  dependencies.md                      # Package versions and rules
  testing.md                           # Test conventions and patterns
```

Also create `.claude/context/` directory if it doesn't exist.

---

## File 1: CLAUDE.md (~80-100 lines)

This is the only file ALWAYS loaded. Keep it ruthlessly concise. Include ONLY:

### What to include:

- **What This Is** — One-line project description
- **Stack** — Runtime, framework, build tool, test runner, key libraries (bullet list, no elaboration)
- **Commands** — dev, build, test, lint (code block, no explanation)
- **Context System** — Directory tree of `.claude/context/` with one-line description per file, plus a Context Loading Rules table mapping task types to required context files
- **Key Rules** — Non-obvious rules that Claude would get wrong by default (bullet list, max 10 items)
- **Do NOT** — Anti-patterns specific to this project (bullet list, max 10 items)
- **Agent Usage** — Table of agents and when to use each (if project has agents)
- **Verification** — Commands to verify the project works (code block)
- **Implementation Phases** — One-liner per phase with pointer to PLAN.md

### What to cut:

- Anything Claude would do correctly by default (standard TypeScript practices, basic ESM usage, etc.)
- Code examples — those go in context files
- Detailed conventions — those go in conventions.md
- Package version tables — those go in dependencies.md
- Architecture details — those go in architecture.md
- Test patterns — those go in testing.md

### Context System section template:

```markdown
## Context System

This project uses layered context files. Do NOT put detailed conventions here.
```

.claude/context/
conventions.md # [one-line description]
architecture.md # [one-line description]
dependencies.md # [one-line description]
testing.md # [one-line description]
phase-NN-summary.md # Auto-generated after each phase (by /impl)

```

### Context Loading Rules

| Task Type | Required Context Files |
|-----------|----------------------|
| [type 1]  | conventions.md, [others] |
| [type 2]  | conventions.md, [others] |
| Any task  | + latest phase-NN-summary.md |
```

Adapt the task types to what's relevant for THIS project (e.g., "CDK stacks", "Lambda handlers", "React components", "API endpoints").

---

## File 2: conventions.md

Everything an agent needs to write code that matches project style. Extract from PLAN.md:

- **Function/handler signatures** — Exact patterns with code examples
- **Response/return formats** — Success and error shapes with code examples
- **Naming conventions** — Files, variables, classes, database fields, API routes
- **Import conventions** — Ordering, grouping, protocols
- **Framework-specific patterns** — CDK naming, React component structure, API route patterns, etc.
- **Template/config conventions** — If the project has a template engine or config system, document the exact rules
- **Error handling patterns** — Standard error codes, error class structure, how errors propagate

Rules:

- Include ALL code examples — agents need copy-paste-able patterns
- Self-contained — an agent must write correct code from this file alone
- Do NOT include architecture decisions (that's architecture.md)
- Do NOT include test patterns (that's testing.md)
- Do NOT include package versions (that's dependencies.md)

---

## File 3: architecture.md

Everything an agent needs to understand WHERE code goes and HOW components connect. Extract from PLAN.md:

- **Project layout** — Full directory tree of the source project
- **Generated/output structure** — If the project generates output (like a scaffolder), the output directory tree
- **Component relationships** — How modules/services/packages depend on each other
- **Data flow** — How requests/data move through the system
- **Configuration patterns** — Environment-based config, stage/preset systems
- **Infrastructure patterns** — If applicable (CDK stacks, Docker services, deployment topology)
- **Local development strategy** — How to run the project locally, port assignments, proxy setup

Rules:

- Include code examples for non-obvious patterns (e.g., CDK stage config, proxy routing)
- Target ~150-200 lines
- Do NOT duplicate conventions (handler format, error response, etc.)

---

## File 4: dependencies.md

Package version reference. Extract from PLAN.md:

- **Version verification rule** — Always `npm view` / `pip show` / equivalent before adding
- **Core dependencies table** — Package name + version, grouped by category
- **Snapshot date** — When versions were last verified

Rules:

- Keep it short (~40-50 lines)
- Tables only, minimal prose
- Include the "always verify before adding" rule prominently at the top

---

## File 5: testing.md

Everything an agent needs to write correct tests. Derive from PLAN.md's testing strategy:

- **Test file locations** — Where each test type lives
- **Test file naming** — Conventions per test type (.test.ts, .spec.ts, etc.)
- **Mock strategy** — What to mock, how, factory patterns
- **Assertion style** — Explicit vs snapshot, what to verify
- **Test patterns per code type** — One complete code example for each type of code in the project (e.g., Lambda handler test, API endpoint test, React component test, CLI function test, infrastructure test)
- **Error/edge case patterns** — Standard edge cases to always test
- **Setup/teardown patterns** — Temp directories, database cleanup, mock reset

Rules:

- Include COMPLETE code examples — agents copy these as starting templates
- One pattern per code type in the project
- Target ~120-150 lines
- Do NOT duplicate conventions from conventions.md

---

## Quality Checks

Before finishing, verify:

1. **No duplication** — Each piece of information exists in exactly ONE file
2. **Self-contained layers** — An agent given CLAUDE.md + conventions.md can write correct code. Adding architecture.md tells it where. Adding testing.md tells it how to test.
3. **CLAUDE.md is slim** — Under 100 lines. No code examples. No tables longer than 10 rows.
4. **conventions.md has all patterns** — Read through PLAN.md's code examples and verify every pattern is captured
5. **architecture.md has all structure** — Every directory, every component relationship
6. **dependencies.md is current** — All packages mentioned in PLAN.md are listed
7. **testing.md has patterns for every code type** — If the project has 4 types of code, there should be 4 test pattern examples

## Adaptation

This is not a rigid template. Adapt to the project:

- **No tests in PLAN.md?** — Skip testing.md, remove from CLAUDE.md context table
- **No infrastructure?** — architecture.md focuses on app structure only
- **Monorepo?** — architecture.md needs workspace structure and cross-package conventions
- **Multiple languages?** — conventions.md may need language-specific sections
- **No dependencies table in PLAN.md?** — Still create dependencies.md with the verification rule and whatever packages are mentioned

The goal is: any agent receiving the right subset of these files has exactly enough context to do its job — no more, no less.
