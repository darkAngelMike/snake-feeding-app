# API Documentation

Base URL is environment-dependent. Frontend uses `VITE_API_BASE_URL` or falls back to the deployed Render URL configured in `client/src/App.jsx`.

All JSON endpoints should return JSON, including 404 and 500 responses.

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

Backend verifies the token through Supabase Auth and sets:

- `req.user = { id: user.id }`
- `req.supabase = request-scoped Supabase client`

Request bodies must not be trusted for `user_id`.

## Error Format

Typical errors:

```json
{ "error": "Message" }
```

Validation errors may include:

```json
{
  "error": "Niepoprawne dane profilu węża",
  "details": ["name jest wymagane"]
}
```

## Endpoints

### GET /

- Auth: no.
- Purpose: health/basic server response.
- Response: text string, currently `Snake app działa 🐍`.
- Notes: not JSON.

### POST /calculate

- Auth: yes.
- Purpose: calculate feeding plan and optionally save calculation if `snake_id` is present.

Request body:

```json
{
  "snake_id": "uuid",
  "last_successful_feeding_date": "2026-04-05",
  "weight_g": 1300,
  "life_stage": "adult",
  "body_condition": "normal",
  "refused_meals_count": 0,
  "is_shedding": false,
  "last_meal_weight_g": 110
}
```

Accepted aliases:

- `current_weight_g` can be used instead of `weight_g`.
- `feeding_date` can be used as date input for service normalization.
- `bodyCondition`, `refusedMealsCount`, `isShedding` are also normalized by `feedingService`.

Success response:

```json
{
  "message": "Obliczono plan karmienia pytona królewskiego",
  "input": {
    "lastSuccessfulFeedingDate": "2026-04-05",
    "weightG": 1300,
    "lifeStage": "adult",
    "bodyCondition": "normal",
    "refusedMealsCount": 0,
    "isShedding": false,
    "lastMealWeightG": 110
  },
  "result": {
    "mealWeightMin": 104,
    "mealWeightMax": 130,
    "mealWeightTarget": 117,
    "feedingIntervalDays": 18,
    "nextFeedingDate": "2026-04-23",
    "status": "ok",
    "warnings": [],
    "disclaimer": "To jest planer karmienia pytona królewskiego, a nie porada weterynaryjna...",
    "daysLeft": 0,
    "daysOverdue": 0
  },
  "calculationSaved": true
}
```

If calculation succeeds but DB save fails:

```json
{
  "message": "Obliczono plan karmienia pytona królewskiego",
  "input": {},
  "result": {},
  "calculationSaved": false,
  "calculationSaveError": "Nie udało się zapisać kalkulacji"
}
```

HTTP statuses:

- `200`: calculation completed.
- `400`: invalid calculation input.
- `401`: missing/invalid auth token.
- `403`: `snake_id` does not belong to user or RLS blocks access.
- `500`: profile verification error or unexpected middleware/server error.

RLS/Supabase notes:

- Uses `req.supabase`.
- If `snake_id` is provided, backend checks profile ownership before saving calculation.
- Calculation insert writes `_g` DB columns: `meal_weight_min_g`, `meal_weight_max_g`, `meal_weight_target_g`.

### GET /feedings?snake_id=...

