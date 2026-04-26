# QA Automation Guidelines

## Stack

- Test runner: Playwright Test.
- Language: TypeScript.
- UI tests: browser automation with Page Object Model.
- API tests: Playwright `request` with typed API clients/services.
- Reporting: Allure when introduced.
- CI: run smoke first, regression separately.

No automation framework is implemented yet in this repository.

## Suggested Folder Structure

```text
tests/
  e2e/
  api/
  fixtures/
  pages/
  services/
  data/
  utils/
playwright.config.ts
```

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

## Fixtures

Recommended fixtures:

- `apiContext`
- `testUser`
- `authToken`
- `snakeProfile`
- `secondUser`
- `adminClient`

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

When Allure is introduced:

- Add feature/story labels.
- Add severity for P0/P1/P2 tests.
- Attach API request/response only after redacting tokens/secrets.
- Attach screenshots/videos only on failure unless debugging.

## CI/CD

Recommended pipeline order:

1. Install dependencies.
2. Lint/build frontend.
3. Run backend unit tests.
4. Start or target test backend/frontend.
5. Run API smoke.
6. Run UI smoke.
7. Upload reports and artifacts.

Regression can run nightly or manually.

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
- Should Playwright run against local services in CI or deployed test environments?
- Which Allure package/version should be standardized?
