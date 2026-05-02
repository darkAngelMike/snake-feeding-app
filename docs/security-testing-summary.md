# Security Testing Summary

## Goal

The goal of security testing is to verify that user-scoped API data is protected by Supabase Auth, backend ownership checks and RLS context, and that exposed environments have baseline HTTP hardening in place.

This document summarizes manual Burp Suite checks, automated API coverage and OWASP ZAP baseline scanning for the Snake Feeding App.

## Scope

Security testing covers:

- Authentication enforcement on protected API endpoints.
- Invalid and missing bearer token handling.
- IDOR attempts against another user's `snake_id`.
- Header spoofing attempts.
- Admin cleanup endpoint protection.
- Input validation failures.
- Business validation for future feeding calculation dates.
- Baseline passive web scan through OWASP ZAP.
- Security headers, CSP and CORS configuration.

Out of scope:

- Full authenticated DAST crawl.
- Penetration test of Supabase infrastructure.
- Source code SAST.
- Dependency vulnerability triage beyond package manager and CI checks.

## Tools

- Burp Suite Community: manual request modification, auth/header tampering and IDOR checks.
- OWASP ZAP baseline scan: GitHub Actions workflow using `zaproxy/action-baseline`.
- Playwright API tests: automated regression coverage for auth, validation and ownership behavior.

## Manual Security Test Results

| Test | Expected result | Actual result | Status |
| --- | --- | --- | --- |
| Missing `Authorization` header on protected endpoints | `401` JSON response | Protected API requests without bearer token were rejected with `401`. | Passed |
| Invalid JWT token | `401` JSON response | Requests with malformed/invalid bearer token were rejected with `401`. | Passed |
| IDOR on another user's `snake_id` | `403` JSON response | Cross-user profile/feedings access was rejected with `403`. | Passed |
| Header spoofing with `X-User-Id` and `X-Role` | Spoofed headers ignored | Backend used Supabase Auth context instead of spoofed headers. | Passed |
| `POST /admin/cleanup` without valid `x-admin-secret` | `403` JSON response | Cleanup endpoint rejected requests without the configured admin secret. | Passed |
| Invalid input payloads | `400` JSON response | Invalid profile/calculation/feeding payloads were rejected with `400`. | Passed |
| Future feeding calculation date | Blocked by business validation | Future last successful feeding date was rejected by feeding validation. | Passed |
| OWASP ZAP baseline scan | Workflow runs and uploads report artifact | `.github/workflows/zap-baseline.yml` runs the scan and uploads `zap-baseline-report`. | Covered by CI workflow |

## Automated Coverage

Existing Playwright API tests cover:

- Missing token responses in `tests/api/regression/auth-validation.spec.ts`.
- Invalid profile and calculation payloads in `tests/api/regression/auth-validation.spec.ts`.
- Cross-user ownership/RLS checks in `tests/api/regression/ownership.spec.ts`.
- Smoke coverage for protected endpoint `401` behavior in `tests/api/smoke/smoke.spec.ts`.

## Current ZAP Findings

No ZAP report artifact is committed to the repository. Current findings should be reviewed from the latest GitHub Actions run of `OWASP ZAP Baseline Scan`.

The workflow currently:

- Targets `https://snake-feeding-app.vercel.app`.
- Runs with `cmd_options: "-a"`.
- Does not fail the workflow on ZAP findings (`fail_action: false`).
- Does not write GitHub issues (`allow_issue_writing: false`).
- Uploads the artifact as `zap-baseline-report`.

## What Was Hardened

- Backend uses Helmet for security headers.
- Backend CORS restricts allowed origins to deployed frontend and local development origins.
- Frontend Vercel configuration defines CSP, `X-Frame-Options`, `X-Content-Type-Options` and `Permissions-Policy`.
- Backend protected endpoints use Supabase bearer token authentication.
- Backend derives user identity from verified Supabase Auth context.
- User-scoped operations verify snake profile ownership and rely on request-scoped Supabase client/RLS context.
- `POST /admin/cleanup` requires `x-admin-secret` and explicit test-environment enablement.
- Service role key is backend-only and must not be exposed to frontend or browser tests.

## Next Steps

- Attach or archive the latest ZAP baseline report before release review.
- Decide which ZAP alert levels should fail CI after the baseline is clean.
- Add automated API coverage for invalid JWT token handling if not already covered by the smoke/regression suite.
- Add automated checks for header spoofing attempts.
- Add an authenticated ZAP scan only for a dedicated non-production environment.
- Keep `client/vercel.json` and backend Helmet/CORS policy aligned with deployed URLs.
