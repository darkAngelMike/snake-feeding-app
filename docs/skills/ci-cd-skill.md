# Skill: CI/CD for QA Automation

Use this skill when designing or updating CI/CD automation for snake-app tests.

## Pipeline Goals

- Fast feedback for critical regressions.
- Clear separation between smoke and full regression.
- Safe handling of Supabase and admin cleanup secrets.
- Reproducible test runs.

## Recommended Jobs

### Frontend Quality

- Install client dependencies.
- Run `npm run lint`.
- Run `npm run build`.

### Backend Quality

- Install server dependencies.
- Run `npm test`.

### API Smoke

- Start or target backend.
- Create isolated test user/profile.
- Run protected endpoint/auth smoke.
- Run calculate/feedings/history smoke.

### UI Smoke

- Start or target frontend and backend.
- Run Chromium smoke.
- Upload Playwright report and traces on failure.

### Regression

- Trigger manually or nightly.
- Run API and UI regression.
- Include mobile viewport.
- Include ownership/RLS tests.

## Environment Variables

Expected variables for future automation:

- `BASE_URL`
- `API_BASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ADMIN_CLEANUP_SECRET`

Backend-only variables:

- `SUPABASE_SERVICE_ROLE_KEY`

Never expose service role key to frontend builds or browser tests.

## Cleanup Safety

- Cleanup job must verify it is running against a test environment.
- Do not run cleanup against production Render/Supabase/Vercel.
- Prefer explicit manual approval for destructive cleanup until environment isolation is proven.

## Artifacts

Upload:

- Playwright HTML report
- traces/videos/screenshots on failure
- Allure results when reporting is added
- sanitized logs

## Open Questions

- Which CI provider will be used?
- Will tests run against local services, preview deployments or shared staging?
- What branch protection rules should require smoke tests?
