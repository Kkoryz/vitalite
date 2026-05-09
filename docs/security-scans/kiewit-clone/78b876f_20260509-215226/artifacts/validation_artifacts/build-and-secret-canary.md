# Build And Secret Canary Validation

## Purpose

Validate whether the historical `process.env.GEMINI_API_KEY` client define created an active leak in the current production bundle.

## Method

1. Build with a fake canary value in the relevant environment path.
2. Search the production bundle and source for the fake value and old key references.
3. Remove the risky define and stale docs even though the canary did not appear in `dist`.

## Commands

```powershell
npm run build
rg -n "GEMINI_API_KEY|sk-test-vitalite-secret-canary|@google/genai|process\.env\.GEMINI_API_KEY" dist package.json package-lock.json .env.example vite.config.ts src README.md
```

## Result

- No active canary value was found in `dist`.
- The risky client define was removed as preventive hardening.
- Unused AI/server dependencies and docs were removed.
