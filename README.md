# Snake Feeding App

React and Express application for planning and tracking ball python feedings. The project is organized as a QA Automation / SDET portfolio example with UI tests, API tests, CI/CD workflows, reporting, API documentation and security testing notes.

The business and testing source of truth is in `docs/`.

---

## 🚀 QA Automation / SDET Portfolio Project

This project demonstrates a production-like QA Automation and Security Testing setup:

- Playwright UI + API tests
- CI/CD with GitHub Actions
- Post-deployment testing on real environments
- Allure reporting
- Swagger/OpenAPI documentation
- Security testing (Burp Suite, OWASP ZAP, automated API security tests)
- Backend + Frontend deployment (Render + Vercel)

---

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

---

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

---

## 🧪 Test Coverage

- Authentication and authorization
- Input validation and error handling
- Business logic (feeding rules)
- Ownership and RLS (multi-user scenarios)
- Edge cases (weight assessment)
- Security checks:
  - Missing/invalid token
  - IDOR attempts
  - Header spoofing
  - Input abuse

---

## Test Architecture

Playwright tests are split by level and purpose:

- `tests/api/smoke`: API smoke coverage for auth, profile, calculation, feeding and history flow
- `tests/api/regression`: API regression coverage for auth validation, ownership/RLS and weight assessment
- `tests/api/security`: API security tests (auth, IDOR, spoofing, validation, rate-limit observation)
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

---

## CI/CD Overview

GitHub Actions workflows are in `.github/workflows`:

- `ci.yml`: installs dependencies, runs smoke tests on pull requests, regression tests on pushes to `main`, and security tests (`@security`), then uploads Playwright and Allure artifacts
- `post-deploy-smoke.yml`: runs smoke tests against deployed/staging URLs after a successful CI workflow
- `allure-pages.yml`: publishes the Allure HTML report to GitHub Pages after successful CI
- `zap-baseline.yml`: runs scheduled and manual OWASP ZAP baseline scans against the deployed frontend

More detail is in `docs/ci-cd-overview.md`.

---

## Deployment Overview

- Backend is deployed on Render
- Frontend is deployed on Vercel
- Local Playwright runs start backend and frontend via `playwright.config.ts` unless `TEST_ENV=staging` is set
- Production/staging URLs are supplied through GitHub Actions secrets for post-deploy tests

---

## 🔐 Security Testing

Security coverage combines manual testing, automated regression checks and CI scanning.

Manual security tests:

| Test | Expected result |
|------|---------------|
| Missing `Authorization` header | `401` |
| Invalid JWT token | `401` |
| IDOR on another user's `snake_id` | `403` |
| Header spoofing (`X-User-Id`, `X-Role`) | Ignored |
| `POST /admin/cleanup` without secret | `403` |
| Invalid payloads | `400` |
| Future feeding date | Blocked |
| OWASP ZAP scan | Report artifact |

Security implementation notes:

- Backend uses `Authorization: Bearer <token>`
- User identity is derived from Supabase Auth context
- Ownership and RLS protect user data
- Helmet provides security headers
- CORS is restricted to allowed origins
- Frontend security headers are defined in `client/vercel.json`

More details in `docs/security-testing-summary.md`.

---

## ⚙️ How To Run

Install dependencies:

```bash
npm install
```
