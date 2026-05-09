# Runtime Inventory

## Scope

Diff-scoped scan for the French SEO/GEO implementation after baseline commit `a318097`.

Changed files reviewed:

- `src/App.tsx`
- `src/seo.ts`
- `src/localization.ts`
- `scripts/postbuild-seo.mjs`

Generated files reviewed:

- `dist/fr/**/index.html`
- `dist/sitemap.xml`
- `dist/llms.txt`
- `dist/robots.txt`

## Trust Boundary Changes

- Added crawlable `/fr/...` routes in generated static HTML.
- Added localized canonical, hreflang, JSON-LD, sitemap, and LLM index output.
- Added client-side language routing and localized detail-page rendering.

No new backend, auth, upload, database, filesystem, command-execution, or third-party write path was introduced.

## Sensitive Sinks

- React visible content is rendered through normal JSX escaping.
- JSON-LD is serialized with `JSON.stringify`.
- Client SEO JSON-LD is assigned through `textContent`.
- Static HTML metadata is generated from repository-owned data and escaped with the existing `escapeHtml` helper.
- Runtime navigation remains constrained to repository route keys and known path maps.
