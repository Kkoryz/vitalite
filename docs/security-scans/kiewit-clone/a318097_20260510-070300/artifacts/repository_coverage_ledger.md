# Repository Coverage Ledger

| Area | Coverage | Disposition |
| --- | --- | --- |
| French route generation | `scripts/postbuild-seo.mjs` static route loop and canonical helpers | Reviewed |
| Runtime language routing | `src/App.tsx`, `src/seo.ts`, `src/localization.ts` | Reviewed |
| Metadata escaping | `escapeHtml`, `JSON.stringify`, `textContent` sinks | Suppressed |
| hreflang lifecycle | Static HTML plus hydrated `applySeo` behavior | Fixed duplicate links |
| Sitemap and LLM/GEO index | `dist/sitemap.xml`, `dist/llms.txt` | Reviewed |
| Visitor search input | Search overlay query handling | No new security sink |
| Contact form | Existing Formspree post path | No change in this diff |
| Dependencies | `package-lock.json`, `npm audit --json` | No vulnerabilities |
| Secrets | changed files and generated `dist` | No new secret path |

## Files Not Re-Reviewed In Depth

The calculators, lead qualification logic, analytics helpers, and unrelated page content were not modified by this French SEO/GEO diff. They remain covered by the prior repository-wide scan unless changed later.
