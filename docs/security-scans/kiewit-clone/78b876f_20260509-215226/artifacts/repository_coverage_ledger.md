# Repository Coverage Ledger

| Row | Surface | Root control | Disposition | Reason |
| --- | --- | --- | --- | --- |
| L-001 | Build-time env injection | `vite.config.ts` define block | Hardened | Removed `process.env.GEMINI_API_KEY`; only build date define remains. |
| L-002 | GA4 bootstrap | `index.html` measurement id gate | Suppressed | Measurement id must match `G-[A-Z0-9]+`; no visitor input reaches script URL. |
| L-003 | Search overlay | `src/App.tsx` search result render | Suppressed | Results are filtered from local route data and rendered by React escaping. Raw query is not sent to analytics. |
| L-004 | Contact form intake | `src/App.tsx` submit handler | Hardened | Honeypot added before Formspree post; non-fit lead filters retained. |
| L-005 | Analytics properties | `src/analytics.ts` event helper | Hardened | Centralized helpers omit names, emails, phone numbers, message bodies, and raw search terms. |
| L-006 | Calculator controls | `src/Calculators.tsx` inputs | Suppressed | Controls are local bounded options/ranges; no server or HTML sink. |
| L-007 | Dependencies | `package.json`, `package-lock.json` | Suppressed | Unused AI/server packages removed; npm audit returned zero vulnerabilities. |
| L-008 | Static SEO JSON-LD | `src/seo.ts` JSON-LD injection | Suppressed | Values are repository-owned data, assigned to `script.textContent` as `JSON.stringify`; no visitor input source found. |
| L-009 | Authentication/authorization | Repository runtime | Not applicable | Static marketing site has no auth boundary or protected object access. |
| L-010 | Upload/path/file/SSRF/RCE sinks | Repository runtime | Not applicable | No upload, path traversal, filesystem, SSRF proxy, command execution, or deserialization surface was found. |
