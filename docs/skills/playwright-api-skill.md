# Skill: Playwright API Tests

Use this skill when adding backend API tests with Playwright `request`.

## Read First

- `docs/api-documentation.md`
- `docs/test-strategy.md`
- `docs/test-data-strategy.md`

## Scope

API tests should verify contracts, validation, auth and ownership:

- `POST /calculate`
- `GET /feedings?snake_id=...`
- `POST /feedings`
- `GET /snake-profiles`
- `GET /snake-profiles/:id`
- `POST /snake-profiles`
- `PATCH /snake-profiles/:id`
- `POST /admin/cleanup`
- JSON 404

## API Client Pattern

Create typed clients around Playwright request context:

- `SnakeProfilesClient`
- `FeedingsClient`
- `CalculationsClient`
- `AdminClient`
- `AuthClient` if test setup uses Supabase Auth directly

Clients should:

- accept base URL and token/headers
- expose one method per endpoint
- return raw response or parsed response plus status
- never hide failed status codes from tests
- never log tokens

## Required Test Categories

### Auth

- Missing token returns 401 JSON.
- Invalid token returns 401 JSON.
- Valid token allows access.

### Ownership

- User A can access User A profile.
- User B receives 403 for User A profile/feedings.
- User B cannot calculate/save against User A `snake_id`.

### Validation

- Profile missing/invalid fields.
- Profile weight boundaries 49/50/5000/5001.
- Calculation invalid life stage/body condition/date.
- Feeding missing required fields.
- Feeding invalid status.
- Feeding meal weight greater than snake weight.

### Success Paths

- Create profile.
- Calculate feeding.
- Save feeding.
- Fetch history sorted by feeding date desc.
- Weight assessment statuses.

### Admin

- Missing/wrong `x-admin-secret` returns 403.
- Missing service role key returns documented 500 where environment allows it.
- Success cleanup returns deleted summary in dedicated test environment.

## Assertions

Assert:

- HTTP status
- JSON content type where applicable
- response shape
- error messages for important validation/auth cases
- no `user_id` leaked in normal user-facing responses when not needed

## Open Questions

- Should API tests use Supabase Auth SDK directly for user creation?
- Should admin cleanup be tested in CI or only manually/nightly?
