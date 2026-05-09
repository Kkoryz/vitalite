# Finding Discovery Report

## Candidate Inventory

### CAND-001: Build-time API key exposure risk

- Source: `vite.config.ts` previously defined `process.env.GEMINI_API_KEY` for client replacement.
- Impact hypothesis: a future client reference could inline a private API key into the production bundle.
- Initial disposition: validate with a canary build and source/bundle search.

### CAND-002: Contact form automated or non-fit submission path

- Source: `src/App.tsx` contact form posts to Formspree after client-side qualification.
- Impact hypothesis: automated bots can submit low-quality data and degrade intake quality.
- Initial disposition: low security impact but useful hardening.

### CAND-003: Dependency advisory exposure

- Source: package manifest included unused AI/server packages.
- Impact hypothesis: unused dependencies can increase audit surface and accidental feature exposure.
- Initial disposition: validate with `npm audit` and source search.

## Non-Candidates

- Route and search rendering did not use `dangerouslySetInnerHTML` or an HTML parser sink.
- JSON-LD generation uses repository-owned data and `textContent`, not visitor-provided HTML.
- No backend, auth, database, upload, SSRF, filesystem, shell execution, or deserialization sink was present.
