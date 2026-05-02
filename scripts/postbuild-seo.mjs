import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const seoData = JSON.parse(await fs.readFile(path.join(rootDir, 'src', 'seo-data.json'), 'utf8'));
const baseHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
const today = '2026-05-01';
const pages = [...seoData.pages, ...buildGeneratedPages()];

const pageByPath = new Map(pages.map((page) => [normalizeRoutePath(page.path), page]));

for (const page of pages) {
  const html = injectSeo(baseHtml, page);
  const routePath = normalizeRoutePath(page.path);
  if (routePath === '/') {
    await fs.writeFile(path.join(distDir, 'index.html'), html);
  } else {
    const targetDir = path.join(distDir, ...routePath.split('/').filter(Boolean));
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, 'index.html'), html);
  }
}

await fs.writeFile(path.join(distDir, '404.html'), injectSeo(baseHtml, pageByPath.get('/')));
await fs.writeFile(path.join(distDir, 'sitemap.xml'), buildSitemap());
await fs.writeFile(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${seoData.siteUrl}/sitemap.xml\n`);

function injectSeo(html, page) {
  const canonical = canonicalFor(page);
  const image = `${seoData.siteUrl}${seoData.defaultImage}`;
  const managedHead = [
    '<!-- Vitalite SEO -->',
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    `<meta name="author" content="${escapeHtml(seoData.business.name)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:site_name" content="${escapeHtml(seoData.siteName)}" />`,
    `<meta property="og:type" content="${page.kind === 'article' ? 'article' : 'website'}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json" data-vitalite-jsonld="true">${JSON.stringify(buildJsonLd(page, canonical, image))}</script>`,
    '<!-- /Vitalite SEO -->',
  ].join('\n    ');

  return html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/\n\s*<meta name="description" content="[^"]*" \/>/g, '')
    .replace(/\n\s*<!-- Vitalite SEO -->[\s\S]*?<!-- \/Vitalite SEO -->/g, '')
    .replace('</head>', `    ${managedHead}\n  </head>`);
}

function buildJsonLd(page, canonical, image) {
  const organizationId = `${seoData.siteUrl}/#organization`;
  const localBusinessId = `${seoData.siteUrl}/#localbusiness`;
  const webPageType = page.kind === 'contact' ? ['WebPage', 'ContactPage'] : 'WebPage';
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${seoData.siteUrl}/#website`,
      url: seoData.siteUrl,
      name: seoData.siteName,
      publisher: { '@id': organizationId },
    },
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: seoData.business.name,
      url: seoData.siteUrl,
      logo: image,
      description: seoData.business.description,
    },
    {
      '@type': ['LocalBusiness', 'GeneralContractor'],
      '@id': localBusinessId,
      name: seoData.business.name,
      url: seoData.siteUrl,
      image,
      description: seoData.business.description,
      areaServed: seoData.business.areaServed.map((name) => ({ '@type': 'Place', name })),
      address: {
        '@type': 'PostalAddress',
        addressLocality: seoData.business.locality,
        addressRegion: seoData.business.region,
        addressCountry: seoData.business.country,
      },
    },
    {
      '@type': webPageType,
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: page.title,
      description: page.description,
      isPartOf: { '@id': `${seoData.siteUrl}/#website` },
      about: { '@id': localBusinessId },
      primaryImageOfPage: { '@type': 'ImageObject', url: image },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: buildBreadcrumbs(page).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
  ];

  if (page.kind === 'service' || page.kind === 'serviceCollection') {
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: page.title.replace(' | Vitalite', ''),
      description: page.description,
      provider: { '@id': localBusinessId },
      areaServed: seoData.business.areaServed.map((name) => ({ '@type': 'Place', name })),
      serviceType: page.primaryKeyword,
    });
  }

  if (page.kind === 'article') {
    graph.push({
      '@type': 'Article',
      '@id': `${canonical}#article`,
      headline: page.title,
      description: page.description,
      image,
      author: { '@id': organizationId },
      publisher: { '@id': organizationId },
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
      datePublished: today,
      dateModified: today,
    });
  }

  const faq = buildPageFaq(page);
  if (faq.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function buildBreadcrumbs(page) {
  const items = [{ name: 'Home', url: `${seoData.siteUrl}/` }];
  const parts = page.path.split('/').filter(Boolean);
  if (!parts.length) return items;

  const parentLabels = {
    services: 'Services',
    'why-vitalite': 'Why Vitalite',
    'our-work': 'Our Work',
    blog: 'Blog',
    'contact-us': 'Contact Us',
  };
  const parentPage = pageByPath.get(`/${parts[0]}`);
  if (parentPage) {
    items.push({ name: parentLabels[parts[0]] ?? parentPage.title, url: canonicalFor(parentPage) });
  }
  if (parts.length > 1) {
    items.push({ name: page.title.split('|')[0].trim(), url: canonicalFor(page) });
  }
  return items;
}

function buildSitemap() {
  const urls = pages
    .map((page) => `  <url>\n    <loc>${canonicalFor(page)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.kind === 'article' ? 'monthly' : 'weekly'}</changefreq>\n    <priority>${page.key === 'home' ? '1.0' : page.kind === 'service' ? '0.9' : '0.7'}</priority>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildGeneratedPages() {
  const locationPages = (seoData.locationServices ?? []).flatMap((service) =>
    (seoData.locations ?? []).map((location) => ({
      key: `${service.keyPrefix}-${location.slug}`,
      path: `/locations/${service.pathPrefix}-${location.slug}`,
      title: fillLocationPattern(service.titlePattern, location.name),
      description: fillLocationPattern(service.descriptionPattern, location.name),
      kind: 'service',
      primaryKeyword: fillLocationPattern(service.primaryKeywordPattern, location.name),
    })),
  );

  const communityPages = (seoData.communityServices ?? []).flatMap((service) =>
    (seoData.communityLocations ?? []).map((community) => ({
      key: `${service.keyPrefix}-${community.slug}`,
      path: `/communities/${service.pathPrefix}-${community.slug}`,
      title: fillCommunityPattern(service.titlePattern, community),
      description: fillCommunityPattern(service.descriptionPattern, community),
      kind: 'service',
      primaryKeyword: fillCommunityPattern(service.primaryKeywordPattern, community),
    })),
  );

  const longTailPages = (seoData.longTailPages ?? []).map((page) => ({
    ...page,
    kind: 'article',
  }));

  return [...locationPages, ...communityPages, ...longTailPages];
}

function buildPageFaq(page) {
  if (page.key === 'contact-us') {
    return [
      {
        question: 'What project details should I include when contacting Vitalite?',
        answer:
          'Include the property city or address, project type, current stage, drawings or permit status, target budget direction, timeline, and any known zoning, structural, access, or inspection concerns.',
      },
      {
        question: 'Can Vitalite help before drawings or permits are ready?',
        answer:
          'Yes. Vitalite can start with consultation, feasibility review, conceptual planning, drawing coordination, zoning and building code review, permit preparation, and budget planning before construction.',
      },
      {
        question: 'What project types does Vitalite review for new inquiries?',
        answer:
          'Vitalite reviews GTA custom homes, rebuilds, multi-unit and multiplex projects, garden suites, laneway houses, home additions, major renovations, permits, construction management, and ICI projects.',
      },
      {
        question: 'Which GTA areas can contact Vitalite for a project review?',
        answer:
          'Vitalite works with owners and investors across Toronto and the GTA, including North York, Markham, Richmond Hill, Vaughan, Mississauga, Scarborough, Etobicoke, and nearby municipalities.',
      },
    ];
  }

  if (page.key.startsWith('location-') || page.key.startsWith('community-')) {
    const location = getLocationFromPage(page);
    return [
      {
        question: `Does Vitalite provide ${page.primaryKeyword} services?`,
        answer: `Yes. Vitalite supports ${page.primaryKeyword} projects with design-build planning, drawing coordination, permit preparation, budgeting, construction management, inspections, and warranty-oriented closeout.`,
      },
      {
        question: `What should owners prepare before starting a project in ${location}?`,
        answer: `Owners should prepare the property address, project goals, current drawings or surveys if available, budget direction, preferred timeline, and any known zoning, access, structural, or approval concerns.`,
      },
      {
        question: 'Can Vitalite coordinate drawings, permits, engineering, and construction together?',
        answer: 'Yes. Vitalite is positioned as a one-stop design-build and construction management partner that coordinates design, permit documentation, engineering inputs, trade scheduling, inspections, and site delivery.',
      },
    ];
  }

  if (page.key.startsWith('guide-')) {
    return [
      {
        question: `What does this ${page.primaryKeyword} guide cover?`,
        answer: `This guide explains the planning factors behind ${page.primaryKeyword}, including early feasibility, drawings, approvals, budget drivers, construction sequencing, inspections, and risk control.`,
      },
      {
        question: 'When should a homeowner involve a design-build contractor?',
        answer: 'A design-build contractor should be involved before drawings and pricing are fixed, especially when the project may involve zoning review, structural work, permit applications, budget tradeoffs, or staged construction.',
      },
      {
        question: 'Does Vitalite provide a fixed cost from the first conversation?',
        answer: 'A reliable cost depends on scope, existing conditions, drawings, finishes, approvals, and site logistics. Vitalite starts with consultation and budget planning before detailed construction pricing.',
      },
    ];
  }

  return [];
}

function getLocationFromPage(page) {
  const location = (seoData.locations ?? []).find((item) => page.key.endsWith(`-${item.slug}`));
  if (location) return location.name;
  const community = (seoData.communityLocations ?? []).find((item) => page.key.endsWith(`-${item.slug}`));
  return community ? `${community.name}, ${community.municipality}` : 'the GTA';
}

function canonicalFor(page) {
  return `${seoData.siteUrl}${page.path === '/' ? '/' : page.path}`;
}

function normalizeRoutePath(value) {
  if (!value || value === '/') return '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function fillLocationPattern(pattern, location) {
  return pattern.replaceAll('{location}', location);
}

function fillCommunityPattern(pattern, community) {
  return pattern
    .replaceAll('{community}', community.name)
    .replaceAll('{municipality}', community.municipality)
    .replaceAll('{location}', community.name);
}
