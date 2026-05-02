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
  const steps = buildHowToSteps(page);
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
  const stepsHtml = steps.length
    ? `<section><h2>Planning Sequence</h2><ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section>`
    : '';

  return `<main class="seo-prerender" data-prerendered="true" style="font-family: Arial, sans-serif; max-width: 1120px; margin: 0 auto; padding: 96px 24px; line-height: 1.6;">
    <p style="text-transform: uppercase; letter-spacing: .12em; font-size: 12px;">${escapeHtml(category)}</p>
    <h1>${escapeHtml(page.title.split('|')[0].trim())}</h1>
    <p>${escapeHtml(page.description)}</p>
    ${sectionHtml}
    ${stepsHtml}
    ${linkHtml}
    ${faqHtml}
  </main>`;
}

function buildStaticSections(page) {
  if (page.key.startsWith('guide-') || page.kind === 'article') {
    const guide = buildGuideContent(page);
    if (guide) {
      return [
        { heading: 'Short Answer', text: guide.answer },
        ...guide.sections,
      ];
    }

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

function buildGuideContent(page) {
  if (!page.key.startsWith('guide-')) return null;
  const topic = `${page.primaryKeyword} ${page.title}`.toLowerCase();

  if (topic.includes('cost') || topic.includes('per square foot') || topic.includes('budget')) {
    return {
      answer: `${page.primaryKeyword} depends on scope, structure, site access, drawings, approvals, finish level, procurement and construction management. Reliable budgeting starts with feasibility review, then moves into permit-ready drawings, trade input, contingency planning and a construction sequence that matches the property conditions.`,
      sections: [
        {
          heading: 'Main Cost Drivers',
          text: 'The biggest budget variables are structural changes, excavation or grading, mechanical upgrades, building envelope work, finish specifications, custom millwork, site access, material lead times and inspection requirements.',
        },
        {
          heading: 'Budgeting Sequence',
          text: 'Early numbers should be treated as planning ranges until drawings, engineering, finish direction and permit requirements are clear enough for trade input and construction scheduling.',
        },
        {
          heading: 'Risk Control',
          text: 'Vitalite reduces budget risk by connecting design decisions, approval requirements, procurement planning, trade coordination and site management before construction starts.',
        },
      ],
    };
  }

  if (topic.includes('permit') || topic.includes('drawings') || topic.includes('laws') || topic.includes('approval')) {
    return {
      answer: `${page.primaryKeyword} starts with zoning and building code review, then moves into architectural drawings, structural or mechanical coordination, permit submission, municipal comments, revisions and inspection planning. Owners should confirm approval requirements before committing to final scope or construction pricing.`,
      sections: [
        {
          heading: 'Permit Readiness',
          text: 'A permit-ready package usually needs clear scope, existing-condition information, architectural drawings, structural details where required, HVAC or mechanical documentation, and alignment with zoning and building code requirements.',
        },
        {
          heading: 'Common Review Issues',
          text: 'Projects can slow down when setbacks, height, lot coverage, parking, fire separation, egress, drainage, tree protection, structural openings or mechanical changes are not resolved early.',
        },
        {
          heading: 'Construction Handoff',
          text: 'Permit approval is not the end of planning. The drawings, conditions, inspection requirements and procurement schedule need to be translated into a buildable site plan.',
        },
      ],
    };
  }

  if (topic.includes('timeline') || topic.includes('how long')) {
    return {
      answer: `${page.primaryKeyword} is shaped by design decisions, permit review, engineering coordination, material lead times, trade availability, inspection timing and the amount of structural or mechanical work. A realistic schedule separates pre-construction planning from the active construction phase.`,
      sections: [
        {
          heading: 'Timeline Drivers',
          text: 'The largest schedule variables are drawing readiness, municipal comments, structural design, custom materials, demolition findings, trade sequencing, inspection availability and client decision timing.',
        },
        {
          heading: 'Pre-Construction Time',
          text: 'Many delays happen before site work starts. Feasibility, drawings, permits, procurement and trade scheduling should be managed together rather than treated as separate handoffs.',
        },
        {
          heading: 'Construction Control',
          text: 'Vitalite manages site coordination, communication, inspections, change decisions and quality checks so the active construction phase has fewer preventable pauses.',
        },
      ],
    };
  }

  if (topic.includes('design-build') || topic.includes('architect')) {
    return {
      answer: `${page.primaryKeyword} compares how project responsibility is organized. Design-build connects planning, permits, budgeting and construction management under one delivery model, while architect-led work can require more owner coordination between designers, engineers, contractors and trades.`,
      sections: [
        {
          heading: 'Design-Build Fit',
          text: 'Design-build is strongest when the owner wants design, permits, budgeting, procurement, trades, inspections and delivery managed through one accountable process.',
        },
        {
          heading: 'Architect-Led Fit',
          text: 'Architect-led delivery can fit projects where design documentation is the primary need, but owners still need a clear plan for pricing, contractor selection, site management and change control.',
        },
        {
          heading: 'Decision Point',
          text: 'The right model depends on project complexity, owner time, approval risk, budget discipline, construction coordination and how much responsibility the owner wants to carry.',
        },
      ],
    };
  }

  if (topic.includes('neighbourhood') || topic.includes('rosedale') || topic.includes('forest hill') || topic.includes('lawrence park') || topic.includes('leaside') || topic.includes('willowdale') || topic.includes('unionville') || topic.includes('port credit') || topic.includes('lorne park')) {
    return {
      answer: `${page.primaryKeyword} should start with address-specific feasibility because mature GTA neighbourhoods can involve zoning limits, tree protection, older structures, access constraints, design continuity, permit drawings and careful construction logistics.`,
      sections: [
        {
          heading: 'Neighbourhood Fit',
          text: 'Established communities often reward careful planning: the project needs to improve space and value while respecting lot conditions, neighbouring properties, access limits and the existing home character.',
        },
        {
          heading: 'Approval Factors',
          text: 'Early review should confirm zoning, setbacks, height, lot coverage, tree protection, grading, heritage or conservation context where relevant, structural scope and permit documentation.',
        },
        {
          heading: 'Construction Logistics',
          text: 'Dense streets, mature landscaping, limited access, material staging and inspection timing can affect cost and schedule as much as the design itself.',
        },
      ],
    };
  }

  return {
    answer: `${page.primaryKeyword} should be planned as a connected design-build process. The key is to confirm feasibility, drawings, approvals, budget, construction sequence and inspection requirements before committing to a final scope or contractor price.`,
    sections: [
      {
        heading: 'What Shapes The Answer',
        text: 'The right plan depends on property conditions, zoning, structural scope, drawings, engineering, finish level, procurement, inspection timing and the project delivery model.',
      },
      {
        heading: 'Design-Build Planning',
        text: 'Vitalite connects early design, permit strategy, budgeting and construction management so owners can make decisions with fewer handoff gaps between consultants and trades.',
      },
      {
        heading: 'Owner Decision Points',
        text: 'Before committing, owners should understand approval risk, cost drivers, material lead times, temporary living needs, inspection steps and who is accountable for coordinating trades.',
      },
    ],
  };
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

  const howToSteps = buildHowToSteps(page);
  if (howToSteps.length) {
    graph.push({
      '@type': 'HowTo',
      '@id': `${canonical}#howto`,
      name: page.title,
      description: page.description,
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
      step: howToSteps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step,
        text: step,
      })),
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

function buildHowToSteps(page) {
  if (!page.key.startsWith('guide-')) return [];
  const topic = `${page.primaryKeyword} ${page.title}`.toLowerCase();

  if (topic.includes('cost') || topic.includes('per square foot') || topic.includes('budget')) {
    return ['Define scope and property constraints', 'Review zoning, surveys and existing conditions', 'Coordinate drawings and engineering inputs', 'Build a budget with allowances and contingencies', 'Sequence procurement, permits, trades and inspections'];
  }

  if (topic.includes('permit') || topic.includes('drawings') || topic.includes('laws') || topic.includes('approval')) {
    return ['Confirm project scope and property address', 'Review zoning, code and existing drawings', 'Coordinate architectural and engineering documents', 'Submit permit package and respond to comments', 'Prepare trades, inspections and site logistics'];
  }

  if (topic.includes('timeline') || topic.includes('how long')) {
    return ['Set project goals and target move-in window', 'Complete feasibility and concept planning', 'Prepare drawings, engineering and permits', 'Order long-lead materials and schedule trades', 'Manage construction, inspections, PDI and closeout'];
  }

  if (topic.includes('design-build') || topic.includes('architect')) {
    return ['Clarify whether you need design only or design plus construction', 'Review zoning and permit complexity', 'Decide how budget feedback will enter design decisions', 'Assign responsibility for trades and site management', 'Choose the delivery model before drawings go too far'];
  }

  if (topic.includes('neighbourhood') || topic.includes('rosedale') || topic.includes('forest hill') || topic.includes('lawrence park') || topic.includes('leaside') || topic.includes('willowdale') || topic.includes('unionville') || topic.includes('port credit') || topic.includes('lorne park')) {
    return ['Start with address and survey review', 'Check zoning, trees, grading and local constraints', 'Develop concept plans with budget direction', 'Coordinate permit drawings and engineering', 'Plan construction access, trades and inspections'];
  }

  return ['Define project goals and constraints', 'Review zoning, drawings and approvals', 'Set budget direction and scope priorities', 'Coordinate trades, procurement and schedule', 'Manage construction, inspections and closeout'];
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
