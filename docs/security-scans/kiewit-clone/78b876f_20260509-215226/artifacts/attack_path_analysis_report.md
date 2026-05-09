# Attack Path Analysis Report

## CAND-001: Build-Time API Key Exposure Risk

1. Attacker requires the production client bundle to contain a private key.
2. The current build did not reference `process.env.GEMINI_API_KEY`, so no key was emitted.
3. The dangerous future path was removed by deleting the client define and stale docs.

Disposition: hardened; no active attack path remains in the current build.

## CAND-002: Contact Form Abuse

1. Attacker can submit the public contact form.
2. Existing lead qualification blocks common non-fit inquiry types and messages.
3. A honeypot now blocks simple automated submissions before the external Formspree request.
4. A determined attacker can still post directly to the external form endpoint if Formspree accepts it.

Disposition: low-impact abuse risk; repository-side hardening complete, account-side anti-spam remains a follow-up if needed.

## CAND-003: Dependency Surface

1. Attacker would need a reachable vulnerable dependency path.
2. Unused AI/server packages were not imported by source.
3. Packages were removed and `npm audit` returned zero vulnerabilities.

Disposition: suppressed.
