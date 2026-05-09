import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src', 'App.tsx');
const appSource = fs.readFileSync(appPath, 'utf8');

const visualAssets = new Map(
  Array.from(appSource.matchAll(/^\s{2}([A-Za-z0-9_]+):\s*visualAsset\('([^']+)'\),$/gm)).map((match) => [
    match[1],
    match[2],
  ]),
);

const detailStart = appSource.indexOf('const detailPages: Record<DetailPageKey, DetailPageContent> = {');
const detailEnd = appSource.indexOf('const staticDetailPages:', detailStart);

if (detailStart === -1 || detailEnd === -1) {
  throw new Error('Could not locate detailPages block in src/App.tsx');
}

const detailBlock = appSource.slice(detailStart, detailEnd);
const pageStarts = Array.from(detailBlock.matchAll(/^  '([^']+)': \{/gm));
const targetCategories = new Set(['WHY VITALITE', 'OUR WORK']);
const mappedSectionImages = new Map();
const usedAssets = new Map();
const failures = [];
let checkedSections = 0;

const sectionMapStart = appSource.indexOf('const detailSectionImages');
if (sectionMapStart !== -1) {
  const sectionMapEnd = appSource.indexOf('};', sectionMapStart);
  const sectionMapBlock = appSource.slice(sectionMapStart, sectionMapEnd);
  const mappedPageStarts = Array.from(sectionMapBlock.matchAll(/^  '([^']+)': \{/gm));

  for (let index = 0; index < mappedPageStarts.length; index += 1) {
    const pageKey = mappedPageStarts[index][1];
    const pageStart = mappedPageStarts[index].index;
    const pageEnd = mappedPageStarts[index + 1]?.index ?? sectionMapBlock.length;
    const pageMapBlock = sectionMapBlock.slice(pageStart, pageEnd);

    for (const match of pageMapBlock.matchAll(/^\s{4}'([^']+)':\s*(?:visuals\.([A-Za-z0-9_]+)|visualAsset\('([^']+)'\)),$/gm)) {
      const visualKey = match[2];
      const directAssetName = match[3];
      const assetName = directAssetName ?? visualAssets.get(visualKey) ?? `__missing_visual_key:${visualKey}`;
      mappedSectionImages.set(`${pageKey}\u0000${match[1]}`, assetName);
    }
  }
}

for (let index = 0; index < pageStarts.length; index += 1) {
  const pageKey = pageStarts[index][1];
  const pageStart = pageStarts[index].index;
  const pageEnd = pageStarts[index + 1]?.index ?? detailBlock.length;
  const pageBlock = detailBlock.slice(pageStart, pageEnd);
  const category = pageBlock.match(/^\s{4}category: '([^']+)',/m)?.[1];

  if (!targetCategories.has(category)) continue;

  const title = pageBlock.match(/^\s{4}title: '([^']+)',/m)?.[1] ?? pageKey;
  const sectionLines = pageBlock
    .split('\n')
    .filter((line) => line.includes('{ heading:') && line.includes(' text: '));

  for (const line of sectionLines) {
    checkedSections += 1;

    const heading = line.match(/heading: '([^']+)'/)?.[1] ?? line.match(/heading: "([^"]+)"/)?.[1] ?? 'Unknown section';
    const inlineVisualKey = line.match(/image:\s*visuals\.([A-Za-z0-9_]+)/)?.[1];
    const mappedAssetName = mappedSectionImages.get(`${pageKey}\u0000${heading}`);
    const assetName = inlineVisualKey ? visualAssets.get(inlineVisualKey) : mappedAssetName;
    const label = `${pageKey} / ${heading}`;

    if (!inlineVisualKey && !mappedAssetName) {
      failures.push(`${label} is missing a detailSectionImages or inline visuals.* assignment.`);
      continue;
    }

    if (!assetName) {
      failures.push(`${label} references visuals.${inlineVisualKey}, but that key is not defined in the visuals map.`);
      continue;
    }

    if (assetName.startsWith('__missing_visual_key:')) {
      failures.push(`${label} references visuals.${assetName.replace('__missing_visual_key:', '')}, but that key is not defined in the visuals map.`);
      continue;
    }

    const assetPath = path.join(root, 'public', 'seo-placeholders', `${assetName}.webp`);
    if (!fs.existsSync(assetPath)) {
      failures.push(`${label} references ${assetName}.webp, but that file does not exist.`);
    }

    const previousUse = usedAssets.get(assetName);
    if (previousUse) {
      failures.push(`${label} reuses ${assetName}.webp already used by ${previousUse}.`);
    } else {
      usedAssets.set(assetName, label);
    }
  }
}

if (checkedSections === 0) {
  failures.push('No WHY VITALITE or OUR WORK detail sections were checked.');
}

if (failures.length > 0) {
  console.error(`Detail section image verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Verified ${checkedSections} WHY VITALITE / OUR WORK detail section images with no duplicate assets.`);
