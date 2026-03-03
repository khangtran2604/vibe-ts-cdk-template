# Verify CLI App — End-to-End Scaffold Verification

You are an automated verification agent for the `vibe-ts-cdk-template` CLI scaffolding tool. Your job is to build the CLI, generate a project, start it, and verify all endpoints work correctly. When something fails, you diagnose and fix it — then re-verify.

## Arguments

`$ARGUMENTS` contains the preset to test. Default: `minimal`. Valid values: `minimal`, `standard`, `full`, `full --rds`.

## Variables

Resolve these first:

- **PRESET**: The preset name from `$ARGUMENTS` (default `minimal`)
- **RDS_FLAG**: If `$ARGUMENTS` contains `--rds`, set to `--rds`, else empty
- **PROTECTED_FLAG**: If PRESET is `standard` or `full`, set to `--protected`, else empty
- **TEST_TOKEN**: `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciJ9.sig` (valid JWT structure with `sub` claim — signature not verified locally)
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
lsof -ti:3000,3001,3002,3003,5173 | xargs kill -9 2>/dev/null || true
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

If build fails, this is likely a template bug. Jump to STEP 14 (diagnosis).

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

### STEP 9: Report Scaffold Results

Format results as a verification table:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Scaffold Verification Results: {PRESET} preset
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

If ALL scaffold tests pass, proceed to STEP 10 (Module Verification).
If any scaffold test FAILS, jump to STEP 14 (diagnosis).

### STEP 10: Generate Module

Run (include `--protected` for standard/full presets):
```bash
cd {PROJECT_DIR} && node {CLI_DIR}/dist/index.js module orders {PROTECTED_FLAG} -y --no-install
```

For **minimal** preset, PROTECTED_FLAG is empty so the command is:
```bash
cd {PROJECT_DIR} && node {CLI_DIR}/dist/index.js module orders -y --no-install
```

Verify exit code 0. On failure, jump to STEP 14 (diagnosis).

### STEP 11: Rebuild After Module Generation

Run:
```bash
cd {PROJECT_DIR} && pnpm install && pnpm build
```

On failure, jump to STEP 14 (diagnosis).

### STEP 12: Restart Dev Servers

1. Kill all ports:
   ```bash
   lsof -ti:3000,3001,3002,3003,5173 | xargs kill -9 2>/dev/null || true
   ```
2. Start `pnpm dev` in background:
   ```bash
   cd {PROJECT_DIR} && pnpm dev > /tmp/verify-dev-{PRESET}-module.log 2>&1
   ```
   Use `run_in_background: true`.
3. Poll ports for readiness (timeout 30 seconds, poll every 2 seconds):
   - **Port 3001** (health): `curl -sf http://localhost:3001/health`
   - **Port 3002** (users): `curl -sf http://localhost:3002/users`
   - **Port 3003** (orders): `curl -sf http://localhost:3003/orders`
   - **Port 3000** (gateway): `curl -sf http://localhost:3000/health`
   - **Port 5173** (Vite frontend, standard+ only): `curl -sf http://localhost:5173/`

### STEP 13: Verify Module

Run all module verification checks and collect results.

#### 13a. Structure Checks

Verify these files/directories exist in PROJECT_DIR and contain expected content:

| # | Check | Description |
|---|-------|-------------|
| M1 | `services/orders/` exists | Module directory created |
| M2 | `services/orders/src/handlers/create.ts` exists | Handler files generated |
| M3 | `services/orders/src/handlers/list.ts` exists | Handler files generated |
| M4 | `infra/src/stacks/modules/orders-stack.ts` exists | CDK stack generated |
| M5 | `infra/src/index.ts` contains `import { OrdersStack }` | Import injected |
| M6 | `infra/src/index.ts` contains `new OrdersStack(` | Instance injected |
| M7 | `dev-gateway/src/gateway.ts` contains `"/orders"` | Gateway route injected |

**Protected structure checks (standard/full only — SKIP for minimal):**

| # | Check | Description |
|---|-------|-------------|
| M8 | `infra/src/stacks/modules/orders-stack.ts` contains `TokenAuthorizer` | CDK authorizer construct |
| M9 | `infra/src/stacks/modules/orders-stack.ts` contains `Fn.importValue` | Auth stack ARN imported |
| M10 | `infra/src/stacks/modules/orders-stack.ts` contains `authorizationType` | Method auth options set |
| M11 | `services/orders/src/app.ts` contains `localAuth` | Local auth middleware imported |
| M12 | `services/orders/src/app.ts` contains `auth,` | Auth middleware applied to routes |

#### 13b. API Tests via Gateway (port 3000)

**IMPORTANT**: For standard/full presets, all orders endpoints are protected. Include `Authorization: Bearer {TEST_TOKEN}` header on every orders request. For minimal preset, no auth header needed.

