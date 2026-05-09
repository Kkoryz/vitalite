import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const baseSeoData = JSON.parse(await fs.readFile(path.join(rootDir, 'src', 'seo-data.json'), 'utf8'));
const seoContexts = JSON.parse(await fs.readFile(path.join(rootDir, 'src', 'seo-contexts.json'), 'utf8'));
const seoData = mergeSeoContextData(baseSeoData, seoContexts);
const projectsData = JSON.parse(await fs.readFile(path.join(rootDir, 'src', 'projects-data.json'), 'utf8'));
const baseHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
const today = process.env.VITALITE_BUILD_DATE || formatBuildDate(new Date());
const pages = [...seoData.pages, ...buildGeneratedPages()];

const pageByPath = new Map(pages.map((page) => [normalizeRoutePath(page.path), page]));
const geoEvidencePageKeys = new Set([
  'ai-gta-design-build-guide',
  'service-custom-homes',
  'service-drawings-permits',
  'blog-renovation-costs',
  'guide-toronto-permit-ready-drawings-checklist',
  'location-custom-homes-toronto',
  'location-garden-suites-toronto',
  'project-willowdale-custom-home-4700',
]);

function mergeSeoContextData(base, contexts) {
  return {
    ...base,
    locationContexts: {
      ...(base.locationContexts ?? {}),
      ...(contexts.locationContexts ?? {}),
    },
    communityContexts: {
      ...(base.communityContexts ?? {}),
      ...(contexts.communityContexts ?? {}),
    },
  };
}

