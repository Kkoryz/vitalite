import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src', 'App.tsx');
const seoDataPath = path.join(root, 'src', 'seo-data.json');
const imageDir = path.join(root, 'public', 'seo-placeholders');
const appSource = fs.readFileSync(appPath, 'utf8');
const seoData = JSON.parse(fs.readFileSync(seoDataPath, 'utf8'));

const visualAssets = new Map(
  Array.from(appSource.matchAll(/^\s{2}([A-Za-z0-9_]+):\s*visualAsset\('([^']+)'\),$/gm)).map((match) => [
    match[1],
    match[2],
  ]),
);

function resolveVisual(expression) {
  const visualKey = expression.match(/^visuals\.([A-Za-z0-9_]+)$/)?.[1];
  if (visualKey) return visualAssets.get(visualKey) ?? `__missing_visual:${visualKey}`;

  const directAsset = expression.match(/^visualAsset\('([^']+)'\)$/)?.[1];
  if (directAsset) return directAsset;

  return `__unresolved:${expression}`;
}

function blockBetween(startNeedle, endNeedle) {
  const start = appSource.indexOf(startNeedle);
  const end = endNeedle ? appSource.indexOf(endNeedle, start) : -1;
  if (start === -1 || (endNeedle && end === -1)) {
    throw new Error(`Could not locate block between ${startNeedle} and ${endNeedle}`);
  }
  return appSource.slice(start, endNeedle ? end : undefined);
}

const homeSources = [];

function collectFromBlock(labelPrefix, block, propertyName) {
  const regex = new RegExp(`${propertyName}:\\s*(visuals\\.[A-Za-z0-9_]+|visualAsset\\('[^']+'\\))`, 'g');
  let match;
  let index = 0;
  while ((match = regex.exec(block))) {
    index += 1;
    homeSources.push({ label: `${labelPrefix} ${index}`, assetName: resolveVisual(match[1]) });
  }
}

collectFromBlock('hero slide', blockBetween('const heroSlides = [', 'const Hero = () => {'), 'image');
collectFromBlock('expertise tab', blockBetween('const expertiseItems = [', 'const Expertise = () => {'), 'image');
collectFromBlock('market card', blockBetween('const Markets = () => {', 'const ProjectProcess = () => {'), 'img');
collectFromBlock('process card', blockBetween('const ProjectProcess = () => {', 'const serviceInclusions'), 'img');

const integratedBlock = blockBetween('const IntegratedSolutions = () => {', 'const Stats = () => {');
for (const match of integratedBlock.matchAll(/<img src=\{(visuals\.[A-Za-z0-9_]+|visualAsset\('[^']+'\))\}/g)) {
  homeSources.push({ label: `integrated collage ${homeSources.length + 1}`, assetName: resolveVisual(match[1]) });
}

const failures = [];
const seenHomeAssets = new Map();

for (const item of homeSources) {
  if (item.assetName.startsWith('__')) {
    failures.push(`${item.label} has unresolved image expression ${item.assetName}.`);
    continue;
  }

  const previous = seenHomeAssets.get(item.assetName);
  if (previous) {
    failures.push(`${item.label} reuses ${item.assetName}.webp already used by ${previous}.`);
  } else {
    seenHomeAssets.set(item.assetName, item.label);
  }

  const assetPath = path.join(imageDir, `${item.assetName}.webp`);
  if (!fs.existsSync(assetPath)) {
    failures.push(`${item.label} references ${item.assetName}.webp, but that file does not exist.`);
  }
}

const locationPages = (seoData.locationServices ?? []).flatMap((service) =>
  (seoData.locations ?? []).map((location) => `${service.keyPrefix}-${location.slug}`),
);
const communityPages = (seoData.communityServices ?? []).flatMap((service) =>
  (seoData.communityLocations ?? []).map((community) => `${service.keyPrefix}-${community.slug}`),
);
const localSeoPages = [...locationPages, ...communityPages];
const localSeoReturnPattern = /if \(page\.key\.startsWith\('location-'\) \|\| page\.key\.startsWith\('community-'\)\) return visualAsset\(`seo-\$\{page\.key\}`\);/;

if (!localSeoReturnPattern.test(appSource)) {
  failures.push('imageForSeoPage must return visualAsset(`seo-${page.key}`) for location/community pages.');
}

for (const key of localSeoPages) {
  const assetPath = path.join(imageDir, `seo-${key}.webp`);
  if (!fs.existsSync(assetPath)) {
    failures.push(`Missing local SEO card image: seo-${key}.webp`);
  }
}

if (failures.length > 0) {
  console.error(`Home and Services SEO image verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Verified ${homeSources.length} homepage images and ${localSeoPages.length} Services local SEO card images with no duplicate homepage assets.`);
