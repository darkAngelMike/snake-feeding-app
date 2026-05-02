# Snake Feeding App

React and Express application for planning and tracking ball python feedings. The project is organized as a QA Automation / SDET portfolio example with UI tests, API tests, CI/CD workflows, reporting, API documentation and security testing notes.

The business and testing source of truth is in `docs/`.

## Tech Stack

- Frontend: Vite, React, Supabase Auth client
- Backend: Express, Supabase Auth, Supabase DB/RLS
- Tests: Playwright Test, TypeScript
- Test architecture: Page Object Model, API service layer, fixtures, isolated test data builders
- Reporting: Allure Playwright, Playwright HTML report
- API documentation: Swagger / OpenAPI
- CI/CD: GitHub Actions
- Deployment: Render backend, Vercel frontend
- Security: Burp Suite manual tests, OWASP ZAP baseline scan, Helmet, CORS, CSP/security headers

## QA / SDET Highlights

- Smoke tests on pull requests
- Regression tests after merge to `main`
- Post-deploy smoke tests on deployed environment URLs
- Playwright UI + API tests
- Page Object Model in `tests/pages`
- API service layer and fixtures in `tests/services` and `tests/fixtures`
- Isolated test data through builders and per-test QA users
- Allure reporting configured through `allure-playwright`
- Swagger/OpenAPI documentation exposed by the backend
- Manual security testing with Burp Suite
- OWASP ZAP baseline scan in GitHub Actions
- CSP, CORS and security headers hardening through Vercel config and backend Helmet/CORS

## Test Architecture

Playwright tests are split by level and purpose:

- `tests/api/smoke`: API smoke coverage for auth, profile, calculation, feeding and history flow
- `tests/api/regression`: API regression coverage for auth validation, ownership/RLS and weight assessment
- `tests/e2e/smoke`: browser smoke coverage for the critical user journey
- `tests/e2e/regression`: browser regression coverage for dashboard, feeding and profile validation behavior
- `tests/pages`: Page Object Model classes for UI flows
- `tests/services`: API clients and setup services
- `tests/fixtures`: authenticated users, API clients and cleanup fixtures
- `tests/data`: reusable data builders

Test strategy and data rules are documented in:

- `docs/test-strategy.md`
- `docs/test-data-strategy.md`
- `docs/qa-automation-guidelines.md`
- `docs/playwright-test-setup.md`

## CI/CD Overview

GitHub Actions workflows are in `.github/workflows`:

- `ci.yml`: installs dependencies, runs smoke tests on pull requests and regression tests on pushes to `main`, then uploads Playwright and Allure artifacts
- `post-deploy-smoke.yml`: runs smoke tests against deployed/staging URLs after a successful CI workflow
- `allure-pages.yml`: publishes the Allure HTML report to GitHub Pages after successful CI
- `zap-baseline.yml`: runs scheduled and manual OWASP ZAP baseline scans against the deployed frontend

More detail is in `docs/ci-cd-overview.md`.

## Deployment Overview

- Backend is intended for Render deployment.
- Frontend is intended for Vercel deployment.
- Local Playwright runs start the backend and frontend through `playwright.config.ts` unless `TEST_ENV=staging` is set.
- Production/staging URLs are supplied through GitHub Actions secrets for post-deploy tests.

## Security Testing

Security coverage combines manual Burp Suite checks, automated API regression checks and OWASP ZAP baseline scanning.

Manual security tests documented for this project:

| Test | Expected result |
| --- | --- |
| Missing `Authorization` header on protected endpoints | `401` JSON response |
| Invalid JWT token | `401` JSON response |
| IDOR attempt using another user's `snake_id` | `403` JSON response |
| Header spoofing with `X-User-Id` and `X-Role` | Headers ignored; authenticated Supabase user context is used |
| `POST /admin/cleanup` without valid `x-admin-secret` | `403` JSON response |
| Invalid input payloads | `400` JSON response |
| Future feeding calculation date | Blocked by business validation |
| OWASP ZAP baseline scan | Runs in GitHub Actions and uploads `zap-baseline-report` artifact |

Security implementation notes:

- Backend protected endpoints require `Authorization: Bearer <supabase_access_token>`.
- Backend identifies users from Supabase Auth and request-scoped Supabase client context.
- User-scoped endpoints must not trust `user_id` from request bodies.
- `snake_profiles` and `feedings` are protected by ownership checks and RLS context.
- Backend security headers are configured through Helmet.
- Backend CORS allows the deployed frontend and local development origins.
- Frontend security headers are defined in `client/vercel.json`.

Detailed notes are in `docs/security-testing-summary.md`.

## How To Run

Install root dependencies:

```bash
npm install
```

Install frontend and backend dependencies when working locally:

```bash
npm --prefix client install
npm --prefix server install
```

Run backend locally:

```bash
npm run start:backend
```

This maps to `npm --prefix server start`.

Run frontend locally:

```bash
npm run start:frontend
```

This maps to `npm --prefix client run dev -- --host 127.0.0.1 --port 5173 --strictPort`.

Run smoke tests:

```bash
npx playwright test --grep @smoke
```

or:

```bash
npm run test:smoke
```

Run regression tests:

```bash
npx playwright test --grep @regression
```

or:

```bash
npm run test:regression
```

Run API tests:

```bash
npm run test:api
```

Run UI tests:

```bash
npm run test:e2e
```

Generate Allure report from existing `allure-results`:

```bash
npm run test:allure
```

The script maps to:

```bash
allure generate allure-results --clean -o allure-report
```

## Swagger / OpenAPI

Swagger UI is served by the backend at:

```text
http://localhost:3000/api-docs
```

The OpenAPI configuration is in `server/config/openapi.js`, with endpoint annotations in `server/routes/*.js`.

API contract documentation is also maintained in `docs/api-documentation.md`.

## Repository Structure

- `client`: Vite + React frontend, Supabase frontend client and Vercel config
- `server`: Express backend, routes, controllers, services, repositories, middleware and OpenAPI config
- `tests/api`: Playwright API smoke and regression tests
- `tests/e2e`: Playwright browser E2E smoke and regression tests
- `tests/pages`: Page Object Model classes
- `tests/services`: API client classes and test setup services
- `docs`: business requirements, API contract, QA strategy, test data strategy and project overviews
- `.github/workflows`: CI, post-deploy smoke, Allure Pages and OWASP ZAP workflows

## Reference Documentation

- `docs/business-requirements.md`
- `docs/api-documentation.md`
- `docs/test-strategy.md`
- `docs/test-data-strategy.md`
- `docs/qa-automation-guidelines.md`
- `docs/security-testing-summary.md`
- `docs/ci-cd-overview.md`