function formatBuildDate(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const galleryStylePlanningFaqs = [
  {
    question: 'Does Vitalite have a project minimum?',
    answer:
      'Vitalite is best suited for permit-driven, structural or multi-trade projects rather than small handyman repairs. A useful starting fit is a custom home, addition, garden suite, multiplex, major renovation, permit drawing package, construction management scope or ICI project where drawings, approvals and site coordination matter.',
  },
  {
    question: 'How long do Toronto permit drawings take?',
    answer:
      'A straightforward Toronto renovation or addition drawing package often takes 4 to 8 weeks once scope, survey and existing conditions are clear. Garden suites, multiplexes, custom homes and projects requiring engineering, zoning review or revisions can take 8 to 12 weeks or longer before municipal review begins.',
  },
  {
    question: 'How long does a Toronto garden suite project take?',
    answer:
      'A Toronto garden suite should usually be planned in two phases: feasibility, drawings and permits first, then construction. Many owners should expect roughly 3 to 6 months for pre-construction planning and approvals, followed by about 6 to 10 months of construction after permits, depending on access, servicing, trees and finish level.',
  },
  {
    question: 'What budget range should owners expect for a home addition?',
    answer:
      'Home addition budgets depend on size, structure, foundation work, mechanical upgrades, finishes and whether the family lives through construction. Small targeted additions can still reach the hundreds of thousands, while second-storey additions, underpinning or whole-home renovation programs commonly move into mid-six-figure or seven-figure planning territory.',
  },
  {
    question: 'Who responds to city permit comments?',
    answer:
      'Vitalite coordinates the response path with the designer, architect, engineer or required consultant. The goal is to keep municipal comments, drawing revisions, engineering updates, budget changes and construction sequencing connected instead of leaving the owner to manage each party separately.',
  },
  {
    question: 'How does Vitalite control change orders?',
    answer:
      'Change-order control starts before construction: define the scope, document existing conditions, clarify allowances, resolve permit and engineering inputs, and make major finish decisions early. When a change is needed, it should be documented with cost, schedule impact and responsibility before work proceeds.',
  },
];

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
    "<script>document.documentElement.classList.add('vitalite-js');</script>",
    '<style>.vitalite-js .seo-prerender { display: none !important; }</style>',
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    `<meta name="author" content="${escapeHtml(seoData.business.name)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:site_name" content="${escapeHtml(seoData.siteName)}" />`,
    `<meta property="og:type" content="${page.kind === 'article' || page.kind === 'project' ? 'article' : 'website'}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
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
    .replace('<div id="root"></div>', `<div id="root"></div>${buildPrerenderedRoot(page)}`)
    .replace('</head>', `    ${managedHead}\n  </head>`);
}

function buildPrerenderedRoot(page) {
  const sections = [...buildStaticSections(page), ...buildGeoEvidenceSections(page)];
  const relatedLinks = getStaticRelatedLinks(page);
  const faqs = buildPageFaq(page);
  const steps = buildHowToSteps(page);
  const answer = buildStaticAnswer(page);
  const category =
    page.kind === 'project' ? projectsData.categoryLabels[page._project?.category] ?? 'Our Work'
    : page.kind === 'service' || page.kind === 'serviceCollection' ? 'Design-Build Service'
    : page.kind === 'contact' ? 'Contact' : 'Planning Guide';
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

function buildGeoEvidenceSections(page) {
  const topic = page.title.split('|')[0].trim();
  const keyword = page.primaryKeyword;
  const local = getLocalMatchFromPage(page);
  const location = page._project?.locationLabel ?? local?.label ?? getLocationFromPage(page);
  const serviceName = getServiceNameFromPage(page);
  const focus = getServicePlanningFocus(page);
  const project = page._project;
  const isPriorityPage = geoEvidencePageKeys.has(page.key);
  const officialReferenceText = buildOfficialReferenceText(page, local);
  const projectFacts = project
    ? `This project proof includes ${project.size}, ${projectsData.statusLabels[project.status] ?? project.status}, ${project.locationLabel}, ${project.projectType ?? projectsData.categoryLabels[project.category] ?? project.category}, and the approval path: ${project.approvalPath ?? buildProjectPermitRoute(project)}.`
    : `This page should be read with the property address, survey, existing drawings, current permit status, target budget, timeline, and known structural, tree, grading or access constraints.`;

  return [
    {
      heading: 'Key Facts',
      text: `${topic} is a planning decision before it is a construction decision. For ${keyword}, owners should confirm zoning, building code, permit drawings, engineering inputs, budget assumptions, inspection path and construction sequencing before relying on a contractor price. Useful GTA planning ranges include 4 to 8 weeks for a straightforward drawing package, 8 to 12 weeks or longer when zoning, engineering or municipal comments are involved, 3 to 6 months for larger pre-construction planning, and 6 to 10 months or more for many permit-driven builds after permits. ${projectFacts} This page is structured with definitions, numbers, comparison criteria, process steps and caveats so the answer can be evaluated, cited and reused without relying on short promotional claims.`,
    },
    {
      heading: 'Comparison Framework',
      text: `Compare delivery options by responsibility, timing and evidence. A design-only path can clarify drawings, but the owner still has to connect pricing, permit comments, engineering and site management. A bid-after-drawings path works when scope and specifications are complete, but it can expose gaps late if allowances, exclusions or municipal comments were not priced. A design-build path fits ${location} projects when feasibility, drawings, permits, budgeting, procurement, trades, inspections and closeout need one accountable team. The evidence to request is the same for every option: scope list, drawings status, permit assumptions, engineering needs, exclusions, allowance schedule, construction sequence and change-order process.`,
    },
    {
      heading: 'Planning Sequence',
      text: `Start with the address and project goal, then confirm the property constraints before design momentum builds. Step 1: collect survey, title or address details, photos, existing drawings, inspection notes and owner priorities. Step 2: check zoning, lot coverage, height, setbacks, parking, tree protection, drainage, servicing and any conservation or heritage context. Step 3: define the drawings and consultant inputs needed for Toronto Building or the relevant GTA municipality. Step 4: price the scope with allowances, long-lead materials and trade sequencing visible. Step 5: schedule construction around permit conditions, inspections, procurement, site access, client decisions, PDI and closeout.`,
    },
    {
      heading: 'Official Planning References',
      text: officialReferenceText,
    },
    {
      heading: 'Evidence To Prepare',
      text: `A strong project file contains more than inspiration images. For ${serviceName.toLowerCase()} work, prepare the property address, survey, lot dimensions, current floor plans if available, photos of existing conditions, preferred scope, target budget range, desired start window, finish expectations, permit status, municipal comments, neighbour or access constraints, tree or grading concerns and known mechanical or structural issues. Useful readiness details include ${focus.readiness}. These details distinguish a simple interior scope from a permit-driven addition, custom home, garden suite, multiplex, legal suite or ICI project with inspection and approval risk.`,
    },
    {
      heading: 'Project Proof And Decision Signals',
      text: `Vitalite project proof should be evaluated by planning quality, not only final images. The useful signals are project type, neighbourhood, square footage, approval route, structural or mechanical scope, permit drawings, trade sequencing, inspection responsibilities, active or completed status and closeout path. For example, a 4,700 sq ft Willowdale custom home, a multi-unit build with a laneway suite, a 200 sq ft addition, or a five-rental-unit vertical addition each teaches a different planning lesson and gives owners concrete evidence to request before hiring.`,
    },
    {
      heading: 'Question Coverage',
      text: `This page is structured to answer several high-intent questions: what ${keyword} means, when a design-build contractor should be involved, how permits and drawings affect cost, how long the planning path can take, what documents owners should prepare, how design-build differs from separate architect and contractor handoffs, what risks appear in ${location}, and what Vitalite coordinates from consultation through closeout. The answer should stay specific to the GTA instead of becoming a generic construction article, because local zoning, municipal review, tree rules, site access, inspection timing and neighbourhood conditions change the practical recommendation.`,
    },
    {
      heading: 'Caveats And Boundaries',
      text: `The right next step depends on the actual property. A page like this can explain common ranges, approval issues and decision criteria, but it cannot replace an address-specific feasibility review. Budgets change when drawings are incomplete, existing conditions are hidden, finishes are undefined, engineering is not scoped, municipal comments require revisions, or the owner changes selections during construction. Timelines change when permits, inspections, long-lead materials, weather, site access, neighbour coordination or consultant response times shift. Vitalite should treat early numbers as planning ranges until scope, approvals, drawings and trade input are connected.`,
    },
    {
      heading: 'How Vitalite Uses This Information',
      text: `Vitalite uses the information above to connect feasibility, design, permits and construction instead of letting each handoff create new risk. The team can start with consultation, then move into site evaluation, concept planning, permit-ready drawings, engineering coordination, budgeting, procurement planning, construction management, inspections, PDI and warranty-oriented closeout. For owners, the practical benefit is clearer accountability: one team tracks what has been decided, what is still provisional, what the municipality may ask for, what trades need before mobilization, and which decisions affect cost or schedule before site work begins. ${isPriorityPage ? 'This priority page goes deeper on evidence, examples and planning constraints.' : 'The same evidence structure is applied across Vitalite service, location, community, guide and project pages so each route can answer a specific search question without relying only on FAQ markup.'}`,
    },
    {
      heading: 'Decision Checklist',
      text: `Before choosing a contractor or delivery model for ${keyword}, confirm five items in writing: the exact scope being priced, the drawings and engineering status, the permit or approval path, the exclusions and allowance assumptions, and the inspection and closeout responsibilities. For ${location}, also check whether local issues such as narrow access, mature trees, grading, parking, servicing, older structure, board approval, tenant coordination or municipal comment response can change cost or timing. A good answer should explain what is known, what is still provisional, what evidence supports the recommendation, and which next step would reduce uncertainty before construction begins.`,
    },
  ];
}

function getOfficialMunicipalityNames(page, local) {
  const context = `${page.key} ${page._project?.locationLabel ?? ''} ${local?.label ?? ''} ${local?.municipality ?? ''}`.toLowerCase();
  const names = [];
  if (context.includes('markham') || context.includes('unionville') || context.includes('angus glen') || context.includes('angus-glen')) names.push('Markham');
  if (context.includes('richmond hill') || context.includes('richmond-hill')) names.push('Richmond Hill');
  if (context.includes('vaughan') || context.includes('kleinburg') || context.includes('woodbridge')) names.push('Vaughan');
  if (context.includes('mississauga') || context.includes('port credit') || context.includes('port-credit') || context.includes('lorne park') || context.includes('lorne-park') || context.includes('mineola')) names.push('Mississauga');
  if (!names.length) names.push('Toronto');
  return [...new Set(names)];
}

function buildOfficialReferenceText(page, local) {
  const municipalities = getOfficialMunicipalityNames(page, local);
  const isToronto = municipalities.includes('Toronto');
  const municipalSummary = municipalities.length === 1 ? municipalities[0] : municipalities.join(' and ');
  const projectType = page.primaryKeyword.toLowerCase();
  const specialtyReferences = [
    projectType.includes('garden') || projectType.includes('laneway') ? 'garden suite or laneway suite guidance' : '',
    projectType.includes('multiplex') || projectType.includes('multi-unit') ? 'multiplex housing guidance' : '',
  ].filter(Boolean);

  if (isToronto) {
    return `Official review should anchor the page, not sit only in markup. Toronto projects can involve Toronto Building permit intake, zoning review, building code review, inspection scheduling, tree protection, garden suite or laneway suite rules, and multiplex considerations. Owners should verify current requirements through City of Toronto building permit guidance${specialtyReferences.length ? `, ${specialtyReferences.join(', ')}` : ''}, and tree or ravine protection guidance before treating any budget or timeline as final. Those sources matter because they explain why a permit-ready package needs existing and proposed drawings, structural details where required, HVAC or mechanical coordination, zoning data and enough scope clarity for municipal review.`;
  }

  return `Official review should anchor the page, not sit only in markup. ${municipalSummary} projects can involve municipal building permit intake, zoning or applicable-law review, grading, tree protection, inspections, consultant coordination and project-specific completeness requirements. Owners should verify current requirements through the relevant ${municipalSummary} building permit, zoning and tree-protection resources before treating any budget or timeline as final. Those sources matter because they explain why a permit-ready package needs existing and proposed drawings, structural details where required, HVAC or mechanical coordination, zoning data and enough scope clarity for municipal review.`;
}

function buildStaticSections(page) {
  if (page.kind === 'project' && page._project) {
    const p = page._project;
    const facts = [
      `Project Type: ${p.projectType ?? projectsData.categoryLabels[p.category] ?? p.category}`,
      `Location: ${p.locationLabel}`,
      `Size: ${p.size}`,
      p.duration ? `Duration: ${p.duration}` : '',
      p.approvalPath ? `Approval Path: ${p.approvalPath}` : '',
      `Permit Route: ${buildProjectPermitRoute(p)}`,
      `Outcome: ${buildProjectOutcome(p)}`,
    ].filter(Boolean);
    const sections = [
      { heading: 'Project Case Study Facts', text: facts.join(' ') },
      { heading: 'Project Scope', text: p.scope.join(', ') + '.' },
      { heading: 'Permit Route', text: buildProjectPermitRoute(p) },
      { heading: 'Outcome', text: buildProjectOutcome(p) },
    ];
    p.narrative.forEach((para, i) => {
      sections.push({ heading: i === 0 ? 'Project Overview' : i === 1 ? 'Construction Detail' : 'Planning Context', text: para });
    });
    return sections;
  }

  if (page.key === 'home') {
    return [
      {
        heading: 'GTA Design-Build Contractor',
        text: 'Vitalite Construction Corp. helps homeowners, investors and commercial clients move from feasibility review to permit-ready drawings, construction management, inspections and closeout through one connected GTA delivery team.',
      },
      {
        heading: 'What Vitalite Coordinates',
        text: 'The company coordinates custom homes, multiplex housing, garden suites, laneway houses, home additions, major renovations, permit drawings, engineering inputs, project management and ICI construction.',
      },
      {
        heading: 'Why The Process Matters',
        text: 'Many project problems begin before construction starts. Vitalite focuses on scope clarity, zoning review, building code considerations, budget assumptions, trade sequencing and municipal inspection planning before site work begins.',
      },
    ];
  }

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

  if (page.key === 'services') {
    return [
      {
        heading: 'Service Scope',
        text: 'Vitalite organizes GTA design-build services around custom homes, multiplex housing, garden suites, laneway houses, additions, permit drawings, engineering coordination, construction management and ICI projects.',
      },
      {
        heading: 'How Vitalite Organizes The Work',
        text: 'The service model connects planning, approvals and construction: first scope and feasibility, then drawings and permits, then procurement, site management, inspections, PDI and closeout.',
      },
      {
        heading: 'Best Starting Point',
        text: 'Owners can start before drawings are ready, when permits need coordination, or when proposals need management review. The right path depends on the property, project type, budget direction and approval status.',
      },
    ];
  }

  if (page.key === 'why-vitalite') {
    return [
      {
        heading: 'Why Vitalite',
        text: 'Vitalite is a GTA design-build and construction management partner for owners who need feasibility, drawings, approvals, budgets, trades, inspections and closeout to stay connected.',
      },
      {
        heading: 'Design-Build Advantage',
        text: 'The design-build model brings budget, approval and construction feedback into planning earlier, reducing the gaps that can happen when owners coordinate separate teams.',
      },
      {
        heading: 'Owner Control Points',
        text: 'Vitalite helps owners make key decisions before drawings, before construction and during delivery, with attention to scope, permit readiness, procurement, site management and PDI closeout.',
      },
    ];
  }

  if (page.key === 'our-work') {
    return [
      {
        heading: 'Project Categories',
        text: 'Vitalite organizes work around custom homes, multiplex housing, garden suites, laneway houses, additions, ICI projects, condo and apartment renovations, lofts, older homes, townhouses and full interiors.',
      },
      {
        heading: 'How To Evaluate The Work',
        text: 'Complex GTA projects should be reviewed by more than finished images. Owners should look for planning quality, approval path, structural or mechanical coordination, trade sequencing, inspections and closeout discipline.',
      },
      {
        heading: 'Project Fit',
        text: 'Many projects combine categories, such as a custom home with a garden suite, an addition with full interiors, or an investment property with multiplex planning.',
      },
    ];
  }

  if (page.key === 'blog') {
    return [
      {
        heading: 'Toronto Building Guides',
        text: 'Vitalite blog content is organized around the questions owners ask before hiring a builder: cost, permits, timelines, zoning, design-build delivery, construction management and investment potential.',
      },
      {
        heading: 'Search Intent Clusters',
        text: 'The guide library covers proposal comparison, permit-ready drawings, pre-construction readiness, design-build vs general contractor decisions, construction management and long-tail GTA planning questions.',
      },
      {
        heading: 'How To Use The Blog',
        text: 'Owners can use the guides to identify the project type, likely approval questions, budget drivers and documents to gather before booking a project review.',
      },
    ];
  }

  if (page.key === 'contact-us') {
    return [
      {
        heading: 'Start A Project Review',
        text: 'Vitalite reviews GTA design-build, permit, construction management and ICI inquiries by first clarifying property location, project type, current drawings or permits, budget direction and timeline.',
      },
      {
        heading: 'What Happens Next',
        text: 'The first conversation identifies whether the next step is feasibility review, architectural coordination, permit drawings, engineering input, budget planning or construction management.',
      },
      {
        heading: 'What To Include',
        text: 'Useful inquiry details include address or municipality, project type, current stage, drawings or survey status, permit status, target budget, timeline and known zoning, structural, access or inspection concerns.',
      },
    ];
  }

  if (page.key === 'why-about-us') {
    return [
      {
        heading: 'Who We Serve',
        text: 'Vitalite works with owners planning custom homes, teardowns, rebuilds, multiplex housing, garden suites, laneway houses, additions, major renovations, permit drawing packages and ICI projects.',
      },
      {
        heading: 'How We Work',
        text: 'The company connects early feasibility, design direction, zoning review, permit drawings, structural and mechanical coordination, budgeting, trade scheduling, site management, inspections and handover.',
      },
      {
        heading: 'Why It Matters',
        text: 'Complex building projects often lose control when design, approvals and construction are handled as separate silos. Vitalite is structured to keep those decisions in one managed workflow.',
      },
    ];
  }

  if (page.key === 'why-the-vitalite-way') {
    return [
      {
        heading: 'Initial Consultation',
        text: 'Vitalite starts by understanding the property, desired scope, budget direction, timeline, client priorities and whether the project is still at idea stage, drawings stage or construction-readiness stage.',
      },
      {
        heading: 'Design, Budget And Contract Model',
        text: 'Concept planning and budgetary review are used to choose the right path: general contracting, project management, construction management or a broader design-build delivery model.',
      },
      {
        heading: 'Construction Through Closeout',
        text: 'During construction, Vitalite manages trades, procurement, site meetings, inspections, quality control, client communication, PDI items and warranty-oriented follow-up.',
      },
    ];
  }

  if (page.key === 'why-design-build') {
    return [
      {
        heading: 'The Core Problem',
        text: 'In a traditional process, drawings can move forward before budget, buildability, permit comments and trade sequencing are fully understood. That can create redesign, repricing and avoidable field changes.',
      },
      {
        heading: 'Where Design-Build Helps',
        text: 'Design-build brings construction input into planning earlier so owners can compare scope, budget, approvals, long-lead materials and schedule risk before the project is too far along.',
      },
      {
        heading: 'Best-Fit Project Types',
        text: 'Custom homes, additions, multiplexes, garden suites, older-home renovations and ICI work benefit when design, engineering, permits and construction responsibilities need active coordination.',
      },
    ];
  }

  if (page.key === 'why-testimonials') {
    return [
      {
        heading: 'Custom Homes and Rebuilds',
        text: 'Custom home clients who have worked with Vitalite on new builds and teardown-rebuilds in North York, Markham and the GTA describe a team that manages approvals, drawings, trade schedules and finish quality without shifting accountability to the owner.',
      },
      {
        heading: 'Additions and Major Renovations',
        text: 'Owners who expanded their homes through additions or major renovations note how Vitalite managed the structural and permit work — the part of a project that often surprises less experienced contractors.',
      },
      {
        heading: 'Project Reviews Available on Request',
        text: 'Vitalite collects feedback at project closeout. If you are evaluating contractors and would like to speak with a past client on a similar project type, contact us to arrange a reference call.',
      },
    ];
  }

  if (page.key === 'why-in-the-news') {
    return [
      {
        heading: '2025 Active Projects',
        text: 'Vitalite currently has active sites across the GTA: a 4,700 sq ft luxury custom home in Willowdale, a multi-unit build with laneway suite in Lansdowne Toronto, a single-storey addition in Preston Lake Stouffville, and a major vertical side-split expansion in Erindale Mississauga.',
      },
      {
        heading: '2026 Project Pipeline',
        text: 'Six projects are scheduled to begin construction in 2026, including a lot severance and two new semi-detached homes in York Toronto, a five-rental-unit vertical addition in Bedford Park, and multiple custom home builds in Avondale, Stouffville and Willowdale.',
      },
      {
        heading: 'GTA Construction Market Context',
        text: 'Toronto and the surrounding region continue to see strong demand for custom home rebuilds, multiplex conversions and laneway suites as zoning rules evolve. Vitalite publishes construction commentary and planning guides through the blog.',
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
        {
          heading: 'Questions To Ask Before Comparing Prices',
          text: 'Ask whether the proposal includes permit coordination, engineering follow-up, demolition, temporary protection, disposal, site supervision, inspection attendance, cleanup, closeout and warranty-oriented support.',
        },
        {
          heading: 'Proposal Red Flags',
          text: 'Be careful when a price is much lower but does not show allowances, exclusions, owner-supplied items, permit assumptions, change-order rules, project management scope or what happens when municipal comments require revisions.',
        },
        {
          heading: 'Best Next Step',
          text: 'Before choosing a contractor, normalize every proposal against the same drawings, finish level, site conditions and management responsibilities. The cheapest number is not always the lowest-risk path.',
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
        {
          heading: 'Owner Decision List',
          text: 'Owners should decide the target scope, must-have spaces, preferred finish level, temporary living plan, budget ceiling, timeline sensitivity and how quickly selections can be approved.',
        },
        {
          heading: 'Documents To Gather',
          text: 'Useful inputs include a survey, existing drawings, title or address details, site photos, inspiration images, inspection notes, municipal correspondence and any known structural, drainage, tree or access concerns.',
        },
        {
          heading: 'When To Bring In Vitalite',
          text: 'The best time to involve Vitalite is before final drawings and pricing are locked, when scope, approvals, engineering and budget tradeoffs can still be coordinated together.',
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
        {
          heading: 'Common Missing Items',
          text: 'Permit packages often slow down when existing conditions, structural openings, HVAC changes, fire separation, grading, tree protection, energy/code notes or construction details are not clear enough for review.',
        },
        {
          heading: 'Handling Municipal Comments',
          text: 'A realistic permit process includes time for examiner comments, consultant revisions and scope clarification. The goal is not just submission; it is a package that can move into construction without new gaps.',
        },
        {
          heading: 'Construction Handoff',
          text: 'Once drawings are accepted, Vitalite translates the approved scope into trade coordination, procurement planning, inspection milestones and site management responsibilities.',
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
        {
          heading: 'Comparison Criteria',
          text: 'Compare each delivery model by when pricing happens, who manages drawings, who responds to permit comments, how trades are selected, how change orders are controlled and how much coordination the owner must carry.',
        },
        {
          heading: 'Budget Timing',
          text: 'Traditional general contracting often prices a finished package. Design-build can bring budget feedback into planning earlier, which helps owners adjust scope before drawings and approvals go too far.',
        },
        {
          heading: 'GTA Recommendation',
          text: 'For permit-driven custom homes, additions, multiplex projects and major renovations, design-build is often stronger when the owner wants fewer handoffs between planning, approvals and site execution.',
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
        {
          heading: 'When It Is Worth It',
          text: 'Construction management becomes more valuable when the project has a larger budget, multiple trades, custom finishes, permit inspections, long-lead materials, owner decisions and site constraints that need active follow-up.',
        },
        {
          heading: 'What Owners Should See',
          text: 'Owners should expect clear schedule updates, budget movement, change items, inspection status, trade sequencing, procurement notes, decision deadlines and closeout items rather than vague progress reports.',
        },
        {
          heading: 'Closeout Discipline',
          text: 'A managed project should finish with PDI review, deficiency tracking, document handoff, warranty-oriented support and a clear record of completed scope.',
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
  const serviceAreas = pages
    .filter((page) => page.key.startsWith('location-') && ['toronto', 'north-york', 'markham', 'richmond-hill', 'vaughan', 'mississauga'].some((slug) => page.key.endsWith(`-${slug}`)))
    .slice(0, 24);
  const projectProof = (projectsData.projects ?? [])
    .slice(0, 18)
    .map((project) => pages.find((page) => page.key === project.key))
    .filter(Boolean);

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
    '## Toronto and GTA Service Area Pages',
    ...serviceAreas.map((page) => `- [${page.title}](${canonicalFor(page)}): ${page.description}`),
    '',
    '## Project Proof',
    ...projectProof.map((page) => `- [${page.title}](${canonicalFor(page)}): ${page.description}`),
    '',
    '## Official Planning References',
    '- City of Toronto building permits: https://www.toronto.ca/services-payments/building-construction/apply-for-a-building-permit/',
    '- City of Toronto garden suites: https://www.toronto.ca/city-government/planning-development/planning-studies-initiatives/garden-suites/',
    '- City of Toronto laneway suites: https://www.toronto.ca/city-government/planning-development/planning-studies-initiatives/changing-lanes-laneway-suites-in-toronto/',
    '- City of Toronto multiplex considerations: https://www.toronto.ca/city-government/planning-development/planning-studies-initiatives/multiplex-housing/considerations-when-building-multiplexes/',
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
      inLanguage: 'en-CA',
    },
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: seoData.business.name,
      url: seoData.siteUrl,
      logo: image,
      description: seoData.business.description,
      sameAs: seoData.business.sameAs,
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
      telephone: seoData.business.telephone,
      email: seoData.business.email,
      sameAs: seoData.business.sameAs,
      priceRange: seoData.business.priceRange,
      openingHours: seoData.business.openingHours,
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
        streetAddress: seoData.business.streetAddress,
        addressLocality: seoData.business.addressLocality ?? seoData.business.locality,
        postalCode: seoData.business.postalCode,
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
      inLanguage: 'en-CA',
      datePublished: today,
      dateModified: today,
      keywords: [
        page.primaryKeyword,
        'GTA design-build',
        'permit drawings',
        'construction management',
        'building permits',
        'Toronto construction',
      ],
      audience: {
        '@type': 'Audience',
        audienceType: 'GTA homeowners, investors, developers and commercial property owners',
      },
      spatialCoverage: seoData.business.areaServed.map((name) => ({ '@type': 'Place', name })),
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
      audience: {
        '@type': 'Audience',
        audienceType: 'homeowners, investors, developers and commercial clients',
      },
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: canonical,
        servicePhone: seoData.business.telephone,
      },
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

  if (page.kind === 'project' && page._project) {
    const p = page._project;
    graph.push({
      '@type': 'Article',
      '@id': `${canonical}#article`,
      headline: page.title.replace(' | Vitalite', ''),
      description: page.description,
      articleSection: projectsData.categoryLabels[p.category] ?? p.category,
      keywords: [
        p.primaryKeyword,
        p.projectType,
        p.locationLabel,
        p.size,
        ...(p.scope ?? []),
      ].filter(Boolean),
      articleBody: [
        ...(p.narrative ?? []),
        buildProjectPermitRoute(p),
        buildProjectOutcome(p),
      ].join('\n\n'),
      image,
      author: { '@id': organizationId },
      publisher: { '@id': organizationId },
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
      datePublished: today,
      dateModified: today,
    });
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: page.title.replace(' | Vitalite', ''),
      description: page.description,
      provider: { '@id': localBusinessId },
      areaServed: [{ '@type': 'Place', name: p.locationLabel }],
      serviceType: p.primaryKeyword,
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
    .map((page) => {
      const priority = page.key === 'home' ? '1.0'
        : page.kind === 'service' ? '0.9'
        : page.kind === 'project' ? '0.8'
        : '0.7';
      const changefreq = page.kind === 'article' || page.kind === 'project' ? 'monthly' : 'weekly';
      return `  <url>\n    <loc>${canonicalFor(page)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildProjectPermitRoute(project) {
  if (project.permitRoute) return project.permitRoute;

  const approvalPath = project.approvalPath?.toLowerCase() ?? '';
  const projectType = `${project.projectType ?? ''} ${project.primaryKeyword} ${project.category}`.toLowerCase();

  if (approvalPath.includes('committee') || approvalPath.includes('severance')) {
    return 'Feasibility review, Committee of Adjustment application, zoning clearance, permit drawings, building permit review, inspections and closeout.';
  }
  if (projectType.includes('laneway') || projectType.includes('garden suite')) {
    return 'Lot feasibility, fire access and servicing review, zoning check, permit drawings, building permit submission, inspections and rental-ready handover.';
  }
  if (projectType.includes('multiplex') || projectType.includes('multi-unit') || projectType.includes('rental')) {
    return 'Unit strategy, zoning review, fire separation and egress coordination, permit drawings, building permit submission, inspections and tenant-ready turnover.';
  }
  if (projectType.includes('addition') || projectType.includes('walkout') || projectType.includes('vertical')) {
    return 'Existing-condition review, structural feasibility, zoning check, architectural and engineering drawings, building permit submission, inspections and closeout.';
  }
  if (project.category === 'ici') {
    return 'Operational scope review, code and permit coordination, trade sequencing, municipal inspections and occupancy-oriented closeout.';
  }

  return 'Survey and feasibility review, zoning check, permit-ready drawings, engineering coordination, building permit submission, inspections and occupancy closeout.';
}

function buildProjectOutcome(project) {
  if (project.outcome) return project.outcome;

  const categoryLabel = projectsData.categoryLabels[project.category] ?? project.category;
  const scopeSummary = (project.scope ?? []).slice(0, 2).join(' and ').toLowerCase();
  if (project.status === 'completed') {
    return `Completed ${categoryLabel.toLowerCase()} reference in ${project.locationLabel}, with ${scopeSummary} delivered as part of a managed design-build scope.`;
  }
  if (project.status === 'ongoing-2025') {
    return 'Active 2025 delivery with scope, approvals, trades, inspections and closeout managed under one Vitalite project path.';
  }
  if (project.status === 'coming-2026') {
    return '2026 pipeline project with feasibility, approval route and construction sequencing defined before site work begins.';
  }

  return `Representative ${categoryLabel.toLowerCase()} case study showing the scope, approval path and construction decisions owners should evaluate before starting a similar project.`;
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

  const projectPages = (projectsData.projects ?? []).map((project) => ({
    key: project.key,
    path: project.path,
    title: project.title,
    description: project.description,
    kind: 'project',
    primaryKeyword: project.primaryKeyword,
    _project: project,
  }));

  return [...locationPages, ...communityPages, ...longTailPages, ...projectPages];
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
      ...galleryStylePlanningFaqs,
    ];
  }

  if (page.key === 'services') {
    return [
      {
        question: 'What services does Vitalite provide in the GTA?',
        answer:
          'Vitalite provides design-build, general contracting and construction management services for custom homes, multiplex housing, garden suites, laneway houses, home additions, permit drawings, engineering coordination and ICI projects.',
      },
      {
        question: 'Can Vitalite help before drawings or permits are ready?',
        answer:
          'Yes. Vitalite can start with consultation, feasibility review, concept planning, zoning review, permit-ready drawings, engineering coordination and budget planning before construction pricing is finalized.',
      },
      {
        question: 'How are Vitalite services different from hiring separate teams?',
        answer:
          'Vitalite connects design decisions, approvals, engineering, budgeting, procurement, site management, inspections and closeout under one managed process so owners have fewer handoffs to coordinate.',
      },
    ];
  }

  if (page.key === 'why-vitalite') {
    return [
      {
        question: 'Why should owners choose Vitalite for a GTA project?',
        answer:
          'Vitalite is built for projects where feasibility, drawings, approvals, budgets, trades, inspections and construction management need to stay connected under one accountable team.',
      },
      {
        question: 'What is the Vitalite design-build advantage?',
        answer:
          'The design-build advantage is earlier coordination between planning, approval requirements, budget direction and site execution, which helps reduce avoidable gaps before construction starts.',
      },
      {
        question: 'Does Vitalite manage the construction phase?',
        answer:
          'Yes. Vitalite can manage schedules, budgets, trades, procurement, inspections, quality control, site communication, PDI items and warranty-oriented closeout.',
      },
    ];
  }

  if (page.key === 'our-work') {
    return [
      {
        question: 'What project categories does Vitalite show in Our Work?',
        answer:
          'The Our Work section is organized around custom homes, multiplex housing, garden suites, laneway houses, additions, ICI projects, condo and apartment renovations, lofts, older homes, townhouses and full interiors.',
      },
      {
        question: 'How should owners evaluate a project example?',
        answer:
          'Owners should look beyond finished photos and consider the original condition, approval path, drawings, structural or mechanical scope, trade coordination, inspection requirements, finish decisions and closeout process.',
      },
      {
        question: 'Can I contact Vitalite if my project does not match one category exactly?',
        answer:
          'Yes. Many projects combine categories, such as a custom home with a garden suite, a major addition with full interiors, or an investment property with multiplex planning.',
      },
    ];
  }

  if (page.key === 'blog') {
    return [
      {
        question: 'What does the Vitalite blog cover?',
        answer:
          'The blog covers GTA renovation and construction planning topics including costs, timelines, permits, zoning, design-build delivery, construction management, garden suites, multiplexes and project readiness.',
      },
      {
        question: 'Who are the guides written for?',
        answer:
          'The guides are written for homeowners, property investors, developers and commercial owners who want to understand project decisions before committing to drawings, pricing or a contractor.',
      },
      {
        question: 'How should I use the blog before contacting Vitalite?',
        answer:
          'Use the guides to identify your project type, likely approval questions, budget drivers and documents to gather, then contact Vitalite with the property details and current project stage.',
      },
    ];
  }

  if (page.key === 'why-about-us') {
    return [
      {
        question: 'What type of company is Vitalite Construction Corp.?',
        answer:
          'Vitalite is a GTA design-build, general contracting and construction management company that coordinates planning, drawings, permits, budgets, construction and closeout.',
      },
      {
        question: 'Who is Vitalite best suited for?',
        answer:
          'Vitalite is best suited for homeowners, investors, developers and commercial owners planning projects that need more coordination than a basic construction crew can provide.',
      },
      {
        question: 'Does Vitalite only build custom homes?',
        answer:
          'No. Custom homes are a core service, but Vitalite also supports multiplex projects, garden suites, laneway houses, additions, major renovations, permits, project management and ICI work.',
      },
    ];
  }

  if (page.key === 'why-the-vitalite-way') {
    return [
      {
        question: 'When should I involve Vitalite in the process?',
        answer:
          'The best time is before drawings, permit assumptions and construction pricing are locked, especially if the project involves zoning, structural work, approvals or budget tradeoffs.',
      },
      {
        question: 'Does the process apply to both homes and ICI projects?',
        answer:
          'Yes. The same coordination logic applies to custom homes, additions, multiplex projects, garden suites and many commercial, industrial or institutional scopes.',
      },
      {
        question: 'What makes this different from asking for a quick quote?',
        answer:
          'A quick quote can miss scope, permit, engineering, site condition and allowance assumptions. The Vitalite Way defines those inputs before pricing is treated as reliable.',
      },
    ];
  }

  if (page.key === 'why-design-build') {
    return [
      {
        question: 'Is design-build always better than hiring an architect first?',
        answer:
          'Not always. Architect-led work can be effective for some projects, but design-build is often stronger when budget, approvals and construction sequencing need to shape design decisions early.',
      },
      {
        question: 'Does design-build mean faster construction?',
        answer:
          'It can reduce delays caused by handoff gaps, but timeline still depends on scope, drawings, permits, municipal comments, material lead times and site conditions.',
      },
      {
        question: 'Can Vitalite work with existing drawings?',
        answer:
          'Yes. Vitalite can review existing drawings for scope, permit readiness, budget assumptions, engineering coordination and construction management needs.',
      },
    ];
  }

  if (page.key === 'why-testimonials') {
    return [
      {
        question: 'Why does this page not show invented reviews?',
        answer:
          'Construction testimonials should be verified. Vitalite should add real client quotes, project type labels and photos as completed project feedback becomes available.',
      },
      {
        question: 'What makes a useful construction testimonial?',
        answer:
          'Useful testimonials mention communication, budget clarity, schedule control, trade coordination, inspection handling, quality and post-delivery support.',
      },
      {
        question: 'Can testimonials support SEO?',
        answer:
          'Yes. Verified reviews tied to service pages and project categories can improve trust, conversion and local authority signals.',
      },
    ];
  }

  if (page.key === 'why-in-the-news') {
    return [
      {
        question: 'What should Vitalite publish in the news section?',
        answer:
          'Publish verified company updates, completed project features, media mentions, awards, local construction commentary and announcements that build trust.',
      },
      {
        question: 'Should every blog post also appear here?',
        answer:
          'No. Keep practical SEO guides in the blog. Use In The News for company credibility, brand authority and project or media updates.',
      },
      {
        question: 'Can this page help local SEO?',
        answer:
          'Yes, if updates are specific, local and connected to real service areas, project types, expertise and internal links.',
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

  if (page.key.startsWith('project-') && page._project) {
    const project = page._project;
    const status = projectsData.statusLabels[project.status] ?? project.status;
    const categoryLabel = projectsData.categoryLabels[project.category] ?? project.category;
    return [
      {
        question: 'Where is this Vitalite project located?',
        answer: `This project is located in ${project.locationLabel}. Vitalite serves Toronto and the Greater Toronto Area, including North York, Markham, Richmond Hill, Vaughan, Mississauga, Scarborough, Etobicoke and surrounding communities.`,
      },
      {
        question: 'What is the current status of this project?',
        answer: `This project is currently ${status.toLowerCase()}. Vitalite organizes projects under ongoing 2025 builds, coming-soon 2026 builds, and completed past projects.`,
      },
      {
        question: 'What category of work does this project represent?',
        answer: `This is a ${categoryLabel.toLowerCase()} project. ${project.headline}`,
      },
      {
        question: 'What was the permit route for this project?',
        answer: buildProjectPermitRoute(project),
      },
      {
        question: 'What was included in the project scope?',
        answer: `The visible scope includes ${project.scope.join(', ')}. Vitalite uses scope details like these to connect drawings, approvals, pricing, trade scheduling and inspections before site work begins.`,
      },
      {
        question: 'What outcome does this case study show?',
        answer: buildProjectOutcome(project),
      },
      {
        question: 'How do I start a similar project with Vitalite?',
        answer: 'Share the property address, project type, current stage, drawings or permit status, target budget direction, and timeline. Vitalite begins with consultation, feasibility review, and conceptual planning before construction pricing is treated as final.',
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
  if (page.key === 'why-the-vitalite-way') {
    return ['Consultation and project fit review', 'On-site evaluation and existing-condition check', 'Concept design, budget direction and delivery model', 'Zoning, drawings, engineering and permits', 'Construction, PDI, closeout and aftercare'];
  }

  if (page.key.startsWith('tool-')) {
    return ['Choose the construction planning tool that matches the decision', 'Enter approximate project inputs', 'Review the directional range or recommendation', 'Gather property-specific documents and constraints', 'Book a project review before treating the result as final'];
  }

  if (page.kind === 'service' || page.kind === 'serviceCollection' || page.key.startsWith('location-') || page.key.startsWith('community-') || page.key.startsWith('service-')) {
    const focus = getServicePlanningFocus(page);
    return [
      'Confirm the property address, municipality and project goal',
      `Gather ${focus.readiness}`,
      `Review ${focus.approvals}`,
      'Define scope, allowances, exclusions, procurement and inspection needs',
      'Coordinate construction management, PDI, closeout and warranty-oriented follow-up',
    ];
  }

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
