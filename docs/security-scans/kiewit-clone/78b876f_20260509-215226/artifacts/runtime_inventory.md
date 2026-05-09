# Runtime Inventory

## Runtime

- Frontend: Vite, React, TypeScript, Tailwind CSS, Motion, Lucide React.
- Build: `vite build && node scripts/postbuild-seo.mjs`.
- Package manager: npm with `package-lock.json`.
- External browser calls:
  - GA4 script from `https://www.googletagmanager.com/gtag/js` when `VITE_GA_MEASUREMENT_ID` is present.
  - Formspree contact form submission endpoint in `src/App.tsx`.
  - Social links and `tel:`/`mailto:` contact links.

## Entry Points Reviewed

- `src/App.tsx`: routes, search overlay, contact form, global link handling.
- `src/Calculators.tsx`: interactive calculator controls and quote CTAs.
- `src/seo.ts`: route metadata, JSON-LD, canonical URL handling, manual pageview tracking.
- `src/analytics.ts`: analytics event wrapper and event helpers.
- `src/leadQualification.ts`: client-side lead filtering.
- `vite.config.ts`: build-time environment handling and HTML transform.
- `index.html`: GA4 bootstrap.
- `package.json` and `package-lock.json`: dependency surface.

## Not Present

- No server routes in the app runtime.
- No authentication or authorization layer.
- No database access.
- No local file upload, deserialization, SSRF proxy, command execution, or HTML template rendering surface.
