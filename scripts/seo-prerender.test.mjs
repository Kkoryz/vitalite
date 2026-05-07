import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const html = await fs.readFile(path.join(process.cwd(), 'dist', 'index.html'), 'utf8');

assert.match(html, /<div id="root"><\/div>/, 'React root should be empty so prerendered SEO copy cannot flash before JS loads.');
assert.match(html, /<noscript><main class="seo-prerender"/, 'SEO fallback should live inside noscript for no-JS clients.');
assert.match(html, /<style id="vitalite-critical-paint">/, 'Critical background style should be inline before the app CSS loads.');

console.log('seo prerender tests passed');
