# Finding Discovery Report

## Candidate Surfaces Reviewed

1. French localization strings in `src/localization.ts`.
2. Runtime SEO and JSON-LD updates in `src/seo.ts`.
3. Route/language switching and translated visible content in `src/App.tsx`.
4. Static French page, sitemap, and LLM index generation in `scripts/postbuild-seo.mjs`.

## Findings Considered

### HTML or Script Injection Through Localized Copy

Disposition: suppressed.

Localized values are repository-owned strings. Runtime rendering uses JSX text nodes. Static metadata uses `escapeHtml` for title, description, and prerendered copy. JSON-LD is emitted with `JSON.stringify` and runtime JSON-LD is assigned through `textContent`.

### Open Redirect or Unsafe Navigation Through Language Switching

Disposition: suppressed.

Language switching maps the active internal page key to `getRouteHref`. Incoming URL resolution strips only the `/fr` locale prefix and then resolves against the static page map. No external URL is accepted as a redirect target.

### Duplicate or Conflicting hreflang Metadata

Disposition: fixed during scan.

The first browser pass showed duplicate `fr-CA` alternate links after client hydration because static HTML already contained hreflang links and `applySeo` appended another set. `setHreflang` now removes existing alternate hreflang links before writing the current set.

### Secret Exposure

Disposition: suppressed.

No new client env secret path was added. Secret-pattern search across changed files and `dist` found only the existing public build date/base URL usage.

### Dependency Advisory Surface

Disposition: suppressed.

No dependencies changed. `npm audit --json` returned zero vulnerabilities.

## Reportable Findings

No high-impact exploitable security finding survived validation.
