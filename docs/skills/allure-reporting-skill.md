# Skill: Allure Reporting

Use this skill when adding Allure reporting to the future Playwright framework.

## Goals

- Make failures easy to triage.
- Group tests by business feature.
- Preserve useful artifacts without leaking secrets.

## Required Labels

Use labels consistently:

- Feature: `Auth`, `Profile`, `Calculation`, `Feedings`, `History`, `Admin cleanup`, `Dashboard`
- Story: specific flow, for example `Create snake profile`
- Severity:
  - `blocker`: auth, ownership, profile creation, feeding save
  - `critical`: calculation, history, JSON errors
  - `normal`: UI layout, tooltip, animation card
  - `minor`: copy and non-critical visual details

## Attachments

Allowed:

- screenshots on failure
- videos/traces on failure
- sanitized request/response JSON
- console logs with secrets redacted

Not allowed:

- Supabase access tokens
- service role key
- passwords
- full environment dumps

## Naming

Test titles should already be readable. Do not rely on Allure labels to explain vague test names.

Good:

```text
Profile API rejects weight below 50 g
```

Bad:

```text
test case 12
```

## Report Usage

Recommended CI behavior:

1. Generate Playwright HTML report.
2. Generate Allure results.
3. Upload both as artifacts.
4. Publish Allure only from trusted CI jobs.

## Open Questions

- Which Allure package will be used with Playwright?
- Where should long-term Allure history be stored?
