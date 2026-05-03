import seoData from './seo-data.json';

type SeoPageKind = 'home' | 'serviceCollection' | 'service' | 'about' | 'collection' | 'blog' | 'article' | 'contact';

export type SeoPage = {
  key: string;
  path: string;
  title: string;
  description: string;
  kind: SeoPageKind;
  primaryKeyword: string;
};

const baseUrl = import.meta.env.BASE_URL ?? '/';
const basePath = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '');

type SeoLocation = { slug: string; name: string };
type SeoCommunity = { slug: string; name: string; municipality: string };
type LocalSeoContext = {
  planningContext: string;
  projectFit: string;
  approvalFocus: string;
};
type LocalSeoMatch = {
  label: string;
  kind: 'location' | 'community';
  slug: string;
  municipality?: string;
  context?: LocalSeoContext;
};
type ServicePlanningFocus = {
  projectType: string;
  searchIntent: string;
  readiness: string;
  approvals: string;
};
type LocationService = {
  keyPrefix: string;
  pathPrefix: string;
  serviceName: string;
  titlePattern: string;
  descriptionPattern: string;
  primaryKeywordPattern: string;
};
type CommunityService = LocationService;
type LongTailPage = {
  key: string;
  path: string;
  title: string;
  description: string;
  primaryKeyword: string;
};

const rawSeoData = seoData as typeof seoData & {
  locations?: SeoLocation[];
  locationServices?: LocationService[];
  communityLocations?: SeoCommunity[];
  communityServices?: CommunityService[];
  locationContexts?: Record<string, LocalSeoContext>;
  communityContexts?: Record<string, LocalSeoContext>;
  longTailPages?: LongTailPage[];
};

function fillLocationPattern(pattern: string, location: string) {
  return pattern.replaceAll('{location}', location);
}

function fillCommunityPattern(pattern: string, community: SeoCommunity) {
  return pattern
    .replaceAll('{community}', community.name)
    .replaceAll('{municipality}', community.municipality)
    .replaceAll('{location}', community.name);
}

function normalizeRoutePath(path: string) {
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

const generatedLocationPages: SeoPage[] = (rawSeoData.locationServices ?? []).flatMap((service) =>
  (rawSeoData.locations ?? []).map((location) => ({
    key: `${service.keyPrefix}-${location.slug}`,
    path: `/locations/${service.pathPrefix}-${location.slug}`,
    title: fillLocationPattern(service.titlePattern, location.name),
    description: fillLocationPattern(service.descriptionPattern, location.name),
    kind: 'service' as const,
    primaryKeyword: fillLocationPattern(service.primaryKeywordPattern, location.name),
  })),
);

const generatedCommunityPages: SeoPage[] = (rawSeoData.communityServices ?? []).flatMap((service) =>
  (rawSeoData.communityLocations ?? []).map((community) => ({
    key: `${service.keyPrefix}-${community.slug}`,
    path: `/communities/${service.pathPrefix}-${community.slug}`,
    title: fillCommunityPattern(service.titlePattern, community),
    description: fillCommunityPattern(service.descriptionPattern, community),
    kind: 'service' as const,
    primaryKeyword: fillCommunityPattern(service.primaryKeywordPattern, community),
  })),
);

const generatedLongTailPages: SeoPage[] = (rawSeoData.longTailPages ?? []).map((page) => ({
  ...page,
  kind: 'article' as const,
}));

export const pages = [...(seoData.pages as SeoPage[]), ...generatedLocationPages, ...generatedCommunityPages, ...generatedLongTailPages];
export const pageByKey = new Map(pages.map((page) => [page.key, page]));
export const pathByKey = new Map(pages.map((page) => [page.key, page.path]));
const keyByPath = new Map(pages.map((page) => [normalizeRoutePath(page.path), page.key]));

export const getRouteHref = (key: string): string => {
  const path = pathByKey.get(key) ?? '/';
  return `${basePath}${canonicalPathFor(path)}`;
};

export const getRouteHrefFromLegacyHash = (href?: string): string => {
  if (!href) return getRouteHref('contact-us');
  if (!href.startsWith('#')) return href;
  return getRouteHref(href.slice(1));
};

export const getCanonicalUrl = (key: string): string => {
  const page = pageByKey.get(key) ?? pageByKey.get('home')!;
  return `${seoData.siteUrl}${canonicalPathFor(page.path)}`;
};

export const getPageKeyFromUrl = (url: URL): string | null => {
  if (url.hash && url.hash.length > 1) {
    const hashKey = url.hash.slice(1);
    if (pageByKey.has(hashKey)) return hashKey;
  }

  let routePath = url.pathname;
  if (basePath && routePath.startsWith(basePath)) {
    routePath = routePath.slice(basePath.length) || '/';
  }

  return keyByPath.get(normalizeRoutePath(routePath)) ?? null;
};

export const getPageKeyFromLocation = (location: Location): string => {
  return getPageKeyFromUrl(new URL(location.href)) ?? 'home';
};

export const applySeo = (key: string) => {
  const page = pageByKey.get(key) ?? pageByKey.get('home')!;
  const canonical = getCanonicalUrl(page.key);
  const image = `${seoData.siteUrl}${seoData.defaultImage}`;

  document.title = page.title;
  setMeta('name', 'description', page.description);
  setMeta('name', 'robots', 'index, follow, max-image-preview:large');
  setMeta('name', 'author', seoData.business.name);
  setMeta('property', 'og:site_name', seoData.siteName);
  setMeta('property', 'og:type', page.kind === 'article' ? 'article' : 'website');
  setMeta('property', 'og:title', page.title);
  setMeta('property', 'og:description', page.description);
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:image', image);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', page.title);
  setMeta('name', 'twitter:description', page.description);
  setMeta('name', 'twitter:image', image);
  setCanonical(canonical);
  setJsonLd(buildJsonLd(page, canonical, image));
};

