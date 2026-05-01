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
type LocationService = {
  keyPrefix: string;
  pathPrefix: string;
  serviceName: string;
  titlePattern: string;
  descriptionPattern: string;
  primaryKeywordPattern: string;
};
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
  longTailPages?: LongTailPage[];
};

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

const generatedLongTailPages: SeoPage[] = (rawSeoData.longTailPages ?? []).map((page) => ({
  ...page,
  kind: 'article' as const,
}));

export const pages = [...(seoData.pages as SeoPage[]), ...generatedLocationPages, ...generatedLongTailPages];
export const pageByKey = new Map(pages.map((page) => [page.key, page]));
export const pathByKey = new Map(pages.map((page) => [page.key, page.path]));
const keyByPath = new Map(pages.map((page) => [normalizeRoutePath(page.path), page.key]));

export const getRouteHref = (key: string): string => {
  const path = pathByKey.get(key) ?? '/';
  return `${basePath}${path}`;
};

export const getRouteHrefFromLegacyHash = (href?: string): string => {
  if (!href) return getRouteHref('contact-us');
  if (!href.startsWith('#')) return href;
  return getRouteHref(href.slice(1));
};

export const getCanonicalUrl = (key: string): string => {
  const page = pageByKey.get(key) ?? pageByKey.get('home')!;
  return `${seoData.siteUrl}${page.path === '/' ? '/' : page.path}`;
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

  if (page.key.startsWith('location-')) {
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
};

const getLocationFromPage = (page: SeoPage) => {
  const match = (rawSeoData.locations ?? []).find((location) => page.key.endsWith(`-${location.slug}`));
  return match?.name ?? 'the GTA';
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
  };

  const parentPath = `/${parts[0]}`;
  const parentPage = pages.find((candidate) => candidate.path === parentPath);
  if (parentPage) {
    items.push({ name: parentMap[parts[0]] ?? parentPage.title, url: `${seoData.siteUrl}${parentPage.path}` });
  }

  if (parts.length > 1) {
    items.push({ name: page.title.split('|')[0].trim(), url: `${seoData.siteUrl}${page.path}` });
  }

  return items;
};

const normalizeRoutePath = (path: string) => {
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
};

const fillLocationPattern = (pattern: string, location: string) => pattern.replaceAll('{location}', location);

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
