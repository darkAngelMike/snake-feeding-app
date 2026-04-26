# Skill: Playwright UI E2E

Use this skill when adding or reviewing browser-based end-to-end tests for snake-app.

## Read First

- `docs/business-requirements.md`
- `docs/test-strategy.md`
- `docs/test-data-strategy.md`
- `docs/qa-automation-guidelines.md`

## Scope

UI E2E tests should validate user-visible behavior:

- login/register
- profile creation/edit
- dashboard summary
- feeding calculation
- timing badge
- weight assessment widget
- feeding save
- feeding history
- logout/login user isolation

Do not test backend internals through UI tests.

## Required Pattern

Use Playwright Test with TypeScript and Page Object Model.

Suggested page objects:

- `LoginPage`
- `ProfilePage`
- `DashboardPage`
- `FeedingFormPage`
- `HistoryPage`

Each page object should:

- accept `Page` in constructor
- expose actions named in business language
- use accessible locators first
- avoid hardcoded waits
- avoid storing test data globally

## Recommended Flow Tests

Smoke:

1. Register or login a unique user.
2. Create snake profile.
3. Verify dashboard summary.
4. Run calculation.
5. Verify timing badge and result cards.
6. Save feeding.
7. Verify history contains feeding.

Regression:

- Profile validation for missing fields and weight boundaries.
- Tooltip opens for life stage.
- User A data is not visible after logout and login as User B.
- Dashboard animation card is visible after profile is complete.
- Mobile viewport keeps header actions and forms usable.

## Locators

Preferred:

- `getByRole`
- `getByLabel`
- `getByText` for stable Polish UI copy
- `data-testid` only when accessibility locators are not stable enough

Avoid:

- generated CSS classes
- positional selectors
- arbitrary waits

## Test Data

- Create unique users per test or worker.
- Use API setup for data when the test is not about profile form UI.
- Use UI setup when validating first-profile flow.
- Clean data through the approved cleanup strategy.

## Assertions

Assert:

- visible text
- enabled/disabled button behavior
- validation messages
- absence of stale data after user switch
- history item presence

Do not assert:

- implementation details of React state
- exact animation frame positions
- styling pixel-perfect details unless requested

## Open Questions

- Should UI add `data-testid` for dashboard widgets and action nav?
- Which browsers are mandatory for CI: Chromium only or Chromium/Firefox/WebKit?