- Auth: yes.
- Purpose: fetch feeding history for one snake and return automatic weight assessment.
- Query: `snake_id` required.

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "snake_id": "uuid",
      "feeding_date": "2026-04-05",
      "snake_weight_g": 1300,
      "meal_weight_g": 110,
      "status": "success"
    }
  ],
  "weightAssessment": {
    "status": "stable",
    "severity": "success",
    "changePercent": 2.5,
    "message": "Masa węża wygląda stabilnie."
  }
}
```

HTTP statuses:

- `200`: success.
- `400`: missing `snake_id`.
- `401`: missing/invalid auth token.
- `403`: profile does not belong to user or RLS blocks access.
- `500`: profile verification or history fetch error.

Notes:

- History is sorted by `feeding_date DESC`.
- `user_id` is sanitized from response.
- Weight assessment uses the two newest `snake_weight_g` values from returned history.

### POST /feedings

- Auth: yes.
- Purpose: create a feeding entry and update profile weight/last successful feeding date.

Request body:

```json
{
  "snake_id": "uuid",
  "feeding_date": "2026-04-05",
  "snake_weight_g": 1300,
  "meal_weight_g": 110,
  "status": "success"
}
```

Status values:

- `success`
- `refused`
- `skipped`

Legacy mappings:

- `ok`, `completed`, `done` -> `success`
- `failed`, `reject`, `rejected` -> `refused`
- `skip` -> `skipped`

Success response:

```json
{
  "success": true,
  "feeding": {
    "id": 1,
    "snake_id": "uuid",
    "feeding_date": "2026-04-05",
    "snake_weight_g": 1300,
    "meal_weight_g": 110,
    "status": "success"
  },
  "profileUpdated": true
}
```

HTTP statuses:

- `201`: feeding inserted.
- `400`: validation error.
- `401`: missing/invalid auth token.
- `403`: snake profile not owned by user or RLS blocks insert/update.
- `500`: insert or verification error.

Notes:

- Insert is not rolled back if profile update fails.
- `profileUpdated: false` means feeding was saved but profile update failed.
- If status is `success`, backend also updates `last_successful_feeding_date`.

### GET /history

- Auth: no.
- Purpose: legacy/raw history endpoint.
- Response: raw list from `feedings`.
- Notes: not user-scoped and should not be used by frontend E2E except as a known legacy risk.

### GET /snake-profiles

- Auth: yes.
- Purpose: list profiles for current user.

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Profil węża",
      "current_weight_g": 1000,
      "life_stage": "adult",
      "body_condition": "normal",
      "last_successful_feeding_date": "2026-04-05"
    }
  ]
}
```

HTTP statuses:

- `200`: success.
- `401`: missing/invalid auth token.
- `403`: RLS permission error.
- `500`: fetch error.

### GET /snake-profiles/:id

- Auth: yes.
- Purpose: fetch one profile only if it belongs to current user.

HTTP statuses:

- `200`: success.
- `401`: missing/invalid auth token.
- `403`: profile not owned by user or RLS blocks access.
- `500`: fetch error.

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Profil węża",
    "current_weight_g": 1000,
    "life_stage": "adult",
    "body_condition": "normal",
    "last_successful_feeding_date": "2026-04-05"
  }
}
```

### POST /snake-profiles

- Auth: yes.
- Purpose: create profile for `req.user.id`.

Request body:

```json
{
  "name": "Profil węża",
  "current_weight_g": 1000,
  "life_stage": "adult",
  "body_condition": "normal",
  "last_successful_feeding_date": "2026-04-05"
}
```

Validation:

- `name` required.
- `current_weight_g` integer 50-5000.
- `life_stage`: `hatchling`, `juvenile`, `subadult`, `adult`.
- `body_condition`: `underweight`, `normal`, `overweight`.
- `last_successful_feeding_date`: optional `YYYY-MM-DD`, empty or null.

HTTP statuses:

- `201`: profile created.
- `400`: validation error.
- `401`: missing/invalid auth token.
- `403`: RLS blocks insert.
- `500`: insert error.

### PATCH /snake-profiles/:id

- Auth: yes.
- Purpose: update current user's profile.
- Body: partial profile payload with same validation for provided fields.

Example request:

```json
{
  "current_weight_g": 1200,
  "body_condition": "normal"
}
```

HTTP statuses:

- `200`: profile updated.
- `400`: validation error.
- `401`: missing/invalid auth token.
- `403`: profile not owned by user or RLS blocks update.
- `500`: verification/update error.

### POST /admin/cleanup

- Auth: admin secret header, not Supabase user auth.
- Purpose: destructive cleanup for test data.

Headers:

```http
x-admin-secret: <ADMIN_CLEANUP_SECRET>
Content-Type: application/json
```

Success response:

```json
{
  "success": true,
  "deleted": {
    "feeding_calculations": 10,
    "feedings": 10,
    "snake_profiles": 3,
    "users": 3
  }
}
```

If Supabase does not return count, table values may be `"unknown"`.

HTTP statuses:

- `200`: cleanup done.
- `403`: missing/wrong `x-admin-secret`.
- `500`: missing service role key or cleanup failure.

Security notes:

- This endpoint must not be called from frontend.
- Requires `SUPABASE_SERVICE_ROLE_KEY` in backend env.
- Deletes data in order: `feeding_calculations`, `feedings`, `snake_profiles`, then Auth users.

### JSON 404

Unknown routes return:

```json
{ "error": "Endpoint not found" }
```

Status: `404`.

## Open Questions

- Should `GET /history` be removed or protected?
- Should API expose explicit delete endpoints for profiles/feedings in future CRUD?
- Should `POST /feedings` support statuses other than `success` from frontend?
- Should API responses standardize on `{ success, data }` for every endpoint including `/calculate`?