| # | Method | URL | Headers | Body | Expected Status | Expected Body Contains |
|---|--------|-----|---------|------|----------------|----------------------|
| M13 | GET | `http://localhost:3000/orders` | Auth header (std/full) | — | 200 | `"items"` |
| M14 | POST | `http://localhost:3000/orders` | Auth header (std/full) | `{"name":"Test Order"}` | 201 | `"id"` |
| M15 | GET | `http://localhost:3000/orders/{id}` | Auth header (std/full) | — | 200 | `"Test Order"` |
| M16 | GET | `http://localhost:3000/orders` | Auth header (std/full) | — | 200 | `"items"` with 1 entry |
| M17 | POST | `http://localhost:3000/orders` | Auth header (std/full) | `{}` | 400 | `"error"` |

For test M14, capture the returned `id` from the response body to use in test M15.

Curl examples for standard/full (with auth):
```bash
curl -s -w "\n%{http_code}" http://localhost:3000/orders -H "Authorization: Bearer {TEST_TOKEN}"
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/orders -H "Content-Type: application/json" -H "Authorization: Bearer {TEST_TOKEN}" -d '{"name":"Test Order"}'
```

#### 13c. Regression Tests (existing services still work)

| # | Method | URL | Expected Status | Description |
|---|--------|-----|----------------|-------------|
| M18 | GET | `http://localhost:3000/health` | 200 | Health unbroken |
| M19 | GET | `http://localhost:3000/users` | 200 | Users unbroken |

#### 13d. Protected Route Auth Tests (standard/full only — SKIP for minimal)

Test the local auth middleware on a protected endpoint (`POST /orders`):

| # | Test | Method | URL | Headers | Expected Status | Expected Body Contains |
|---|------|--------|-----|---------|----------------|----------------------|
| P1 | No auth header | POST | `http://localhost:3000/orders` | None | 401 | `"Unauthorized"` |
| P2 | Invalid token format | POST | `http://localhost:3000/orders` | `Authorization: Bearer not-a-jwt` | 403 | `"not authorized"` |
| P3 | Valid token succeeds | POST | `http://localhost:3000/orders` | `Authorization: Bearer {TEST_TOKEN}` + body `{"name":"Auth Test"}` | 201 | `"id"` |
| P4 | Unprotected endpoint still open | GET | `http://localhost:3000/health` | None | 200 | `"status"` |

Curl examples:
```bash
# P1: No auth
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"name":"test"}'

# P2: Invalid token
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/orders -H "Content-Type: application/json" -H "Authorization: Bearer not-a-jwt" -d '{"name":"test"}'

# P3: Valid token
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/orders -H "Content-Type: application/json" -H "Authorization: Bearer {TEST_TOKEN}" -d '{"name":"Auth Test"}'

# P4: Unprotected endpoint
curl -s -w "\n%{http_code}" http://localhost:3000/health
```

#### 13e. Report Module Results

Format results as a second verification table.

