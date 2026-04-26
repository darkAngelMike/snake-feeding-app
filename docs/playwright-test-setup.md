# Playwright Test Setup

This repository contains a Playwright TypeScript automation skeleton for future API and UI E2E tests.

## Install

From repository root:

```bash
npm install
npx playwright install
```

Do not commit `.env` files or secrets.

## Environment Variables

Optional defaults:

```bash
BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:3000
```

For admin cleanup tests in a dedicated test environment:

```bash
ADMIN_CLEANUP_SECRET=...
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser-side tests.

## Run

API smoke/API suite:

```bash
npm run test:api
```

UI E2E:

```bash
npm run test:e2e
```

Smoke tests:

```bash
npm run test:smoke
```

Regression tests:

```bash
npm run test:regression
```

Generate Allure report after a test run:

```bash
npm run test:allure
```

## Current Coverage

Implemented only minimal smoke examples:

- API auth-negative smoke for `GET /snake-profiles` without token.
- UI smoke verifying login page loads.

Full regression is intentionally not implemented yet.

## Structure

```text
tests/
  api/
  e2e/
  data/
  fixtures/
  pages/
  services/
  utils/
```

Follow `docs/qa-automation-guidelines.md` and `docs/skills/*.md` when adding tests.
