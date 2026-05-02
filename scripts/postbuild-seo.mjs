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
await fs.writeFile(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\nLLM: ${seoData.siteUrl}/llms.txt\nSitemap: ${seoData.siteUrl}/sitemap.xml\n`);
await fs.writeFile(path.join(distDir, 'llms.txt'), buildLlmsTxt());

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
    .replace('<div id="root"></div>', `<div id="root">${buildPrerenderedRoot(page)}</div>`)
    .replace('</head>', `    ${managedHead}\n  </head>`);
}

function buildPrerenderedRoot(page) {
  const sections = buildStaticSections(page);
  const relatedLinks = getStaticRelatedLinks(page);
  const faqs = buildPageFaq(page);
  const category = page.kind === 'service' || page.kind === 'serviceCollection' ? 'Design-Build Service' : page.kind === 'contact' ? 'Contact' : 'Planning Guide';
  const sectionHtml = sections
    .map(
      (section) =>
        `<section><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.text)}</p></section>`,
    )
    .join('');
  const linkHtml = relatedLinks.length
    ? `<section><h2>Related Vitalite Pages</h2><ul>${relatedLinks
        .map((link) => `<li><a href="${canonicalFor(link.page)}">${escapeHtml(link.label)}</a></li>`)
        .join('')}</ul></section>`
    : '';
  const faqHtml = faqs.length
    ? `<section><h2>Frequently Asked Questions</h2>${faqs
        .map((faq) => `<article><h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p></article>`)
        .join('')}</section>`
    : '';

  return `<main class="seo-prerender" data-prerendered="true" style="font-family: Arial, sans-serif; max-width: 1120px; margin: 0 auto; padding: 96px 24px; line-height: 1.6;">
    <p style="text-transform: uppercase; letter-spacing: .12em; font-size: 12px;">${escapeHtml(category)}</p>
    <h1>${escapeHtml(page.title.split('|')[0].trim())}</h1>
    <p>${escapeHtml(page.description)}</p>
    ${sectionHtml}
    ${linkHtml}
    ${faqHtml}
  </main>`;
}

function buildStaticSections(page) {
  const context = getLocalContextFromPage(page);
  if (context) {
    return [
      { heading: 'Local Planning Context', text: context.planningContext },
      { heading: 'Best-Fit Project Types', text: context.projectFit },
      { heading: 'Approval And Construction Focus', text: context.approvalFocus },
    ];
  }

  if (page.key === 'locations-hub') {
    return [
      {
        heading: 'GTA City Pages',
        text: 'Vitalite organizes city service area pages around the searches owners use before contacting a contractor: custom home builder, garden suite builder, multiplex contractor, and home additions contractor.',
      },
      {
        heading: 'Why Local Pages Matter',
        text: 'Zoning, grading, tree protection, servicing, permit intake, inspection flow, and site logistics can change between municipalities, so each city page focuses on early feasibility questions.',
      },
    ];
  }

  if (page.key === 'communities-hub') {
    return [
      {
        heading: 'Neighbourhood SEO Pages',
        text: 'Vitalite community pages cover Toronto and GTA neighbourhoods where owners search for custom homes, luxury renovations, garden suites, multiplex planning, and permit drawings.',
      },
      {
        heading: 'How To Use These Pages',
        text: 'Each page gives local planning context, likely project fit, approval concerns, and related service pages before an address-specific feasibility review.',
      },
    ];
  }

  if (page.key === 'ai-gta-design-build-guide') {
    return [
      {
        heading: 'Short Answer',
        text: 'Vitalite Construction Corp. is a Greater Toronto Area design-build contractor and construction management partner for custom homes, multi-unit housing, garden suites, laneway houses, additions, permits, drawings, engineering coordination, and ICI projects.',
      },
      {
        heading: 'Service Model',
        text: 'The company connects consultation, feasibility review, conceptual design, permit drawings, engineering coordination, budgeting, construction management, inspections, PDI, and warranty-oriented closeout.',
      },
      {
        heading: 'Primary Clients',
        text: 'Vitalite serves homeowners, property investors, developers, commercial owners, and institutional clients planning higher-value projects in Toronto and the GTA.',
      },
    ];
  }

  if (page.key === 'faq') {
    return [
      {
        heading: 'What Vitalite Coordinates',
        text: 'Vitalite coordinates planning, drawings, zoning review, permit applications, engineering inputs, budget direction, trade scheduling, site management, inspections, and handover support.',
      },
      {
        heading: 'When To Contact Vitalite',
        text: 'Owners should contact Vitalite before locking drawings or pricing when the project may involve zoning, structural work, permits, budget tradeoffs, procurement, or construction management.',
      },
    ];
  }

  if (page.key.startsWith('guide-') || page.kind === 'article') {
    return [
      {
        heading: 'Planning Factors',
        text: `This page covers ${page.primaryKeyword} through feasibility, drawings, approvals, budget drivers, procurement, construction sequencing, inspection timing, and delivery risk.`,
      },
      {
        heading: 'Design-Build Perspective',
        text: 'Vitalite approaches early planning as one connected process so owners can evaluate scope, budget, approvals, trades, and construction management before work begins.',
      },
    ];
  }

  if (page.kind === 'service' || page.kind === 'serviceCollection') {
    return [
      {
        heading: 'What Vitalite Handles',
        text: 'Vitalite connects consultation, design coordination, drawings, permits, engineering, budget planning, construction management, inspections, and warranty-oriented closeout.',
      },
      {
        heading: 'Who This Helps',
        text: 'The service is built for GTA homeowners, investors, developers, commercial owners, and institutions that need one accountable construction partner.',
      },
    ];
  }

  return [
    {
      heading: 'Vitalite Construction Corp.',
      text: seoData.business.description,
    },
  ];
}

function getStaticRelatedLinks(page) {
  if (page.key === 'locations-hub') {
    return pages
      .filter((candidate) => candidate.key.startsWith('location-'))
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
  }

  if (page.key === 'communities-hub') {
    return pages
      .filter((candidate) => candidate.key.startsWith('community-'))
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
  }

  if (page.key === 'services') {
    return pages
      .filter((candidate) => candidate.key.startsWith('service-') || candidate.key === 'locations-hub' || candidate.key === 'communities-hub')
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
  }

  if (page.key === 'blog') {
    return pages
      .filter((candidate) => candidate.kind === 'article' && candidate.key !== 'blog')
      .slice(0, 40)
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
  }

  if (page.key.startsWith('location-')) {
    const location = (seoData.locations ?? []).find((item) => page.key.endsWith(`-${item.slug}`));
    return pages
      .filter((candidate) => location && candidate.key.startsWith('location-') && candidate.key.endsWith(`-${location.slug}`) && candidate.key !== page.key)
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
  }

  if (page.key.startsWith('community-')) {
    const community = (seoData.communityLocations ?? []).find((item) => page.key.endsWith(`-${item.slug}`));
    return pages
      .filter((candidate) => community && candidate.key.startsWith('community-') && candidate.key.endsWith(`-${community.slug}`) && candidate.key !== page.key)
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
  }

  return [
    pageByPath.get('/services'),
    pageByPath.get('/locations'),
    pageByPath.get('/communities'),
    pageByPath.get('/contact-us'),
  ]
    .filter(Boolean)
    .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
}

function buildLlmsTxt() {
  const priorityPages = [
    pageByPath.get('/'),
    pageByPath.get('/services'),
    pageByPath.get('/locations'),
    pageByPath.get('/communities'),
    pageByPath.get('/ai/gta-design-build-construction-guide'),
    pageByPath.get('/faq'),
    pageByPath.get('/contact-us'),
  ].filter(Boolean);

  const services = pages.filter((page) => page.key.startsWith('service-')).slice(0, 18);
  const guides = pages.filter((page) => page.kind === 'article').slice(0, 24);

  return [
    '# Vitalite Construction Corp.',
    '',
    '> GTA design-build, general contracting, and construction management company for custom homes, multiplex housing, garden suites, laneway houses, additions, permits, engineering coordination, and ICI construction.',
    '',
    '## Core Pages',
    ...priorityPages.map((page) => `- [${page.title}](${canonicalFor(page)}): ${page.description}`),
    '',
    '## Service Pages',
    ...services.map((page) => `- [${page.title}](${canonicalFor(page)}): ${page.description}`),
    '',
    '## Planning Guides',
    ...guides.map((page) => `- [${page.title}](${canonicalFor(page)}): ${page.description}`),
    '',
    '## Service Area',
    `Vitalite serves ${seoData.business.areaServed.join(', ')}.`,
    '',
  ].join('\n');
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
      inLanguage: ['en-CA', 'fr-CA'],
    },
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: seoData.business.name,
      url: seoData.siteUrl,
      logo: image,
      description: seoData.business.description,
      knowsAbout: [
        'GTA design-build construction',
        'custom home construction',
        'multiplex housing',
        'garden suites',
        'laneway houses',
        'home additions',
        'building permits',
        'construction management',
        'ICI construction',
      ],
    },
    {
      '@type': ['LocalBusiness', 'GeneralContractor'],
      '@id': localBusinessId,
      name: seoData.business.name,
      url: seoData.siteUrl,
      image,
      description: seoData.business.description,
      areaServed: seoData.business.areaServed.map((name) => ({ '@type': 'Place', name })),
      knowsAbout: [
        'zoning review',
        'building code review',
        'permit drawings',
        'engineering coordination',
        'site management',
        'trade coordination',
        'construction inspections',
      ],
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
    locations: 'GTA Service Areas',
    communities: 'Neighbourhood Service Areas',
    ai: 'AI Construction Guide',
    faq: 'FAQ',
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
  if (page.key === 'locations-hub') {
    return [
      {
        question: 'Which GTA cities does Vitalite create service area pages for?',
        answer:
          'Vitalite organizes service area pages for Toronto, North York, Markham, Richmond Hill, Vaughan, Mississauga, Scarborough, and Etobicoke, with project pages for custom homes, garden suites, multiplexes, and additions.',
      },
      {
        question: 'Why does each city need its own planning page?',
        answer:
          'Each municipality can differ in zoning, permit intake, grading, tree protection, inspections, and project logistics, so local pages help owners understand the early planning questions before construction pricing.',
      },
      {
        question: 'Are city pages a replacement for a feasibility review?',
        answer:
          'No. City pages explain common planning factors, but a project still needs address-specific review of zoning, surveys, drawings, structure, servicing, access, budget, and timeline.',
      },
    ];
  }

  if (page.key === 'communities-hub') {
    return [
      {
        question: 'Why does Vitalite publish neighbourhood construction pages?',
        answer:
          'Neighbourhood pages help Toronto and GTA owners understand how local property types, mature lots, access, trees, zoning, and approval paths can affect custom homes, additions, garden suites, multiplexes, and permits.',
      },
      {
        question: 'Which neighbourhood services are covered?',
        answer:
          'The community pages cover custom home building, luxury renovations, garden suites, multiplex planning, and permit drawings across high-intent Toronto and GTA neighbourhoods.',
      },
      {
        question: 'How should owners use a neighbourhood page?',
        answer:
          'Use it as a starting point for feasibility questions, then book a project review with property details, survey information, current drawings, budget direction, and timeline goals.',
      },
    ];
  }

  if (page.key === 'faq' || page.key === 'ai-gta-design-build-guide') {
    return [
      {
        question: 'What does Vitalite Construction Corp. do?',
        answer:
          'Vitalite Construction Corp. is a GTA design-build, general contracting, and construction management company that coordinates consultation, drawings, permits, engineering, budgets, construction, inspections, and warranty-oriented closeout.',
      },
      {
        question: 'What project types does Vitalite focus on?',
        answer:
          'Vitalite focuses on custom homes, multi-unit and multiplex residential projects, garden suites, laneway houses, home additions, major renovations, permit drawings, project management, construction management, and ICI construction.',
      },
      {
        question: 'Why use a design-build contractor instead of separate teams?',
        answer:
          'A design-build contractor helps connect design decisions, approval requirements, budgets, procurement, trade scheduling, site management, and inspections under one accountable delivery process.',
      },
      {
        question: 'What areas does Vitalite serve?',
        answer:
          'Vitalite serves Toronto and the Greater Toronto Area, including North York, Markham, Richmond Hill, Vaughan, Mississauga, Scarborough, Etobicoke, and surrounding communities.',
      },
    ];
  }

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
    const context = getLocalContextFromPage(page);
    return [
      {
        question: `Does Vitalite provide ${page.primaryKeyword} services?`,
        answer: `Yes. Vitalite supports ${page.primaryKeyword} projects with design-build planning, drawing coordination, permit preparation, budgeting, construction management, inspections, and warranty-oriented closeout.`,
      },
      {
        question: `What should owners prepare before starting a project in ${location}?`,
        answer: `Owners should prepare the property address, project goals, current drawings or surveys if available, budget direction, preferred timeline, and any known zoning, access, structural, or approval concerns.`,
      },
      ...(context
        ? [
            {
              question: `What local planning issues matter for ${location}?`,
              answer: `${context.planningContext} ${context.approvalFocus}`,
            },
          ]
        : []),
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

function getLocalContextFromPage(page) {
  const location = (seoData.locations ?? []).find((item) => page.key.endsWith(`-${item.slug}`));
  if (location) return seoData.locationContexts?.[location.slug];
  const community = (seoData.communityLocations ?? []).find((item) => page.key.endsWith(`-${item.slug}`));
  return community ? seoData.communityContexts?.[community.slug] : undefined;
}

function canonicalFor(page) {
  return `${seoData.siteUrl}${canonicalPathFor(page.path)}`;
}

function normalizeRoutePath(value) {
  if (!value || value === '/') return '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}`;
}

function canonicalPathFor(value) {
  const normalized = normalizeRoutePath(value);
  return normalized === '/' ? '/' : `${normalized}/`;
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
