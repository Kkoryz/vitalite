# Repository-Wide File Checklist

| Area | Files | Status | Notes |
| --- | --- | --- | --- |
| Build config | `vite.config.ts`, `index.html`, `.env.example`, `README.md` | Reviewed | Secret define removed; GA4 id allowlisted by format. |
| Runtime app | `src/App.tsx`, `src/main.tsx` | Reviewed | Search, contact form, routing, and link tracking inspected. |
| SEO/data | `src/seo.ts`, `src/seo-data.json`, `src/seo-contexts.json`, `src/projects-data.json` | Reviewed | Local static data rendered through React; no HTML sink found. |
| Calculators | `src/Calculators.tsx` | Reviewed | Numeric and categorical client controls only. |
| Lead filtering | `src/leadQualification.ts`, `src/leadQualification.test.ts` | Reviewed | Existing filters covered by local tests; honeypot added at form layer. |
| Analytics | `src/analytics.ts` | Reviewed | Event wrapper drops empty values and avoids PII fields. |
| Dependencies | `package.json`, `package-lock.json` | Reviewed | Unused AI/server packages removed; audit clean. |
| Scripts | `scripts/*.mjs` | Reviewed at inventory level | Postbuild/static verification scripts only; no runtime exposure. |
