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
  const answer = buildStaticAnswer(page);
  const category = page.kind === 'service' || page.kind === 'serviceCollection' ? 'Design-Build Service' : page.kind === 'contact' ? 'Contact' : 'Planning Guide';
  const answerHtml = answer
    ? `<section><h2>Short Answer</h2><p>${escapeHtml(answer)}</p></section>`
    : '';
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
    ${answerHtml}
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
    return buildLocalServiceSections(page, context);
  }

  if (page.key.startsWith('location-') || page.key.startsWith('community-')) {
    return buildLocalServiceSections(page);
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

function buildStaticAnswer(page) {
  if (!(page.key.startsWith('location-') || page.key.startsWith('community-'))) return '';
  const local = getLocalMatchFromPage(page);
  const serviceName = getServiceNameFromPage(page);
  return buildServiceAreaAnswer(page, local, serviceName);
}

function buildLocalServiceSections(page, localContext = getLocalContextFromPage(page)) {
  const local = getLocalMatchFromPage(page);
  const label = local?.label ?? 'the GTA';
  const serviceName = getServiceNameFromPage(page);
  const focus = getServicePlanningFocus(page);
  const contextSections = localContext
    ? [
        { heading: 'Local Planning Context', text: localContext.planningContext },
        { heading: 'Best-Fit Project Types', text: localContext.projectFit },
        { heading: 'Approval And Construction Focus', text: localContext.approvalFocus },
      ]
    : [
        {
          heading: 'Local Project Fit',
          text: `${page.primaryKeyword} work is best planned as an integrated process because design choices, zoning, drawings, budget and site logistics affect one another before construction begins.`,
        },
      ];

  return [
    ...contextSections,
    {
      heading: 'Service Scope',
      text: `${serviceName} planning in ${label} can include ${focus.projectType}, with early attention to ${focus.searchIntent}.`,
    },
    {
      heading: 'Project Readiness',
      text: `Before pricing or construction, owners should gather ${focus.readiness}. Vitalite uses that information to connect design direction, approvals, trade input and schedule planning.`,
    },
    {
      heading: 'How Vitalite Helps',
      text: `Vitalite coordinates ${focus.approvals}, then carries the project into procurement, site management, inspections, quality control and closeout through one accountable GTA design-build process.`,
    },
  ];
}

function buildServiceAreaAnswer(page, local, serviceName) {
  const label = local?.label ?? 'the GTA';
  return `Vitalite provides ${page.primaryKeyword} support for ${label}, combining ${serviceName.toLowerCase()} feasibility, zoning and code review, permit drawings, engineering coordination, budget planning, construction management, inspections and closeout under one GTA design-build team.`;
}

function buildGuideContent(page) {
  if (!page.key.startsWith('guide-')) return null;
  const topic = `${page.primaryKeyword} ${page.title}`.toLowerCase();

  if (topic.includes('proposal') || topic.includes('quote') || topic.includes('estimate') || topic.includes('allowance')) {
    return {
      answer: 'GTA construction proposals usually differ because contractors are not pricing the same scope. One proposal may include drawings, permit coordination, engineering, demolition, site protection, allowances, exclusions, trade management and inspection support, while another may leave those items undefined.',
      sections: [
        {
          heading: 'Scope Normalization',
          text: 'Compare proposals against the same drawings, structural assumptions, permit status, finish level, demolition scope, site access, temporary protection, disposal, utility work and inspection requirements.',
        },
        {
          heading: 'Allowances And Exclusions',
          text: 'Low prices often hide provisional sums, owner-supplied materials, missing engineering, unclear permit fees, utility work, landscaping, contingency, cleanup, or change-order assumptions.',
        },
        {
          heading: 'Management Risk',
          text: 'A useful proposal should explain who coordinates trades, procurement, inspections, schedule updates, quality control, change decisions, site meetings and closeout.',
        },
      ],
    };
  }

  if (topic.includes('pre-construction') || topic.includes('readiness') || (topic.includes('checklist') && !topic.includes('permit-ready'))) {
    return {
      answer: `${page.primaryKeyword} should confirm feasibility, zoning, survey information, drawings, engineering inputs, permit path, budget assumptions, procurement, trade sequencing, inspection requirements and client decisions before site work begins.`,
      sections: [
        {
          heading: 'Feasibility Inputs',
          text: 'Start with the property address, survey, existing drawings where available, photos, desired scope, target budget, timeline, zoning constraints, tree or grading concerns and access conditions.',
        },
        {
          heading: 'Permit And Engineering Readiness',
          text: 'Pre-construction should align architectural drawings, structural details, HVAC or mechanical inputs, building code requirements, municipal comments and inspection planning before final construction scheduling.',
        },
        {
          heading: 'Buildability And Procurement',
          text: 'The construction plan should identify long-lead materials, trade order, site protection, temporary services, inspection milestones, client selections and communication rhythm.',
        },
      ],
    };
  }

  if (topic.includes('permit-ready')) {
    return {
      answer: 'A Toronto permit-ready drawing package requires clear scope, existing-condition information, zoning and building code review, architectural drawings, structural details where needed, HVAC or mechanical coordination, and a permit submission plan that can respond to municipal comments.',
      sections: [
        {
          heading: 'Drawing Package',
          text: 'A permit-ready package should show existing and proposed plans, elevations where needed, sections, construction notes, life-safety items, structural openings and the scope that municipal reviewers need to assess.',
        },
        {
          heading: 'Coordination Inputs',
          text: 'Structural engineering, HVAC, mechanical, energy/code items, grading, tree protection and servicing details should be identified early when they affect the permit path or construction cost.',
        },
        {
          heading: 'Submission Readiness',
          text: 'The package should be organized for municipal intake, comment response, revisions, inspection planning and handoff into trade scheduling and procurement.',
        },
      ],
    };
  }

  if (topic.includes('general contractor')) {
    return {
      answer: 'In the GTA, design-build vs general contractor is a delivery model decision. Design-build connects design, approvals, budgeting and construction management earlier, while a traditional general contractor is usually most effective after drawings, specifications and permit scope are already complete.',
      sections: [
        {
          heading: 'Delivery Model Decision',
          text: 'Owners should decide whether they need a build team after completed drawings or an integrated team that can shape design, approvals, budgets, procurement and site execution together.',
        },
        {
          heading: 'When General Contracting Fits',
          text: 'A general contractor model can work well when drawings, engineering, selections and permit requirements are already clear enough for trade pricing and site scheduling.',
        },
        {
          heading: 'When Design-Build Helps',
          text: 'Design-build helps when feasibility, drawings, approvals, budgets, construction sequence and owner decisions need to be coordinated before a final price is reliable.',
        },
      ],
    };
  }

  if (topic.includes('construction management') || topic.includes('construction manager')) {
    return {
      answer: 'GTA construction management helps control schedule, budget, trades, inspections, procurement, site communication, quality and closeout across a complex project. It is especially useful when multiple consultants, approvals and sub-trades need active coordination.',
      sections: [
        {
          heading: 'What Construction Management Controls',
          text: 'Construction management organizes the baseline schedule, scope decisions, procurement, trade sequencing, site meetings, municipal inspections, quality checks, change orders and PDI closeout.',
        },
        {
          heading: 'Owner Visibility',
          text: 'A managed process gives owners clearer reporting on decisions, risks, budget movement, inspection milestones, trade progress and items that need approval before work can proceed.',
        },
        {
          heading: 'Risk Reduction',
          text: 'The main value is fewer preventable gaps between drawings, permits, trades, materials, field conditions and client decisions during active construction.',
        },
      ],
    };
  }

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
    const sameLocationLinks = pages
      .filter((candidate) => location && candidate.key.startsWith('location-') && candidate.key.endsWith(`-${location.slug}`) && candidate.key !== page.key)
      .slice(0, 6)
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
    return uniqueStaticRelatedLinks([
      ...sameLocationLinks,
      linkByKey('locations-hub', 'All GTA service areas'),
      linkByKey('communities-hub', 'Toronto & GTA neighbourhood pages'),
      linkByKey('guide-garden-suite-cost-toronto', 'Garden Suite Cost Toronto guide'),
      linkByKey('contact-us', 'Contact Vitalite for a project review'),
    ]).slice(0, 10);
  }

  if (page.key.startsWith('community-')) {
    const community = (seoData.communityLocations ?? []).find((item) => page.key.endsWith(`-${item.slug}`));
    const sameCommunityLinks = pages
      .filter((candidate) => community && candidate.key.startsWith('community-') && candidate.key.endsWith(`-${community.slug}`) && candidate.key !== page.key)
      .slice(0, 6)
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
    const sameMunicipalityLinks = pages
      .filter((candidate) => {
        const candidateCommunity = (seoData.communityLocations ?? []).find((item) => candidate.key.endsWith(`-${item.slug}`));
        return candidateCommunity?.municipality === community?.municipality && candidateCommunity.slug !== community.slug && candidate.key.startsWith('community-custom-homes');
      })
      .slice(0, 3)
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), page: candidate }));
    const parentLocationSlug = locationSlugFromMunicipality(community?.municipality);
    const parentLocationLink = parentLocationSlug ? linkByKey(`location-custom-homes-${parentLocationSlug}`, `${community.municipality.split('/')[0].trim()} custom home builder`) : undefined;
    return uniqueStaticRelatedLinks([
      ...sameCommunityLinks,
      ...sameMunicipalityLinks,
      parentLocationLink,
      linkByKey('communities-hub', 'All neighbourhood construction pages'),
      linkByKey('guide-toronto-neighbourhood-garden-suite', 'Toronto neighbourhood garden suite guide'),
      linkByKey('contact-us', 'Contact Vitalite for a project review'),
    ]).slice(0, 10);
  }

  if (page.key.startsWith('guide-')) {
    return uniqueStaticRelatedLinks([
      linkByKey('guide-gta-pre-construction-checklist', 'GTA design-build pre-construction checklist'),
      linkByKey('guide-gta-construction-proposals-differ', 'Why GTA construction proposals differ'),
      linkByKey('guide-design-build-vs-general-contractor-gta', 'Design-build vs general contractor GTA'),
      linkByKey('guide-gta-construction-management', 'GTA construction management guide'),
      linkByKey('guide-toronto-permit-ready-drawings-checklist', 'Toronto permit-ready drawings checklist'),
      linkByKey('locations-hub', 'GTA service areas'),
      linkByKey('communities-hub', 'Toronto & GTA communities'),
      linkByKey('contact-us', 'Contact Vitalite'),
    ]).slice(0, 10);
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

function linkByKey(key, label) {
  const page = pages.find((candidate) => candidate.key === key);
  return page ? { label: label ?? page.title.split('|')[0].trim(), page } : undefined;
}

function uniqueStaticRelatedLinks(links) {
  const seen = new Set();
  return links.filter((link) => {
    if (!link?.page || seen.has(link.page.key)) return false;
    seen.add(link.page.key);
    return true;
  });
}

function locationSlugFromMunicipality(municipality) {
  const firstCity = municipality?.split('/')[0].trim();
  return (seoData.locations ?? []).find((location) => location.name === firstCity)?.slug;
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
  const guides = pages.filter((page) => page.kind === 'article').slice(0, 40);

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
    const local = getLocalMatchFromPage(page);
    const location = local?.label ?? 'the GTA';
    const context = local?.context;
    const serviceName = getServiceNameFromPage(page);
    const focus = getServicePlanningFocus(page);
    return [
      {
        question: `Does Vitalite provide ${page.primaryKeyword} services?`,
        answer: `Yes. Vitalite supports ${page.primaryKeyword} projects with design-build planning, drawing coordination, permit preparation, budgeting, construction management, inspections, and warranty-oriented closeout.`,
      },
      {
        question: `What should owners prepare before starting a project in ${location}?`,
        answer: buildOwnerPreparationAnswer(focus),
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
        question: `What type of ${serviceName.toLowerCase()} project is this page best for?`,
        answer: `This page is most relevant for a ${focus.projectType}. It is meant for ${focus.searchIntent}.`,
      },
      {
        question: `Can Vitalite help with permits and approvals for ${page.primaryKeyword}?`,
        answer: `Yes. Vitalite can coordinate ${focus.approvals}, then connect the approved scope to budgeting, trade scheduling, procurement, site management and inspections.`,
      },
      {
        question: 'Can Vitalite coordinate drawings, permits, engineering, and construction together?',
        answer: 'Yes. Vitalite is positioned as a one-stop design-build and construction management partner that coordinates design, permit documentation, engineering inputs, trade scheduling, inspections, and site delivery.',
      },
    ];
  }

  if (page.key.startsWith('guide-')) {
    const topic = `${page.primaryKeyword} ${page.title}`.toLowerCase();
    const topicFaq = (() => {
      if (topic.includes('proposal') || topic.includes('quote') || topic.includes('estimate')) {
        return [
          {
            question: 'Why can two GTA construction proposals be far apart?',
            answer:
              'Two proposals may include different assumptions for drawings, permits, engineering, demolition, site protection, allowances, exclusions, trade management, inspections, cleanup, contingency and change orders.',
          },
        ];
      }
      if (topic.includes('pre-construction') || (topic.includes('checklist') && !topic.includes('permit-ready'))) {
        return [
          {
            question: 'What should be resolved before construction starts?',
            answer:
              'Pre-construction should resolve feasibility, zoning, drawings, engineering inputs, permit path, budget assumptions, procurement, trade sequencing, inspection requirements and client selections.',
          },
        ];
      }
      if (topic.includes('general contractor')) {
        return [
          {
            question: 'When is design-build better than a traditional general contractor?',
            answer:
              'Design-build is usually better when design, approvals, budget feedback, construction sequencing and site management need to be coordinated before final drawings and pricing are complete.',
          },
        ];
      }
      if (topic.includes('construction management')) {
        return [
          {
            question: 'What does construction management add to a GTA project?',
            answer:
              'Construction management adds schedule control, budget tracking, trade coordination, procurement planning, inspection management, quality control, owner communication and closeout discipline.',
          },
        ];
      }
      if (topic.includes('permit-ready')) {
        return [
          {
            question: 'What makes drawings permit-ready in Toronto?',
            answer:
              'Permit-ready drawings should show clear scope, existing conditions, zoning and code alignment, architectural plans, required structural or HVAC coordination, and enough detail for municipal review and comments.',
          },
        ];
      }
      return [];
    })();
    return [
      ...topicFaq,
      {
        question: 'What does this guide cover?',
        answer: 'This guide explains the planning factors behind the topic, including early feasibility, drawings, approvals, budget drivers, construction sequencing, inspections, and risk control.',
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
  return getLocalMatchFromPage(page)?.context;
}

function getLocalMatchFromPage(page) {
  const location = (seoData.locations ?? []).find((item) => page.key.endsWith(`-${item.slug}`));
  if (location) {
    return {
      label: location.name,
      kind: 'location',
      slug: location.slug,
      context: seoData.locationContexts?.[location.slug],
    };
  }

  const community = (seoData.communityLocations ?? []).find((item) => page.key.endsWith(`-${item.slug}`));
  if (community) {
    return {
      label: `${community.name}, ${community.municipality}`,
      kind: 'community',
      slug: community.slug,
      municipality: community.municipality,
      context: seoData.communityContexts?.[community.slug],
    };
  }

  return undefined;
}

function getServiceNameFromPage(page) {
  const service = [...(seoData.locationServices ?? []), ...(seoData.communityServices ?? [])].find((item) =>
    page.key.startsWith(`${item.keyPrefix}-`),
  );
  return service?.serviceName ?? page.primaryKeyword;
}

function getServicePlanningFocus(page) {
  const key = page.key.toLowerCase();
  const keyword = page.primaryKeyword.toLowerCase();

  if (key.includes('custom-homes') || keyword.includes('custom home')) {
    return {
      projectType: 'custom home, teardown rebuild, estate home or major residential build',
      searchIntent: 'owners comparing feasibility, architectural direction, permit strategy, budget range and construction management before choosing a builder',
      readiness: 'survey, zoning goals, preferred home size, inspiration images, budget direction, timeline expectations and any known site constraints',
      approvals: 'zoning review, setbacks, height, lot coverage, grading, tree protection, structural design, energy/code details and permit-ready drawings',
    };
  }

  if (key.includes('garden-suites') || keyword.includes('garden suite') || keyword.includes('laneway')) {
    return {
      projectType: 'garden suite, laneway house, coach house or secondary dwelling unit',
      searchIntent: 'homeowners looking to add rental income, family housing flexibility or long-term property value through an accessory dwelling',
      readiness: 'survey, servicing information, access route, parking context, intended unit size, rental or family-use goals and preliminary budget',
      approvals: 'zoning eligibility, setbacks, height, servicing, drainage, tree protection, fire access, building code review and permit drawings',
    };
  }

  if (key.includes('multiplex') || keyword.includes('multiplex') || keyword.includes('multi-unit')) {
    return {
      projectType: 'multiplex, multi-unit conversion, legal suite strategy or small residential investment project',
      searchIntent: 'owners and investors trying to increase land use, rental potential and code-compliant unit count without losing control of budget and approvals',
      readiness: 'existing floor plans, unit goals, servicing assumptions, parking context, rent strategy, budget direction and tolerance for structural or mechanical upgrades',
      approvals: 'zoning permissions, fire separation, egress, parking, servicing, HVAC, structural work, building code review and inspection planning',
    };
  }

  if (key.includes('home-additions') || key.includes('luxury-renovations') || keyword.includes('addition') || keyword.includes('renovation')) {
    return {
      projectType: 'home addition, second-storey addition, rear extension, structural renovation or whole-home upgrade',
      searchIntent: 'homeowners who need more space, a better layout or a higher-value renovation while keeping design continuity and structure under control',
      readiness: 'existing drawings if available, survey, desired added area, structural concerns, finish level, temporary living needs, budget range and timeline',
      approvals: 'setbacks, height, lot coverage, structural openings, HVAC changes, energy/code requirements, permit drawings and municipal inspections',
    };
  }

  if (key.includes('permit-drawings') || keyword.includes('permit') || keyword.includes('drawing')) {
    return {
      projectType: 'permit drawing package, zoning review, building code review or engineering coordination scope',
      searchIntent: 'owners who need clear drawings, municipal submission support and construction-aware documentation before pricing or site work',
      readiness: 'property address, survey, existing drawings, scope notes, photos, known violation or order details, target timeline and construction goals',
      approvals: 'architectural drawings, structural details where required, HVAC or mechanical inputs, zoning review, building code review and permit comments',
    };
  }

  return {
    projectType: 'design-build construction, renovation or construction management project',
    searchIntent: 'owners comparing feasibility, budget, approvals, construction sequencing and one-team accountability before committing to a contractor',
    readiness: 'property details, project goals, drawings or survey if available, budget direction, desired timeline and known structural or approval issues',
    approvals: 'zoning, building code, permit drawings, engineering coordination, trade sequencing and inspection planning',
  };
}

function buildOwnerPreparationAnswer(focus) {
  const supportingDetails = focus.readiness.toLowerCase().includes('property address')
    ? 'budget direction, site photos, available surveys or drawings, inspection notes, municipal comments and timeline assumptions'
    : 'the property address, existing surveys or drawings, photos, inspection notes, municipal comments, budget direction and timeline assumptions';
  return `Owners should prepare ${focus.readiness}. Useful supporting information includes ${supportingDetails}.`;
}

function buildHowToSteps(page) {
  if (!page.key.startsWith('guide-')) return [];
  const topic = `${page.primaryKeyword} ${page.title}`.toLowerCase();

  if (topic.includes('proposal') || topic.includes('quote') || topic.includes('estimate') || topic.includes('allowance')) {
    return ['Define the same project scope for every bidder', 'Review drawings, permit status and engineering assumptions', 'Compare allowances, exclusions and provisional sums', 'Clarify trade, inspection and site management responsibility', 'Choose the proposal with transparent scope and risk control'];
  }

  if (topic.includes('pre-construction') || topic.includes('readiness') || (topic.includes('checklist') && !topic.includes('permit-ready'))) {
    return ['Confirm goals, address and property constraints', 'Collect survey, drawings, photos and existing-condition details', 'Review zoning, code, permit and engineering requirements', 'Build a budget with allowances, procurement and trade input', 'Set the construction sequence, inspections and closeout plan'];
  }

  if (topic.includes('permit-ready')) {
    return ['Confirm address, project scope and available survey information', 'Gather existing drawings, photos and site constraints', 'Complete zoning and building code review', 'Coordinate architectural, structural and HVAC documentation', 'Submit the permit package and respond to municipal comments'];
  }

  if (topic.includes('general contractor')) {
    return ['Identify whether drawings and scope are complete', 'Review zoning, permit and engineering risk', 'Decide when budget feedback should enter design', 'Assign responsibility for trades, inspections and change control', 'Choose the delivery model before final pricing'];
  }

  if (topic.includes('construction management') || topic.includes('construction manager')) {
    return ['Define the project controls and reporting rhythm', 'Set the baseline schedule, budget and scope tracker', 'Organize trades, procurement and site logistics', 'Manage inspections, quality control and change decisions', 'Complete PDI, closeout documents and warranty-oriented follow-up'];
  }

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
