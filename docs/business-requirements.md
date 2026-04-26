# Business Requirements

## Application Goal

SerpentTrack helps a logged-in user plan feeding for a ball python, track feeding history and monitor weight-related signals over time. The app is not veterinary advice. It gives planning suggestions based on user-entered profile data and feeding history.

## User Roles

- Owner/user: registers or logs in, manages their snake profile, calculates feeding recommendations, records feedings and reviews history.
- Admin/test operator: can call the technical cleanup endpoint with an admin secret to remove test data.

There is no separate UI role management in the current app.

## Main Functional Areas

- Supabase Auth login/register from the frontend.
- Snake profile CRUD through backend API.
- Feeding calculation through backend API.
- Feeding record creation through backend API.
- Feeding history through backend API.
- Automatic weight assessment based on feeding history.
- Technical admin cleanup endpoint for test environments.

## User Flows

### Login/Register

1. User enters a local username and password.
2. Frontend transforms username to an email-like value: `<nick>@snake.local`.
3. User can register or log in with Supabase Auth.
4. Frontend stores the Supabase session and sends `Authorization: Bearer <access_token>` to backend API calls.

### Snake Profile

1. After login the frontend loads profiles from `GET /snake-profiles`.
2. If no complete profile exists, the user is shown the profile form.
3. User creates or updates a profile through backend API.
4. Backend assigns `user_id` from auth context, not from request body.
5. Profile data drives dashboard and calculation inputs.

### Feeding Calculation

1. User opens dashboard with a complete profile.
2. User may enter refused meal count, last meal weight and shedding state.
3. Frontend sends calculation input to `POST /calculate`.
4. Backend validates input using `feedingService`.
5. If `snake_id` is present, backend verifies the snake belongs to the user and attempts to save calculation.
6. UI shows next feeding date, meal range, target meal weight, interval, timing badge and warnings.

### Feeding Save

1. User opens "Dodaj wpis".
2. User enters feeding date, current snake weight and meal weight.
3. Frontend sends `POST /feedings` with status currently hardcoded as `success`.
4. Backend validates payload, verifies snake ownership, inserts feeding, then attempts to update profile weight and last successful feeding date.
5. If profile update fails, insert is not rolled back and response includes `profileUpdated: false`.

### Feeding History

1. Frontend calls `GET /feedings?snake_id=...`.
2. Backend verifies ownership.
3. Response includes sorted feeding history and `weightAssessment`.
4. UI displays feedings and automatic mass status.

### Admin Cleanup

1. Test operator calls `POST /admin/cleanup`.
2. Request must include `x-admin-secret`.
3. Backend uses `SUPABASE_SERVICE_ROLE_KEY`.
4. It deletes rows from `feeding_calculations`, `feedings`, `snake_profiles`, then Supabase Auth users.

## Form Fields

### Login

- `nick`: required in UI for login/register buttons.
- `password`: required in UI for login/register buttons.

### Snake Profile

- `name`: required.
- `current_weight_g`: required; frontend and backend enforce 50-5000 g.
- `last_successful_feeding_date`: required for a complete profile; optional at API validation level when omitted from payload.
- `life_stage`: required; `hatchling`, `juvenile`, `subadult`, `adult`.
- `body_condition`: required; `underweight`, `normal`, `overweight`.

### Dashboard Calculation

- `refused_meals_count`: optional in UI, defaults to 0.
- `last_meal_weight_g`: optional, must be positive when provided.
- `is_shedding`: boolean.

### Feeding Entry

- `feeding_date`: required, date format `YYYY-MM-DD`.
- `snake_weight_g`: required, positive integer.
- `meal_weight_g`: required, positive integer and cannot exceed snake weight.
- `status`: backend supports `success`, `refused`, `skipped`; current frontend sends `success`.

## Validations and Rules

### Profile Validation

- `name` must be non-empty.
- `current_weight_g` must be a positive integer and in range 50-5000 g.
- `life_stage` must be one of `hatchling`, `juvenile`, `subadult`, `adult`.
- `body_condition` must be one of `underweight`, `normal`, `overweight`.
- `last_successful_feeding_date` must be `YYYY-MM-DD` or empty/null when provided.

### Calculation Validation

- Weight must be a positive number.
- Life stage and body condition must be valid enums.
- Last successful feeding date is required and cannot be in the future.
- Refused meals count must be an integer >= 0.
- Last meal weight must be positive or null.

### Feeding Validation

- `snake_id` required.
- `feeding_date` must be valid `YYYY-MM-DD`.
- `snake_weight_g` and `meal_weight_g` must be positive integers.
- `meal_weight_g` cannot exceed `snake_weight_g`.
- `status` must be `success`, `refused` or `skipped`.
- Legacy statuses are mapped: `ok`, `completed`, `done` -> `success`; `failed`, `reject`, `rejected` -> `refused`; `skip` -> `skipped`.

## Statuses

### Feeding Status

- `success`
- `refused`
- `skipped`

### Feeding Planner Status

- `ok`
- `due_soon`
- `overdue`
- `vet_check_recommended`

### Dashboard Timing Badge

- `Do karmienia: X dni`
- `Po terminie: X dni`
- `Karmienie dzisiaj`

### Weight Assessment

- `unknown`: insufficient history.
- `weight_loss`: latest weight dropped by more than 8% from previous measurement.
- `rapid_gain`: latest weight increased by more than 10%.
- `stable`: weight is within accepted trend.
- `overweight_alert`: latest `snake_weight_g >= 5000`.
- `invalid`: latest `snake_weight_g < 50`.

## Business Risks

- Incorrect auth/RLS handling could expose one user's snake profile or feeding history to another user.
- Calculation output may be misunderstood as veterinary advice.
- Feeding history and profile update are intentionally not transactional; profile may fail to update after feeding insert.
- Weight assessment is a heuristic based on feeding history, not medical diagnosis.
- Cleanup endpoint is destructive and must never be exposed through frontend UI.
- Date handling is UTC-based in `feedingService`, which can affect boundary-day tests.

## Open Questions

- Should a user support multiple snake profiles in the UI, or is the current first-profile behavior intentional?
- Should frontend allow non-success feeding statuses, or is `success` only intentional for now?
- Should `last_successful_feeding_date` be mandatory at API level for profile creation?
- Should feeding entry enforce the same 50-5000 g range as profile weight?
- Should admin cleanup be available in production environments or only test/staging?
- What exact browsers/devices are in scope for UI regression?
