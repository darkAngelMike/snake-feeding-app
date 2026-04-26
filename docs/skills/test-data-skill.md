# Skill: Test Data Management

Use this skill when creating fixtures, builders or cleanup utilities for automated tests.

## Read First

- `docs/test-data-strategy.md`
- `docs/api-documentation.md`

## Principles

- Tests own their data.
- Data must be unique per test or worker.
- Setup should use public backend API unless the test specifically targets auth setup.
- Cleanup must not target production.

## Builders

Create small data builders:

- `buildUser()`
- `buildSnakeProfile(overrides)`
- `buildFeeding(overrides)`
- `buildCalculationInput(overrides)`

Builders should:

- return plain objects
- use valid defaults
- allow overrides
- avoid side effects

## User Data

Generate users with a QA prefix:

```text
qa_<timestamp>_<random>@snake.local
```

Do not hardcode real credentials.

## Profile Data

Valid default:

```json
{
  "name": "QA Python",
  "current_weight_g": 1000,
  "life_stage": "adult",
  "body_condition": "normal",
  "last_successful_feeding_date": "2026-04-05"
}
```

## Feeding Data

Valid default:

```json
{
  "feeding_date": "2026-04-05",
  "snake_weight_g": 1000,
  "meal_weight_g": 100,
  "status": "success"
}
```

## Cleanup

Use `POST /admin/cleanup` only when:

- the environment is dedicated to tests
- `ADMIN_CLEANUP_SECRET` is configured
- the job has explicit permission to delete test data

Never call cleanup from browser-side code.

## Parallelism

- Prefer isolated users per worker.
- Do not run destructive cleanup while parallel tests are still executing.
- If cleanup is suite-level, run it before and after the suite, not mid-suite.

## Open Questions

- Should cleanup delete all data or only QA-prefixed users once the backend supports that?
- Should test users be created through UI registration or direct Supabase Auth calls?
