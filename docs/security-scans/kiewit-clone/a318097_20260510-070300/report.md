# Codex Security Scan Report

## Scan Metadata

- Repository: `kiewit-clone`
- Commit baseline: `a318097`
- Scan id: `a318097_20260510-070300`
- Scan date: 2026-05-10
- Scope: diff-scoped scan for French SEO/GEO route, metadata, sitemap, LLM index, and visible page localization changes
- Skill workflow: threat model, finding discovery, validation, attack-path analysis, final report

Subagent note: the security-scan workflow supports delegated phase work, but this session only permits spawning subagents when the user explicitly asks for parallel agents. The scan was executed locally and artifacts were written under this directory.

## Result

No high-impact exploitable finding survived validation.

One SEO-integrity issue was found and fixed during browser validation: hydrated pages briefly had duplicate `fr-CA` hreflang links because static HTML and runtime SEO both wrote alternates. Runtime `setHreflang` now removes existing alternate hreflang links before writing the current set.

## Coverage Closure

| Surface | Disposition | Evidence |
| --- | --- | --- |
| French static route generation | Suppressed | 297 generated `dist/fr/**/index.html` files with localized canonical, hreflang, and JSON-LD. |
| Runtime language routing | Suppressed | Language changes map internal page keys to known localized paths; no external redirect target is accepted. |
| HTML/script injection | Suppressed | Visible copy uses JSX escaping; static text uses `escapeHtml`; JSON-LD uses `JSON.stringify` and runtime `textContent`. |
| hreflang duplication | Fixed | Browser check now reports exactly one `fr-CA` alternate after hydration. |
| LLM/GEO index | Suppressed | `dist/llms.txt` includes French core, service, guide, service-area, and project-proof sections. |
| Secret exposure | Suppressed | No new secret-bearing env path; search found only public build date/base URL usage. |
| Dependencies | Suppressed | `npm audit --json` reported zero vulnerabilities. |
| Contact form | Not changed | Existing Formspree trust boundary unchanged by this diff. |

## Validation Summary

```powershell
npm run lint
npm run build
npm audit --json
```

Additional targeted checks searched for direct HTML/script sinks and secret patterns in the modified runtime/generator files and generated `dist`.

Browser validation passed for `/fr/` and `/fr/services/custom-home-design-build-toronto/`: `fr-CA` language, French canonical, single `fr-CA` alternate, JSON-LD `inLanguage: fr-CA`, French visible GEO sections, and no console warnings/errors.

## Follow-Up Prompts

- If the site later adds server-side French intake, rescan authentication, rate limiting, validation, and CRM writes.
- If external translation or CMS input is introduced, rescan metadata escaping and JSON-LD serialization with attacker-controlled content.
