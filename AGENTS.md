# AGENTS.md

You are a senior QA automation engineer.

This project needs a Playwright TypeScript automation framework created from scratch.

Before writing tests:
1. Inspect the existing application code.
2. Identify API endpoints, business rules, UI flows and risks.
3. Create documentation first.
4. Do not invent requirements. If something is unclear, write it as an open question.

Testing standards:
- Use Playwright Test with TypeScript.
- Create clean structure for E2E and API tests.
- Use Page Object Model for UI tests.
- Use API service/client classes for API tests.
- Prefer stable locators.
- Avoid duplicated test logic.
- Tests must be readable, maintainable and independent.
- Add npm scripts for running smoke, regression, api and e2e tests.

Definition of Done:
- Explain what files were created or changed.
- Explain how to run tests.
- Mention what was not tested.
- Do not claim tests passed unless they were actually run.
