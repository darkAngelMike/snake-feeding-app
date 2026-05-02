# QA Automation Guidelines

## Stack

- Test runner: Playwright Test.
- Language: TypeScript.
- UI tests: browser automation with Page Object Model.
- API tests: Playwright `request` with typed API clients/services.
- Reporting: Playwright HTML report and Allure via `allure-playwright`.
- CI: GitHub Actions runs smoke, regression and security-tagged API tests.

The automation framework is implemented in this repository. Current coverage includes Playwright UI tests, Playwright API tests, smoke/regression/security tags, shared fixtures, API clients, Page Object Model classes and test data builders.

## Current Folder Structure

```text
tests/
  api/
    smoke/
    regression/
    security/
  e2e/
    smoke/
    regression/
  fixtures/
  pages/
  services/
  data/
  utils/
playwright.config.ts
```

## Test Suites And Tags

- `@smoke`: critical API/UI flows for pull requests and post-deploy checks.
- `@regression`: broader API/UI coverage for pushes to `main`.
- `@security`: API security checks for auth, ownership, validation, header spoofing and rate-limit observation.
- API project: `playwright test --project=api`.
- Desktop UI project: `playwright test --project=chromium`.
- Mobile UI project: `playwright test --project=mobile-chromium`.

## Page Object Model

Rules:

- One page object per stable page or major workflow: LoginPage, ProfilePage, DashboardPage, FeedingFormPage, HistoryPage.
- Page objects expose user actions and meaningful assertions helpers.
- Page objects should not contain test data generation.
- Avoid assertions hidden inside actions unless the action cannot be considered complete without them.

Example style:

```ts
await loginPage.login(user.nick, user.password);
await profilePage.createProfile(profile);
await dashboardPage.expectWeightStatus("Brak danych");
```

## API Clients and Services

Rules:

- Use API clients for raw HTTP calls.
- Use services for business setup flows.
- Keep auth token handling inside fixtures or clients.
- Validate status codes and response shape in tests, not only in clients.

Suggested clients:

- `AuthClient`
- `SnakeProfilesClient`
- `CalculationsClient`
- `FeedingsClient`
- `AdminClient`

Current clients live in `tests/services` and are used by fixtures and setup services. Business setup helpers live in `tests/services/test-data.service.ts`.

## Fixtures

Current fixtures:

- `authUser`
- `apiClient`
- `authClient`
- `adminClient`
- `calculationsClient`
- `feedingsClient`
- `snakeProfilesClient`
- `testProfile`
- `testRunId`
- `testUserEmailPrefix`
- `cleanup`

Fixture requirements:

- Create unique data per test or worker.
- Cleanup must be explicit.
- Do not leak secrets into test output.

## Selectors and data-testid

Preferred selector order:

1. Accessible role/name when stable and user-facing.
2. Label text for form fields.
3. `data-testid` for dynamic UI or repeated elements.
4. CSS selectors only as last resort.

Current app does not consistently expose `data-testid`. Adding them later is acceptable if done as a testability improvement without changing UX.

## Assertions

Prefer:

- Visible user-facing text.
- Response status and JSON body shape.
- Ownership behavior: 401/403.
- State changes visible through public API or UI.

Avoid:

- Arbitrary waits.
- Snapshotting large UI sections.
- Asserting implementation details like React state.

## Allure

Allure is configured in `playwright.config.ts` through `allure-playwright`.

- Add feature/story labels.
- Add severity for P0/P1/P2 tests.
- Attach API request/response only after redacting tokens/secrets.
- Attach screenshots/videos only on failure unless debugging.

## CI/CD

Current CI pipeline:

1. Install dependencies.
2. Install Playwright Chromium.
3. Run smoke tests on pull requests.
4. Run regression tests on pushes to `main`.
5. Run API security tests.
6. Generate Allure HTML report when `allure-results` exists.
7. Upload Playwright and Allure artifacts.

Post-deploy smoke tests run in a separate workflow after successful CI. ZAP baseline scan runs in a separate scheduled/manual workflow.

## Naming Conventions

- Test files: `*.spec.ts`.
- Page objects: `*.page.ts`.
- API clients: `*.client.ts`.
- Data builders: `*.builder.ts`.
- Fixtures: `*.fixture.ts` or central `fixtures.ts`.
- Test titles should describe behavior and expected result.

Example:

```ts
test("shows 403 when user fetches another user's snake profile", async () => {});
```

## Anti-Patterns

- Sharing one mutable user across all tests.
- Calling service role APIs from UI tests.
- Hiding assertions in setup helpers.
- Relying on execution order.
- Logging tokens, passwords or secrets.
- Using long fixed timeouts instead of web-first assertions.
- Testing every CSS detail instead of user-visible behavior.

## Open Questions

- Should `data-testid` attributes be added before UI automation starts?
- Should CI add Firefox/WebKit projects or keep Chromium-only execution?
- Should security tests remain a CI step or move to a separate required job?
