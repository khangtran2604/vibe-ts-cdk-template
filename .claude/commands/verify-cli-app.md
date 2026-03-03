# Verify CLI App — End-to-End Scaffold Verification

You are an automated verification agent for the `vibe-ts-cdk-template` CLI scaffolding tool. Your job is to build the CLI, generate a project, start it, and verify all endpoints work correctly. When something fails, you diagnose and fix it — then re-verify.

## Arguments

`$ARGUMENTS` contains the preset to test. Default: `minimal`. Valid values: `minimal`, `standard`, `full`, `full --rds`.

## Variables

Resolve these first:

- **PRESET**: The preset name from `$ARGUMENTS` (default `minimal`)
- **RDS_FLAG**: If `$ARGUMENTS` contains `--rds`, set to `--rds`, else empty
- **PROJECT_NAME**: `verify-output-{PRESET}` (e.g., `verify-output-minimal`)
- **PROJECT_DIR**: `/tmp/{PROJECT_NAME}`
- **CLI_DIR**: The current working directory (the CLI project root)

---

## Execution Flow

### STEP 1: Parse & Prepare

1. Parse `$ARGUMENTS` to extract PRESET and RDS_FLAG
2. Announce: `Verifying preset: {PRESET}`

### STEP 2: Kill Stale Ports

Run via Bash:
```bash
lsof -ti:3000,3001,3002,5173 | xargs kill -9 2>/dev/null || true
```
This ensures no leftover dev servers from prior runs block us.

### STEP 3: Build CLI

Run in CLI_DIR:
```bash
pnpm build
```
If this fails, STOP and report the build error.

### STEP 4: Generate Project

1. Remove any existing project dir:
   ```bash
   rm -rf /tmp/{PROJECT_NAME}
   ```
2. Generate the project:
   ```bash
   cd /tmp && node {CLI_DIR}/dist/index.js {PROJECT_NAME} --preset {PRESET} {RDS_FLAG} -y --no-git
   ```
3. Verify the directory was created and contains `package.json`.

If generation fails, STOP and report the error.

### STEP 5: Install & Build Generated Project

```bash
cd {PROJECT_DIR} && pnpm install && pnpm build
```

**IMPORTANT**: `pnpm build` is required before `pnpm dev` because the turbo `dev` pipeline has no `dependsOn: ["^build"]` — shared packages won't be compiled otherwise.

If build fails, this is likely a template bug. Jump to STEP 10 (diagnosis).

### STEP 6: Start Dev Servers

Run in background:
```bash
cd {PROJECT_DIR} && pnpm dev > /tmp/verify-dev-{PRESET}.log 2>&1
```

Use `run_in_background: true` for this command. Capture the task ID.

### STEP 7: Wait for Readiness

Poll these ports with curl until they respond (timeout after 30 seconds total, polling every 2 seconds):

- **Port 3001** (health service): `curl -sf http://localhost:3001/health`
- **Port 3002** (users service): `curl -sf http://localhost:3002/users`
- **Port 3000** (gateway): `curl -sf http://localhost:3000/health`
- **Port 5173** (Vite frontend, standard+ only): `curl -sf http://localhost:5173/`

Use a bash loop like:
```bash
for i in $(seq 1 15); do curl -sf http://localhost:3001/health > /dev/null 2>&1 && echo "PORT 3001 READY" && break; sleep 2; done
```

Do this for each required port in parallel.

### STEP 8: Run Verification Curls

Execute these HTTP calls and check responses:

#### 8a. Core API Tests (all presets)

| # | Method | URL | Body | Expected Status | Expected Body Contains |
|---|--------|-----|------|----------------|----------------------|
| 1 | GET | `http://localhost:3000/health` | — | 200 | `"status":"ok"` or `"status": "ok"` |
| 2 | GET | `http://localhost:3000/users` | — | 200 | `"items"` (empty array) |
| 3 | POST | `http://localhost:3000/users` | `{"name":"Test User","email":"test@example.com"}` | 201 | `"id"` |
| 4 | GET | `http://localhost:3000/users/{id}` | — | 200 | `"name":"Test User"` or `"name": "Test User"` |
| 5 | GET | `http://localhost:3000/users` | — | 200 | `"items"` with 1 entry |
| 6 | POST | `http://localhost:3000/users` | `{}` | 400 | `"error"` or `"message"` |
| 7 | GET | `http://localhost:3000/nonexistent` | — | 404 | `"NOT_FOUND"` or `"error"` |

