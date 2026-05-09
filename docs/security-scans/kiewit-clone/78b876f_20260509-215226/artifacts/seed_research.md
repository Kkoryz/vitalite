# Seed Research

## Inputs

- Repository-wide scan requested by the user.
- Local dependency and source review.
- Local `npm audit --json` advisory check.

## Advisory And Secret Seeds

| Seed | Source | Result |
| --- | --- | --- |
| `GEMINI_API_KEY` | `.env.example`, `vite.config.ts`, `README.md` | Risky client define and stale setup docs were present before remediation. Build canary did not find an active leaked value in `dist`. |
| `@google/genai` | `package.json` | Dependency was unused in source and removed to reduce accidental future client AI-key usage. |
| `express`, `dotenv`, `@types/express` | `package.json` | Unused server-side packages in a static client app; removed. |
| npm advisories | `npm audit --json` | Zero known vulnerabilities after cleanup. |

## Failed Lookup Attempts

- No repository backend, API route, database adapter, upload handler, or authentication code was found to seed deeper server-side checks.