export const buildJsonLd = (page: SeoPage, canonical: string, image: string) => {
  const organizationId = `${seoData.siteUrl}/#organization`;
  const localBusinessId = `${seoData.siteUrl}/#localbusiness`;
  const webPageType = page.kind === 'contact' ? ['WebPage', 'ContactPage'] : 'WebPage';
  const graph: Array<Record<string, unknown>> = [
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
      datePublished: '2026-05-01',
      dateModified: '2026-05-01',
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
};

export const buildPageFaq = (page: SeoPage) => {
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
};

const getLocationFromPage = (page: SeoPage) => {
  const locationMatch = (rawSeoData.locations ?? []).find((location) => page.key.endsWith(`-${location.slug}`));
  if (locationMatch) return locationMatch.name;
  const communityMatch = (rawSeoData.communityLocations ?? []).find((community) => page.key.endsWith(`-${community.slug}`));
  return communityMatch ? `${communityMatch.name}, ${communityMatch.municipality}` : 'the GTA';
};

const getLocalMatchFromPage = (page: SeoPage): LocalSeoMatch | undefined => {
  const locationMatch = (rawSeoData.locations ?? []).find((location) => page.key.endsWith(`-${location.slug}`));
  if (locationMatch) {
    return {
      label: locationMatch.name,
      kind: 'location',
      slug: locationMatch.slug,
      context: rawSeoData.locationContexts?.[locationMatch.slug],
    };
  }

  const communityMatch = (rawSeoData.communityLocations ?? []).find((community) => page.key.endsWith(`-${community.slug}`));
  if (communityMatch) {
    return {
      label: `${communityMatch.name}, ${communityMatch.municipality}`,
      kind: 'community',
      slug: communityMatch.slug,
      municipality: communityMatch.municipality,
      context: rawSeoData.communityContexts?.[communityMatch.slug],
    };
  }

  return undefined;
};

const getLocalContextFromPage = (page: SeoPage) => {
  return getLocalMatchFromPage(page)?.context;
};

const getServiceNameFromPage = (page: SeoPage) => {
  const service = [...(rawSeoData.locationServices ?? []), ...(rawSeoData.communityServices ?? [])].find((item) =>
    page.key.startsWith(`${item.keyPrefix}-`),
  );
  return service?.serviceName ?? page.primaryKeyword;
};

const getServicePlanningFocus = (page: SeoPage): ServicePlanningFocus => {
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
};

const buildOwnerPreparationAnswer = (focus: ServicePlanningFocus) => {
  const supportingDetails = focus.readiness.toLowerCase().includes('property address')
    ? 'budget direction, site photos, available surveys or drawings, inspection notes, municipal comments and timeline assumptions'
    : 'the property address, existing surveys or drawings, photos, inspection notes, municipal comments, budget direction and timeline assumptions';
  return `Owners should prepare ${focus.readiness}. Useful supporting information includes ${supportingDetails}.`;
};

const buildHowToSteps = (page: SeoPage) => {
  if (page.key === 'why-the-vitalite-way') {
    return ['Consultation and project fit review', 'On-site evaluation and existing-condition check', 'Concept design, budget direction and delivery model', 'Zoning, drawings, engineering and permits', 'Construction, PDI, closeout and aftercare'];
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
};

const buildBreadcrumbs = (page: SeoPage) => {
  const homeUrl = `${seoData.siteUrl}/`;
  const items = [{ name: 'Home', url: homeUrl }];

  const parts = page.path.split('/').filter(Boolean);
  if (!parts.length) return items;

  const parentMap: Record<string, string> = {
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

  const parentPath = `/${parts[0]}`;
  const parentPage = pages.find((candidate) => candidate.path === parentPath);
  if (parentPage) {
    items.push({ name: parentMap[parts[0]] ?? parentPage.title, url: getCanonicalUrl(parentPage.key) });
  }

  if (parts.length > 1) {
    items.push({ name: page.title.split('|')[0].trim(), url: getCanonicalUrl(page.key) });
  }

  return items;
};

const canonicalPathFor = (path: string) => {
  const normalized = normalizeRoutePath(path);
  return normalized === '/' ? '/' : `${normalized}/`;
};

const setCanonical = (href: string) => {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
};

const setJsonLd = (value: unknown) => {
  let script = document.querySelector<HTMLScriptElement>('script[data-vitalite-jsonld="true"]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.vitaliteJsonld = 'true';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(value);
};

const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
};
