# Validation Report

## Commands

```powershell
npm run lint
npm run build
npm audit --json
rg -n -F "dangerouslySetInnerHTML" src\App.tsx src\seo.ts src\localization.ts scripts\postbuild-seo.mjs
rg -n -F "innerHTML" src\App.tsx src\seo.ts src\localization.ts scripts\postbuild-seo.mjs
rg -n -F "eval(" src\App.tsx src\seo.ts src\localization.ts scripts\postbuild-seo.mjs
rg -n -F "new Function" src\App.tsx src\seo.ts src\localization.ts scripts\postbuild-seo.mjs
rg -n "sk-|api[_-]?key|secret|token|GEMINI|OPENAI|process\.env|import\.meta\.env" src\App.tsx src\seo.ts src\localization.ts scripts\postbuild-seo.mjs dist package.json .env.example README.md
```

## Results

- TypeScript lint passed.
- Production build passed after approved escalation for the local esbuild sandbox `spawn EPERM` failure.
- npm audit reported zero vulnerabilities.
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval(`, or `new Function` use was found in changed runtime/generator files.
- Secret-pattern search found only expected public build/base-url references: `process.env.VITALITE_BUILD_DATE` and `import.meta.env.BASE_URL`.

## Browser Checks

Local static preview checks passed for:

- `http://127.0.0.1:3017/fr/`
- `http://127.0.0.1:3017/fr/services/custom-home-design-build-toronto/`

Observed:

- `html lang="fr-CA"`
- French canonical URLs
- exactly one `fr-CA` hreflang after hydration
- JSON-LD WebPage `inLanguage: fr-CA`
- French visible short-answer and planning-evidence sections
- no browser warnings or errors
