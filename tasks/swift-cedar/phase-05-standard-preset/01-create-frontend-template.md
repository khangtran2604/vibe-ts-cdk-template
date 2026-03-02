# Task: Create frontend (Vite + React) template

## ID
5.1

## Description
Create the `templates/frontend/` directory with a Vite + React application using feature-based folder structure. This includes the app shell, routing setup, a home page feature, shared components/hooks, and environment-based API client configuration.

## Dependencies
- Task 4.6: Minimal preset verified (frontend builds on top of working services)

## Inputs
- Frontend structure from PLAN.md
- React 19, Vite 7, react-router 7
- Variables: `{{projectName}}`
- Environment: `VITE_API_URL=http://localhost:3000` (dev gateway)

## Outputs / Deliverables
- `templates/frontend/package.json.hbs`
- `templates/frontend/vite.config.ts`
- `templates/frontend/tsconfig.json`
- `templates/frontend/index.html.hbs`
- `templates/frontend/_env.development`
- `templates/frontend/_env.production`
- `templates/frontend/src/main.tsx`
- `templates/frontend/src/App.tsx`
- `templates/frontend/src/features/home/HomePage.tsx`
- `templates/frontend/src/features/home/components/` (placeholder)
- `templates/frontend/src/shared/components/` (placeholder)
- `templates/frontend/src/shared/hooks/` (placeholder)
- `templates/frontend/src/shared/lib/api.ts`
- `templates/frontend/src/assets/logo.svg`

## Acceptance Criteria
- [ ] Vite config has React plugin and correct dev server port (5173)
- [ ] React Router configured with at least a home route
- [ ] `api.ts` reads `VITE_API_URL` from environment for API calls
- [ ] `.env.development` sets `VITE_API_URL=http://localhost:3000`
- [ ] `.env.production` has placeholder for production API URL
- [ ] Feature-based folder structure with `features/home/` as example
- [ ] `pnpm dev` starts Vite dev server
- [ ] `pnpm build` produces production build

## Implementation Notes
- Use React 19 with the latest router API (react-router v7)
- Keep the frontend minimal but well-structured -- it's a starting point, not a full app
- The api.ts client should be a simple fetch wrapper, not axios or similar
- Vite proxy can optionally be configured to forward `/api/*` to the dev gateway
- Include a basic CSS file or use inline styles -- keep styling minimal

## Estimated Complexity
Medium -- Standard Vite + React setup with routing and API client

## Status
- [ ] Not Started
