# Attack Path Analysis

## Candidate Attack Path: Localized Copy to HTML/Script Execution

An attacker would need to control localization or SEO page strings. In the shipped site those strings come from repository-owned JSON and TypeScript constants, not visitor input. React escapes visible text. Static HTML generation escapes metadata and prerender text. JSON-LD uses JSON serialization. No exploitable path remains.

## Candidate Attack Path: URL Prefix to External Redirect

An attacker would need `/fr` routing to accept arbitrary external destinations. The route resolver strips the locale prefix and resolves the remaining path against known internal page keys. Language switching derives destinations from internal page keys. No external redirect sink exists.

## Candidate Attack Path: Build-Time Secret Exposure

An attacker would need a secret-bearing environment variable to be injected into the client bundle. The diff only reads `VITALITE_BUILD_DATE` in the postbuild script and `BASE_URL` in client code. No new secret or token-bearing env path was added.

## Candidate Attack Path: Metadata Poisoning Through User Input

The search box and contact form do not write to SEO metadata, sitemap, static pages, or LLM index generation. Generated French metadata is build-time only and repository-owned. No visitor-controlled metadata poisoning path exists.

## Result

No validated attack path reaches script execution, credential exposure, open redirect, stored content poisoning, or unauthorized third-party transmission beyond the pre-existing Formspree contact form.
