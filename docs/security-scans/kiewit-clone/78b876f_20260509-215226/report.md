# Codex Security Scan Report

## Scan Metadata

- Repository: `kiewit-clone`
- Commit baseline: `78b876f`
- Scan id: `78b876f_20260509-215226`
- Scan date: 2026-05-09
- Scope: repository-wide Vite/React marketing site scan
- Skill workflow: threat model, finding discovery, validation, attack-path analysis, final report

Subagent note: the security-scan workflow normally supports delegated phase work, but this session only permits spawning subagents when the user explicitly asks for parallel agents. The scan was executed locally and artifacts were written under this directory.

## Result

No high-impact exploitable finding survived validation in the current shipped build.

The scan did produce security hardening changes:

- Removed the risky `process.env.GEMINI_API_KEY` Vite client define.
- Removed stale Gemini setup instructions from `.env.example` and `README.md`.
- Removed unused `@google/genai`, `express`, `dotenv`, and `@types/express` packages.
- Added a contact-form honeypot before the external Formspree post.
- Added analytics-safe event helpers that avoid PII and raw search queries.

## No Findings

The repository has no backend, auth boundary, database access, file upload, filesystem path sink, SSRF proxy, command execution path, or deserialization surface. The main visitor-controlled surfaces are contact-form fields and search text. Search output is selected from local route data and rendered through React escaping. Contact form data is sent to Formspree, but local controls now reject obvious non-fit and honeypot submissions before the post.

The historical API-key concern did not become a formal live finding because the canary value did not appear in `dist`; however, the pattern was removed because it was fragile and could leak a future secret if client code referenced it.

## Coverage Closure

| Surface | Disposition | Evidence |
| --- | --- | --- |
| Client env injection | Hardened | `vite.config.ts` now only defines `__VITALITE_BUILD_DATE__`. |
| Stale secret docs | Hardened | `.env.example` and `README.md` no longer instruct `GEMINI_API_KEY` setup. |
| Dependency advisory surface | Suppressed | Unused AI/server packages removed; `npm audit` returned zero vulnerabilities. |
| Search overlay | Suppressed | React-rendered local results; raw queries are not sent to analytics. |
| Contact form abuse | Hardened | Honeypot added; existing lead qualification retained and tested. |
| Analytics PII leakage | Hardened | Centralized helpers track ids, categories, query length, and result keys instead of personal fields or raw query text. |
| JSON-LD/SEO metadata | Suppressed | Repository-owned data serialized with `JSON.stringify` into `textContent`. |
| Auth/object access | Not applicable | Static marketing site has no authenticated resource boundary. |
| Upload/path/SSRF/RCE/deserialization | Not applicable | No matching sink found in the runtime inventory. |

## Validation Summary

```powershell
npm run lint
npm run build
npx tsx src\leadQualification.test.ts
npm audit --json
rg -n "GEMINI_API_KEY|sk-test-vitalite-secret-canary|@google/genai|process\.env\.GEMINI_API_KEY" dist package.json package-lock.json .env.example vite.config.ts src README.md
```

Results:

- TypeScript lint passed.
- Production build passed after an approved escalation was used for the sandbox `spawn EPERM` failure.
- Lead qualification tests passed.
- npm audit reported zero vulnerabilities.
- Secret/dependency canary search found no active Gemini client-key path after cleanup.

## Follow-Up Prompts

- Review Formspree account-side spam controls and rate limits for the contact form endpoint.
- If a backend intake API is added, run a focused security scan on authentication, rate limiting, server-side validation, and CRM writes.
- If an AI API integration is reintroduced, run a focused secret-handling review before exposing any UI that calls the model.
