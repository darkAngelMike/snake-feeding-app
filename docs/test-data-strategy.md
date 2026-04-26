# Test Data Strategy

## Principles

- Every automated test must own its data.
- Prefer creating data through public/backend APIs to match real behavior.
- Use direct Supabase/service role cleanup only in controlled test infrastructure.
- Never use production data.
- Never expose service role keys to frontend or browser context.

## Test Users

Recommended pattern:

- Generate unique username per test run: `qa_<timestamp>_<random>@snake.local`.
- Register through Supabase Auth from API or UI depending on test type.
- Store access token only in test process memory.
- Delete users through `POST /admin/cleanup` only in test environments.

Minimum user sets:

- User A: owner of primary snake profile.
- User B: isolation/403 checks.
- Admin/test operator: represented by `ADMIN_CLEANUP_SECRET`, not a UI user.

## Snake Profile Data

Valid baseline:

```json
{
  "name": "QA Python",
  "current_weight_g": 1000,
  "life_stage": "adult",
  "body_condition": "normal",
  "last_successful_feeding_date": "2026-04-05"
}
```

Validation boundary data:

- `current_weight_g`: 49 -> invalid.
- `current_weight_g`: 50 -> valid lower boundary.
- `current_weight_g`: 5000 -> valid upper boundary by current backend profile validation.
- `current_weight_g`: 5001 -> invalid.
- `life_stage`: invalid string -> invalid.
- `body_condition`: invalid string -> invalid.
- `last_successful_feeding_date`: invalid format -> invalid.

## Feeding Data

Valid baseline:

```json
{
  "feeding_date": "2026-04-05",
  "snake_weight_g": 1000,
  "meal_weight_g": 100,
  "status": "success"
}
```

Trend data:

- Stable: previous 1000 g, latest 1040 g.
- Weight loss: previous 1000 g, latest 910 g.
- Rapid gain: previous 1000 g, latest 1110 g.
- Overweight alert: latest 5000 g or higher.
- Invalid alert: latest below 50 g if backend allows such feeding data.

Status data:

- Valid: `success`, `refused`, `skipped`.
- Legacy mapping: `ok`, `completed`, `done`, `failed`, `reject`, `rejected`, `skip`.
- Invalid: any other string.

## Cleanup

Preferred cleanup:

```http
POST /admin/cleanup
x-admin-secret: <ADMIN_CLEANUP_SECRET>
```

Cleanup deletes:

1. `feeding_calculations`
2. `feedings`
3. `snake_profiles`
4. Supabase Auth users

Use cleanup:

- Before a full test run in a dedicated test environment.
- After a full test run when safe.
- Never against production.

## Isolation Strategy

- Use unique test users and profile names.
- Do not share one user across parallel tests unless the tests are read-only.
- For ownership tests, create User A data and assert User B receives 403.
- Keep API setup separate from UI assertions where possible.
- Use cleanup at suite boundaries, not inside every test, unless test data volume becomes an issue.

## Creating Data Through API

Recommended API setup order:

1. Register/login user and obtain access token.
2. Create profile through `POST /snake-profiles`.
3. Create feedings through `POST /feedings`.
4. Fetch history through `GET /feedings?snake_id=...`.

For UI tests:

- Use API setup for preconditions when the test is not about the setup UI itself.
- Use UI setup only for flows that explicitly validate the form.

## What Not To Do

- Do not hardcode real user credentials.
- Do not put service role key in frontend, Playwright browser context or logs.
- Do not rely on database row IDs being stable across runs.
- Do not use shared static user accounts for parallel tests.
- Do not clean production data.
- Do not bypass backend ownership checks in test setup unless explicitly testing database-only behavior.

## Open Questions

- What Supabase project/environment is dedicated to automated tests?
- Should cleanup remove all users or only users with a QA prefix?
- Are tests allowed to call Supabase Auth APIs directly, or must user creation go through UI only?
