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
};

const getLocationFromPage = (page: SeoPage) => {
  const locationMatch = (rawSeoData.locations ?? []).find((location) => page.key.endsWith(`-${location.slug}`));
  if (locationMatch) return locationMatch.name;
  const communityMatch = (rawSeoData.communityLocations ?? []).find((community) => page.key.endsWith(`-${community.slug}`));
  return communityMatch ? `${communityMatch.name}, ${communityMatch.municipality}` : 'the GTA';
};

const getLocalContextFromPage = (page: SeoPage) => {
  const locationMatch = (rawSeoData.locations ?? []).find((location) => page.key.endsWith(`-${location.slug}`));
  if (locationMatch) return rawSeoData.locationContexts?.[locationMatch.slug];
  const communityMatch = (rawSeoData.communityLocations ?? []).find((community) => page.key.endsWith(`-${community.slug}`));
  return communityMatch ? rawSeoData.communityContexts?.[communityMatch.slug] : undefined;
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
