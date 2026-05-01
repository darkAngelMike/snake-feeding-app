# Local Environment And Playwright Test Setup

This repository contains Playwright TypeScript automation for API and UI smoke/regression coverage.

## Install

From repository root:

```bash
npm install
npx playwright install
```

Do not commit `.env` files or secrets.

## Environment Variables

Create local environment files from the root template:

```bash
cp .env.example .env
```

Before starting backend, frontend or tests, export the root `.env` values in the shell running that process:

```bash
set -a
source .env
set +a
```

Use the same Supabase project for frontend, backend and Playwright tests.

Required for backend and API/UI tests that create real Supabase users:

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

Required for the Vite frontend:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=http://localhost:3000
```

Required by Playwright when not using defaults:

```bash
API_BASE_URL=http://localhost:3000
BASE_URL=http://localhost:5173
```

For admin cleanup tests in a dedicated test environment:

```bash
ADMIN_CLEANUP_SECRET=...
ALLOW_TEST_CLEANUP=true
```

Backend cleanup also requires `SUPABASE_SERVICE_ROLE_KEY`, but never expose it to browser-side tests or Vite env variables. Cleanup deletes only Supabase Auth users whose email starts with the per-test `qa_...` prefix and only application rows owned by those users.

## Local Run

Optional manual backend run after loading backend env values from the repository root:

```bash
set -a
source .env
set +a
npm run start:backend
```

Optional manual frontend run after loading `VITE_*` env values from the repository root:

```bash
set -a
source .env
set +a
npm run start:frontend
```

Run Playwright from the repository root after loading test env values. Playwright starts both local servers automatically and waits for `API_BASE_URL` and `BASE_URL` to respond:

```bash
set -a
source .env
set +a
npm install
npm run test:api
npm run test:e2e
```

Locally, Playwright reuses already running servers on those URLs. In CI, it expects to start fresh servers.

## Run

API smoke/API suite:

```bash
npm run test:api
```

UI E2E:

```bash
npm run test:e2e
```

Desktop UI E2E:

```bash
npm run test:e2e:desktop
```

Mobile UI E2E:

```bash
npm run test:e2e:mobile
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

Implemented and locally green suites:

- API smoke for auth-negative, profile creation, calculation, feeding save and feeding history.
- UI smoke that logs in through Supabase Auth API, opens dashboard, calculates feeding, saves feeding and verifies history.
- API regression for auth validation, ownership/RLS boundaries and weight assessment.
- UI regression for dashboard feeding behavior and profile validation.

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
