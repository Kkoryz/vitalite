import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist');
const html = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
const sitemap = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8');

assert.match(html, /document\.documentElement\.classList\.add\('vitalite-js'\)/, 'HTML should mark JS-capable clients before first paint.');
assert.match(html, /\.vitalite-js \.seo-prerender\s*\{\s*display:\s*none\s*!important;\s*\}/, 'JS-capable clients should hide the static SEO fallback.');
assert.match(html, /<div id="root"><\/div>\s*<main class="seo-prerender"/, 'SEO evidence copy should sit outside an empty React root.');
assert.doesNotMatch(html, /<noscript><main class="seo-prerender"/, 'SEO evidence copy should not be hidden behind noscript only.');
assert.match(html, /<style id="vitalite-critical-paint">/, 'Critical background style should be inline before the app CSS loads.');
assert.ok(sitemap.includes('/services/fourplex-builder-toronto'), 'Fourplex BOFU service page should be indexable.');
assert.ok(sitemap.includes('/communities/custom-home-builder-rosedale'), 'Tier 2 community custom-home page should be indexable.');
assert.ok(sitemap.includes('/communities/garden-suite-builder-roncesvalles'), 'Tier 2 garden-suite community page should be indexable.');
assert.ok(!sitemap.includes('/communities/multiplex-contractor-mineola'), 'Non-priority community multiplex pages should stay out of the sitemap.');

const stripTags = (value) =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const collectRouteFiles = async (dir, files = []) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectRouteFiles(entryPath, files);
    } else if (entry.name === 'index.html') {
      files.push(entryPath);
    }
  }
  return files;
};

const routeFiles = await collectRouteFiles(distDir);
assert.ok(routeFiles.length >= 250, `Expected a broad static route set; found ${routeFiles.length}.`);

for (const routeFile of routeFiles) {
  const route = path.relative(distDir, path.dirname(routeFile)).replaceAll(path.sep, '/') || '/';
  const routeHtml = await fs.readFile(routeFile, 'utf8');
  assert.match(routeHtml, /<div id="root"><\/div>\s*<main class="seo-prerender"/, `${route} should keep the React root empty before the static SEO fallback.`);

  const fallbackMatch = routeHtml.match(/<main class="seo-prerender"[\s\S]*?<\/main>/);
  assert.ok(fallbackMatch, `${route} should contain a static SEO fallback.`);

  const fallbackHtml = fallbackMatch[0];
  const text = stripTags(fallbackHtml);
  const words = text.match(/[A-Za-z0-9$%-]+/g) ?? [];
  const canonical = routeHtml.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '';
  const robots = routeHtml.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '';
  const isNoindex = robots.includes('noindex');

  assert.ok(robots, `${route} should define a robots directive.`);
  assert.ok(canonical, `${route} should define a canonical URL.`);

  if (isNoindex) {
    assert.ok(!sitemap.includes(`<loc>${canonical}</loc>`), `${route} is noindex and should not be listed in the sitemap.`);
    continue;
  }

  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${route} is indexable and should be listed in the sitemap.`);

  if (route === 'fr' || route.startsWith('fr/')) {
    assert.ok(words.length >= 400, `${route} should expose at least 400 static French planning words; found ${words.length}.`);
  } else {
    assert.ok(words.length >= 1000, `${route} should expose at least 1000 static GEO words; found ${words.length}.`);
    assert.match(fallbackHtml, /<h2>Key Facts<\/h2>/, `${route} should include a key facts evidence block.`);
    assert.match(fallbackHtml, /<h2>Comparison Framework<\/h2>/, `${route} should include a comparison block.`);
    assert.match(fallbackHtml, /<h2>Planning Sequence<\/h2>/, `${route} should include a process block.`);
    assert.match(fallbackHtml, /City of Toronto|Toronto Building|building permit|zoning|inspection/i, `${route} should include official planning or approval evidence.`);
  }
}

console.log('seo prerender tests passed');
