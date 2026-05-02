# CI/CD Overview

## Purpose

The CI/CD setup validates the application with Playwright smoke and regression tests, publishes test artifacts, runs post-deploy checks and keeps a baseline security scan available through GitHub Actions.

## Workflows

GitHub Actions workflows are stored in `.github/workflows`.

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `ci.yml` | Pull requests and pushes to `main` | Install dependencies and run Playwright smoke or regression tests. |
| `post-deploy-smoke.yml` | Successful `CI` workflow run | Run smoke tests against deployed/staging URLs. |
| `allure-pages.yml` | Successful `CI` workflow run | Publish generated Allure HTML report to GitHub Pages. |
| `zap-baseline.yml` | Manual dispatch and weekly schedule | Run OWASP ZAP baseline scan against the deployed frontend. |

## Pull Request Validation

On pull requests, `ci.yml` runs:

```bash
npx playwright test --grep @smoke
```

The smoke suite covers the critical path:

- Login/register path through Supabase Auth.
- Profile creation.
- Feeding calculation.
- Feeding save.
- Feeding history.
- Protected endpoint behavior without a token.

## Regression On Main

On pushes to `main`, `ci.yml` runs:

```bash
npx playwright test --grep @regression
```

Regression coverage includes:

- API auth and validation checks.
- Ownership/RLS negative checks.
- Weight assessment behavior.
- UI dashboard and feeding behavior.
- Profile validation behavior.

## Post-Deploy Smoke

`post-deploy-smoke.yml` runs after a successful `CI` workflow and executes:

```bash
npx playwright test --grep @smoke
```

The workflow reads deployed environment URLs from GitHub Actions secrets:

- `STAGING_FRONTEND_BASE_URL`
- `STAGING_API_BASE_URL`

The Playwright config switches away from local web servers when `TEST_ENV=staging`.

## Allure Artifacts

`ci.yml` generates and uploads:

- `playwright-report`
- `test-results`
- `allure-results`
- `allure-report`

`allure-pages.yml` downloads the `allure-report` artifact from the completed CI run and deploys it to GitHub Pages.

Local Allure report generation:

```bash
npm run test:allure
```

## OWASP ZAP Baseline

`zap-baseline.yml` runs:

- Weekly on Monday at 06:00 UTC.
- Manually through `workflow_dispatch`.

The workflow uses `zaproxy/action-baseline` against:

```text
https://snake-feeding-app.vercel.app
```

It uploads the scan output as:

```text
zap-baseline-report
```

The current workflow records findings without failing the job:

- `fail_action: false`
- `allow_issue_writing: false`

## Deployment

Backend deployment:

- Target platform: Render.
- Runtime: Node.js 20.
- Start command maps to `npm --prefix server start`.
- Required environment includes Supabase URL/keys and cleanup secret for non-production test cleanup.

Frontend deployment:

- Target platform: Vercel.
- App folder: `client`.
- Security headers are configured in `client/vercel.json`.
- Frontend uses `VITE_API_BASE_URL` for the backend API URL.

## Secrets And Environment

CI uses GitHub Actions secrets for:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_CLEANUP_SECRET`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `STAGING_FRONTEND_BASE_URL`
- `STAGING_API_BASE_URL`

Security rule: service role key must stay backend-side and must not be exposed to frontend code or browser-side Playwright context.
