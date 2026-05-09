import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const read = (file) => fs.readFileSync(path.join(rootDir, file), 'utf8');
const app = read('src/App.tsx');
const seo = read('src/seo.ts');
const postbuild = read('scripts/postbuild-seo.mjs');
const vite = read('vite.config.ts');
const seoData = JSON.parse(read('src/seo-data.json'));

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(app.includes("import seoContexts from './seo-contexts.json';"), 'App.tsx must import src/seo-contexts.json.');
assert(seo.includes("import seoContexts from './seo-contexts.json';"), 'seo.ts must import src/seo-contexts.json.');
assert(postbuild.includes('seo-contexts.json'), 'postbuild SEO must read src/seo-contexts.json.');
assert(app.includes('mergeSeoContextData') && seo.includes('mergeSeoContextData'), 'Client code must merge seo-contexts into SEO context data.');

assert(!postbuild.includes("const today = '2026-05-04'"), 'postbuild freshness date must not be hard-coded to 2026-05-04.');
assert(postbuild.includes('VITALITE_BUILD_DATE') && postbuild.includes('formatBuildDate'), 'postbuild must support build-date freshness.');
assert(vite.includes('__VITALITE_BUILD_DATE__'), 'Vite must expose a build date for client-side JSON-LD freshness.');

const guideImageMap = app.match(/const longTailGuideImages:[\s\S]*?};/);
assert(guideImageMap, 'App.tsx must define longTailGuideImages.');
if (guideImageMap) {
  const mappedKeys = [...guideImageMap[0].matchAll(/'([^']+)':\s*(?:visuals\.\w+|visualAsset\('[^']+'\))/g)].map((match) => match[1]);
  const mappedValues = [...guideImageMap[0].matchAll(/:\s*((?:visuals\.\w+)|(?:visualAsset\('[^']+'\)))/g)].map((match) => match[1]);
  const missingKeys = (seoData.longTailPages ?? [])
    .map((page) => page.key)
    .filter((key) => !mappedKeys.includes(key));
  assert(missingKeys.length === 0, `Missing long-tail guide images for: ${missingKeys.join(', ')}`);
  assert(new Set(mappedValues).size === mappedValues.length, 'Long-tail guide images should not reuse the same image mapping.');
}

for (const label of ['Project Type', 'Location', 'Size', 'Duration', 'Approval Path', 'Permit Route', 'Scope', 'Outcome']) {
  assert(app.includes(label), `Project case-study facts must include ${label}.`);
}
assert(app.includes('Project Case Study Facts'), 'Project pages must label the Gallery-style facts section.');
assert(app.includes('buildProjectPermitRoute') && app.includes('buildProjectOutcome'), 'Project pages must derive permit route and outcome content.');
assert(seo.includes('buildProjectPermitRoute') && seo.includes('buildProjectOutcome'), 'Project FAQ/schema must include permit route and outcome helpers.');
assert(postbuild.includes('buildProjectPermitRoute') && postbuild.includes('buildProjectOutcome'), 'Static SEO output must include permit route and outcome helpers.');

assert(app.includes('buildVisibleGeoEvidenceSections'), 'Detail pages must generate visible GEO evidence sections.');
for (const heading of ['Key Facts', 'Comparison Framework', 'Evidence To Prepare', 'Caveats And Boundaries']) {
  assert(app.includes(heading), `Visible detail-page GEO content missing heading: ${heading}`);
  assert(postbuild.includes(heading), `Static GEO content missing heading: ${heading}`);
}
assert(app.includes('According to the GEO citation research pattern'), 'Visible copy must explain the evidence-page rationale without relying only on hidden fallback copy.');

const faqRequirements = [
  'Does Vitalite have a project minimum?',
  'How long do Toronto permit drawings take?',
  'How long does a Toronto garden suite project take?',
  'What budget range should owners expect for a home addition?',
  'Who responds to city permit comments?',
  'How does Vitalite control change orders?',
];
for (const question of faqRequirements) {
  assert(seo.includes(question), `Client FAQ missing: ${question}`);
  assert(postbuild.includes(question), `Static FAQ missing: ${question}`);
}

assert(app.includes("page.key === 'faq'"), 'FAQ route must render as a real detail page.');
assert(vite.includes('seo-data.json') && vite.includes('projects-data.json') && vite.includes('seo-contexts.json'), 'Vite must split local SEO/project data into named chunks.');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Gallery-style SEO/GEO upgrade checks passed.');
