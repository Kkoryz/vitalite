# Vitalite Security Audit

## Summary

- Scan date: 2026-05-09
- Scope: full repository review of the Vite/React marketing site, client-side routing, contact form intake, analytics loading, dependency manifest, and build output.
- Method: Codex Security phased scan: threat model, finding discovery, validation, attack-path analysis, and final report.
- Result: no high-impact exploitable finding survived validation in the current shipped build.

The audit still identified hardening work worth doing. The site previously carried an unused build-time define for `process.env.GEMINI_API_KEY`; it was not referenced in the built bundle during canary validation, but it created a risky pattern where future client code could accidentally publish a secret. The key path and unused Gemini/Express/Dotenv dependencies were removed. The contact form now has an additional honeypot and analytics-safe blocked-lead telemetry.

## Security Changes Added

| Area | Change | Files |
| --- | --- | --- |
| Client secret exposure prevention | Removed `process.env.GEMINI_API_KEY` from the Vite client define block and removed Gemini setup docs. | `vite.config.ts`, `.env.example`, `README.md` |
| Dependency surface reduction | Removed unused `@google/genai`, `express`, `dotenv`, and `@types/express` packages. | `package.json`, `package-lock.json` |
| Intake abuse reduction | Added a hidden honeypot field before Formspree submission and tracked blocked attempts without PII. | `src/App.tsx` |
| Analytics safety | Added a centralized GA4 wrapper that drops empty values and avoids PII in tracked events. | `src/analytics.ts`, `src/App.tsx`, `src/Calculators.tsx`, `src/seo.ts` |

## Findings Status

| ID | Candidate | Status | Evidence |
| --- | --- | --- | --- |
| CAND-001 | Client-side API key exposure through Vite `define` | Hardened, not an active leak | Canary build with a fake key did not find the value in `dist`, but the risky define was removed. |
| CAND-002 | Contact form spam/data-quality bypass | Hardened, low security impact | Existing client qualification reduced non-fit leads; a honeypot now blocks simple automated submissions before the external form post. |
| CAND-003 | Dependency advisory exposure | Suppressed | `npm audit --json` reported zero vulnerabilities after dependency cleanup. |
| CAND-004 | SPA route or search injection | Suppressed | Search result rendering uses React escaping and route keys from local data; no HTML sink was found. |

## Residual Risks

- Formspree remains an external submission endpoint. Abuse prevention beyond the local honeypot should be configured in Formspree or a server-side intake endpoint if spam volume increases.
- GA4 runs only when `VITE_GA_MEASUREMENT_ID` is injected at build time. If consent requirements apply in a target market, add consent mode before enabling production tracking.
- This is a static client application. Any future server endpoint, AI API integration, or CRM write integration should be reviewed separately because it will introduce new trust boundaries.

## Verification

The following checks were run after the implementation:

```powershell
npm run lint
npm run build
npx tsx src\leadQualification.test.ts
npm audit --json
rg -n "GEMINI_API_KEY|sk-test-vitalite-secret-canary|@google/genai|process\.env\.GEMINI_API_KEY" dist package.json package-lock.json .env.example vite.config.ts src README.md
```

Results:

- TypeScript lint passed.
- Production build passed. The first sandboxed build hit `spawn EPERM`; the approved escalated build completed.
- Lead qualification tests passed.
- `npm audit` reported zero vulnerabilities.
- Secret/dependency canary search returned no active Gemini client key path in build or source files after cleanup.

## Linked Artifacts

- Final scan report: `docs/security-scans/kiewit-clone/78b876f_20260509-215226/report.md`
- Tracking plan: `docs/analytics-tracking-plan.md`