**For minimal preset** (M8-M12 and P1-P4 are SKIPped):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Module Verification Results: minimal preset
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  #   │ Test                       │ Status │ Details
 ─────┼────────────────────────────┼────────┼──────────
  M1  │ services/orders/ exists    │ PASS   │ directory
  M2  │ create.ts exists           │ PASS   │ file
  M3  │ list.ts exists             │ PASS   │ file
  M4  │ orders-stack.ts exists     │ PASS   │ file
  M5  │ OrdersStack import         │ PASS   │ injected
  M6  │ OrdersStack instance       │ PASS   │ injected
  M7  │ Gateway /orders route      │ PASS   │ injected
  M8  │ TokenAuthorizer in stack   │ SKIP   │ minimal preset
  M9  │ Fn.importValue in stack    │ SKIP   │ minimal preset
  M10 │ authorizationType in stack │ SKIP   │ minimal preset
  M11 │ localAuth import in app    │ SKIP   │ minimal preset
  M12 │ auth middleware in app     │ SKIP   │ minimal preset
  M13 │ GET /orders                │ PASS   │ 200
  M14 │ POST /orders               │ PASS   │ 201, created
  M15 │ GET /orders/:id            │ PASS   │ 200
  M16 │ GET /orders (with data)    │ PASS   │ 200, 1 item
  M17 │ POST /orders (invalid)     │ PASS   │ 400
  M18 │ GET /health (regression)   │ PASS   │ 200
  M19 │ GET /users (regression)    │ PASS   │ 200
  P1  │ POST /orders (no auth)    │ SKIP   │ minimal preset
  P2  │ POST /orders (bad token)  │ SKIP   │ minimal preset
  P3  │ POST /orders (valid token)│ SKIP   │ minimal preset
  P4  │ GET /health (unprotected) │ SKIP   │ minimal preset

  Result: 14/14 passed (+ 9 skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**For standard/full presets** (all checks run):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Module Verification Results: {PRESET} preset
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  #   │ Test                       │ Status │ Details
 ─────┼────────────────────────────┼────────┼──────────
  M1  │ services/orders/ exists    │ PASS   │ directory
  M2  │ create.ts exists           │ PASS   │ file
  M3  │ list.ts exists             │ PASS   │ file
  M4  │ orders-stack.ts exists     │ PASS   │ file
  M5  │ OrdersStack import         │ PASS   │ injected
  M6  │ OrdersStack instance       │ PASS   │ injected
  M7  │ Gateway /orders route      │ PASS   │ injected
  M8  │ TokenAuthorizer in stack   │ PASS   │ found
  M9  │ Fn.importValue in stack    │ PASS   │ found
  M10 │ authorizationType in stack │ PASS   │ found
  M11 │ localAuth import in app    │ PASS   │ found
  M12 │ auth middleware in app     │ PASS   │ found
  M13 │ GET /orders                │ PASS   │ 200
  M14 │ POST /orders               │ PASS   │ 201, created
  M15 │ GET /orders/:id            │ PASS   │ 200
  M16 │ GET /orders (with data)    │ PASS   │ 200, 1 item
  M17 │ POST /orders (invalid)     │ PASS   │ 400
  M18 │ GET /health (regression)   │ PASS   │ 200
  M19 │ GET /users (regression)    │ PASS   │ 200
  P1  │ POST /orders (no auth)    │ PASS   │ 401
  P2  │ POST /orders (bad token)  │ PASS   │ 403
  P3  │ POST /orders (valid token)│ PASS   │ 201
  P4  │ GET /health (unprotected) │ PASS   │ 200

  Result: 23/23 passed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If ALL module tests pass, jump to STEP 17 (cleanup).
If any module test FAILS, jump to STEP 14 (diagnosis).

### STEP 14: Diagnose Failures (on any FAIL)

When any test fails, use the **Agent tool** with `subagent_type: "js-debugger"` to diagnose:

Provide the agent with:
- Which tests failed and the actual vs expected responses
- The dev server log: `/tmp/verify-dev-{PRESET}.log` and `/tmp/verify-dev-{PRESET}-module.log` (if module step was reached)
- Relevant template source files to read:
  - `templates/dev-gateway/src/gateway.ts` — gateway routing
  - `templates/services/health/src/handler.ts` — health handler
  - `templates/services/users/src/handler.ts` — users handler
  - `templates/services/users/src/dev-server.ts` — users dev server
  - `templates/services/health/src/dev-server.ts` — health dev server
  - `templates/generators/module/src/app.ts.hbs` — module app template
  - `templates/generators/module/src/handlers/create.ts.hbs` — module create handler
  - `templates/generators/module/src/handlers/list.ts.hbs` — module list handler
  - `templates/generators/module/src/handlers/get.ts.hbs` — module get handler
  - `templates/generators/module/src/dev-server.ts.hbs` — module dev server
  - `templates/generators/infra-stack/stack.ts.hbs` — module CDK stack
  - `src/module-generator.ts` — module generation engine
  - `src/module-helpers.ts` — module string transforms and injection helpers
- The generated project dir for comparison: `{PROJECT_DIR}`

Ask the agent to identify the root cause and which **template files** (not generated files) need to be fixed.

### STEP 15: Fix Issues

Use the **Agent tool** with `subagent_type: "nodejs-performance-security"` to implement fixes:

Provide:
- The diagnosis report from Step 14
- The specific template files to fix (paths in CLI_DIR, under `templates/` or `src/`)

**CRITICAL CONSTRAINTS:**
- NEVER edit files in the generated project (`{PROJECT_DIR}`). All fixes go to `templates/` or `src/` in CLI_DIR.
- The agent must edit the actual template files, not just suggest changes.

### STEP 16: Re-verify (Loop)

After fixes are applied:
1. Go back to **STEP 2** (kill ports, rebuild CLI, regenerate, re-test)
2. Maximum **3 retry cycles**. If issues persist after 3 cycles, report all remaining failures and stop.
3. Track which cycle you're on: `Retry cycle {N}/3`

### STEP 17: Cleanup

1. Kill dev servers:
   ```bash
   lsof -ti:3000,3001,3002,3003,5173 | xargs kill -9 2>/dev/null || true
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
5. **Service ports**: health=3001, users=3002, orders=3003, gateway=3000, Vite=5173
6. **Gateway routes**: `/health/*` → localhost:3001, `/users/*` → localhost:3002, `/orders/*` → localhost:3003
7. **Max 3 fix cycles** — don't loop forever
8. **Auth testing**: For standard/full presets with `--protected`, orders API tests (M13-M17) must include `Authorization: Bearer {TEST_TOKEN}` header
9. **TEST_TOKEN**: Use a properly structured JWT with base64-encoded `{"sub":"test-user-123","username":"testuser"}` payload — signature is not verified locally
