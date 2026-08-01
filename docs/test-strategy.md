# Test Strategy

## Goals

- Protect critical user flows: auth, profile, calculation, feeding save, history and dashboard status.
- Verify backend auth and ownership boundaries.
- Catch regressions where API returns HTML instead of JSON.
- Keep automated tests stable enough for CI and future development.

## Test Levels

### Manual Testing

Manual tests should cover:

- Visual sanity for login, profile, dashboard, feeding form and history.
- Mobile and desktop layout behavior.
- Tooltip behavior for life stage.
- Profile form reset behavior on logout/login and user switch.
- Dashboard timing badge and weight status visibility.
- Admin cleanup via Postman or API client in non-production environment.

### API Tests

API tests should cover:

- Auth required responses: 401 JSON for protected endpoints without token.
- Ownership checks: 403 JSON when user accesses another user's snake profile/feedings.
- Profile CRUD validation and success cases.
- Calculation success and validation errors.
- Calculation persistence response including `calculationSaved`.
- Feeding create validation, legacy status mapping and profile update response.
- Feeding history sorting and `weightAssessment`.
- Admin cleanup 403/500/success paths in a controlled environment.
- 404 JSON handler.

### UI E2E Tests

UI E2E tests should cover:

- Register/login flow.
- First profile creation.
- Dashboard rendering with summary, status mass widget and animation card.
- Calculation flow and timing badge.
- Save feeding and see it in history.
- Logout/login isolation between users.
- Profile edit without accidental form clearing.
### Performance Tests (Grafana k6)

Performance tests should cover:

- Peak load simulation (up to 20 concurrent virtual users / VUs).
- Response time SLA threshold: 95% of API requests completed in < 500 ms (`p(95)<500`).
- Error rate threshold: failed HTTP requests < 1% (`rate<0.01`).
- Endpoint load coverage: `POST /calculate` and `GET /`.
- Automated execution via `grafana/k6-action` in GitHub Actions CI.

## Smoke vs Regression

### Smoke Suite

Run on every PR/deploy:

- App loads login page.
- User can register/login.
- User can create profile.
- User can calculate feeding.
- User can save feeding.
- User can view history.
- Protected endpoint without token returns 401 JSON.

### Regression Suite

Run before release or nightly:

- All profile validation boundaries.
- All feeding statuses and legacy mappings.
- Calculation warnings for underweight, overweight, refusals and shedding.
- RLS/ownership negative tests.
- Weight assessment statuses.
- Logout/login data isolation.
- UI responsive checks across desktop and mobile.
- Admin cleanup behavior.

## Priority

P0:

- Auth and ownership protection.
- Profile CRUD.
- Calculation endpoint and UI result.
- Feeding save and history.
- JSON error responses.

P1:

- Weight assessment.
- Validation messages.
- UI state cleanup and no stale data between users.
- Admin cleanup in test environments.

P2:

- Detailed visual checks.
- Full browser matrix.
- Accessibility checks beyond stable locators.

## Regression Risks

- Supabase RLS context not applied when global client is used instead of `req.supabase`.
- Frontend missing `Authorization` header.
- Backend returning HTML error pages instead of JSON.
- Feeding status mismatch with DB constraint.
- Calculation save using wrong DB column names.
- Asynchronous profile fetch overwriting active form edits.
- User A data visible after User B login.
- Cleanup endpoint misconfigured or used against wrong environment.

## What to Automate First

1. API smoke for auth, profile CRUD, calculate, feedings and JSON errors.
2. UI smoke for login, profile creation, calculation, save feeding and history.
3. Ownership/RLS API tests with two users.
4. Weight assessment API tests.
5. UI regression for stale state and responsive dashboard.
6. Admin cleanup tests guarded by explicit test environment variables.

## Open Questions

- Which CI provider will run the suite?
- Should tests create real Supabase Auth users or use a dedicated test auth helper?
- Should UI tests run against local backend, Render backend or both?
- What is the accepted runtime budget for smoke and regression suites?
