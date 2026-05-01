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

export const pages = seoData.pages as SeoPage[];
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
      '@type': 'WebPage',
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

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
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