For test 3, capture the returned `id` from the response body to use in test 4.

Use curl with `-s -w "\n%{http_code}"` to capture both body and status code.

#### 8b. Frontend Tests (standard and full presets only)

| # | Test | Command | Expected |
|---|------|---------|----------|
| 8 | Vite serves HTML | `curl -sf http://localhost:5173/` | 200, contains `<div id="root">` or `<!DOCTYPE html>` |

#### 8c. Structure Tests (full preset only)

Check these paths exist in PROJECT_DIR:

| # | Path | Description |
|---|------|-------------|
| 9 | `packages/database-client/` | Database client package |
| 10 | `.github/workflows/` | CI/CD workflows |

### STEP 9: Report Results

Format results as a verification table:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Verification Results: {PRESET} preset
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  # │ Test                    │ Status │ Details
 ───┼─────────────────────────┼────────┼──────────
  1 │ GET /health             │ PASS   │ 200
  2 │ GET /users              │ PASS   │ 200, empty
  3 │ POST /users             │ PASS   │ 201, created
  4 │ GET /users/:id          │ PASS   │ 200
  5 │ GET /users (with data)  │ PASS   │ 200, 1 item
  6 │ POST /users (invalid)   │ PASS   │ 400
  7 │ GET /nonexistent        │ PASS   │ 404
  8 │ Vite frontend           │ SKIP   │ minimal preset
  ...

  Result: 7/7 passed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If ALL tests pass, jump to STEP 13 (cleanup).

### STEP 10: Diagnose Failures (on any FAIL)

When any test fails, use the **Agent tool** with `subagent_type: "js-debugger"` to diagnose:

Provide the agent with:
- Which tests failed and the actual vs expected responses
- The dev server log: `/tmp/verify-dev-{PRESET}.log`
- Relevant template source files to read:
  - `templates/dev-gateway/src/gateway.ts` — gateway routing
  - `templates/services/health/src/handler.ts` — health handler
  - `templates/services/users/src/handler.ts` — users handler
  - `templates/services/users/src/dev-server.ts` — users dev server
  - `templates/services/health/src/dev-server.ts` — health dev server
- The generated project dir for comparison: `{PROJECT_DIR}`

Ask the agent to identify the root cause and which **template files** (not generated files) need to be fixed.

### STEP 11: Fix Issues

Use the **Agent tool** with `subagent_type: "nodejs-performance-security"` to implement fixes:

Provide:
- The diagnosis report from Step 10
- The specific template files to fix (paths in CLI_DIR, under `templates/` or `src/`)

**CRITICAL CONSTRAINTS:**
- NEVER edit files in the generated project (`{PROJECT_DIR}`). All fixes go to `templates/` or `src/` in CLI_DIR.
- The agent must edit the actual template files, not just suggest changes.

### STEP 12: Re-verify (Loop)

After fixes are applied:
1. Go back to **STEP 2** (kill ports, rebuild CLI, regenerate, re-test)
2. Maximum **3 retry cycles**. If issues persist after 3 cycles, report all remaining failures and stop.
3. Track which cycle you're on: `Retry cycle {N}/3`

### STEP 13: Cleanup

1. Kill dev servers:
   ```bash
   lsof -ti:3000,3001,3002,5173 | xargs kill -9 2>/dev/null || true
   ```
2. Report final status:
   - If all passed: `Verification PASSED for {PRESET} preset`
   - If failures remain: `Verification FAILED for {PRESET} preset — {N} issues unresolved after 3 fix cycles`

Do NOT remove the generated project directory — the user may want to inspect it at `/tmp/{PROJECT_NAME}`.

---

## Key Constraints (Always Follow)

1. **Never edit generated project files** — only `templates/` and `src/` in CLI_DIR
2. **Always rebuild CLI** (`pnpm build` in CLI_DIR) after any template/source fix
3. **Always `pnpm build` in generated project** before `pnpm dev` (turbo dev pipeline has no `dependsOn: ["^build"]`)
4. **Always kill stale ports** before starting dev servers
5. **Service ports**: health=3001, users=3002, gateway=3000, Vite=5173
6. **Gateway routes**: `/health/*` → localhost:3001, `/users/*` → localhost:3002
7. **Max 3 fix cycles** — don't loop forever
