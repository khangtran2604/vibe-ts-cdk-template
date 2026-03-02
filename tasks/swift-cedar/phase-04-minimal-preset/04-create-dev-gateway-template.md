# Task: Create dev gateway template

## ID
4.4

## Description
Create the `templates/dev-gateway/` directory with a local development proxy that routes requests to individual service dev servers. This provides a single entry point (port 3000) for the frontend to call, mirroring the API Gateway routing in production.

## Dependencies
- Task 4.2: Health service (target for proxy routing)
- Task 4.3: Users service (target for proxy routing)

## Inputs
- Routing rules: /health -> localhost:3001, /users -> localhost:3002
- Port: 3000 (gateway)
- Variables: `{{projectName}}`

## Outputs / Deliverables
- `templates/dev-gateway/package.json.hbs`
- `templates/dev-gateway/tsconfig.json`
- `templates/dev-gateway/src/gateway.ts`

## Acceptance Criteria
- [ ] Gateway listens on port 3000
- [ ] Proxies `/health/*` to `http://localhost:3001`
- [ ] Proxies `/users/*` to `http://localhost:3002`
- [ ] Handles CORS headers for frontend development
- [ ] `dev` script uses `tsx watch` for hot reload
- [ ] Package.json has minimal dependencies (just what's needed for proxying)

## Implementation Notes
- Can use `http-proxy` or Node.js native `http` module with manual proxying
- Alternatively, use Hono as the gateway server with proxy middleware
- Consider adding CORS middleware so frontend can call the gateway during local dev
- The gateway should be easily extensible when new services are added
- Consider logging incoming requests for debugging

## Estimated Complexity
Medium -- HTTP proxy with routing logic

## Status
- [ ] Not Started
