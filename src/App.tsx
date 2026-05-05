import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Menu,
  Pause,
  Play,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  applySeo,
  getPageKeyFromLocation,
  getPageKeyFromUrl,
  getRouteHref,
  getRouteHrefFromLegacyHash,
  pages as seoPages,
  buildPageFaq,
  projects,
  projectsByKey,
  projectStatusLabels,
  projectCategoryLabels,
  projectCategoryParents,
  type SeoPage,
  type ProjectEntry,
  type ProjectCategory,
} from './seo';
import seoData from './seo-data.json';

const BASE_URL: string = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
const PLACEHOLDER_IMAGE = `${BASE_URL}placeholder-project.svg`;
const CONTACT_PHONE_DISPLAY = '+1 (647) 718-0972';
const CONTACT_PHONE_TEL = '+16477180972';
const CONTACT_EMAIL = 'Vitaliteconstruction@gmail.com';
const CONTACT_ADDRESS_LINE1 = 'Suite 235, 7181 Woodbine Ave';
const CONTACT_ADDRESS_LINE2 = 'Markham, ON L3R 1A3';
// Replace with your Formspree endpoint: https://formspree.io/f/YOUR_ID
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xpwdvrzb';

type MainPageKey = 'services' | 'why-vitalite' | 'our-work' | 'blog' | 'contact-us';
type DetailPageKey =
  | 'service-architectural-services'
  | 'service-interior-design'
  | 'service-rendering'
  | 'service-material-selection'
  | 'service-building-board-approvals'
  | 'service-construction-site-management'
  | 'service-custom-homes'
  | 'service-multiplex'
  | 'service-garden-suites'
  | 'service-home-additions'
  | 'service-drawings-permits'
  | 'service-project-management'
  | 'service-ici-construction'
  | 'service-apartment-renovations'
  | 'service-townhouse-renovations'
  | 'service-condo-renovations'
  | 'service-heritage-renovations'
  | 'service-loft-renovations'
  | 'service-gut-renovations'
  | 'why-about-us'
  | 'why-the-vitalite-way'
  | 'why-design-build'
  | 'why-testimonials'
  | 'why-in-the-news'
  | 'work-custom-homes'
  | 'work-multiplex'
  | 'work-garden-suites'
  | 'work-additions'
  | 'work-ici'
  | 'work-condos'
  | 'work-lofts'
  | 'work-older-homes'
  | 'work-townhouses'
  | 'work-full-interiors'
  | 'blog-buyers-renovation-guide'
  | 'blog-renovation-costs'
  | 'blog-design-build-vs-architect'
  | 'blog-renovation-timeline'
  | 'blog-renovation-laws'
  | 'blog-garden-suite-ideas'
  | 'blog-fixer-upper-vs-new';
type PageKey = string;

type ImageCard = {
  title: string;
  summary: string;
  image: string;
  eyebrow?: string;
  href?: string;
};

type TextCard = {
  title: string;
  text: string;
  eyebrow?: string;
  pageKey?: PageKey;
};

type DetailPageContent = {
  parent: MainPageKey;
  category: string;
  title: string;
  subtitle: string;
  image: string;
  intro: string;
  bullets: string[];
  sections: Array<{ heading: string; text: string }>;
  answer?: string;
  steps?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  relatedLinks?: Array<{ label: string; key: string }>;
  projectKeys?: string[];
  isProject?: boolean;
  projectMeta?: {
    status: string;
    statusLabel: string;
    location: string;
    size: string;
    headline: string;
    narrative: string[];
  };
};

type Language = 'en' | 'fr';
type LocalSeoContext = {
  planningContext: string;
  projectFit: string;
  approvalFocus: string;
};
type SeoDataWithLocalContext = typeof seoData & {
  locations?: Array<{ slug: string; name: string }>;
  communityLocations?: Array<{ slug: string; name: string; municipality: string }>;
  locationServices?: Array<{ keyPrefix: string; serviceName: string }>;
  communityServices?: Array<{ keyPrefix: string; serviceName: string }>;
  locationContexts?: Record<string, LocalSeoContext>;
  communityContexts?: Record<string, LocalSeoContext>;
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

type DropdownColumn = {
  heading: string;
  links: Array<{ label: string; href: `#${MainPageKey | DetailPageKey}`; description?: string }>;
};

const navItems: Array<{ key: MainPageKey; label: string }> = [
  { key: 'services', label: 'Services' },
  { key: 'why-vitalite', label: 'Why Vitalite' },
  { key: 'our-work', label: 'Our Work' },
  { key: 'blog', label: 'Blog' },
  { key: 'contact-us', label: 'Contact Us' },
];
const footerSeoLinks = [
  { key: 'locations-hub', label: 'GTA Areas' },
  { key: 'communities-hub', label: 'Communities' },
  { key: 'faq', label: 'FAQ' },
  { key: 'ai-gta-design-build-guide', label: 'AI Guide' },
];

const pageKeys = navItems.map((item) => item.key);

const routeHref = (key: PageKey | MainPageKey | DetailPageKey) => getRouteHref(key);
const routeHrefFromLegacyHash = (href?: string) => getRouteHrefFromLegacyHash(href);
const localSeoData = seoData as SeoDataWithLocalContext;
const staticSeoPageKeys = ['locations-hub', 'communities-hub', 'faq', 'ai-gta-design-build-guide'];

const frenchText: Record<string, string> = {
  Services: 'Services',
  Home: 'Accueil',
  Service: 'Service',
  Guide: 'Guide',
  'Why Vitalite': 'Pourquoi Vitalite',
  'Our Work': 'Projets',
  Blog: 'Blogue',
  'Contact Us': 'Contactez-nous',
  Search: 'Rechercher',
  'Search Vitalite': 'Rechercher sur Vitalite',
  'Search services, locations, permits, additions, multiplex projects and planning guides.': 'Recherchez services, secteurs, permis, agrandissements, multiplex et guides de planification.',
  'Type a service, city, permit question or project type.': 'Tapez un service, une ville, une question de permis ou un type de projet.',
  'Quick searches': 'Recherches rapides',
  Results: 'Resultats',
  'No results found.': 'Aucun resultat trouve.',
  'Try custom homes, garden suites, permits, multiplex, Markham or Toronto.': 'Essayez maisons sur mesure, garden suites, permis, multiplex, Markham ou Toronto.',
  'Start typing to search services, project pages and guides.': 'Commencez a taper pour rechercher services, projets et guides.',
  'View page': 'Voir la page',
  'Close search': 'Fermer la recherche',
  'Custom homes': 'Maisons sur mesure',
  'Garden suites': 'Garden suites',
  Multiplex: 'Multiplex',
  Permits: 'Permis',
  Markham: 'Markham',
  Additions: 'Agrandissements',
  Overview: 'Apercu',
  'Design-Build Renovations Include': 'Services conception-construction inclus',
  'Project Types': 'Types de projets',
  'Why Work With Vitalite': 'Pourquoi travailler avec Vitalite',
  'Project Categories': 'Categories de projets',
  'Popular Guides': 'Guides populaires',
  'Architectural Services': 'Services architecturaux',
  'Interior Design': 'Design interieur',
  Rendering: 'Rendus 3D',
  'Material Selection / Procurement': 'Selection et approvisionnement des materiaux',
  'Building + Board Approvals': 'Approbations municipales et de copropriete',
  'Construction & Site Management': 'Gestion de chantier',
  'Custom Home Design & Build': 'Maisons sur mesure conception-construction',
  'Multi-Unit & Multiplex Construction': 'Construction multi-logements et multiplex',
  'Garden Suites & Laneway Houses': 'Garden suites et maisons de ruelle',
  'Home Additions & Major Renovations': 'Agrandissements et renovations majeures',
  'Drawings, Permits & Engineering': 'Plans, permis et ingenierie',
  'Project & Construction Management': 'Gestion de projet et construction',
  'Industrial, Commercial & Institutional': 'Industriel, commercial et institutionnel',
  'About Us': 'A propos',
  'The Vitalite Way': 'La methode Vitalite',
  'Why Design-Build?': 'Pourquoi conception-construction?',
  Testimonials: 'Temoignages',
  'In The News': 'Dans les medias',
  'Custom Homes': 'Maisons sur mesure',
  'Multi-Unit & Multiplex': 'Multi-logements et multiplex',
  'Additions & Major Renovations': 'Agrandissements et renovations majeures',
  'ICI Projects': 'Projets ICI',
  'Full Interiors': 'Interieurs complets',
  "Buyer's Renovation Guide": 'Guide acheteur pour renovation',
  'Toronto Renovations: Cost Per SQ FT': 'Renovations a Toronto : cout par pi2',
  'Design-Build Vs Architect': 'Conception-construction vs architecte',
  'How Long Is A GTA Renovation?': 'Combien de temps dure une renovation dans le GTA?',
  'Toronto Renovation Laws': 'Regles de renovation a Toronto',
  'Garden Suite Ideas 2026': 'Idees de garden suite 2026',
  'Renovating A Fixer-Upper vs Buying New': 'Renover une propriete a reparer ou acheter neuf',
  'GTA Design-Build Contractor': 'Entrepreneur conception-construction dans le GTA',
  'Design, Permits and Construction Under One GTA Team': 'Conception, permis et construction avec une seule equipe GTA',
  'Luxury Custom Homes, Built Around Your Vision': 'Maisons de luxe sur mesure, concues autour de votre vision',
  'Custom Homes Planned Before They Are Priced': 'Maisons sur mesure planifiees avant le prix final',
  'Multiplex Housing, Garden Suites & Additions': 'Multiplex, garden suites et agrandissements',
  'Multiplex, Garden Suite and Addition Projects Built for Approval': 'Multiplex, garden suites et agrandissements prepares pour les approbations',
  'Explore Vitalite services': 'Explorer les services Vitalite',
  'Explore design-build services': 'Explorer les services conception-construction',
  'Plan residential investment work': 'Planifier un projet residentiel d investissement',
  'Custom home design & build': 'Conception-construction de maison sur mesure',
  'GTA Design-Build, Permits and Construction Management': 'Conception-construction, permis et gestion de construction dans le GTA',
  'View Vitalite services': 'Voir les services Vitalite',
  'Plan First. Build With Control.': 'Planifier d abord. Construire avec controle.',
  'Design, Approvals and Construction in One Workflow.': 'Conception, approbations et construction dans un seul processus.',
  'From First Review to Final Handover': 'De la premiere evaluation a la livraison finale',
  'Plan a project consultation': 'Planifier une consultation',
  'GTA DESIGN-BUILD': 'CONCEPTION-CONSTRUCTION GTA',
  'Full-Service Design-Build Renovations Include:': 'Services complets conception-construction inclus :',
  'Toronto-Area Service Lines': 'Services dans la region de Toronto',
  'GTA Service Area Pages': 'Pages de services par secteur GTA',
  'Toronto Long-Tail Planning Guides': 'Guides de planification Toronto',
  'Our Most Popular Content': 'Nos contenus les plus populaires',
  'View Blog In Full': 'Voir tout le blogue',
  'View all before + afters': 'Voir tous les avant/apres',
  'Start With a Clear Project Conversation': 'Commencez par une conversation claire sur le projet',
  'What To Include': 'Informations a inclure',
  'Project Paths': 'Parcours de projet',
  'Start here': 'Commencer ici',
  'Custom home consultation': 'Consultation maison sur mesure',
  'Multiplex project review': 'Evaluation de projet multiplex',
  'Garden suite or laneway house': 'Garden suite ou maison de ruelle',
  'Additions and alterations': 'Agrandissements et modifications',
  'Drawings, permits and engineering': 'Plans, permis et ingenierie',
  'Project and construction management': 'Gestion de projet et construction',
  'Contact FAQ': 'FAQ contact',
  'Start Consultation': 'Demarrer la consultation',
  Name: 'Nom',
  Email: 'Courriel',
  'Project Type': 'Type de projet',
  'Project Details': 'Details du projet',
  'Privacy Statement': 'Declaration de confidentialite',
  'Terms and Conditions': 'Conditions generales',
  Accessibility: 'Accessibilite',
  'Cookies Settings': 'Parametres des cookies',
  '(c) 2026 Vitalite Construction Corp. All rights reserved.': '(c) 2026 Vitalite Construction Corp. Tous droits reserves.',
};

const reverseFrenchText = Object.fromEntries(Object.entries(frenchText).map(([english, french]) => [french, english]));
const copy = (text: string, language: Language) => (language === 'fr' ? frenchText[text] ?? text : text);
const publicAsset = (fileName: string) => `${import.meta.env.BASE_URL}${fileName.replace(/^\/+/, '')}`;

const translateVisibleText = (language: Language) => {
  if (typeof document === 'undefined') return;
  const dictionary = language === 'fr' ? frenchText : reverseFrenchText;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      const trimmed = node.textContent?.trim();
      return trimmed && dictionary[trimmed] ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  nodes.forEach((node) => {
    const text = node.textContent ?? '';
    const trimmed = text.trim();
    const translated = dictionary[trimmed];
    if (translated) {
      node.textContent = text.replace(trimmed, translated);
    }
  });
};

const dropdownMenus: Partial<Record<MainPageKey, DropdownColumn[]>> = {
  services: [
    {
      heading: 'Design-Build Renovations Include',
      links: [
        { label: 'Architectural Services', href: '#service-architectural-services' },
        { label: 'Interior Design', href: '#service-interior-design' },
        { label: 'Rendering', href: '#service-rendering' },
        { label: 'Material Selection / Procurement', href: '#service-material-selection' },
        { label: 'Building + Board Approvals', href: '#service-building-board-approvals' },
        { label: 'Construction & Site Management', href: '#service-construction-site-management' },
      ],
    },
    {
      heading: 'Project Types',
      links: [
        { label: 'Custom Home Design & Build', href: '#service-custom-homes' },
        { label: 'Multi-Unit & Multiplex Construction', href: '#service-multiplex' },
        { label: 'Garden Suites & Laneway Houses', href: '#service-garden-suites' },
        { label: 'Home Additions & Major Renovations', href: '#service-home-additions' },
        { label: 'Drawings, Permits & Engineering', href: '#service-drawings-permits' },
        { label: 'Project & Construction Management', href: '#service-project-management' },
        { label: 'Industrial, Commercial & Institutional', href: '#service-ici-construction' },
      ],
    },
  ],
  'why-vitalite': [
    {
      heading: 'Why Vitalite',
      links: [
        { label: 'About Us', href: '#why-about-us' },
        { label: 'The Vitalite Way', href: '#why-the-vitalite-way' },
        { label: 'Why Design-Build?', href: '#why-design-build' },
        { label: 'Testimonials', href: '#why-testimonials' },
        { label: 'In The News', href: '#why-in-the-news' },
      ],
    },
  ],
  'our-work': [
    {
      heading: 'Our Work',
      links: [
        { label: 'Custom Homes', href: '#work-custom-homes' },
        { label: 'Multi-Unit & Multiplex', href: '#work-multiplex' },
        { label: 'Garden Suites & Laneway Houses', href: '#work-garden-suites' },
        { label: 'Additions & Major Renovations', href: '#work-additions' },
        { label: 'ICI Projects', href: '#work-ici' },
        { label: 'Full Interiors', href: '#work-full-interiors' },
      ],
    },
  ],
  blog: [
    {
      heading: 'Popular Guides',
      links: [
        { label: "Buyer's Renovation Guide", href: '#blog-buyers-renovation-guide' },
        { label: 'Toronto Renovations: Cost Per SQ FT', href: '#blog-renovation-costs' },
        { label: 'Design-Build Vs Architect', href: '#blog-design-build-vs-architect' },
        { label: 'How Long Is A GTA Renovation?', href: '#blog-renovation-timeline' },
        { label: 'Toronto Renovation Laws', href: '#blog-renovation-laws' },
        { label: 'Garden Suite Ideas 2026', href: '#blog-garden-suite-ideas' },
        { label: 'Renovating A Fixer-Upper vs Buying New', href: '#blog-fixer-upper-vs-new' },
      ],
    },
  ],
};

const resolvePage = (): PageKey => {
  const candidate = getPageKeyFromLocation(window.location) as PageKey;
  if (pageKeys.includes(candidate as MainPageKey)) return candidate;
  if (staticSeoPageKeys.includes(candidate)) return candidate;
  if (Object.prototype.hasOwnProperty.call(allDetailPages, candidate)) return candidate;
  if (candidate === 'home') return candidate;
  return 'home';
};

const Navbar = ({
  activePage,
  language,
  onLanguageChange,
  onSearchOpen,
}: {
  activePage: PageKey;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onSearchOpen: () => void;
}) => {
  const [openMenu, setOpenMenu] = useState<MainPageKey | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setOpenMenu(null);
    setMobileMenuOpen(false);
  }, [activePage]);

  return (
    <nav
      onMouseLeave={() => setOpenMenu(null)}
      className="fixed top-0 left-0 right-0 z-50 flex items-stretch h-[78px] lg:h-[96px] bg-gradient-to-b from-black/85 via-black/45 to-transparent"
    >
      {/* Logo Area */}
      <a href={routeHref('home')} className="w-52 md:w-[380px] flex items-center justify-center shrink-0 overflow-hidden">
        <img
          src={publicAsset('logo-transparent.png?v=20260430-1340')}
          alt="Vitalite Construction"
          className="w-[185px] md:w-[345px] h-auto max-h-[68px] lg:max-h-[84px] object-contain"
        />
      </a>

      {/* Nav Links */}
      <div className="flex-1 hidden lg:flex items-center px-8 justify-between">
        <div className="flex items-center space-x-8 text-[13px] font-semibold tracking-[0.1em] uppercase text-white/90">
          {navItems.map((item) => {
            const dropdown = dropdownMenus[item.key];
            const isActive = activePage === item.key || allDetailPages[activePage]?.parent === item.key;
            const isOpen = openMenu === item.key;

            return (
              <div
                key={item.key}
                className="relative group h-[96px] flex items-center"
                onMouseEnter={() => setOpenMenu(dropdown ? item.key : null)}
                onFocus={() => setOpenMenu(dropdown ? item.key : null)}
              >
                {dropdown ? (
                  <button
                    type="button"
                    onClick={() => setOpenMenu(isOpen ? null : item.key)}
                    className={`flex items-center hover:text-kiewit-yellow transition-colors ${
                      isActive ? 'text-kiewit-yellow' : ''
                    }`}
                  >
                    {copy(item.label, language)}
                    <ChevronRight className={`w-4 h-4 ml-1 rotate-90 transition-colors ${isOpen ? 'text-kiewit-yellow' : 'text-white/50'}`} />
                  </button>
                ) : (
                  <a
                    href={routeHref(item.key)}
                    onClick={() => setOpenMenu(null)}
                    className={`flex items-center hover:text-kiewit-yellow transition-colors ${
                      isActive ? 'text-kiewit-yellow' : ''
                    }`}
                  >
                    {copy(item.label, language)}
                  </a>
                )}
                {dropdown && (
                  <div className={`absolute left-0 top-full w-[720px] max-w-[calc(100vw-3rem)] bg-black/95 border-t-4 border-kiewit-yellow shadow-2xl transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 ${
                    isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-4'
                  }`}>
                    <div className="px-8 pt-7">
                      <a href={routeHref(item.key)} onClick={() => setOpenMenu(null)} className="inline-flex items-center text-kiewit-yellow text-[13px] font-bold tracking-[0.12em] uppercase hover:text-white transition-colors">
                        {copy(item.label, language)} {copy('Overview', language)} <ChevronRight className="w-4 h-4 ml-2" />
                      </a>
                    </div>
                    <div className={`grid gap-8 p-8 ${dropdown.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {dropdown.map((column) => (
                        <div key={column.heading}>
                          <div className="text-kiewit-yellow text-[11px] font-bold tracking-[0.18em] uppercase mb-5">
                            {copy(column.heading, language)}
                          </div>
                          <div className="space-y-1">
                            {column.links.map((link) => (
                              <a
                                key={link.href}
                                href={routeHrefFromLegacyHash(link.href)}
                                onClick={() => setOpenMenu(null)}
                                className="block rounded-md px-3 py-2 text-[14px] leading-snug tracking-normal normal-case font-semibold text-white hover:bg-white/10 hover:text-kiewit-yellow transition-colors"
                              >
                                {copy(link.label, language)}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center space-x-6 text-white/90">
          <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.1em] border-r border-white/30 pr-6 uppercase">
            {(['en', 'fr'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onLanguageChange(item)}
                className={`hover:text-kiewit-yellow transition-colors ${language === item ? 'text-kiewit-yellow' : 'text-white/70'}`}
                aria-pressed={language === item}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" aria-label={copy('Search', language)} onClick={onSearchOpen} className="hover:text-kiewit-yellow transition-colors">
            <Search className="w-5 h-5 text-kiewit-yellow" />
          </button>
        </div>
      </div>

      <div className="flex-1 lg:hidden flex items-center justify-end pr-5 gap-3">
        <button
          type="button"
          onClick={onSearchOpen}
          aria-label={copy('Search', language)}
          className="w-11 h-11 border border-white/30 rounded-full flex items-center justify-center text-kiewit-yellow hover:border-kiewit-yellow transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => onLanguageChange(language === 'en' ? 'fr' : 'en')}
          className="w-11 h-11 border border-white/30 rounded-full flex items-center justify-center text-[12px] font-bold text-white hover:border-kiewit-yellow hover:text-kiewit-yellow transition-colors"
          aria-label={language === 'en' ? 'Switch to French' : 'Switch to English'}
        >
          {language.toUpperCase()}
        </button>
        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="w-11 h-11 border border-white/30 rounded-full flex items-center justify-center text-white hover:border-kiewit-yellow hover:text-kiewit-yellow transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed left-0 right-0 top-[78px] max-h-[calc(100vh-78px)] overflow-y-auto bg-black/96 border-t border-white/10 shadow-2xl">
          <div className="px-5 py-6 space-y-6">
            {navItems.map((item) => {
              const dropdown = dropdownMenus[item.key];
              const isActive = activePage === item.key || allDetailPages[activePage]?.parent === item.key;

              return (
                <div key={item.key} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                  <a
                    href={routeHref(item.key)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between text-[14px] font-bold tracking-[0.12em] uppercase ${
                      isActive ? 'text-kiewit-yellow' : 'text-white'
                    }`}
                  >
                    {copy(item.label, language)}
                    <ChevronRight className="w-4 h-4 text-kiewit-yellow" />
                  </a>
                  {dropdown && (
                    <div className="mt-4 grid gap-5">
                      {dropdown.map((column) => (
                        <div key={column.heading}>
                          <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-white/45 mb-2">
                            {copy(column.heading, language)}
                          </div>
                          <div className="grid gap-1">
                            {column.links.map((link) => (
                              <a
                                key={link.href}
                                href={routeHrefFromLegacyHash(link.href)}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded-md px-2 py-2 text-[15px] font-medium text-white/82 hover:bg-white/10 hover:text-kiewit-yellow transition-colors"
                              >
                                {copy(link.label, language)}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

const heroSlides = [
  {
    category: 'GTA DESIGN-BUILD',
    title: 'Design, Permits and Construction Under One GTA Team',
    desc: 'Vitalite helps owners move from feasibility review to permit-ready drawings, construction management, inspections and warranty-oriented closeout without splitting the project across disconnected teams.',
    link: 'Explore design-build services',
    video: publicAsset('vitalite-hero-design-build.mp4'),
    displayDurationMs: 16000,
    image: PLACEHOLDER_IMAGE,
  },
  {
    category: 'CUSTOM HOMES',
    title: 'Custom Homes Planned Before They Are Priced',
    desc: 'We connect lifestyle goals, lot constraints, architectural direction, budgets and site execution before construction starts, so each custom home has a clear path from concept to handover.',
    link: 'Custom home design & build',
    displayDurationMs: 6500,
    image: PLACEHOLDER_IMAGE,
  },
  {
    category: 'MULTI-UNIT HOUSING',
    title: 'Multiplex, Garden Suite and Addition Projects Built for Approval',
    desc: 'For investors and homeowners adding density or space, Vitalite coordinates feasibility, zoning, drawings, permits, trades and inspections around one managed construction plan.',
    link: 'Plan residential investment work',
    displayDurationMs: 6500,
    image: PLACEHOLDER_IMAGE,
  },
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const currentHeroSlide = heroSlides[currentSlide];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, currentHeroSlide.displayDurationMs);
    return () => clearInterval(timer);
  }, [currentHeroSlide.displayDurationMs, isPaused]);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video || !currentHeroSlide.video) return undefined;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    if (isPaused) {
      video.pause();
      return undefined;
    }

    const playVideo = () => {
      void video.play().catch(() => {
        // Some mobile browsers block autoplay in low-power or data-saving modes.
      });
    };

    if (video.readyState >= 2) {
      playVideo();
      return undefined;
    }

    video.addEventListener('canplay', playVideo, { once: true });
    return () => video.removeEventListener('canplay', playVideo);
  }, [currentHeroSlide.video, currentSlide, isPaused]);

  return (
    <div className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {currentHeroSlide.video ? (
            <video
              ref={heroVideoRef}
              src={currentHeroSlide.video}
              poster={currentHeroSlide.image}
              className="w-full h-full object-cover"
              autoPlay
              defaultMuted
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Vitalite design-build project video"
            />
          ) : (
            <img src={currentHeroSlide.image} alt="Vitalite project" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40"></div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none"></div>

      <div className="relative h-full flex items-center px-5 sm:px-8 md:px-24 pt-16 lg:pt-0">
        <div className="max-w-4xl text-white">
          <motion.div
            key={`content-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="inline-block border-b border-white pb-1 mb-6 text-[11px] font-bold tracking-[0.2em] uppercase">
              {currentHeroSlide.category}
            </div>
            <h1 className="text-[2.55rem] sm:text-5xl md:text-7xl font-bold mb-6 leading-[1.08] tracking-tight text-white drop-shadow-md">
              {currentHeroSlide.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl max-w-3xl mb-8 font-light text-gray-200">
              {currentHeroSlide.desc}
            </p>
            <a href={routeHref('services')} className="group inline-flex items-center text-lg sm:text-xl font-medium hover:text-gray-300 transition-colors">
              {currentHeroSlide.link}
              <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </div>

      {/* Navigation Arrows for Hero */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
        className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/30 items-center justify-center text-white hover:bg-white/10 transition-colors z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
        className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/30 items-center justify-center text-white hover:bg-white/10 transition-colors z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Hero Controls */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-2">
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-kiewit-yellow' : 'w-1.5 bg-white/50 hover:bg-white'}`}
          />
        ))}
      </div>
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="absolute bottom-8 right-5 sm:bottom-10 sm:right-10 w-10 h-10 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        {isPaused ? <Play className="w-4 h-4 text-white" fill="white" /> : <Pause className="w-4 h-4 text-white" fill="white" />}
      </button>
    </div>
  );
};

const SectionHeading = ({ title, className = '' }: { title: string; className?: string }) => (
  <div className={`mb-10 ${className}`}>
    <div className="w-16 h-1 bg-kiewit-yellow mb-6"></div>
    <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white">
      {title}
    </h2>
  </div>
);

const fadeInVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const IntegratedSolutions = () => {
  return (
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        variants={fadeInVariants}
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
      >
        <div>
          <SectionHeading title="GTA Design-Build, Permits and Construction Management" />
          <p className="text-lg text-gray-300 leading-relaxed max-w-xl mb-12">
            Vitalite Construction Corp. is built for projects where design decisions, zoning review, permit drawings, engineering, budget control and site execution need to stay connected. We support custom homes, multiplex housing, additions, garden suites, laneway houses and ICI projects across the GTA.
          </p>
          <a href={routeHref('services')} className="group inline-flex items-center text-xl font-medium text-white hover:text-gray-300 transition-colors">
            View Vitalite services <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <div className="relative h-[600px] hidden lg:block">
          <img src={PLACEHOLDER_IMAGE} alt="Construction planning" className="absolute top-4 right-0 w-[45%] h-[200px] object-cover rounded-2xl z-0 shadow-xl" />
          <img src={PLACEHOLDER_IMAGE} alt="Custom home exterior" className="absolute left-0 top-1/2 -translate-y-1/2 w-[75%] h-[420px] object-cover rounded-2xl z-10 shadow-2xl" />
          <img src={PLACEHOLDER_IMAGE} alt="Project management meeting" className="absolute bottom-4 right-8 w-[40%] h-[220px] object-cover rounded-2xl z-20 shadow-xl" />
        </div>
      </motion.div>
    </section>
  );
};

const Stats = () => {
  const stats = [
    { value: 'GTA', label: 'Toronto-area zoning, permit and inspection experience' },
    { value: '7', label: 'Core service lines for residential and ICI projects' },
    { value: 'A-Z', label: 'Consultation, drawings, permits, construction and closeout' },
    { value: 'PM', label: 'Schedule, budget, trades, inspections and quality control' },
  ];

  return (
    <section className="bg-kiewit-blue py-20 md:py-32 px-5 sm:px-8">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeInVariants}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium text-center text-white mb-14 md:mb-20 tracking-tight">
          Plan First. Build With Control.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 text-center">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
            >
              <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-kiewit-yellow mb-4 md:mb-6 tracking-tighter">
                {stat.value}
              </div>
              <div className="text-lg md:text-xl text-white font-medium max-w-[220px] mx-auto leading-tight">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

const expertiseItems = [
  {
    tab: 'Custom Homes',
    title: 'Custom Home Design & Build',
    desc: 'We help owners turn a custom-home idea into a buildable plan by aligning lifestyle goals, lot constraints, architectural drawings, budgets, permits, material choices and site delivery before construction begins.',
    link: 'Custom home approach',
    image: PLACEHOLDER_IMAGE,
  },
  {
    tab: 'Multiplex Housing',
    title: 'Multi-Unit & Multiplex Residential Construction',
    desc: 'We help investors and property owners evaluate unit strategy, zoning fit, code requirements, systems upgrades, rental potential and construction sequencing for compliant multi-unit residential projects.',
    link: 'Multiplex construction',
    image: PLACEHOLDER_IMAGE,
  },
  {
    tab: 'Garden Suites',
    title: 'Garden Suites, Laneway Houses & Coach Houses',
    desc: 'We coordinate garden suites, laneway houses and coach houses from early feasibility through drawings, permits, servicing, access planning and managed construction.',
    link: 'Secondary dwelling units',
    image: PLACEHOLDER_IMAGE,
  },
  {
    tab: 'Additions',
    title: 'Home Additions & Major Renovations',
    desc: 'We plan additions and major renovations around structure, code, permit path, existing-home conditions and finish continuity, so added space feels intentional rather than patched on.',
    link: 'Addition and renovation work',
    image: PLACEHOLDER_IMAGE,
  },
  {
    tab: 'Permits & Engineering',
    title: 'Drawings, Permits & Engineering Coordination',
    desc: 'We organize architectural drawings, structural inputs, HVAC or mechanical coordination, zoning review and permit applications so construction pricing is based on a clearer scope.',
    link: 'Permit-ready documentation',
    image: PLACEHOLDER_IMAGE,
  },
  {
    tab: 'Project Management',
    title: 'Project Management & Construction Management',
    desc: 'We manage schedules, budgets, trades, procurement, inspections, site meetings, quality control and client communication so complex projects have visible accountability.',
    link: 'Construction management',
    image: PLACEHOLDER_IMAGE,
  },
  {
    tab: 'ICI Construction',
    title: 'Industrial, Commercial & Institutional Construction',
    desc: 'We support warehouses, offices, retail spaces and institutional facilities with practical design-build and construction management focused on compliance, durability and operating needs.',
    link: 'ICI construction services',
    image: PLACEHOLDER_IMAGE,
  },
];

const Expertise = () => {
  const [activeTab, setActiveTab] = useState(expertiseItems[0].tab);
  const activeExpertise = expertiseItems.find((item) => item.tab === activeTab) ?? expertiseItems[0];

  return (
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeInVariants}
        className="max-w-7xl mx-auto"
      >
        <SectionHeading title="Design, Approvals and Construction in One Workflow." />
        <p className="text-lg text-gray-300 leading-relaxed max-w-4xl mb-12">
          Vitalite is not a standalone design office or a basic construction crew. We coordinate the planning work that decides whether a project can be priced, approved and built with fewer avoidable gaps.
        </p>

        <div className="flex flex-nowrap md:flex-wrap items-center gap-3 md:gap-4 mb-12 md:mb-16 overflow-x-auto pb-2 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {expertiseItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`px-4 md:px-6 py-2.5 rounded-full text-[14px] md:text-[15px] font-medium transition-colors border whitespace-nowrap shrink-0 ${
                activeTab === item.tab
                  ? 'bg-kiewit-yellow border-kiewit-yellow text-black'
                  : 'bg-transparent border-gray-600 text-white hover:border-white'
              }`}
            >
              {item.tab}
            </button>
          ))}
          <button className="hidden md:block p-2 ml-4 hover:bg-white/10 rounded-full transition-colors">
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeExpertise.tab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl overflow-hidden h-[320px] sm:h-[420px] lg:h-[500px]"
            >
              <img src={activeExpertise.image} alt={activeExpertise.title} className="w-full h-full object-cover" />
            </motion.div>
          </AnimatePresence>
          <div>
            <h3 className="text-2xl sm:text-3xl font-medium mb-5 md:mb-6">{activeExpertise.title}</h3>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-8 md:mb-10">
              {activeExpertise.desc}
            </p>
            <a href={routeHref('services')} className="group inline-flex items-center text-xl font-medium text-white hover:text-gray-300 transition-colors">
              {activeExpertise.link} <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const Markets = () => {
  const markets = [
    {
      name: 'Custom Homes',
      summary: 'Custom homes, rebuilds and owner-focused residences planned around lot conditions, approvals, budget and finish quality.',
      img: PLACEHOLDER_IMAGE,
    },
    {
      name: 'Multi-Unit / Multiplex',
      summary: 'Multi-unit housing, separate suites and investment residential projects planned for code compliance and rental potential.',
      img: PLACEHOLDER_IMAGE,
    },
    {
      name: 'Garden Suite / Laneway House',
      summary: 'Secondary dwelling units that add family flexibility, rental income potential and long-term property value.',
      img: PLACEHOLDER_IMAGE,
    },
    {
      name: 'Home Additions & Alterations',
      summary: 'Additions, extensions, structural changes and whole-house renovations coordinated with permits and existing conditions.',
      img: PLACEHOLDER_IMAGE,
    },
    {
      name: 'Drawings, Permits & Engineering',
      summary: 'Permit-ready drawings, structural coordination, HVAC inputs, zoning review and municipal submission support.',
      img: PLACEHOLDER_IMAGE,
    },
    {
      name: 'Project / Construction Management',
      summary: 'Budget, schedule, trades, procurement, quality control, inspections and client communication managed together.',
      img: PLACEHOLDER_IMAGE,
    },
    {
      name: 'ICI Construction',
      summary: 'Warehouse, office, retail, industrial and institutional projects planned around compliance, durability and operations.',
      img: PLACEHOLDER_IMAGE,
    },
  ];

  return (
    <section className="bg-gray-100 text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeInVariants}
        className="max-w-[1400px] mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-3xl">
            <div className="w-16 h-1 bg-kiewit-yellow mb-6"></div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight mb-6 md:mb-8">
              Our Services
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed font-light">
              Vitalite serves GTA homeowners, investors, developers and commercial clients who need design-build general contracting, permit coordination and construction management under one accountable process.
            </p>
          </div>
          <div className="hidden sm:flex space-x-4 shrink-0">
            <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-6 h-6 text-black" />
            </button>
            <button className="w-12 h-12 rounded-full border border-black flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {markets.map((market, i) => (
            <div key={i} className="min-w-[82vw] sm:min-w-[300px] md:min-w-[340px] h-[420px] sm:h-[480px] rounded-2xl overflow-hidden relative group cursor-pointer snap-start shrink-0">
              <img src={market.img} alt={market.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{market.name}</h3>
                <p className="text-sm text-gray-200 leading-relaxed mb-5">{market.summary}</p>
                <div className="flex items-center text-[15px] font-medium text-white group-hover:text-gray-300 transition-colors">
                  Read more <ChevronRight className="w-5 h-5 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

const ProjectProcess = () => {
  const cards = [
    {
      title: 'Consult & Evaluate',
      detail: 'Initial consultation, project goals, budget direction, site measurement and existing-condition review.',
      img: PLACEHOLDER_IMAGE,
    },
    {
      title: 'Design, Price & Contract',
      detail: 'Concept design, 2D or 3D planning, budgetary quotation and the right contracting model for the project.',
      img: PLACEHOLDER_IMAGE,
    },
    {
      title: 'Review, Engineer & Permit',
      detail: 'Zoning review, building code review, structural, HVAC and mechanical coordination, then permit submission.',
      img: PLACEHOLDER_IMAGE,
    },
    {
      title: 'Build, Inspect & Support',
      detail: 'Pre-construction preparation, site management, quality control, PDI, move-in support and aftercare warranty.',
      img: PLACEHOLDER_IMAGE,
    },
  ];

  return (
    <section className="relative py-20 md:py-32 px-5 sm:px-8 overflow-hidden bg-[#111]">
      <div className="absolute inset-0 z-0">
        <img src={PLACEHOLDER_IMAGE} alt="Construction site" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent"></div>
      </div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeInVariants}
        className="max-w-[1400px] mx-auto relative z-10"
      >
        <SectionHeading title="From First Review to Final Handover" />
        <p className="text-lg text-gray-300 leading-relaxed max-w-4xl mb-12">
          Our process gives owners a clear path before the site is active: feasibility, design, zoning, permits, engineering, budget planning, procurement, construction, inspections, PDI and warranty-oriented aftercare.
        </p>
        <a href={routeHref('why-the-vitalite-way')} className="group inline-flex items-center text-lg sm:text-xl font-medium text-white hover:text-gray-300 mb-12 md:mb-16 transition-colors">
          How Vitalite works <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div key={i} className="h-[320px] sm:h-[360px] rounded-2xl overflow-hidden relative group cursor-pointer">
              <img src={card.img} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-5 sm:p-6 w-full flex justify-between items-end gap-4">
                <div className="max-w-[82%]">
                  <h3 className="text-[22px] font-bold text-white leading-tight mb-3">{card.title}</h3>
                  <p className="text-sm text-gray-200 leading-relaxed">{card.detail}</p>
                </div>
                <Plus className="w-6 h-6 text-white shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

const serviceInclusions: Array<{ label: string; href: `#${DetailPageKey}` }> = [
  { label: 'Architectural Services', href: '#service-architectural-services' },
  { label: 'Interior Design', href: '#service-interior-design' },
  { label: 'Rendering', href: '#service-rendering' },
  { label: 'Material Selection / Procurement', href: '#service-material-selection' },
  { label: 'Building + Board Approvals', href: '#service-building-board-approvals' },
  { label: 'Construction & Site Management', href: '#service-construction-site-management' },
];

const servicePageCards: ImageCard[] = [
  {
    title: 'Custom Home Design & Build',
    eyebrow: 'Luxury custom homes',
    summary: 'Bespoke residences, rebuilds and owner-focused homes built around lifestyle, craftsmanship and long-term property value.',
    image: PLACEHOLDER_IMAGE,
    href: '#service-custom-homes',
  },
  {
    title: 'Multi-Unit & Multiplex Construction',
    eyebrow: 'Investment housing',
    summary: 'Compliant multi-unit residential projects that help owners increase land use, rental potential and future asset value.',
    image: PLACEHOLDER_IMAGE,
    href: '#service-multiplex',
  },
  {
    title: 'Garden Suites & Laneway Houses',
    eyebrow: 'Secondary dwelling units',
    summary: 'Garden suites, laneway houses and coach houses that add flexible living space, rental income potential and property value.',
    image: PLACEHOLDER_IMAGE,
    href: '#service-garden-suites',
  },
  {
    title: 'Home Additions & Major Renovations',
    eyebrow: 'Additions and alterations',
    summary: 'Additions, structural alterations and large renovations that expand living space while protecting design continuity and safety.',
    image: PLACEHOLDER_IMAGE,
    href: '#service-home-additions',
  },
  {
    title: 'Drawings, Permits & Engineering',
    eyebrow: 'Permit-ready planning',
    summary: 'Architectural drawings, structural coordination, zoning review, building code review and permit applications.',
    image: PLACEHOLDER_IMAGE,
    href: '#service-drawings-permits',
  },
  {
    title: 'Project & Construction Management',
    eyebrow: 'Budget and schedule control',
    summary: 'Schedules, budgets, trades, quality control, inspections and client communication managed through delivery.',
    image: PLACEHOLDER_IMAGE,
    href: '#service-project-management',
  },
  {
    title: 'Industrial, Commercial & Institutional',
    eyebrow: 'ICI construction',
    summary: 'Warehouses, offices, retail spaces and institutional facilities planned for compliance, durability and cost efficiency.',
    image: PLACEHOLDER_IMAGE,
    href: '#service-ici-construction',
  },
];

const whyPageCards: ImageCard[] = [
  {
    title: 'About Vitalite',
    summary: 'Vitalite Construction Corp. is a GTA-based design-build, general contracting and construction management company for residential and ICI projects.',
    image: PLACEHOLDER_IMAGE,
    href: '#why-about-us',
  },
  {
    title: 'The Vitalite Way',
    summary: 'We move through consultation, site evaluation, concept design, budget planning, zoning review, permits, construction, PDI and warranty support.',
    image: PLACEHOLDER_IMAGE,
    href: '#why-the-vitalite-way',
  },
  {
    title: 'Why Design-Build?',
    summary: 'A single accountable team reduces gaps between design, approvals, engineering and site execution, especially on complex GTA properties.',
    image: PLACEHOLDER_IMAGE,
    href: '#why-design-build',
  },
  {
    title: 'Testimonials',
    summary: 'Client feedback, project reviews and handover stories can be featured here as the portfolio grows.',
    image: PLACEHOLDER_IMAGE,
    href: '#why-testimonials',
  },
  {
    title: 'In The News',
    summary: 'Company updates, local project features and media mentions can live here without mixing them into service pages.',
    image: PLACEHOLDER_IMAGE,
    href: '#why-in-the-news',
  },
];

const workPageCards: ImageCard[] = [
  {
    title: 'Custom Homes',
    summary: 'Luxury homes, rebuilds and bespoke residences for Toronto-area owners upgrading lifestyle and long-term value.',
    image: PLACEHOLDER_IMAGE,
    href: '#work-custom-homes',
  },
  {
    title: 'Multi-Unit / Multiplex',
    summary: 'Investment-focused residential projects that increase density, rental potential and long-term property value.',
    image: PLACEHOLDER_IMAGE,
    href: '#work-multiplex',
  },
  {
    title: 'Garden Suites & Laneway Houses',
    summary: 'Secondary dwelling units that create rental income, family living space and more flexible use of a lot.',
    image: PLACEHOLDER_IMAGE,
    href: '#work-garden-suites',
  },
  {
    title: 'Additions & Major Renovations',
    summary: 'Home additions, extensions, structural alterations and whole-house renovations for changing family needs.',
    image: PLACEHOLDER_IMAGE,
    href: '#work-additions',
  },
  {
    title: 'Industrial / Commercial / Institutional',
    summary: 'Warehouses, offices, retail spaces and institutional facilities built around compliance and practical operation.',
    image: PLACEHOLDER_IMAGE,
    href: '#work-ici',
  },
  {
    title: 'Full Interiors',
    summary: 'Interior construction, finish upgrades, space planning and procurement for high-value residential projects.',
    image: PLACEHOLDER_IMAGE,
    href: '#work-full-interiors',
  },
];

const blogPageCards: ImageCard[] = [
  {
    title: "Buyer's Renovation Guide",
    summary: 'What GTA buyers should understand before purchasing a property that needs additions, permits or major renovation work.',
    image: PLACEHOLDER_IMAGE,
    href: '#blog-buyers-renovation-guide',
  },
  {
    title: 'Toronto Renovations: Cost Per SQ FT',
    summary: 'How custom home, addition, multiplex and renovation budgets are shaped by scope, structure, finishes and approvals.',
    image: PLACEHOLDER_IMAGE,
    href: '#blog-renovation-costs',
  },
  {
    title: 'Design-Build Vs Architect',
    summary: 'When a design-build contractor makes sense, when to separate design and construction, and how accountability changes.',
    image: PLACEHOLDER_IMAGE,
    href: '#blog-design-build-vs-architect',
  },
  {
    title: 'How Long Is A GTA Renovation?',
    summary: 'A practical timeline guide covering design, engineering, permits, procurement, construction and final inspection.',
    image: PLACEHOLDER_IMAGE,
    href: '#blog-renovation-timeline',
  },
  {
    title: 'Toronto Renovation Laws',
    summary: 'A plain-English introduction to zoning review, building permits, drawings and inspections for residential projects.',
    image: PLACEHOLDER_IMAGE,
    href: '#blog-renovation-laws',
  },
  {
    title: 'Garden Suite Ideas 2026',
    summary: 'Design, rental and approval considerations for owners planning a garden suite, laneway house or coach house.',
    image: PLACEHOLDER_IMAGE,
    href: '#blog-garden-suite-ideas',
  },
  {
    title: 'Renovating A Fixer-Upper vs Buying New',
    summary: 'Better value strategies for owners comparing secondary suites, additions, full interiors and investment housing.',
    image: PLACEHOLDER_IMAGE,
    href: '#blog-fixer-upper-vs-new',
  },
];

const detailPages: Record<DetailPageKey, DetailPageContent> = {
  'service-architectural-services': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Architectural Services',
    subtitle: "Drawings that account for zoning, structure, budget and the permit reviewer — not just what looks good on screen.",
    image: PLACEHOLDER_IMAGE,
    intro: "Architectural drawings are the foundation of every GTA building permit. But drawings that look complete can still fail at the permit counter if they misread the zoning bylaw, skip a required structural note or omit an HVAC reference. Vitalite coordinates architectural services so the drawings serve three audiences at once: the approval office, the structural engineer and the construction team.",
    answer: "Vitalite coordinates concept layouts, permit-ready drawings, zoning review and design-build scope alignment — so the design intent survives contact with the approval process.",
    bullets: ['Concept layouts and design direction', 'Permit-ready drawing packages', 'Zoning and bylaw review', 'Design-build scope coordination'],
    sections: [
      { heading: 'When You Need This', text: "Any project that requires a building permit — custom homes, additions, multiplexes, garden suites, major renovations, gut renovations and ICI spaces — depends on architectural drawings that are accurate, code-compliant and complete. An incomplete or technically incorrect package gets returned, adding weeks to a project that cannot move without the permit." },
      { heading: 'What Makes GTA Drawing Coordination Difficult', text: "Toronto-area zoning is layered: base zoning, Official Plan overlays, heritage designations, mature neighbourhood policies and lot-specific constraints can all affect what a drawing can show. A drafter unfamiliar with the local context may produce drawings that are technically legal but practically wrong for the site." },
      { heading: 'What Vitalite Coordinates', text: "Concept design, site measurement, zoning interpretation, building code review, structural coordination, HVAC references, drawing sets for permit submission and response to municipal comments. Each element is reviewed against the others before the package leaves our hands." },
      { heading: 'Connection to Construction', text: "Architectural coordination does not stop at permit approval. We review drawings against construction reality — framing, rough-in, structural assumptions — before trades begin work. Conflicts caught at drawing stage cost a revision. Conflicts caught on site cost time and money." },
    ],
    steps: ['Site review and program definition', 'Zoning and building code review', 'Concept layout and design direction', 'Permit drawing package preparation', 'Structural and mechanical coordination', 'Municipal submission and comment response'],
    faqs: [
      { question: "Can Vitalite work with an architect I have already hired?", answer: "Yes. Vitalite can work alongside an existing architect in a construction management role, reviewing drawings for buildability, code compliance and permit readiness without duplicating the design work." },
      { question: "What is the difference between architectural drawings and permit drawings?", answer: "Architectural drawings define the design intent. Permit drawings are a specific package — organized per municipal requirements, including zoning data sheets, code compliance notes and sometimes structural or HVAC references — submitted to the City for approval." },
      { question: "How long does architectural coordination take for a typical project?", answer: "For a standard addition, four to eight weeks from design start to permit-ready submission is typical. Custom homes and multiplexes often take longer if zoning issues require resolution first." },
    ],
    relatedLinks: [
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Custom home design and build', key: 'service-custom-homes' },
      { label: 'Why design-build?', key: 'why-design-build' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-interior-design': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Interior Design',
    subtitle: "Interior decisions made before construction starts — so the walls, trades and procurement are ready for them.",
    image: PLACEHOLDER_IMAGE,
    intro: "Interior design in construction is not just about what looks good. A kitchen layout decided after framing can require re-routing plumbing. A tile selection made without checking lead times can delay trades by three weeks. Vitalite connects interior design choices to the build plan — so decisions land at the right time, not after the consequences are already in the walls.",
    answer: "Vitalite coordinates space planning, finish direction, kitchen and bath layouts, millwork and fixture selection to support the construction schedule and budget — not just the design vision.",
    bullets: ['Space planning and layout', 'Finish and material direction', 'Kitchen and bath design', 'Millwork, fixture and procurement coordination'],
    sections: [
      { heading: 'Where Interior Decisions Affect Construction', text: "Plumbing rough-in, electrical placement, floor structure reinforcement, HVAC outlet locations and window openings are all locked before finish trades arrive. Decisions that affect those elements need to be made before the framing inspection — not during it." },
      { heading: 'Design-Build Advantage', text: "Because Vitalite manages both design and construction, interior selections are reviewed against budget, procurement lead time and trade sequence before they are locked. That review prevents the common pattern of expensive redesign after finishes are committed." },
      { heading: 'Project Types', text: "Condo and apartment full interiors, custom home finish packages, gut renovations, kitchen and bath rebuilds, loft renovations and commercial interior fit-outs. Most projects benefit from interior design coordination regardless of size." },
      { heading: 'Procurement and Trade Coordination', text: "Material selections are tied to supplier timelines, trade schedules and budget controls. Vitalite does not hand owners a finish board and leave them to manage procurement independently — selections are tracked through to site delivery." },
    ],
    faqs: [
      { question: "Can Vitalite work with my own interior designer?", answer: "Yes. If you have a designer engaged, Vitalite can work in a construction management role — reviewing their selections for buildability, code compliance, procurement timing and trade coordination without conflicting with the design direction." },
      { question: "How early should interior design decisions be made?", answer: "Before framing is complete for structural implications. Before rough-in begins for plumbing and electrical placement. Before permits are issued for items that affect building code compliance. Earlier is almost always better — and always cheaper." },
      { question: "Does Vitalite provide standalone interior design services?", answer: "Vitalite coordinates interior design as part of a broader design-build or construction management scope. For standalone interior design without construction engagement, we can direct you to appropriate partners." },
    ],
    relatedLinks: [
      { label: 'Rendering and visualization', key: 'service-rendering' },
      { label: 'Material selection and procurement', key: 'service-material-selection' },
      { label: 'Full-gut renovations', key: 'service-gut-renovations' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-rendering': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Rendering',
    subtitle: "See the space before the first hole is drilled.",
    image: PLACEHOLDER_IMAGE,
    intro: "The most expensive decisions in a construction project are made early — before drawings are finished, before permits are submitted, before the budget is set. A rendering turns design intent into a visual that owners can actually react to. That feedback at week two costs nothing. The same feedback at week ten of construction costs significantly more.",
    answer: "Vitalite uses 2D layouts, 3D concept models and interior finish studies to help owners confirm design decisions before those decisions are locked into permits, procurement and construction contracts.",
    bullets: ['3D concept visualization', 'Interior finish and material studies', 'Exterior massing and elevation views', 'Pre-permit design confirmation'],
    sections: [
      { heading: 'When a Rendering Prevents a Problem', text: "A raised kitchen island that looked right on the floor plan blocks the sightline from the living room in the rendering. A bathroom layout that seemed efficient is too tight to open the door properly when modelled. These discoveries at design stage cost a revision. At construction stage, they cost a redesign, additional labour and schedule time." },
      { heading: 'Exterior and Massing Visualization', text: "For custom homes, additions and multiplexes, exterior renderings help confirm height, roofline, window placement, material choice and overall proportion before permit drawings are finalized. Adjustments at this stage are free." },
      { heading: 'Interior Finish Studies', text: "Material combinations — tile, cabinetry, countertop, flooring, lighting — are easier to evaluate together in a rendered environment than separately on sample boards. Renderings help owners make confident finish selections faster and with less regret." },
      { heading: 'Connection to Procurement', text: "Once design direction is confirmed through renderings, Vitalite uses the confirmed selections to drive procurement timelines. Selections made earlier reduce the risk of material delays affecting the construction schedule." },
    ],
    faqs: [
      { question: "Are renderings always necessary?", answer: "Not always. Simpler projects with clear owner direction and experience can proceed without them. Renderings add the most value when the design involves multiple finish trades, a significant investment or an owner who wants to see the space before committing." },
      { question: "How detailed are the renderings?", answer: "Renderings range from concept-level massing studies to detailed interior visualizations with specific finishes. The detail level depends on the decision being supported — not every project needs photorealistic output." },
      { question: "Can I request changes after seeing the rendering?", answer: "Yes — that is exactly the point. A rendering is a decision tool, not a final commitment. Changes at rendering stage are expected and inexpensive compared to changes during construction." },
    ],
    relatedLinks: [
      { label: 'Interior design', key: 'service-interior-design' },
      { label: 'Material selection', key: 'service-material-selection' },
      { label: 'Architectural services', key: 'service-architectural-services' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-material-selection': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Material Selection / Procurement',
    subtitle: "Finish selections that arrive on time, fit the budget and survive the inspection.",
    image: PLACEHOLDER_IMAGE,
    intro: "Material selection in a construction project is a procurement problem as much as an aesthetic one. The tile chosen in the showroom has a six-week lead time. The countertop edge profile adds two weeks to fabrication. The light fixture requires a different electrical rough-in than planned. Vitalite coordinates material selection so the choices that come off the mood board match the budget, the schedule and the construction sequence.",
    answer: "Vitalite helps owners select and procure materials — finishes, fixtures, cabinetry, tile, flooring, hardware — tied to real lead times, trade sequences and budget controls, not just design preference.",
    bullets: ['Finish and fixture selection', 'Supplier and lead-time coordination', 'Budget-aligned procurement', 'Trade sequence integration'],
    sections: [
      { heading: 'Lead Time Is a Construction Variable', text: "High-end tile from Italy may have a 10-week lead time. Custom cabinetry often takes 12 to 14 weeks from order to delivery. Stone countertops need templating after the cabinets are installed. Material selection is not a design activity — it is a scheduling activity, and late selections cause trades to stand down." },
      { heading: 'Selection Connected to Budget', text: "Material costs interact with installation costs, waste allowances, structural requirements and specification changes. Vitalite reviews selections against the project budget so owners understand the full cost of a material choice before it is ordered — not after." },
      { heading: 'Supplier Coordination', text: "Vitalite works with suppliers and trades to align delivery windows with site readiness. Materials do not arrive too early (no secure storage, risk of damage) or too late (trades idle, schedule slips). Timing is tracked actively, not assumed." },
      { heading: 'Owner Experience', text: "Material selection can be overwhelming. Vitalite narrows the options to a curated set that meets the design intent, fits the budget, is available within the required timeline and will be installed correctly by the relevant trade." },
    ],
    faqs: [
      { question: "Can I use materials I have already selected independently?", answer: "Yes. If you have existing selections, Vitalite will review them for lead time, specification, installation requirements and budget fit before incorporating them into the procurement schedule." },
      { question: "What if I want to upgrade a selection after construction starts?", answer: "Upgrades are possible but carry schedule and cost risk depending on what is already ordered or installed. Vitalite reviews change requests for downstream impact before processing them." },
      { question: "Does Vitalite receive commissions from suppliers?", answer: "No. Selection guidance is based on what fits the project — lead time, quality, budget and trade compatibility. We do not receive undisclosed commissions from material suppliers." },
    ],
    relatedLinks: [
      { label: 'Interior design', key: 'service-interior-design' },
      { label: 'Rendering and visualization', key: 'service-rendering' },
      { label: 'Construction site management', key: 'service-construction-site-management' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-building-board-approvals': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Building + Board Approvals',
    subtitle: "Getting through the condo board or the City without losing months to paperwork.",
    image: PLACEHOLDER_IMAGE,
    intro: "Approval processes in Toronto range from a straightforward building permit application to a months-long Committee of Adjustment hearing. Condo boards add their own layer: they control elevator access, working hours, damage deposits and what contractor documentation they need before work starts. Vitalite coordinates both tracks — municipal approvals and building management approvals — so neither one holds up the project.",
    answer: "Vitalite prepares and coordinates approval packages for condo boards, property managers, zoning review and municipal permit applications — so construction can start with the right permissions in place.",
    bullets: ['Condo board package preparation', 'Property management coordination', 'Zoning and Committee of Adjustment support', 'Building permit application coordination'],
    sections: [
      { heading: 'Condo Board and Property Manager Requirements', text: "Condo boards require proof of insurance, contractor credentials, scope drawings, noise and dust management plans, elevator booking and a damage deposit before renovation work begins. Missing or incomplete submissions mean rejection and rebooking delay. Vitalite prepares complete packages for first-submission approval." },
      { heading: 'Municipal Permit Applications', text: "Building permits require a complete application: the right form, correct drawings, zoning data sheets, applicable consultant reports and the correct fee. Incomplete applications get returned. Vitalite prepares packages that go through on the first submission and manages comment rounds when the City responds." },
      { heading: 'Committee of Adjustment', text: "Projects that need a minor variance — a setback slightly short of the bylaw minimum, an addition that slightly exceeds lot coverage — require a Committee of Adjustment application. This adds several months to the approval timeline. Vitalite advises owners on whether a variance is needed and manages the application." },
      { heading: 'Stacking Multiple Approvals', text: "Some projects need both board approval and a building permit. Some need a permit, a Committee of Adjustment hearing and a heritage review. Vitalite maps the full approval sequence upfront so owners understand what is coming, in what order and how long each stage takes." },
    ],
    faqs: [
      { question: "What causes condo board approval rejections most often?", answer: "Incomplete contractor credentials, missing drawings, incorrectly specified working hours and inadequate dust or noise management plans are the most common rejection reasons. Vitalite prepares complete packages to avoid first-submission rejection." },
      { question: "How long does a Committee of Adjustment application take?", answer: "Typically three to five months from application to decision in Toronto. Preparation, submission, notice, hearing and written decision each take time. Projects that need a variance should factor this into their schedule before permit drawings are started." },
      { question: "Is a building permit always required for Toronto renovations?", answer: "Permits are required for structural changes, additions, changes of use, HVAC modifications, plumbing relocations and certain electrical work. Cosmetic work — painting, flooring, cabinet replacement without plumbing or electrical changes — generally does not. When in doubt, Vitalite confirms before any work begins." },
    ],
    relatedLinks: [
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Condo renovations', key: 'service-condo-renovations' },
      { label: 'Apartment renovations', key: 'service-apartment-renovations' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-construction-site-management': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Construction & Site Management',
    subtitle: "Someone on site who is accountable for the sequence, the quality and the communication — every day.",
    image: PLACEHOLDER_IMAGE,
    intro: "Most construction problems are visible before they become expensive — if someone is actually watching. A framing crew that misread the drawing. A sub-trade who arrived before the previous trade finished. A material delivery scheduled for the wrong week. Vitalite provides construction and site management as the accountable party on the ground: coordinating trades, managing the schedule, controlling quality and communicating clearly to the owner.",
    answer: "Vitalite manages daily site execution — trade sequencing, procurement timing, quality checks, municipal inspections and client updates — so the construction phase delivers what the drawings and contract promised.",
    bullets: ['Daily trade and schedule coordination', 'Quality control and inspection management', 'Procurement and material timing', 'Owner communication and progress reporting'],
    sections: [
      { heading: 'What Active Site Management Prevents', text: "A standing trade — a plumber who shows up when the framing is not ready for rough-in — is a day rate plus rescheduling delay. Multiply that across a six-month project with fifteen sub-trades and the coordination inefficiency becomes a significant budget risk. Vitalite sequences trades to minimize standing time and cascading delays." },
      { heading: 'Quality Control at the Right Stage', text: "Quality problems are cheapest to fix before they are covered up. Vitalite conducts quality checks at each trade handoff — framing before insulation, rough-in before drywall, finishes before close-out — to catch errors at the stage where correction is simple, not after it is hidden inside the wall." },
      { heading: 'Municipal Inspections', text: "Building inspections are mandatory at specific construction stages. Missing or failing an inspection stops work until the issue is resolved. Vitalite schedules inspections to align with the construction sequence and prepares for them in advance so they pass on the first visit." },
      { heading: 'Owner Communication', text: "Owners who are not on site daily need to understand what is happening, what decisions are coming and where the project stands against budget and schedule. Vitalite provides clear, regular project updates without requiring the owner to chase for information." },
    ],
    faqs: [
      { question: "What is the difference between a general contractor and a construction manager?", answer: "A general contractor typically holds the contract with the owner, hires sub-trades and carries the risk. A construction manager coordinates and manages trades on the owner's behalf, often with more transparency into actual costs. Vitalite can perform either role depending on the project structure." },
      { question: "Does Vitalite self-perform trades or hire sub-trades?", answer: "Vitalite uses qualified sub-trades for specialized work. The site management and coordination role is performed directly by Vitalite, maintaining accountability for the full construction process." },
      { question: "What if a trade does poor-quality work?", answer: "Vitalite identifies quality issues at trade handoff points and requires correction before the next stage proceeds. This is cheaper and faster than discovering problems at final inspection." },
    ],
    relatedLinks: [
      { label: 'Project and construction management', key: 'service-project-management' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-custom-homes': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Custom Home Design & Build',
    subtitle: "A GTA custom home built without the gap between the design team and the build team.",
    image: PLACEHOLDER_IMAGE,
    intro: "Custom home projects in the GTA are long, expensive and heavily dependent on decisions made in the first few months. The zoning determines what the footprint can be. The structural engineer shapes the interior spans. The permit drawings lock in the budget assumptions. And the construction team — if they were not involved during design — often inherits details that cost more to build than the budget assumed. Vitalite manages GTA custom home projects from the first feasibility conversation through drawings, permits, construction and warranty as one connected team.",
    answer: "Vitalite delivers GTA custom homes under a design-build model: one team for concept planning, permit drawings, engineering coordination, trade management, inspections and post-occupancy warranty support.",
    bullets: ['Concept design and architectural coordination', 'Budget planning and construction pricing', 'Permit drawings, engineering and municipal approvals', 'Trade scheduling, site management and PDI'],
    sections: [
      { heading: 'What Makes a GTA Custom Home Difficult', text: "Toronto and the surrounding region have some of the most layered residential zoning in Canada. Lot coverage, building height, angular plane setbacks, heritage overlays, tree protection requirements and lot grading standards all constrain what can be built. Projects that do not account for these requirements early lose time and money at the permit counter." },
      { heading: 'How Vitalite Approaches a Custom Home', text: "The process starts with zoning review and site feasibility before any design work is committed. Concept design then develops within confirmed constraints. Budget planning is integrated with design decisions so scope and cost stay aligned throughout drawings — not after the first contractor quote comes back over budget." },
      { heading: 'GTA Portfolio', text: "Vitalite has completed custom homes in Willowdale, Cachet Markham, Bullock Markham, Richvale Richmond Hill, Don Valley and Bayview Village. A 4,700 sq ft luxury build in Willowdale is currently under construction. A lot severance in York Toronto delivering two semi-detached homes is scheduled for 2026." },
      { heading: 'From Construction to Closeout', text: "During construction, Vitalite manages framing, mechanical, electrical, plumbing, insulation, finish trades, exterior work, municipal inspections and client communication. PDI is conducted before occupancy. Warranty items are tracked and resolved, not left open." },
    ],
    steps: ['Zoning review and site feasibility', 'Concept design and budget planning', 'Permit drawings, engineering and approvals', 'Trade procurement and pre-construction', 'Construction, inspections and quality control', 'PDI, closeout and warranty support'],
    faqs: [
      { question: "How long does a GTA custom home take from first meeting to occupancy?", answer: "Design and approvals typically take six to twelve months depending on zoning complexity and permit queue times. Construction adds another twelve to twenty months for a full custom build. The total from first consultation to occupancy is commonly two to three years." },
      { question: "What does a custom home cost in the GTA?", answer: "Construction costs start at approximately $400 to $500 per square foot for standard finish levels and can exceed $700 per square foot for luxury specifications. Land cost, design fees, permits and taxes are separate. Vitalite provides budget guidance at first consultation." },
      { question: "Does Vitalite handle the entire project or just construction?", answer: "Vitalite can engage at any stage — from pre-design feasibility through full design-build delivery or construction management only. The scope is defined at first consultation based on where the project is and what the owner needs." },
    ],
    relatedLinks: [
      { label: 'Custom home projects portfolio', key: 'work-custom-homes' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Why design-build?', key: 'why-design-build' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-apartment-renovations': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Apartment Renovations',
    subtitle: "Apartment renovation planned around building rules, elevator windows and neighbour impact.",
    image: PLACEHOLDER_IMAGE,
    intro: "Renovating a Toronto apartment is not like renovating a house. The building has rules about working hours, elevator access, waste disposal, contractor insurance and noise. The strata below cares about your plumbing work. The property manager needs documentation before anyone enters a mechanical room. These constraints need to be planned for, not discovered during construction.",
    answer: "Vitalite coordinates Toronto apartment renovations — managing board and property manager approval, design, material selection, trade coordination and site management within the constraints of the building environment.",
    bullets: ['Board and property management coordination', 'Interior design and space planning', 'Material selection and procurement', 'Trade coordination within building rules'],
    sections: [
      { heading: 'Approval Before Construction', text: "Building management needs to know who is coming, what they will do, when they will do it, how waste will be removed and what happens if something goes wrong. Vitalite prepares the package so the property manager has everything needed to give access approval on the first submission." },
      { heading: 'Sequencing Around Building Access', text: "Elevator availability is often the binding constraint on an apartment renovation schedule. Vitalite sequences material delivery, waste removal and trade access around booked elevator windows — preventing the common problem of materials stranded in the lobby or trades waiting to unload." },
      { heading: 'Scope Examples', text: "Full apartment gut renovations, kitchen and bathroom rebuilds, flooring replacement, lighting and electrical upgrades, millwork installation and finish upgrades. Some projects include layout changes that require building code review and a building permit." },
      { heading: 'Communication with Neighbours', text: "Renovation noise in an apartment building affects people on shared walls, above and below. Vitalite follows building working hours, uses dust barriers, coordinates noisy work to minimize cumulative disruption and communicates transparently with building management throughout." },
    ],
    faqs: [
      { question: "Do apartment renovations require a building permit?", answer: "It depends on the scope. Cosmetic work — new finishes, cabinetry, lighting — generally does not. Structural changes, plumbing relocations, electrical panel upgrades and HVAC modifications typically do. Vitalite confirms permit requirements at the start of the project." },
      { question: "What does the condo board approval process involve?", answer: "Boards typically require contractor insurance certificates, a scope description, a schedule, noise management notes, elevator booking confirmation and a damage deposit. Vitalite prepares and submits this package on behalf of the owner." },
      { question: "How long does an apartment renovation take?", answer: "A kitchen and bath renovation typically takes four to eight weeks of active construction. A full gut renovation of a two-bedroom apartment commonly takes eight to sixteen weeks. Board approval and material lead times add time before construction can begin." },
    ],
    relatedLinks: [
      { label: 'Condo renovations', key: 'service-condo-renovations' },
      { label: 'Building and board approvals', key: 'service-building-board-approvals' },
      { label: 'Interior design', key: 'service-interior-design' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-townhouse-renovations': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Townhouse & Semi-Detached Renovations',
    subtitle: "Tight Toronto lots, shared walls and permit-sensitive changes — managed from the start.",
    image: PLACEHOLDER_IMAGE,
    intro: "Toronto townhouses and semi-detached homes concentrate several construction challenges in one property type: limited side access, party walls that require careful structural and acoustic management, foundation types not always known until demolition starts, and tight footprints where every square foot of addition matters for zoning compliance. Vitalite plans townhouse renovations with these site realities built into the design and construction approach from day one.",
    answer: "Vitalite manages townhouse and semi-detached renovations in Toronto — handling structural review, permit coordination, party wall engineering and construction sequencing for tight-site, permit-sensitive projects.",
    bullets: ['Structural review and engineering coordination', 'Party wall and neighbour considerations', 'Permit applications and inspections', 'Tight-site construction management'],
    sections: [
      { heading: 'Party Wall Considerations', text: "Structural work near a shared wall requires careful engineering — the neighbour's building is attached, and their foundation and structure are affected by what happens on your side. Vitalite coordinates structural engineering that accounts for the party wall conditions before construction begins, not after demolition reveals them." },
      { heading: 'Rear Extensions and Additions', text: "Many Toronto townhouse owners extend at the rear to add kitchen space, a family room or a bedroom. Rear extensions require zoning confirmation of setbacks, a building permit, structural drawings and construction sequencing that maintains a weathertight building throughout." },
      { heading: 'Basement Walk-outs and Underpinning', text: "Creating a basement entrance or a legal basement suite in a Toronto townhouse often requires underpinning, waterproofing and structural coordination. These are high-consequence scopes where the engineering review must precede the design commitment — not follow it." },
      { heading: 'Working in an Occupied Home', text: "Most townhouse renovation clients stay in their homes during construction. Vitalite phases work to minimize disruption — maintaining functional kitchen, bathroom and sleeping areas through the build, and sequencing noisy or dusty work to minimize impact on daily life." },
    ],
    faqs: [
      { question: "Do I need my neighbour's permission to renovate a semi-detached home?", answer: "For structural work affecting the shared wall, you are required to give your neighbour formal notice under Ontario's Party Wall Act. For work that does not affect the party wall, neighbour permission is not legally required — though Vitalite recommends proactive communication as a matter of good practice." },
      { question: "What permits are required for a Toronto townhouse renovation?", answer: "Structural changes, additions, basement alterations, plumbing relocations and HVAC modifications all require building permits. Vitalite confirms permit requirements and prepares the complete application." },
      { question: "Can I add a second floor to my Toronto townhouse?", answer: "It depends on zoning height limits, existing structure and your lot type. Vitalite reviews the feasibility — zoning, structural capacity and budget implications — before any design commitment is made." },
    ],
    relatedLinks: [
      { label: 'Home additions and major renovations', key: 'service-home-additions' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Full-gut renovations', key: 'service-gut-renovations' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-condo-renovations': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Condo Renovations',
    subtitle: "Condo renovation coordinated with the board, the building and the neighbours — not just the design.",
    image: PLACEHOLDER_IMAGE,
    intro: "Condo renovation in Toronto has an approval layer that house renovations do not. The condo board controls access, working hours, noise restrictions, elevator scheduling and what contractor documentation the building requires. Skip that layer and the renovation stops before it starts. Vitalite handles condo renovations from board approval through construction completion — making the approval process part of the project plan, not an afterthought.",
    answer: "Vitalite delivers Toronto condo renovations under a managed process: board package preparation, design coordination, material selection, trade management and construction within the building's rules and access constraints.",
    bullets: ['Board and property management approval', 'Interior design and rendering', 'Material selection and procurement', 'Trade coordination within building access rules'],
    sections: [
      { heading: 'Board Package Preparation', text: "Condo boards want to know who is doing the work, what is being done, when it will happen, how noise and dust will be managed, what insurance is in place and what happens if something goes wrong. A complete submission gets approved. An incomplete one gets rejected and rescheduled. Vitalite prepares complete packages." },
      { heading: 'Design Within Condo Constraints', text: "Condos often have restrictions on plumbing penetration through the slab, flooring types (acoustic requirements), HVAC modifications and what can be changed within the unit envelope. Vitalite reviews the condo declaration and rules before design is finalized so the scope does not conflict with building restrictions." },
      { heading: 'Scope Examples', text: "Full unit gut renovations, kitchen and bathroom rebuilds, flooring replacement, built-in millwork, lighting and electrical upgrades, paint and finish work. Some larger scopes include layout changes that require a building permit." },
      { heading: 'Construction Coordination', text: "Trade access, elevator booking, delivery windows, waste removal and noise management are all sequenced by Vitalite around the building's rules and the board's approval conditions. Owners are not left to manage those logistics independently." },
    ],
    faqs: [
      { question: "How long does condo board approval take?", answer: "Most condo boards respond within two to four weeks of a complete submission. Incomplete submissions are returned and require resubmission, adding two to four more weeks. Vitalite prepares complete packages to avoid this delay." },
      { question: "What if the condo board restricts certain renovation work?", answer: "Condo boards can restrict what can be altered within the unit. Vitalite reviews the condo declaration and rules before design begins — so the scope is designed to comply, not revised after an approval rejection." },
      { question: "Can I renovate a condo I own as an investment property?", answer: "Yes. The board approval process is the same whether the unit is owner-occupied or tenanted. If the unit is occupied during renovation, phasing and access coordination become more complex — Vitalite plans for both scenarios." },
    ],
    relatedLinks: [
      { label: 'Apartment renovations', key: 'service-apartment-renovations' },
      { label: 'Building and board approvals', key: 'service-building-board-approvals' },
      { label: 'Interior design', key: 'service-interior-design' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-heritage-renovations': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Heritage & Older Home Renovations',
    subtitle: "Older GTA homes renovated without sacrificing structure, character or the building permit.",
    image: PLACEHOLDER_IMAGE,
    intro: "Renovating an older Toronto or GTA home is different from renovating a recently built house. The structure may be knob-and-tube wiring, balloon framing or a foundation type that predates modern code standards. Heritage guidelines may restrict what the exterior can show. And the surprises — asbestos, lead paint, deteriorated sill plates, undersized beams — are not visible until demolition starts. Vitalite plans older-home renovations with the inspection, structural review and contingency planning these buildings require.",
    answer: "Vitalite manages heritage and older-home renovations in the GTA — with existing-condition review, structural and code coordination, careful material planning and construction management that respects the building's character while meeting current standards.",
    bullets: ['Existing-condition and structural review', 'Heritage and conservation guideline compliance', 'Code upgrade coordination', 'Construction management for older buildings'],
    sections: [
      { heading: 'What Old Homes Hide', text: "A 1920s Toronto home may have vermiculite insulation in the attic, knob-and-tube wiring in the walls and a foundation built of rubble stone or plain concrete that was never designed for vertical loads. Identifying these conditions early — through a pre-renovation assessment — lets the budget, scope and drawings account for them before construction reveals them at full trade cost." },
      { heading: 'Heritage Designations and Conservation Guidelines', text: "Some Toronto properties are individually designated or within a Heritage Conservation District. Designation restricts exterior alterations — windows, cladding, doors, roofline — but typically allows interior renovation freedom. Vitalite identifies heritage status early and plans the exterior scope to comply with the applicable guidelines." },
      { heading: 'Code Upgrades', text: "Renovating a significant portion of an older home often triggers requirements to upgrade electrical service, add smoke and CO detectors, improve egress, insulate to current standards and address other code deficiencies. Vitalite identifies these requirements at the design stage and incorporates them into the scope and budget — not as surprises during construction." },
      { heading: 'Material and Finish Sensitivity', text: "Older homes often have character elements — original hardwood floors, plaster ceilings, millwork profiles, brick or stone — that owners want to preserve. Vitalite plans around those elements: protecting them during demolition, repairing rather than replacing where possible and matching new finishes to the existing character." },
    ],
    faqs: [
      { question: "What is a pre-renovation assessment?", answer: "A structured site review before drawings begin, identifying existing structure, systems, hazardous materials, code deficiencies and heritage constraints. It informs the budget, permit strategy and construction approach before design costs are committed — and prevents expensive surprises during construction." },
      { question: "What if asbestos or lead paint is discovered during renovation?", answer: "Vitalite works with licensed abatement contractors to manage hazardous materials according to Ontario regulations. Discovery during construction triggers a scope change; pre-renovation assessment reduces the likelihood of surprises." },
      { question: "Can I significantly modify the interior of a heritage-designated home?", answer: "Interior modifications are generally unrestricted by heritage designation — the protection applies primarily to the exterior character-defining elements. Vitalite confirms what the specific designation covers before design begins." },
    ],
    relatedLinks: [
      { label: 'Full-gut renovations', key: 'service-gut-renovations' },
      { label: 'Home additions and major renovations', key: 'service-home-additions' },
      { label: 'Our Work portfolio', key: 'our-work' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-loft-renovations': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Loft & Open-Concept Renovations',
    subtitle: "Open-plan space that works structurally, mechanically and visually — not just in the rendering.",
    image: PLACEHOLDER_IMAGE,
    intro: "Loft conversions and open-concept renovations look straightforward on a floor plan: remove a wall, open the ceiling, expose the structure. In practice, that wall may be load-bearing. The ceiling may contain mechanical or electrical systems that need rerouting. The exposed beam may need engineering review before it can be left visible. Vitalite coordinates loft and open-concept renovations so the structural, mechanical and architectural details work together before any demolition begins.",
    answer: "Vitalite manages loft and open-concept renovations — handling structural engineering for load-bearing changes, mechanical rerouting, interior design coordination and construction management for the trades involved.",
    bullets: ['Structural review and load-bearing analysis', 'Mechanical rerouting coordination', 'Interior design and finish direction', 'Construction management and quality control'],
    sections: [
      { heading: 'Load-Bearing Walls', text: "In Toronto residential buildings, walls running perpendicular to the floor joists are often load-bearing. Removing them without a proper beam and post support creates a structural failure risk. Vitalite identifies load-bearing conditions before demolition begins and coordinates structural engineering for all modifications — not after the wall is already down." },
      { heading: 'Mechanical and Electrical in the Ceiling', text: "Exposing joists or adding a vaulted ceiling can reveal ductwork, plumbing lines, electrical runs and fire suppression piping that need to be rerouted or concealed differently. Vitalite identifies these systems before the ceiling comes down — so rerouting is planned, not improvised on site." },
      { heading: 'Design Coherence', text: "Open-plan spaces require more deliberate lighting design, acoustic planning and material consistency than compartmentalized rooms. Vitalite coordinates the interior design elements — layout, materials, lighting, storage — as part of the project scope, not as afterthoughts once the structure is exposed." },
      { heading: 'Common Project Types', text: "Open-concept kitchen and living renovations, loft conversions in older Toronto homes and commercial buildings, mezzanine additions, exposed-structure feature rooms and full-gut open-plan reconfiguration of residential or commercial spaces." },
    ],
    faqs: [
      { question: "Do I need a permit to remove a wall in my Toronto home?", answer: "If the wall is load-bearing, a building permit is required. If it is non-load-bearing and the work does not affect plumbing, electrical panels or HVAC distribution, a permit is often not required. Vitalite confirms permit requirements before any work is planned." },
      { question: "How do I know if a wall is load-bearing?", answer: "Wall orientation relative to floor joists, position in the building plan and presence of posts or columns in the basement below are indicators. Vitalite conducts a structural assessment to confirm before any demolition is planned." },
      { question: "What does a loft or open-concept renovation cost in the GTA?", answer: "Cost depends heavily on what is found above the ceiling and inside the walls once demolition begins. A realistic budget range for a full open-concept kitchen and living renovation in a Toronto home is $150,000 to $300,000 depending on size, structural complexity and finish level." },
    ],
    relatedLinks: [
      { label: 'Full-gut renovations', key: 'service-gut-renovations' },
      { label: 'Interior design', key: 'service-interior-design' },
      { label: 'Architectural services', key: 'service-architectural-services' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-gut-renovations': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Full-Gut Renovations',
    subtitle: "A complete interior rebuild — taken back to structure and rebuilt to current standard.",
    image: PLACEHOLDER_IMAGE,
    intro: "A gut renovation is the most comprehensive renovation option: everything non-structural comes out, systems are replaced, the floor plan is reconsidered and the interior is rebuilt from scratch. It is the approach that makes sense when a home's layout, systems, finishes and structure have all degraded past the point where patching extends the useful life. Vitalite manages gut renovations as a full project delivery — with design, approvals, engineering, trade coordination and quality control from demolition through close-out.",
    answer: "Vitalite coordinates full-gut renovations in the GTA — from scope definition and permit drawings through demolition, system replacement, trade sequencing and final delivery — with one team accountable for the entire rebuild.",
    bullets: ['Full scope definition and budget planning', 'Permit and engineering coordination', 'Demolition, structural review and systems replacement', 'Trade sequencing, quality control and closeout'],
    sections: [
      { heading: 'When a Gut Renovation Makes Sense', text: "When a home has outdated electrical, failing plumbing, inadequate insulation, an inflexible floor plan, deferred maintenance across multiple systems and a finish package that needs complete replacement, individual repairs cost more over time than a planned gut renovation that addresses everything in one coordinated sequence." },
      { heading: 'Scope That Cannot Be Known Until Demolition', text: "Gut renovations reveal conditions that no inspection could detect: framing issues behind walls, water damage behind finishes, undersized beams, incorrect previous repairs and hazardous materials. Vitalite builds contingency into the budget and scope, and manages discoveries without derailing the project." },
      { heading: 'The Permit Strategy', text: "A full gut renovation typically requires a building permit covering structural changes, electrical upgrade, plumbing modifications and energy code compliance. Vitalite prepares the permit package and coordinates engineer sign-offs before demolition begins — so the permit is in hand before trades start." },
      { heading: 'Living Arrangements', text: "Most gut renovation clients relocate during construction — the project is invasive enough that staying in the home is not practical. Vitalite sets a realistic construction schedule at the start so clients can plan their living arrangements without surprises mid-project." },
    ],
    steps: ['Existing-condition assessment and scope definition', 'Design direction and budget planning', 'Permit strategy and engineering coordination', 'Demolition and structural review', 'Systems installation and rough-in', 'Finish trades, quality control and PDI'],
    faqs: [
      { question: "How long does a gut renovation take?", answer: "A full gut renovation of a typical GTA detached home takes six to twelve months from permit approval to occupancy, depending on size, scope and finish level. Design and permit preparation typically add two to four months before construction begins." },
      { question: "How much does a gut renovation cost in the GTA?", answer: "A gut renovation of a standard Toronto detached home typically costs between $400,000 and $800,000 depending on the scope of structural changes, systems replacement and finish specification. Vitalite provides a detailed budget breakdown after scope is defined." },
      { question: "Can Vitalite manage a gut renovation of a property I plan to sell after?", answer: "Yes. Vitalite can scope and deliver a renovation optimized for resale value — finish level, layout appeal and system upgrades that maximize market value within the renovation budget." },
    ],
    relatedLinks: [
      { label: 'Home additions and major renovations', key: 'service-home-additions' },
      { label: 'Loft and open-concept renovations', key: 'service-loft-renovations' },
      { label: 'Project and construction management', key: 'service-project-management' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-multiplex': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Multi-Unit & Multiplex Construction',
    subtitle: "Multi-unit residential built to zoning, code and rental market realities.",
    image: PLACEHOLDER_IMAGE,
    intro: "Toronto zoning changes have made multiplex conversions and new multi-unit residential builds more viable than at any point in recent history. But viable is not the same as straightforward. Zoning interpretation, site feasibility, building code compliance for separate units, fire separation, parking requirements, utility servicing and permit coordination make multiplex projects among the most technically complex residential work in the city. Vitalite plans and builds multiplex housing with the coordination these projects require.",
    answer: "Vitalite manages GTA multiplex projects from zoning feasibility and design through permit drawings, building code review, construction and occupancy — for investors, developers and homeowners increasing rental density on existing lots.",
    bullets: ['Zoning and site feasibility review', 'Multi-unit architectural and engineering coordination', 'Permit applications and building code compliance', 'Construction management and occupancy planning'],
    sections: [
      { heading: 'What Changed in GTA Zoning', text: "As of recent bylaw changes, many Toronto residential lots can now support up to four units as of right — meaning without a Committee of Adjustment hearing. Garden suites and laneway houses add further density potential on qualifying properties. Understanding which configuration a specific lot supports, and under what conditions, is the starting point for any multiplex project." },
      { heading: 'Building Code Complexity', text: "Multi-unit residential has stricter fire separation, exit, ventilation, plumbing and accessibility requirements than single-family homes. A building code review that misses a required fire rating or exit separation can send a project back through permitting. Vitalite coordinates these requirements into the drawings before submission." },
      { heading: 'Investor Value', text: "The goal of a multiplex project is a compliant, durable and rentable building. Vitalite plans units around rental market realities — layout efficiency, acoustic performance, mechanical access, exterior durability and operating cost — not just construction cost." },
      { heading: 'Active Projects', text: "Vitalite is currently delivering a multi-unit build with integrated laneway suite in Lansdowne Toronto. A five-rental-unit vertical addition over a mixed-use building in Bedford Park is scheduled for 2026. Both projects were zoning-reviewed before design commitments were made." },
    ],
    steps: ['Zoning feasibility and site review', 'Unit mix and massing concept', 'Building code and fire separation review', 'Permit drawings and engineering coordination', 'Municipal submissions and comment response', 'Construction, inspections and occupancy'],
    faqs: [
      { question: "How many units can I build on my Toronto lot?", answer: "Recent bylaw changes allow up to four units as of right on many residential lots, plus a garden suite or laneway house on qualifying properties. The actual number depends on lot size, zoning category, setbacks, parking requirements and existing structure. Vitalite confirms what is achievable for a specific property at first consultation." },
      { question: "Is a Committee of Adjustment required for a multiplex?", answer: "Not always. Many multiplex configurations now comply as of right under updated zoning. If the proposed building requires variances — setbacks, height, lot coverage — a CoA application is necessary. Vitalite assesses the zoning position at the start of the project." },
      { question: "What is the construction timeline for a Toronto multiplex?", answer: "Permits for a four-unit multiplex typically take six to twelve months to obtain depending on complexity. Construction adds another eight to fourteen months. Total from feasibility to occupancy is commonly eighteen to thirty months." },
    ],
    relatedLinks: [
      { label: 'Multiplex projects portfolio', key: 'work-multiplex' },
      { label: 'Garden suites and laneway houses', key: 'service-garden-suites' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-garden-suites': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Garden Suites & Laneway Houses',
    subtitle: "A separate structure on your existing lot — for rental income, a family member, or long-term flexibility.",
    image: PLACEHOLDER_IMAGE,
    intro: "Garden suites, laneway houses and coach houses are standalone dwelling units built on an existing residential lot. They do not require selling the property, applying for a subdivision or major zoning approval in most GTA municipalities. They do require a careful look at lot dimensions, setbacks, site access, servicing, grading and the specific zoning rules that govern secondary suites — before any design work begins.",
    answer: "Vitalite designs, permits and builds garden suites and laneway houses as fully independent dwelling units — handling zoning review, concept design, permit drawings, construction and site coordination from start to finish.",
    bullets: ['Garden suites and laneway houses', 'Zoning and site feasibility review', 'Permit drawings and servicing coordination', 'Construction and site management'],
    sections: [
      { heading: 'What Makes a Good Garden Suite Site', text: "Lot depth and width determine what can fit. Rear lane access affects laneway house viability. Existing servicing affects connection costs. Tree positions affect what the building footprint can be. Vitalite reviews these site factors before design work starts — so the concept is grounded in what the lot can actually support." },
      { heading: 'What These Projects Add', text: "A garden suite or laneway house can add $800 to $2,000 per month in rental income potential, provide independent space for a family member without a separate property purchase, and increase long-term property value. The capital cost depends on size, specification and site conditions — Vitalite provides realistic budget guidance at first consultation." },
      { heading: 'Approval and Permit Coordination', text: "Garden suites require building permits and coordination with municipal servicing, grading, structural and mechanical engineers. Some properties near ravines or with heritage designation require additional review. Vitalite coordinates all required consultants and submissions." },
      { heading: 'Construction and Site Logistics', text: "Building a structure at the rear of an occupied property requires careful staging — crane access, material delivery, utility protection and construction noise management. Vitalite plans these logistics before the permit is issued, not after the excavator arrives." },
    ],
    faqs: [
      { question: "Can I build a garden suite in the backyard of my Toronto home?", answer: "Most residential lots in Toronto can now support a garden suite under updated zoning rules. Eligibility depends on lot size, setbacks, existing structure and any site-specific constraints. Vitalite confirms eligibility at first consultation." },
      { question: "How much does a garden suite cost to build in the GTA?", answer: "A finished garden suite typically costs between $350,000 and $600,000 depending on size, specification and site conditions. Servicing connections, grading and engineering are project-specific. Vitalite provides a budget range at first consultation before design costs are committed." },
      { question: "How long does the permit and construction process take?", answer: "From first consultation to occupancy, most garden suite projects take fourteen to twenty-two months. Permit approval typically takes four to eight months depending on site complexity and municipality. Construction adds another four to eight months." },
    ],
    relatedLinks: [
      { label: 'Garden suite projects portfolio', key: 'work-garden-suites' },
      { label: 'Multi-unit and multiplex construction', key: 'service-multiplex' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-home-additions': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Home Additions & Major Renovations',
    subtitle: "More space without moving — if the structure, zoning and budget can support it.",
    image: PLACEHOLDER_IMAGE,
    intro: "A home addition sounds simple: add a room at the back, add a floor on top. In practice, additions involve structural review of the existing foundation and framing, zoning confirmation of setbacks and height limits, permit drawings with engineering coordination, and a construction sequence that keeps the existing home livable through the build. Vitalite manages home additions with the same coordination as a custom home project — because the complexity is often comparable.",
    answer: "Vitalite plans, permits and builds GTA home additions — rear additions, side additions, second-storey additions and structural alterations — with integrated design, engineering, permit and construction management.",
    bullets: ['Rear and side additions', 'Second-storey and vertical expansions', 'Structural alteration and reconfiguration', 'Permit drawings, engineering and inspections'],
    sections: [
      { heading: 'What to Confirm Before Designing', text: "Setbacks determine how close to the lot line the addition can go. Lot coverage limits how much of the lot can be covered by structure. Building height rules affect second-storey viability. The existing foundation type affects what loads can be added above. These are not details to discover after drawings are complete — they define what the addition can be." },
      { heading: 'Structural Coordination', text: "Additions that add a floor, open up a rear wall or carry new loads to the foundation require structural engineering. Vitalite coordinates the structural engineer from concept design — so the engineering shapes the drawings, not the other way around. That sequencing prevents expensive structural revisions late in the drawing process." },
      { heading: 'Active Examples', text: "Vitalite is currently delivering a single-storey addition in Preston Lake Stouffville and a major vertical side-split expansion in Erindale Mississauga. Completed additions include a cathedral ceiling conversion with walkup in Stouffville and a 5,200 sq ft whole-home expansion in Willowdale." },
      { heading: 'Living Through Construction', text: "Many addition clients remain in their homes during construction. Vitalite sequences work to maintain habitability — weathertight connection points, temporary protection of existing systems and clear phasing between the existing structure and new work. The schedule impact on daily life is discussed at project start, not discovered during construction." },
    ],
    steps: ['Zoning check and site feasibility', 'Structural assessment of existing building', 'Concept design and budget planning', 'Permit drawings and engineering coordination', 'Construction, phasing and inspections', 'Completion, PDI and closeout'],
    faqs: [
      { question: "How do I know if my lot can support an addition?", answer: "Vitalite reviews zoning setbacks, lot coverage, height limits and foundation capacity at first consultation. This confirms what the lot and existing structure can accommodate before design costs are committed." },
      { question: "Is a building permit required for a home addition?", answer: "Yes. Any structural addition to a home requires a building permit. This includes rear additions, second-storey additions and significant interior structural changes." },
      { question: "How much does a home addition cost in the GTA?", answer: "Construction costs for additions typically range from $350 to $550 per square foot depending on finish level, structural complexity and site conditions. A second-storey addition tends to cost more per square foot than a single-storey rear addition due to structural requirements." },
    ],
    relatedLinks: [
      { label: 'Additions portfolio', key: 'work-additions' },
      { label: 'Custom home design and build', key: 'service-custom-homes' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-drawings-permits': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Drawings, Permits & Engineering',
    subtitle: "Permit drawings that pass on the first submission — and engineering that does not hold up the build.",
    image: PLACEHOLDER_IMAGE,
    intro: "A permit drawing package is not just design drawings with a stamp on them. It is a specific document set organized per Toronto Building's requirements, with zoning data sheets, code compliance notes, applicable engineer references and the right scope definition for the approval path being taken. Packages that miss required content get returned — adding weeks to a project that cannot move forward without the permit. Vitalite prepares complete permit packages for GTA residential and ICI projects.",
    answer: "Vitalite prepares and coordinates architectural drawings, structural engineering, zoning review, HVAC references and building permit applications for GTA residential and commercial projects — so approvals move forward without rework.",
    bullets: ['Architectural permit drawing packages', 'Zoning and bylaw compliance review', 'Structural and HVAC engineering coordination', 'Municipal permit applications and comment response'],
    sections: [
      { heading: 'What a Complete Permit Package Includes', text: "The specific requirements depend on project type and municipality, but typically include: architectural drawings with zoning compliance data, a site plan, floor plans, elevations, sections, a code compliance matrix, structural drawings where applicable, an HVAC summary and a completed permit application form with the correct fee. Missing any element gets the package returned." },
      { heading: 'Common Reasons Permits Get Returned', text: "Missing zoning data, incorrect setback dimensions on the site plan, no structural notes for load-bearing changes, missing engineer sign-off where required, and permit applications submitted to the wrong department are the most common return reasons. Vitalite reviews packages against municipal requirements before submission." },
      { heading: 'Engineering Coordination', text: "Structural engineering for custom homes, additions and multiplexes runs in parallel with architectural drawing development. Vitalite manages the coordination between architect and engineer so their documents reference each other correctly — avoiding the common problem of architectural drawings that contradict the structural drawings, which causes rejection." },
      { heading: 'Municipal Comment Response', text: "When the permit reviewer issues comments, the response needs to be specific, accurate and submitted quickly. Slow or incomplete responses extend the approval timeline. Vitalite manages comment rounds so the owner is not navigating the municipal process independently on a technical file." },
    ],
    steps: ['Zoning review and permit strategy', 'Architectural drawing coordination', 'Structural and mechanical engineering', 'Drawing package compilation and review', 'Municipal submission', 'Comment response and permit issuance'],
    faqs: [
      { question: "How long does a Toronto building permit take?", answer: "Small residential projects can be approved in two to six weeks. Custom homes, additions and multiplex projects typically take three to six months depending on completeness of the submission and permit queue volumes. Projects requiring a Committee of Adjustment approval add several months before the permit application can even be submitted." },
      { question: "What if the permit application is rejected?", answer: "Rejected applications receive a letter identifying the deficiency. Vitalite prepares a corrected submission and resubmits. The goal is to prevent rejection through complete first submissions — but when comments come, we respond quickly." },
      { question: "Can Vitalite coordinate permits for a project where someone else did the drawings?", answer: "Yes. Vitalite can review existing drawings for permit readiness, identify missing items, coordinate engineering sign-off and manage the submission and comment process." },
    ],
    relatedLinks: [
      { label: 'Architectural services', key: 'service-architectural-services' },
      { label: 'Building and board approvals', key: 'service-building-board-approvals' },
      { label: 'Construction and site management', key: 'service-construction-site-management' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-project-management': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Project & Construction Management',
    subtitle: "Budget, schedule and trade accountability when the project is too complex to manage informally.",
    image: PLACEHOLDER_IMAGE,
    intro: "Project management in construction is not overhead — it is the difference between a project that delivers what it promised and one that discovers its gaps in the field. For GTA residential and ICI projects above a certain complexity — multiple trades, long schedules, owner-funded procurement, permit sequencing, structural coordination — informal site visits and weekly calls are not sufficient management. Vitalite provides construction project management as a professional service: structured reporting, trade accountability, budget tracking and decision support.",
    answer: "Vitalite manages GTA construction projects end to end — schedules, sub-trade contracts, quality control, inspections, budget tracking and client communication — as the accountable project management layer between the owner and the construction process.",
    bullets: ['Schedule and trade sequencing', 'Budget tracking and change control', 'Quality control and inspection management', 'Client reporting and decision support'],
    sections: [
      { heading: 'What Gets Managed', text: "Every trade engagement, every procurement decision, every inspection, every scope change, every schedule adjustment and every quality check generates a decision or a record. Vitalite tracks those decisions so the project does not drift without the owner's knowledge. Undocumented changes become disputes; documented changes become managed decisions." },
      { heading: 'Budget Control', text: "The most common construction budget failure is undisclosed scope growth: small changes that each seem minor but collectively add 15% to the project cost by the end. Vitalite tracks every change against the approved budget and obtains owner approval before changes are incorporated into the scope." },
      { heading: 'Trade Accountability', text: "Sub-trades need clear scope, complete drawings, confirmed schedules and someone to answer their questions in real time. Vitalite provides that function so trades can focus on their work rather than waiting for direction. Trades who have a single point of contact perform more reliably than trades who have to manage the owner directly." },
      { heading: 'When Project Management Is Separate from Construction', text: "Some owners use a separate project manager and general contractor. Some GTA owners hire Vitalite as construction manager with full transparency into trade costs. Vitalite advises on the right delivery model at first consultation — and will say clearly when a simpler arrangement would serve the project better." },
    ],
    steps: ['Scope review and project planning', 'Sub-trade procurement and contracts', 'Pre-construction coordination', 'Construction management and trade sequencing', 'Budget tracking and change control', 'Closeout, PDI and warranty support'],
    faqs: [
      { question: "What is the difference between project management and general contracting?", answer: "A general contractor takes the contract with the owner, subcontracts trades and carries risk and markup. A project manager coordinates and manages on the owner's behalf — typically with greater cost transparency. Vitalite can work in either capacity." },
      { question: "How does Vitalite charge for project management services?", answer: "Project management fees are typically structured as a percentage of construction cost or a fixed fee based on scope and duration. Fee structure is discussed openly at first consultation." },
      { question: "What reporting does Vitalite provide?", answer: "Regular progress reports covering schedule status, budget tracking, upcoming decisions, completed inspections and open issues. Reporting frequency and format are agreed at project start." },
    ],
    relatedLinks: [
      { label: 'Construction and site management', key: 'service-construction-site-management' },
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
      { label: 'Why design-build?', key: 'why-design-build' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'service-ici-construction': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Industrial, Commercial & Institutional Construction',
    subtitle: "Commercial and institutional construction that stays on schedule and keeps the building operational.",
    image: PLACEHOLDER_IMAGE,
    intro: "ICI construction in the GTA operates under different constraints than residential work: tighter operational windows, more complex permit categories, higher insurance requirements and clients whose business continuity depends on the project finishing on time. Vitalite brings the same disciplined planning and coordination it uses for residential design-build to commercial, industrial and institutional scopes — with the added attention to operational sequencing, occupancy compliance and building communication that occupied facilities require.",
    answer: "Vitalite delivers ICI construction services — warehouses, offices, retail build-outs and institutional facilities — under a design-build or construction management model focused on compliance, schedule control and operational continuity.",
    bullets: ['Warehouse and light industrial', 'Office and retail build-outs', 'Institutional facility improvements', 'Compliance, permitting and operations continuity'],
    sections: [
      { heading: 'What ICI Clients Need', text: "Commercial and institutional clients need accurate scopes, firm schedules, clear communication about site impact and construction choices that account for how the building will be used — not just how it will look. Vitalite plans ICI projects around those operational realities from the first feasibility discussion, not after the contract is signed." },
      { heading: 'Permitting for Commercial Spaces', text: "Commercial permits in Ontario require building permit applications, fire code compliance, mechanical and electrical coordination and often an occupancy plan or change-of-use documentation. Vitalite coordinates the permit package so approvals do not delay the start of a lease-sensitive or operationally-urgent project." },
      { heading: 'Construction in Occupied Buildings', text: "Some ICI work happens in buildings that remain in operation. Vitalite phases and sequences construction work around occupied areas, manages dust and noise, maintains emergency exits and communicates clearly with building management — so tenants and staff are not surprised by construction impacts." },
      { heading: 'Tenant and Owner Communication', text: "Whether the client is a landlord managing tenant improvements or an owner commissioning their own facility, Vitalite provides clear progress reporting, change control and inspection coordination throughout the construction process. ICI clients should not have to chase for project status." },
    ],
    steps: ['Scope definition and permit strategy', 'Design coordination and budget planning', 'Permit submission and approval', 'Pre-construction trade coordination', 'Construction management and site sequencing', 'Inspections, occupancy and closeout'],
    faqs: [
      { question: "What types of ICI projects does Vitalite take on?", answer: "Warehouse and light industrial interiors, office and retail build-outs, medical office fit-outs, institutional facility improvements and mixed-use commercial construction. Project size typically ranges from tenant improvement scopes to full building construction." },
      { question: "Can Vitalite work within a tenant improvement allowance structure?", answer: "Yes. Vitalite can work within a defined tenant improvement budget provided by a landlord, preparing drawings, managing permits and delivering the construction scope within the committed allowance." },
      { question: "Does Vitalite manage ICI projects outside the GTA?", answer: "Vitalite is primarily focused on the Greater Toronto Area and surrounding municipalities. Project inquiries from outside the primary service area are reviewed case by case." },
    ],
    relatedLinks: [
      { label: 'Project and construction management', key: 'service-project-management' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Construction and site management', key: 'service-construction-site-management' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'why-about-us': {
    parent: 'why-vitalite',
    category: 'WHY VITALITE',
    title: 'About Us',
    subtitle: "Built for GTA projects where drawings, permits and construction need to answer to the same team.",
    image: PLACEHOLDER_IMAGE,
    intro: "Vitalite Construction Corp. started from a straightforward observation: most GTA construction problems are not technical — they are organizational. The drawings go ahead before the budget is real. The permits stall because the engineering was never coordinated. The trades arrive without a clear sequence. Vitalite is structured to solve that. We handle design coordination, permit drawings, engineering, budgeting and construction management as one connected workflow for residential and ICI clients across the Greater Toronto Area.",
    answer: "Vitalite is a GTA design-build and construction management company that keeps drawings, permits, budget and construction under one accountable team. We work with homeowners, investors and commercial clients on projects from 500 sq ft additions to 6,000 sq ft custom homes and multi-unit ICI builds.",
    bullets: ['Design-build general contractor', 'Custom homes, multiplexes and additions', 'Drawings, permits and engineering coordination', 'Project management from first review to warranty'],
    sections: [
      { heading: 'Who We Work With', text: "Our clients own property in Toronto, North York, Markham, Mississauga and the wider GTA. They are planning a custom home rebuild, a multiplex conversion, a garden suite, a significant addition or a major renovation. What they share is a need for one team accountable for the outcome — not separate contractors pointing at each other when something goes wrong." },
      { heading: 'How We Approach a Project', text: "Every engagement starts with an honest feasibility conversation: what the site can support, what approvals it needs, what budget range is realistic and where design decisions actually affect cost. From there, Vitalite coordinates drawings, engineering, permits, budget management, trade scheduling, site supervision, inspections and warranty follow-through." },
      { heading: 'Why the Structure Matters', text: "GTA construction projects fail for predictable reasons: drawings that do not account for site conditions, permits that stall because structural coordination was incomplete, budgets that were never tested against real trade pricing. Vitalite is built around those failure points — not as a selling feature, but because we have seen them sink expensive projects." },
      { heading: 'GTA Realities We Work Around Every Week', text: "Toronto, North York, Markham and surrounding municipalities have their own zoning histories, inspection cultures, lot constraints and committee approval patterns. Vitalite works in these environments continuously. That familiarity reduces the surprises that drive cost overruns on projects managed by teams unfamiliar with the area." },
    ],
    faqs: [
      { question: 'What kinds of projects does Vitalite take on?', answer: "Custom homes, teardown-rebuilds, multiplex conversions, garden suites, laneway houses, additions, major renovations, permit drawing packages and ICI scopes. The common thread is that they all benefit from coordinated design, approvals and construction management." },
      { question: 'Is Vitalite the right fit for a smaller project?', answer: "Vitalite is most effective when a project needs drawings, approvals or trade coordination — even on additions as small as 500 sq ft. If the scope is a straightforward repair or finish upgrade with no permits involved, a local general contractor will likely serve you faster." },
      { question: 'How does Vitalite charge for its services?', answer: "Depending on scope and delivery model, Vitalite can work under a general contracting agreement, a construction management arrangement or a broader design-build contract. The pricing approach is discussed openly at first consultation." },
    ],
    relatedLinks: [
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
      { label: 'Why Design-Build?', key: 'why-design-build' },
      { label: 'Services', key: 'services' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'why-the-vitalite-way': {
    parent: 'why-vitalite',
    category: 'WHY VITALITE',
    title: 'The Vitalite Way',
    subtitle: "A sequence that answers budget, approval and scope questions before construction money gets spent.",
    image: PLACEHOLDER_IMAGE,
    intro: "Most GTA project problems start the same way: a quote is accepted before permit drawings are finished, or engineering scope gets added after the contract is signed, or a zoning issue surfaces mid-construction that a site visit in week two would have caught. The Vitalite Way is a deliberate sequence designed to surface those issues while they are still cheap to solve.",
    answer: "The Vitalite Way moves through consultation, on-site evaluation, concept design, budget review, delivery model selection, permit drawings, building code review, construction, PDI and warranty-oriented aftercare — in an order that reduces avoidable surprises.",
    bullets: [
      'Initial Consultation',
      'On-Site Evaluation',
      'Conceptual Design',
      'Budgetary Plan & Quotation',
      'Contract Agreement',
      'Zoning Review & Permit Drawings',
      'Building Code Review & Permits',
      'Construction, PDI & Warranty',
    ],
    sections: [
      { heading: 'Consultation — Define What You Actually Need', text: "Not every project needs a full design-build engagement. The first conversation identifies whether the scope is clear enough to price, whether permits are required, what budget range is realistic and what delivery model fits. That clarity saves months of misdirected effort." },
      { heading: 'Site and Existing-Condition Review', text: "A site visit before drawings start catches the issues that drawings miss: foundation type, servicing, grading, tree positions, neighbour fencing, access constraints and existing structure that affects cost. These are not surprises you want to discover at framing stage." },
      { heading: 'Concept Design, Budget and Delivery Model', text: "Concept layouts and a budgetary review help owners answer the real question: what scope can this budget actually deliver? Vitalite reviews design intent against real trade pricing before anyone commits to drawings — preventing the common pattern of redesigning after the first tender comes back over budget." },
      { heading: 'Zoning, Permits and Engineering', text: "Permit drawings require zoning compliance, building code review, structural engineering and sometimes HVAC coordination, grading plans or Committee of Adjustment applications. Vitalite coordinates those inputs and responds to municipal comments so the permit file does not stall at a stage where delay means money." },
      { heading: 'Construction, PDI and Closeout', text: "On site, Vitalite manages trade sequencing, procurement timing, inspections, site safety and client updates. PDI is conducted before occupancy. Warranty items are tracked and closed, not left for the owner to chase." },
    ],
    steps: ['Consultation — scope, budget range and project fit', 'On-site review — structure, services, conditions and access', 'Concept design, budget direction and delivery model', 'Drawings, engineering, zoning and permit coordination', 'Construction, PDI, closeout and warranty aftercare'],
    faqs: [
      { question: 'What makes this different from getting a standard quote?', answer: "A standard quote prices a set of drawings. The Vitalite Way questions whether those drawings are right before pricing them — checking zoning, budget assumptions, site conditions and engineering requirements that regularly change the scope." },
      { question: 'Can Vitalite join a project that already has drawings?', answer: "Yes. Vitalite reviews existing drawings for permit readiness, construction practicality and budget implications. Sometimes the drawings are solid; sometimes they need revision before construction starts. Either outcome is useful to know before committing." },
      { question: 'When is the best time to bring Vitalite in?', answer: "Before drawings are finalized and before permit assumptions are locked. Earlier involvement means the decisions that affect cost, schedule and approval are made intentionally, not reactively." },
    ],
    relatedLinks: [
      { label: 'About Vitalite', key: 'why-about-us' },
      { label: 'Construction management', key: 'service-project-management' },
      { label: 'Permit drawings', key: 'service-drawings-permits' },
      { label: 'Start a project review', key: 'contact-us' },
    ],
  },
  'why-design-build': {
    parent: 'why-vitalite',
    category: 'WHY VITALITE',
    title: 'Why Design-Build?',
    subtitle: "What happens when the person drawing the plans and the person building them answer to different clients.",
    image: PLACEHOLDER_IMAGE,
    intro: "In a traditional GTA project, the architect produces drawings, the owner obtains permits, the contractor prices the drawings and the engineer files the structural. Each professional is accountable for their piece. Nobody is accountable for the gaps between them. Design-build does not eliminate those specializations — it connects them under one team that is responsible for the outcome.",
    answer: "Design-build brings design decisions, permit strategy, engineering input and construction budgeting together under one accountable delivery model. For complex GTA projects, it reduces the redesign, repricing and field changes caused by handoff gaps between separate teams.",
    bullets: ['Earlier budget visibility', 'Fewer handoff gaps between design and site', 'Construction input shapes drawings before permits', 'One team accountable for the full outcome'],
    sections: [
      { heading: 'The Problem Design-Build Solves', text: "Permit drawings are complete. The contractor prices them. Then: the soil report adds $40,000 to the foundation, the roof beam triggers a structural engineer revision, and the kitchen layout will not pass building code for the intended use. Each professional did their job correctly. Nobody caught the coordination problem. That is the gap design-build is designed to close." },
      { heading: 'When It Is Most Useful', text: "Custom homes, additions, multiplex conversions, garden suites and older-home renovations benefit most — particularly when zoning is not straightforward, when site conditions are unpredictable or when the budget requires real design tradeoffs. The more moving parts a project has, the more valuable a connected delivery team becomes." },
      { heading: 'What Owners Still Control', text: "Design-build is not about handing over creative direction. Owners make every significant decision: scope, finish level, budget and timeline. The difference is that each decision gets tested against drawings, permit readiness and real construction cost before it is locked — not after the deposit is paid." },
      { heading: 'When Traditional Delivery Still Works', text: "For landmark projects or owners who want deep design involvement with a specific architect, a traditional model can be effective. Vitalite can also work alongside an existing architect in a construction management role. The right delivery model depends on the project — and we will say so honestly at first consultation." },
    ],
    steps: ['Confirm scope flexibility and existing constraints', 'Review zoning, building code and engineering risk', 'Bring construction budget into design decisions early', 'Coordinate permit drawings with trade and engineering input', 'Proceed to construction with defined scope and accountability'],
    faqs: [
      { question: 'Is design-build more expensive than hiring an architect first?', answer: "Not inherently. The integrated process can reduce redesign costs, permit delays and field changes that accumulate in traditional delivery. Whether it saves money depends on project type and how well separate teams would have coordinated otherwise." },
      { question: 'Does design-build mean Vitalite controls everything?', answer: "No. Owners make the scope, budget, finish and timeline decisions. Vitalite's role is to give those decisions accurate construction context — not to override them." },
      { question: 'Can Vitalite work with existing drawings or an architect already engaged?', answer: "Yes. Vitalite can review existing drawings for construction practicality and permit readiness, or work in a construction management role alongside a design team. Not every project needs a full design-build arrangement." },
    ],
    relatedLinks: [
      { label: 'Design-build vs general contractor guide', key: 'guide-design-build-vs-general-contractor-gta' },
      { label: 'Architectural services', key: 'service-architectural-services' },
      { label: 'Project management', key: 'service-project-management' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'why-testimonials': {
    parent: 'why-vitalite',
    category: 'WHY VITALITE',
    title: 'What Clients Say',
    subtitle: 'Real client feedback and project reviews from GTA homeowners, investors and commercial clients.',
    image: PLACEHOLDER_IMAGE,
    intro: 'For a high-value construction decision, the question most owners actually ask is whether the team communicated clearly, controlled the budget, handled the unexpected and delivered what they promised. Client reviews for Vitalite projects are collected at project closeout and added here as they become available.',
    bullets: ['Clear communication throughout', 'Budget and schedule managed honestly', 'Trade coordination handled in-house', 'Post-delivery follow-through'],
    sections: [
      { heading: 'Custom Homes and Rebuilds', text: 'Custom home clients who have worked with Vitalite on new builds and teardown-rebuilds in North York, Markham and the GTA describe a team that manages approvals, drawings, trade schedules and finish quality without shifting accountability to the owner.' },
      { heading: 'Additions and Major Renovations', text: 'Owners who expanded their homes through additions or major renovations note how Vitalite managed the structural and permit work — the part of a project that often surprises less experienced contractors.' },
      { heading: 'Multiplex and Investment Properties', text: 'Investors who built multiplexes, mixed-use additions or laneway suites with Vitalite value the zoning knowledge, rental-use planning and site coordination that keeps complex projects on track.' },
      { heading: 'Project Reviews Available on Request', text: 'Vitalite collects feedback at project closeout. If you are evaluating contractors and would like to speak with a past client on a similar project type, contact us to arrange a reference call.' },
    ],
    faqs: [
      { question: 'What do clients most often mention in their reviews?', answer: 'Communication clarity, how Vitalite handled scope changes or site surprises, budget transparency, and the quality of finish-trade coordination are the most common themes in client feedback.' },
      { question: 'Can I speak with a past Vitalite client before committing?', answer: 'Yes. Vitalite can connect prospective clients with past homeowners or investors on similar project types. Contact us to request a reference.' },
      { question: 'Are project reviews available by project type?', answer: 'Feedback is collected by project category — custom homes, multiplex, additions, garden suites, and ICI — so you can hear from clients on projects similar to yours.' },
    ],
    relatedLinks: [
      { label: 'Our Work', key: 'our-work' },
      { label: 'Custom homes', key: 'work-custom-homes' },
      { label: 'Additions and renovations', key: 'work-additions' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'why-in-the-news': {
    parent: 'why-vitalite',
    category: 'WHY VITALITE',
    title: 'In The News',
    subtitle: 'Company updates, GTA project features and construction commentary from the Vitalite team.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Vitalite is an active GTA design-build contractor with ongoing projects in Willowdale, Markham, Mississauga, Lansdowne Toronto and across the wider region. This page tracks company developments, completed project news and local construction perspective as it becomes available.',
    bullets: ['Completed project features', 'Company milestones', 'GTA construction market commentary', 'Awards and local recognition'],
    sections: [
      { heading: '2025 Active Projects', text: 'Vitalite currently has active sites across the GTA: a 4,700 sq ft luxury custom home in Willowdale, a multi-unit build with laneway suite in Lansdowne Toronto, a single-storey addition in Preston Lake Stouffville, and a major vertical side-split expansion in Erindale Mississauga.' },
      { heading: '2026 Project Pipeline', text: 'Six projects are scheduled to begin construction in 2026, including a lot severance and two new semi-detached homes in York Toronto, a five-rental-unit vertical addition over a mixed-use building in Bedford Park, and multiple custom home builds in Avondale, Stouffville and Willowdale.' },
      { heading: 'GTA Construction Market Context', text: 'Toronto and the surrounding region continue to see strong demand for custom home rebuilds, multiplex conversions and laneway suites as zoning rules evolve. Vitalite publishes construction commentary and planning guides through the blog.' },
      { heading: 'Media and Industry Recognition', text: 'Vitalite project announcements, completed project features and recognition in the GTA design-build space will be shared here as they occur.' },
    ],
    faqs: [
      { question: 'What should Vitalite publish in the news section?', answer: 'Publish verified company updates, completed project features, media mentions, awards, local construction commentary and announcements that build trust.' },
      { question: 'Should every blog post also appear here?', answer: 'No. Keep practical SEO guides in the blog. Use In The News for company credibility, brand authority and project or media updates.' },
      { question: 'Can this page help local SEO?', answer: 'Yes, if updates are specific, local and connected to real service areas, project types, expertise and internal links.' },
    ],
    relatedLinks: [
      { label: 'Blog', key: 'blog' },
      { label: 'Our Work', key: 'our-work' },
      { label: 'Toronto service areas', key: 'locations-hub' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'work-custom-homes': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Custom Homes',
    subtitle: 'Luxury homes, teardown-rebuilds and new detached homes across Toronto, North York and the GTA.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Vitalite custom home projects cover the full delivery path — from zoning review, concept design and permit drawings through structural framing, mechanical systems, finish-trade coordination and closeout. Active builds are underway in Willowdale and York Toronto. The portfolio also includes completed homes in Cachet Markham, Bullock Markham, Richvale Richmond Hill, Don Valley and Bayview Village.',
    bullets: ['New detached custom homes', 'Teardown-rebuilds on existing lots', 'Lot severance and infill', 'Luxury interiors and exterior detailing'],
    sections: [
      { heading: 'Willowdale, North York', text: "One of the GTA's most active custom home rebuild markets. Vitalite is currently delivering a 4,700 sq ft modern luxury build in Willowdale and has completed multiple custom homes in the area over the past several years." },
      { heading: 'Markham', text: 'Cachet and Bullock are mature neighbourhoods where estate-style custom home buyers expect high-spec detailing and disciplined construction management. Vitalite has completed six custom homes across Markham.' },
      { heading: 'Toronto Infill and Lot Severance', text: "Vitalite's 2026 pipeline includes a 38x120 ft lot severance in York Toronto delivering two 2,100 sq ft semi-detached homes — a common Toronto infill pattern that requires careful Committee of Adjustment work." },
      { heading: 'End-to-End Delivery', text: 'Every custom home project includes drawings, structural and engineering coordination, building permit management, trade scheduling, site inspections and post-occupancy support.' },
    ],
    relatedLinks: [
      { label: 'Custom home design & build service', key: 'service-custom-home' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-willowdale-custom-home-4700',
      'project-york-toronto-lot-severance-semi',
      'project-avondale-custom-home-3200',
      'project-rural-stouffville-american-country',
      'project-past-willowdale-1',
      'project-past-willowdale-2',
      'project-past-willowdale-3',
      'project-past-cachet-markham-1',
      'project-past-cachet-markham-2',
      'project-past-cachet-markham-3',
      'project-past-bullock-markham-1',
      'project-past-bullock-markham-2',
      'project-past-bullock-markham-3',
      'project-past-richvale-richmond-hill',
      'project-past-don-valley-north-york',
      'project-past-bayview-village-north-york',
    ],
  },
  'work-multiplex': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Multi-Unit / Multiplex',
    subtitle: 'Rental-focused residential construction and mixed-use density projects across the GTA.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Vitalite multiplex projects involve a more complex delivery model than single-family homes: fire separation between units, parking and laneway coordination, separate services and independent egress for each unit. Active projects include a ground-up multi-unit build with laneway suite in Lansdowne Toronto and a five-rental-unit vertical addition over a mixed-use building in Bedford Park North York.',
    bullets: ['Ground-up multi-unit residential builds', 'Vertical additions over occupied buildings', 'Laneway suites integrated with main build', 'Investment-focused unit layouts'],
    sections: [
      { heading: 'Lansdowne Toronto — Multi-Unit with Laneway Suite', text: 'A purpose-built multi-unit residential building in Lansdowne where every floor is a self-contained unit with independent access. A garage with laneway suite at the rear adds a second rentable unit on the same lot, maximizing return on a single parcel.' },
      { heading: 'Bedford Park — Mixed-Use Vertical Addition', text: 'Coming 2026: two new storeys and five rental apartments built above an active mixed-use building in Bedford Park North York. One of the most complex project types Vitalite handles — the commercial and residential tenants below remain operational during construction.' },
      { heading: 'Zoning, Permits and Rental Compliance', text: 'Multiplex and multi-unit projects in Toronto move through zoning review, Committee of Adjustment where required, and building permit drawings that address fire separation, egress, mechanical risers and parking before any structural work begins.' },
      { heading: 'Investment Property Planning', text: 'Owners who plan multi-unit projects with Vitalite typically start from a rental income and lot-use strategy. Vitalite works through the zoning feasibility, unit configuration and construction budget before drawings are commissioned.' },
    ],
    relatedLinks: [
      { label: 'Multiplex construction service', key: 'service-multiplex' },
      { label: 'Garden suites and laneway houses', key: 'service-garden-suites' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-lansdowne-toronto-multiplex-laneway',
      'project-bedford-park-mixed-use-rental',
    ],
  },
  'work-garden-suites': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Garden Suites & Laneway Houses',
    subtitle: 'Secondary dwelling units for GTA homeowners adding rental income or family living space.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Garden suites and laneway houses are compact secondary units built on existing residential lots — in the rear yard or above a lane-facing garage. City of Toronto by-laws now permit these on eligible lots across much of the city, and Whitchurch-Stouffville, Mississauga and other GTA municipalities have their own ADU regulations. Vitalite handles the zoning review, permit drawings, engineering coordination and site construction from start to finish.',
    bullets: ['Garden suites in rear yards', 'Laneway houses over rear garages', 'Coach house and detached ADU construction', 'Rental-use feasibility and permit coordination'],
    sections: [
      { heading: 'Zoning and Permit Path', text: 'Every garden suite or laneway house starts with a lot eligibility check against local by-laws, setbacks, lot coverage, lot depth and laneway or rear-yard access rules. Vitalite prepares permit-ready drawings that meet those requirements before any site work begins.' },
      { heading: 'What Drives the Cost', text: 'Foundation type, servicing (water, sewer, electrical tie-in), site access, insulation, and finish level are the main budget drivers for ADU projects. Vitalite works through these early so owners make cost decisions before committing to design.' },
      { heading: 'Rental Income Planning', text: 'Many garden suite projects in Toronto are planned around rental income. Vitalite can help owners understand the interplay between construction budget, rental return, lot constraints and long-term property value before drawings start.' },
      { heading: 'Contact for Garden Suite Feasibility', text: 'If you have a GTA property and want to understand whether a garden suite or laneway house is viable — lot dimensions, servicing, access, approximate cost — contact Vitalite for a scoping conversation.' },
    ],
    relatedLinks: [
      { label: 'Garden suites and laneway houses service', key: 'service-garden-suites' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'work-additions': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Additions & Major Renovations',
    subtitle: 'Home additions, vertical expansions and major renovations across Toronto, Mississauga and the GTA.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Vitalite additions range from a 200 sq ft single-storey dining extension in Stouffville to a full vertical expansion that grows a Willowdale home from 3,700 to 5,200 sq ft. Other active projects include a major side-split vertical expansion in Erindale Mississauga and a whole-home retrofit with cathedral ceiling transformation in Stouffville. Each project moves through structural assessment, architectural drawings, permit submission, foundation or structural work, and finish-trade coordination on one managed schedule.',
    bullets: ['Single-storey rear and side additions', 'Vertical additions and second-storey expansions', 'Whole-home retrofits and reconfiguration', 'Basement walkout and foundation extensions'],
    sections: [
      { heading: 'Stouffville — Single-Storey Addition', text: 'A 200 sq ft addition in Preston Lake Stouffville extends the dining and family room under a vaulted cathedral roof with a heated crawl space below. Compact additions need precise foundation, framing and tie-in work so the new structure connects cleanly to the existing house.' },
      { heading: 'Willowdale — 1,500 sq ft Expansion', text: 'Coming 2026: a Willowdale home grows from 3,700 to 5,200 sq ft with the original foundation retained. Main-floor ceiling height rises to 11 ft. Keeping the foundation reduces demolition and grading costs but requires careful structural analysis to confirm it can carry the new load.' },
      { heading: 'Erindale Mississauga — Vertical Side-Split Addition', text: 'A four-storey side-split expands to six storeys with a new trussed roof, vaulted foyer and aluminum alloy doors and windows. Vertical additions on side-splits are structurally complex — existing walls, floors and the foundation all have to be reviewed before new floors are framed.' },
      { heading: 'Stouffville Retrofit — Multi-Space Expansion', text: 'Coming 2026: a major retrofit on an existing Stouffville home adds a front foyer, study, sunroom and basement walkup staircase, while transforming the existing roof into a cathedral ceiling. Projects at this scope blend addition, renovation and structural alteration work.' },
    ],
    relatedLinks: [
      { label: 'Additions and renovations service', key: 'service-additions' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-preston-lake-stouffville-addition',
      'project-erindale-mississauga-side-split-addition',
      'project-stouffville-retrofit-cathedral-walkup',
      'project-willowdale-expansion-5200',
    ],
  },
  'work-ici': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Industrial / Commercial / Institutional',
    subtitle: 'Design-build and construction management for GTA warehouses, offices, retail and institutional facilities.',
    image: PLACEHOLDER_IMAGE,
    intro: 'ICI construction puts a premium on schedule discipline, code compliance and operational continuity. Whether it is a warehouse build-out, a retail tenant fit-up, an office interior or an institutional facility improvement, commercial clients expect a contractor who can manage trades, coordinate inspections and deliver on time without disrupting other operations. Vitalite brings the same design-build coordination model to ICI work that it applies on residential projects.',
    bullets: ['Warehouse and light industrial projects', 'Office build-outs and tenant improvements', 'Retail space construction', 'Institutional facility improvements'],
    sections: [
      { heading: 'Warehouse and Light Industrial', text: 'Vitalite builds and fits out warehouses, light industrial units and distribution facilities in the GTA. Key coordination points include mechanical and electrical services, loading dock requirements, clear height, fire suppression and building code compliance.' },
      { heading: 'Office and Retail Construction', text: 'Office build-outs and retail tenant improvements require precise scheduling around occupancy dates and often involve coordination with building management, landlord approvals and municipal permits. Vitalite handles that coordination from drawings through site closeout.' },
      { heading: 'Institutional and Specialized Facilities', text: "Institutional clients — educational facilities, community organizations, healthcare-adjacent spaces — often have more rigorous code, accessibility and finish requirements. Vitalite's pre-construction planning process addresses these requirements before site work begins." },
      { heading: 'Request a Commercial Construction Consultation', text: 'Commercial and institutional projects benefit most from early design-build engagement. Contact Vitalite to discuss your GTA ICI project scope, timeline and construction management requirements.' },
    ],
    relatedLinks: [
      { label: 'ICI construction service', key: 'service-ici' },
      { label: 'Project and construction management', key: 'service-project-management' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'work-condos': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Condos & Apartments',
    subtitle: 'Toronto condo and apartment renovations with board approval coordination and material procurement.',
    image: PLACEHOLDER_IMAGE,
    intro: "Condo and apartment renovations in Toronto operate under a second layer of constraints that don't exist in detached homes: building management approval, freight elevator access windows, noise restrictions, suite protection, and board-approved material requirements. Vitalite understands that coordination layer and manages it as part of the project — not as an afterthought.",
    bullets: ['Full interior renovations', 'Kitchen and bathroom rebuilds', 'Board approval package preparation', 'Material procurement and site sequencing'],
    sections: [
      { heading: 'Building Coordination', text: 'Toronto condo renovations require board or building management approval before any structural or mechanical work begins. Vitalite prepares the documentation package, coordinates freight elevator scheduling, and manages noise windows so the project stays within building rules.' },
      { heading: 'Interior Design and Material Selection', text: 'Condo renovations often involve finish-level decisions that compound quickly — flooring, tile, millwork, fixtures, lighting, and paint across a compressed floorplan. Vitalite supports material selection and procurement coordination to prevent delays at the finish stage.' },
      { heading: 'Kitchen and Bathroom Focus', text: 'Most condo renovation budgets are concentrated in the kitchen and bathrooms. Vitalite plans these rooms from rough-in through tile and cabinetry install, with a trade schedule that avoids common sequencing errors.' },
      { heading: 'Contact for a Condo Renovation Review', text: 'If you are planning a Toronto condo renovation and want to understand scope, building approval requirements and realistic budget ranges, contact Vitalite for an initial consultation.' },
    ],
    relatedLinks: [
      { label: 'Condo renovations service', key: 'service-condo-renovations' },
      { label: 'Apartment renovations service', key: 'service-apartment-renovations' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'work-lofts': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Lofts',
    subtitle: 'Open-concept loft renovations in Toronto with exposed finishes, integrated kitchens and flexible space planning.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Loft renovations are among the most coordination-intensive interior projects in Toronto. The open plan removes the walls that would normally conceal mechanical, electrical and structural elements — so every trade decision is also a design decision. Vitalite manages that coordination to keep the finish consistent with the design intent.',
    bullets: ['Open-concept layout planning', 'Exposed structural feature finishing', 'Integrated kitchen and living areas', 'Mechanical, electrical and HVAC planning in open plan'],
    sections: [
      { heading: 'Structural and Mechanical Coordination', text: 'In an open loft, HVAC ductwork, electrical conduit, sprinkler heads and structural beams all sit in plain view. Vitalite routes these elements as part of the design intent — not after finishes are selected.' },
      { heading: 'Lighting and Material Decisions', text: 'Lofts typically rely on lighting design, flooring selection and surface material choices to define zones within the open plan. These decisions compound: one change in the flooring material affects the transition to the kitchen, the lighting layout and the baseboards.' },
      { heading: 'Live-Work Space Planning', text: 'Many Toronto loft renovations also need to accommodate a home office or work zone within the same open volume. Vitalite plans these functional zones early so the electrical, data and acoustic decisions are resolved before the floor goes down.' },
      { heading: 'Building Approval for Loft Renovations', text: 'Hard-loft buildings often require building management or strata approval before structural, mechanical or electrical alterations. Vitalite handles the approval coordination as part of the project.' },
    ],
    relatedLinks: [
      { label: 'Loft and open-concept renovations service', key: 'service-loft-renovations' },
      { label: 'Interior design service', key: 'service-interior-design' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'work-older-homes': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Older Toronto Homes',
    subtitle: 'Renovations on pre-war and mid-century Toronto homes with structural, code and character considerations.',
    image: PLACEHOLDER_IMAGE,
    intro: "Older Toronto homes — Edwardian, Victorian, wartime and mid-century detached and semi-detached houses — carry construction complexity that newer builds don't: knob-and-tube electrical, balloon framing, plaster walls, undersized foundations, lead paint and asbestos-containing materials. Vitalite's pre-construction process includes a full existing-condition assessment so scope, code compliance and budget are based on what's actually there, not assumptions.",
    bullets: ['Pre-war and mid-century detached homes', 'Structural assessment and alteration', 'Electrical, plumbing and HVAC upgrades', 'Character-sensitive finish planning'],
    sections: [
      { heading: 'Existing Conditions Assessment', text: 'Before any older-home renovation scope is finalized, Vitalite reviews accessible structural, electrical, plumbing and mechanical systems. This step identifies what drives cost and what can stay — so the budget is not built on unknowns.' },
      { heading: 'Structural Alterations and Code Compliance', text: 'Older Toronto homes often require structural changes to open a floor plan, add a second storey, or improve foundation performance. Vitalite coordinates the structural engineering and code review that those alterations require, so the permit set is complete before site work begins.' },
      { heading: 'Preserving Character While Improving Performance', text: 'Many owners of older Toronto homes want to keep what makes the house distinct — trim profiles, proportions, materials — while gaining modern insulation, mechanical and electrical performance. Vitalite plans that balance at the design stage rather than resolving it during construction.' },
      { heading: 'Contact for an Older Home Renovation Review', text: 'If you own an older Toronto home and are planning a renovation, addition or gut project, contact Vitalite for an initial scope and condition discussion before committing to drawings.' },
    ],
    relatedLinks: [
      { label: 'Older and heritage home renovations service', key: 'service-heritage-renovations' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'work-townhouses': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Townhouses & Semi-Detached Homes',
    subtitle: 'Townhouse and semi-detached home renovations, additions and full rebuilds in Toronto and the GTA.',
    image: PLACEHOLDER_IMAGE,
    intro: "Townhouses and semi-detached homes in Toronto operate with constraints that detached homes don't have: shared party walls, narrow lot widths, setbacks measured from adjacent structures, limited access corridors and often tighter site logistics. Vitalite plans around these constraints before drawings are finalized so the permit set addresses the actual conditions on site.",
    bullets: ['Rear additions on narrow lots', 'Second-storey additions with party wall coordination', 'Basement walkouts and underpinning', 'Whole-home renovations from gut to finish'],
    sections: [
      { heading: 'Party Wall and Structural Coordination', text: 'Additions and structural alterations on semi-detached homes require careful attention to the shared wall — load transfer, fire separation, and any impact on the adjacent property. Vitalite coordinates structural engineering that addresses the shared wall from the start.' },
      { heading: 'Narrow-Lot Site Logistics', text: 'Many Toronto townhouses and semis have 15 to 20 foot frontages and limited rear access. Trade deliveries, equipment staging and material movement all need to be planned around the lot geometry before a single nail is pulled.' },
      { heading: 'Additions and Vertical Expansions', text: "Rear additions and second-storey additions on semis and townhouses are common scopes in Toronto's established neighbourhoods. Vitalite handles zoning review, architectural drawings, structural engineering and permit submission so the process moves without late surprises." },
      { heading: 'Contact for a Townhouse Renovation Review', text: 'If you own a townhouse or semi-detached home in Toronto or the GTA and are planning a renovation, addition or full rebuild, contact Vitalite to discuss scope, zoning and realistic timelines.' },
    ],
    relatedLinks: [
      { label: 'Townhouse renovations service', key: 'service-townhouse-renovations' },
      { label: 'Additions and major renovations', key: 'work-additions' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'work-full-interiors': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Full Interiors',
    subtitle: 'Complete interior renovations from design direction and procurement through finish-trade coordination.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Full interior renovations require more coordination than they appear to from the outside. Every finish decision — tile selection, cabinetry dimensions, lighting placement, flooring type — has a sequencing implication for the trades that install it. Vitalite manages the full interior from design and material procurement through rough-in, substrate prep and finish installation so the result holds together as intended.',
    bullets: ['Kitchen and bathroom gut renovations', 'Millwork, cabinetry and built-ins', 'Flooring, tile and surface finishes', 'Lighting design and fixture procurement'],
    sections: [
      { heading: 'Kitchen Renovations', text: 'Kitchen renovations typically involve plumbing rough-in changes, electrical panel upgrades, cabinetry lead times, countertop templating and appliance coordination. Vitalite sequences these correctly so there are no hold-ups between trades.' },
      { heading: 'Bathroom Renovations', text: 'Bathroom renovations are where material decisions compound fastest: tile pattern, fixture rough-in placement, niche framing and waterproofing all need to be finalized before work begins. Vitalite works through these choices early in the project with the client.' },
      { heading: 'Material Procurement and Lead Times', text: "Italian porcelain, solid stone slabs and custom millwork all carry lead times that must be planned into the construction schedule. Vitalite builds procurement timing into the project plan from the start so a delayed tile order doesn't stop the finish-trade sequence." },
      { heading: 'Contact for a Full Interior Renovation Review', text: 'If you are planning a full interior renovation in Toronto or the GTA, contact Vitalite to discuss your scope, timeline, material direction and realistic budget range.' },
    ],
    relatedLinks: [
      { label: 'Interior design service', key: 'service-interior-design' },
      { label: 'Material selection and procurement', key: 'service-material-selection' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'blog-buyers-renovation-guide': {
    parent: 'blog',
    category: 'BLOG',
    title: "Buyer's Renovation Guide",
    subtitle: 'What to check before buying a property to renovate in the GTA.',
    image: PLACEHOLDER_IMAGE,
    intro: 'A buyer should understand likely renovation scope, permit risk, budget range and property constraints before removing conditions or closing.',
    bullets: ['Check zoning and permitted use', 'Review structure and existing systems', 'Estimate approval and construction timeline', 'Budget for contingencies'],
    sections: [
      { heading: 'Before You Buy', text: 'Look at lot constraints, parking, basement height, additions, suite potential and signs of hidden building issues.' },
      { heading: 'When To Call Vitalite', text: 'Bring us in before design decisions are fixed so we can flag budget, approval and construction issues early.' },
    ],
  },
  'blog-renovation-costs': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Toronto Renovations: Cost Per SQ FT',
    subtitle: 'How scope, structure, finishes and approvals shape cost.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Cost per square foot can be useful, but it is only meaningful when tied to project type, structure, finishes, approvals and site conditions.',
    bullets: ['Custom homes and rebuilds', 'Additions and structural renovations', 'Condo and apartment interiors', 'Multiplex and secondary-suite projects'],
    sections: [
      { heading: 'Cost Drivers', text: 'Structure, mechanical systems, finishes, permit requirements, site access and unknown existing conditions all affect budget.' },
      { heading: 'Budget Planning', text: 'Vitalite uses early scope review and budgetary planning to reduce surprises before detailed construction pricing.' },
    ],
  },
  'blog-design-build-vs-architect': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Design-Build Vs Architect',
    subtitle: 'Choosing the right delivery model for a GTA renovation or build.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Some projects benefit from a separate architect-led process, while others need an integrated design-build team from the beginning.',
    bullets: ['Design-build improves accountability', 'Construction input arrives earlier', 'Budget feedback is integrated sooner', 'Approvals and site execution stay connected'],
    sections: [
      { heading: 'Best Fit For Design-Build', text: 'Custom homes, additions, gut renovations, multiplex projects and owner-led investments often benefit from one accountable delivery partner.' },
      { heading: 'Decision Point', text: 'The more construction complexity and budget sensitivity you have, the more valuable early buildability input becomes.' },
    ],
  },
  'blog-renovation-timeline': {
    parent: 'blog',
    category: 'BLOG',
    title: 'How Long Is A GTA Renovation?',
    subtitle: 'A practical timeline from concept to handover.',
    image: PLACEHOLDER_IMAGE,
    intro: 'The timeline depends on design decisions, zoning review, permit requirements, procurement, construction scope and inspections.',
    bullets: ['Consultation and site evaluation', 'Design and budgeting', 'Zoning, engineering and permits', 'Construction, PDI and warranty'],
    sections: [
      { heading: 'Before Construction', text: 'Design, drawings, engineering and municipal approval can take longer than owners expect, especially for additions and multi-unit work.' },
      { heading: 'During Construction', text: 'A controlled schedule depends on procurement, trade coordination, inspection timing and quick decision-making.' },
    ],
  },
  'blog-renovation-laws': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Toronto Renovation Laws',
    subtitle: 'Permits, zoning, building code and board approvals.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Renovation rules vary by project type, municipality, building, zoning condition and scope of structural or mechanical work.',
    bullets: ['Zoning review', 'Building permit applications', 'Structural and HVAC documentation', 'Board or property-management approvals'],
    sections: [
      { heading: 'Common Approval Needs', text: 'Additions, walk-ups, structural alterations, multi-unit conversions and secondary dwellings often require drawings, engineering and permits.' },
      { heading: 'How Vitalite Helps', text: 'We coordinate the documents, consultants and municipal process needed to move the project forward.' },
    ],
  },
  'blog-garden-suite-ideas': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Garden Suite Ideas 2026',
    subtitle: 'Planning a garden suite, laneway house or coach house in the GTA.',
    image: PLACEHOLDER_IMAGE,
    intro: 'Garden suites and laneway-style dwellings can create rental income, independent family space and added property value when the lot, approvals and budget make sense.',
    bullets: ['Review zoning and lot constraints', 'Plan compact living layouts', 'Coordinate drawings and engineering', 'Budget for services, access and finishes'],
    sections: [
      { heading: 'Design Ideas', text: 'Focus on efficient layouts, durable finishes, natural light, privacy and storage so a compact unit feels complete.' },
      { heading: 'Approval Path', text: 'Start with feasibility and municipal requirements before committing to detailed design or construction pricing.' },
    ],
  },
  'blog-fixer-upper-vs-new': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Renovating A Fixer-Upper vs Buying New',
    subtitle: 'Which path creates better value in the GTA?',
    image: PLACEHOLDER_IMAGE,
    intro: 'The better choice depends on land value, zoning potential, renovation scope, financing, rental strategy and long-term use.',
    bullets: ['Compare acquisition plus construction cost', 'Assess zoning and suite potential', 'Estimate timeline and carrying costs', 'Plan for structural and permit risk'],
    sections: [
      { heading: 'Fixer-Upper Advantage', text: 'A renovation can unlock location, layout and rental upside when the property has strong fundamentals.' },
      { heading: 'Newer Property Advantage', text: 'Buying newer can reduce approval and construction risk, but may offer less customization or investment upside.' },
    ],
  },
};

const staticDetailPages: Record<string, DetailPageContent> = {
  faq: {
    parent: 'contact-us',
    category: 'FAQ',
    title: 'GTA Design-Build FAQ',
    subtitle: 'Common questions about Vitalite consultation, drawings, permits, budgets, construction management and project delivery.',
    image: PLACEHOLDER_IMAGE,
    intro:
      'Vitalite works best when owners involve the team before drawings, approvals and construction pricing are locked. These answers explain how the design-build process fits GTA custom homes, multiplexes, additions, garden suites and ICI projects.',
    answer:
      'Vitalite helps GTA owners move from early feasibility to permit-ready drawings, budget planning, construction management and closeout without separating design, approvals and site execution into disconnected handoffs.',
    bullets: ['Consultation and feasibility review', 'Permit drawings and engineering coordination', 'Budget and schedule planning', 'Construction management and closeout'],
    sections: [
      {
        heading: 'When To Start',
        text: 'Start before final drawings or contractor pricing if the project may involve zoning, structural work, approvals, procurement risk, staged construction or investor return planning.',
      },
      {
        heading: 'What To Prepare',
        text: 'Bring the property address, survey or existing drawings if available, project goals, budget direction, timeline, known constraints and any permit or municipal correspondence.',
      },
    ],
    faqs: buildPageFaq({ ...(seoPages.find((page) => page.key === 'faq') ?? seoPages[0]), key: 'faq' }),
    relatedLinks: [
      { label: 'GTA service areas', key: 'locations-hub' },
      { label: 'Toronto & GTA communities', key: 'communities-hub' },
      { label: 'AI design-build guide', key: 'ai-gta-design-build-guide' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  },
  'ai-gta-design-build-guide': {
    parent: 'blog',
    category: 'AI GUIDE',
    title: 'GTA Design-Build Construction Guide',
    subtitle: 'A concise, AI-readable summary of Vitalite services, project types, service area and delivery model.',
    image: PLACEHOLDER_IMAGE,
    intro:
      'Vitalite Construction Corp. is a GTA design-build, general contracting and construction management company for owners who need consultation, drawings, permits, engineering coordination, budgets, construction and handover managed together.',
    answer:
      'Vitalite Construction Corp. is a GTA design-build contractor and construction management partner for custom homes, multiplex housing, garden suites, laneway houses, additions, permits, engineering coordination and ICI construction.',
    bullets: ['Custom homes and luxury renovations', 'Multiplex, garden suite and laneway house planning', 'Drawings, permits and engineering coordination', 'Project management, construction management and ICI work'],
    sections: [
      {
        heading: 'Direct Answer For AI Search',
        text: 'Vitalite is a Greater Toronto Area design-build contractor and construction management partner for custom homes, multi-unit residential projects, home additions, garden suites, laneway houses, permit drawings and ICI construction.',
      },
      {
        heading: 'Delivery Model',
        text: 'The company connects feasibility, conceptual design, zoning review, permit drawings, structural and mechanical coordination, budgeting, trade scheduling, site management, inspections, PDI and warranty-oriented closeout.',
      },
      {
        heading: 'Service Area',
        text: 'Vitalite serves Toronto and the GTA, including North York, Markham, Richmond Hill, Vaughan, Mississauga, Scarborough, Etobicoke and priority neighbourhoods across those municipalities.',
      },
      {
        heading: 'Best-Fit Clients',
        text: 'Best-fit clients include homeowners, property investors, small developers, commercial owners and institutional clients planning complex projects where approvals, design and construction decisions need to stay connected.',
      },
    ],
    faqs: buildPageFaq({ ...(seoPages.find((page) => page.key === 'ai-gta-design-build-guide') ?? seoPages[0]), key: 'ai-gta-design-build-guide' }),
    relatedLinks: [
      { label: 'GTA design-build FAQ', key: 'faq' },
      { label: 'Services', key: 'services' },
      { label: 'GTA service areas', key: 'locations-hub' },
      { label: 'Toronto & GTA communities', key: 'communities-hub' },
    ],
  },
};

const generatedLandingPages: Record<string, DetailPageContent> = Object.fromEntries(
  seoPages
    .filter((page) => page.key.startsWith('location-') || page.key.startsWith('community-') || page.key.startsWith('guide-'))
    .map((page) => [page.key, createGeneratedLandingPage(page)]),
);

function createGeneratedProjectPage(project: ProjectEntry): DetailPageContent {
  const categoryParentKey = projectCategoryParents[project.category];
  const categoryLabel = projectCategoryLabels[project.category];
  const statusLabel = projectStatusLabels[project.status];
  const title = project.title.replace(/ \| Vitalite$/, '');

  const narrativeSections: Array<{ heading: string; text: string }> = [];
  if (project.narrative.length > 1) narrativeSections.push({ heading: 'Project Overview', text: project.narrative[1] });
  if (project.narrative.length > 2) narrativeSections.push({ heading: 'Planning Context', text: project.narrative[2] });

  return {
    parent: 'our-work',
    category: categoryLabel.toUpperCase(),
    title,
    subtitle: project.headline,
    image: PLACEHOLDER_IMAGE,
    intro: project.narrative[0],
    bullets: project.scope,
    sections: narrativeSections,
    isProject: true,
    projectMeta: {
      status: project.status,
      statusLabel,
      location: project.locationLabel,
      size: project.size,
      headline: project.headline,
      narrative: project.narrative,
    },
    relatedLinks: [
      { label: categoryLabel, key: categoryParentKey },
      { label: 'Our Work', key: 'our-work' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
  };
}

const generatedProjectDetailPages: Record<string, DetailPageContent> = Object.fromEntries(
  projects.map((project) => [project.key, createGeneratedProjectPage(project)]),
);

const allDetailPages: Record<string, DetailPageContent> = {
  ...detailPages,
  ...staticDetailPages,
  ...generatedLandingPages,
  ...generatedProjectDetailPages,
};

const locationSeoCards: ImageCard[] = seoPages
  .filter((page) => page.key.startsWith('location-'))
  .map((page) => ({
    title: page.title.split('|')[0].trim(),
    eyebrow: 'GTA service area',
    summary: page.description,
    image: imageForSeoPage(page),
    href: routeHref(page.key),
  }));

const communitySeoCards: ImageCard[] = seoPages
  .filter((page) => page.key.startsWith('community-'))
  .map((page) => ({
    title: page.title.split('|')[0].trim(),
    eyebrow: 'Neighbourhood service area',
    summary: page.description,
    image: imageForSeoPage(page),
    href: routeHref(page.key),
  }));

const longTailSeoCards: ImageCard[] = seoPages
  .filter((page) => page.key.startsWith('guide-'))
  .map((page) => ({
    title: page.title.split('|')[0].trim(),
    eyebrow: 'Planning guide',
    summary: page.description,
    image: imageForSeoPage(page),
    href: routeHref(page.key),
  }));

const contactSeoPage = seoPages.find((page) => page.key === 'contact-us');
const contactFaqs = contactSeoPage ? buildPageFaq(contactSeoPage) : [];
const contactIntakeItems = [
  'Property address or GTA municipality',
  'Project type and current planning stage',
  'Existing drawings, survey or permit status',
  'Target budget direction and timeline',
  'Known zoning, structural, access or inspection concerns',
];
const contactPriorityLinks = [
  { label: 'Custom home consultation', key: 'service-custom-homes' },
  { label: 'Multiplex project review', key: 'service-multiplex' },
  { label: 'Garden suite or laneway house', key: 'service-garden-suites' },
  { label: 'Additions and alterations', key: 'service-home-additions' },
  { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
  { label: 'Project and construction management', key: 'service-project-management' },
] satisfies Array<{ label: string; key: DetailPageKey }>;

const serviceWorkflowCards: TextCard[] = [
  {
    eyebrow: '01',
    title: 'Plan the scope before the price',
    text: 'Vitalite starts by clarifying the property, owner goals, existing conditions, zoning questions, drawings, budget direction and likely approval path before construction pricing is treated as reliable.',
  },
  {
    eyebrow: '02',
    title: 'Connect approvals to buildability',
    text: 'Architectural drawings, structural input, HVAC or mechanical coordination, permit comments, trade sequencing and material decisions are reviewed as one project path instead of separate handoffs.',
  },
  {
    eyebrow: '03',
    title: 'Manage the site through closeout',
    text: 'During construction, Vitalite manages trades, schedule, procurement, inspections, quality control, owner communication, PDI items and warranty-oriented aftercare.',
  },
];

const serviceStartingPointCards: TextCard[] = [
  {
    title: 'I have a property but no drawings',
    text: 'Start with feasibility, concept planning, zoning review and architectural coordination so the project can move toward permit-ready documentation.',
    pageKey: 'service-architectural-services',
  },
  {
    title: 'I need permits or engineering coordinated',
    text: 'Use the drawings, permits and engineering path when construction depends on municipal review, structural input, HVAC coordination or code questions.',
    pageKey: 'service-drawings-permits',
  },
  {
    title: 'I am comparing builders or proposals',
    text: 'Start with project and construction management when you need schedule, budget, trade, inspection and quality-control responsibilities clearly defined.',
    pageKey: 'service-project-management',
  },
];

const whyProofCards: TextCard[] = [
  {
    title: 'One accountable delivery model',
    text: 'Design decisions, approvals, budget planning and site execution are managed together, which helps owners avoid the gaps that often appear between separate consultants and contractors.',
  },
  {
    title: 'GTA approval awareness',
    text: 'Projects are planned around Toronto-area zoning review, permit drawings, building code questions, municipal comments, inspections, site access and local construction constraints.',
  },
  {
    title: 'Construction management discipline',
    text: 'Vitalite keeps focus on schedule, budget movement, procurement, trade sequencing, site meetings, quality control and closeout items throughout the build.',
  },
];

const whyControlCards: TextCard[] = [
  {
    eyebrow: 'Before drawings',
    title: 'Feasibility and scope decisions',
    text: 'Owners get clearer direction on what can be designed, what needs approval, what should be priced early and which risks need engineering or municipal review.',
  },
  {
    eyebrow: 'Before construction',
    title: 'Budget and permit readiness',
    text: 'Drawings, engineering inputs, allowances, exclusions, procurement assumptions and inspection requirements are aligned before the site schedule is finalized.',
  },
  {
    eyebrow: 'During delivery',
    title: 'Visible project control',
    text: 'The construction phase is managed around trade coordination, schedule updates, quality checks, municipal inspections, change decisions and PDI closeout.',
  },
];

const workFrameworkCards: TextCard[] = [
  {
    title: 'Residential value creation',
    text: 'Custom homes, additions, garden suites and multiplex projects are evaluated by how design, approvals, budget, construction and long-term property value connect.',
  },
  {
    title: 'Investment-oriented planning',
    text: 'Multi-unit, garden suite and laneway projects need early review of unit strategy, servicing, egress, fire separation, parking, approvals and rental-use assumptions.',
  },
  {
    title: 'Commercial and ICI readiness',
    text: 'Commercial, industrial and institutional work is framed around durability, compliance, cost control, operational needs, trade coordination and inspection planning.',
  },
];

const workEvidenceCards: TextCard[] = [
  {
    title: 'What each project page should show',
    text: 'Future case studies should document the original condition, project goal, approval path, scope decisions, construction sequence, finish direction and handover result.',
  },
  {
    title: 'How owners should compare work',
    text: 'Look beyond finished photos. Review whether the builder managed drawings, approvals, structural work, trades, inspections, budget decisions and post-construction items.',
  },
  {
    title: 'Where to start',
    text: 'If your project type matches a category, use that page to understand the likely planning path, then contact Vitalite with address, drawings, budget direction and timeline.',
    pageKey: 'contact-us',
  },
];

const blogIntentCards: TextCard[] = [
  {
    title: 'Cost and proposal questions',
    text: 'Guides explain why GTA construction quotes vary, how allowances and exclusions affect price, and what owners should compare before choosing a contractor.',
    pageKey: 'guide-gta-construction-proposals-differ',
  },
  {
    title: 'Permits and approval readiness',
    text: 'Permit-focused content covers drawings, zoning review, building code questions, engineering coordination, municipal comments and handoff into construction.',
    pageKey: 'guide-toronto-permit-ready-drawings-checklist',
  },
  {
    title: 'Delivery model decisions',
    text: 'Design-build and construction management guides help owners decide when they need one accountable team instead of disconnected design and build handoffs.',
    pageKey: 'guide-design-build-vs-general-contractor-gta',
  },
];

const contactNextStepCards: TextCard[] = [
  {
    eyebrow: 'Step 1',
    title: 'Send the project basics',
    text: 'Share the address or municipality, project type, current drawings or permit status, budget direction, timeline and the decision you need help making next.',
  },
  {
    eyebrow: 'Step 2',
    title: 'Clarify the right starting path',
    text: 'Vitalite identifies whether the next move is feasibility review, architectural coordination, permit drawings, engineering input, budget planning or construction management.',
  },
  {
    eyebrow: 'Step 3',
    title: 'Move into a defined scope',
    text: 'Once the path is clear, the project can move toward drawings, approvals, procurement, construction scheduling, site management and closeout planning.',
  },
];

const getMainPageFaqs = (key: MainPageKey) => {
  const page = seoPages.find((item) => item.key === key);
  return page ? buildPageFaq(page) : [];
};

const servicesFaqs = getMainPageFaqs('services');
const whyVitaliteFaqs = getMainPageFaqs('why-vitalite');
const ourWorkFaqs = getMainPageFaqs('our-work');
const blogFaqs = getMainPageFaqs('blog');

const searchKindLabels: Record<string, string> = {
  home: 'Home',
  serviceCollection: 'Services',
  service: 'Service',
  about: 'Why Vitalite',
  collection: 'Our Work',
  blog: 'Blog',
  article: 'Guide',
  contact: 'Contact Us',
};

const searchItems = seoPages.map((page) => ({
  key: page.key,
  href: routeHref(page.key),
  title: page.title.split('|')[0].trim(),
  description: page.description,
  kind: searchKindLabels[page.kind] ?? page.kind,
  haystack: `${page.title} ${page.description} ${page.primaryKeyword} ${page.key}`.toLowerCase(),
}));

const SearchOverlay = ({
  open,
  onClose,
  language,
}: {
  open: boolean;
  onClose: () => void;
  language: Language;
}) => {
  const [query, setQuery] = useState('');
  const quickSearches = ['Custom homes', 'Garden suites', 'Multiplex', 'Permits', 'Markham', 'Additions'];
  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? searchItems
        .filter((item) => item.haystack.includes(normalizedQuery))
        .slice(0, 12)
    : searchItems
        .filter((item) => ['services', 'service-custom-homes', 'service-garden-suites', 'service-multiplex', 'contact-us'].includes(item.key))
        .slice(0, 8);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/92 backdrop-blur-md text-white px-5 sm:px-8 py-6 sm:py-10 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={copy('Search Vitalite', language)}
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <div className="text-kiewit-yellow text-[12px] font-bold tracking-[0.2em] uppercase mb-3">
                  {copy('Search', language)}
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">{copy('Search Vitalite', language)}</h2>
                <p className="text-gray-300 mt-4 max-w-2xl leading-relaxed">
                  {copy('Search services, locations, permits, additions, multiplex projects and planning guides.', language)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={copy('Close search', language)}
                className="w-12 h-12 rounded-full border border-white/25 flex items-center justify-center hover:border-kiewit-yellow hover:text-kiewit-yellow transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-kiewit-yellow" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy('Type a service, city, permit question or project type.', language)}
                className="w-full bg-white text-black rounded-none border-4 border-kiewit-yellow pl-14 pr-5 py-5 text-lg sm:text-2xl font-semibold outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-10">
              <span className="text-[12px] font-bold tracking-[0.16em] uppercase text-white/55">{copy('Quick searches', language)}</span>
              {quickSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="border border-white/20 px-4 py-2 text-sm font-semibold hover:border-kiewit-yellow hover:text-kiewit-yellow transition-colors"
                >
                  {copy(item, language)}
                </button>
              ))}
            </div>

            <div className="mb-5 text-[12px] font-bold tracking-[0.18em] uppercase text-kiewit-yellow">
              {copy('Results', language)} ({results.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={onClose}
                  className="group border border-white/12 bg-white/5 p-5 sm:p-6 hover:bg-white hover:text-black transition-colors"
                >
                  <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-kiewit-yellow mb-3">
                    {copy(item.kind, language)}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold leading-tight mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-300 group-hover:text-gray-700 leading-relaxed mb-4">
                    {item.description}
                  </p>
                  <span className="inline-flex items-center text-sm font-bold uppercase tracking-[0.12em]">
                    {copy('View page', language)} <ChevronRight className="w-4 h-4 ml-2 text-kiewit-yellow" />
                  </span>
                </a>
              ))}
            </div>
            {!results.length && (
              <div className="border border-white/15 bg-white/5 p-8 text-center">
                <div className="text-2xl font-bold mb-3">{copy('No results found.', language)}</div>
                <p className="text-gray-300">{copy('Try custom homes, garden suites, permits, multiplex, Markham or Toronto.', language)}</p>
              </div>
            )}
            {!normalizedQuery && (
              <p className="text-gray-400 text-sm mt-8">{copy('Start typing to search services, project pages and guides.', language)}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function getLocalMatchForSeoPage(page: SeoPage): LocalSeoMatch | undefined {
  const location = localSeoData.locations?.find((item) => page.key.endsWith(`-${item.slug}`));
  if (location) {
    return {
      label: location.name,
      kind: 'location',
      slug: location.slug,
      context: localSeoData.locationContexts?.[location.slug],
    };
  }

  const community = localSeoData.communityLocations?.find((item) => page.key.endsWith(`-${item.slug}`));
  if (community) {
    return {
      label: `${community.name}, ${community.municipality}`,
      kind: 'community',
      slug: community.slug,
      municipality: community.municipality,
      context: localSeoData.communityContexts?.[community.slug],
    };
  }

  return undefined;
}

function getGeneratedServiceName(page: SeoPage) {
  const service = [...(localSeoData.locationServices ?? []), ...(localSeoData.communityServices ?? [])].find((item) =>
    page.key.startsWith(`${item.keyPrefix}-`),
  );
  return service?.serviceName ?? page.primaryKeyword;
}

function getServicePlanningFocus(page: SeoPage): ServicePlanningFocus {
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

function buildLocalServiceSections(page: SeoPage, local: LocalSeoMatch | undefined, serviceName: string) {
  const focus = getServicePlanningFocus(page);
  const label = local?.label ?? 'the GTA';
  const contextSections = local?.context
    ? [
        {
          heading: 'Local Planning Context',
          text: local.context.planningContext,
        },
        {
          heading: 'Best-Fit Project Types',
          text: local.context.projectFit,
        },
        {
          heading: 'Approval And Construction Focus',
          text: local.context.approvalFocus,
        },
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

function buildServiceAreaAnswer(page: SeoPage, local: LocalSeoMatch | undefined, serviceName: string) {
  const label = local?.label ?? 'the GTA';
  return `Vitalite provides ${page.primaryKeyword} support for ${label}, combining ${serviceName.toLowerCase()} feasibility, zoning and code review, permit drawings, engineering coordination, budget planning, construction management, inspections and closeout under one GTA design-build team.`;
}

function uniqueRelatedLinks(links: Array<{ label: string; key: string }>) {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.key)) return false;
    seen.add(link.key);
    return true;
  });
}

function locationSlugFromMunicipality(municipality?: string) {
  const firstCity = municipality?.split('/')[0].trim();
  return localSeoData.locations?.find((location) => location.name === firstCity)?.slug;
}

function getGeneratedRelatedLinks(page: SeoPage) {
  const location = localSeoData.locations?.find((item) => page.key.endsWith(`-${item.slug}`));
  if (location) {
    const sameLocationLinks = seoPages
      .filter((candidate) => candidate.key.startsWith('location-') && candidate.key.endsWith(`-${location.slug}`) && candidate.key !== page.key)
      .slice(0, 6)
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), key: candidate.key }));
    return uniqueRelatedLinks([
      ...sameLocationLinks,
      { label: 'All GTA service areas', key: 'locations-hub' },
      { label: 'Toronto & GTA neighbourhood pages', key: 'communities-hub' },
      { label: 'Garden Suite Cost Toronto guide', key: 'guide-garden-suite-cost-toronto' },
      { label: 'Contact Vitalite for a project review', key: 'contact-us' },
    ]).slice(0, 10);
  }

  const community = localSeoData.communityLocations?.find((item) => page.key.endsWith(`-${item.slug}`));
  if (community) {
    const sameCommunityLinks = seoPages
      .filter((candidate) => candidate.key.startsWith('community-') && candidate.key.endsWith(`-${community.slug}`) && candidate.key !== page.key)
      .slice(0, 6)
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), key: candidate.key }));
    const sameMunicipalityLinks = seoPages
      .filter((candidate) => {
        const candidateCommunity = localSeoData.communityLocations?.find((item) => candidate.key.endsWith(`-${item.slug}`));
        return candidateCommunity?.municipality === community.municipality && candidateCommunity.slug !== community.slug && candidate.key.startsWith('community-custom-homes');
      })
      .slice(0, 3)
      .map((candidate) => ({ label: candidate.title.split('|')[0].trim(), key: candidate.key }));
    const parentLocationSlug = locationSlugFromMunicipality(community.municipality);
    const parentLocationKey = parentLocationSlug ? `location-custom-homes-${parentLocationSlug}` : undefined;
    return uniqueRelatedLinks([
      ...sameCommunityLinks,
      ...sameMunicipalityLinks,
      ...(parentLocationKey ? [{ label: `${community.municipality.split('/')[0].trim()} custom home builder`, key: parentLocationKey }] : []),
      { label: 'All neighbourhood construction pages', key: 'communities-hub' },
      { label: 'Toronto neighbourhood garden suite guide', key: 'guide-toronto-neighbourhood-garden-suite' },
      { label: 'Contact Vitalite for a project review', key: 'contact-us' },
    ]).slice(0, 10);
  }

  if (page.key.startsWith('guide-')) {
    return uniqueRelatedLinks([
      { label: 'GTA design-build pre-construction checklist', key: 'guide-gta-pre-construction-checklist' },
      { label: 'Why GTA construction proposals differ', key: 'guide-gta-construction-proposals-differ' },
      { label: 'Design-build vs general contractor GTA', key: 'guide-design-build-vs-general-contractor-gta' },
      { label: 'GTA construction management guide', key: 'guide-gta-construction-management' },
      { label: 'Toronto permit-ready drawings checklist', key: 'guide-toronto-permit-ready-drawings-checklist' },
      { label: 'GTA service areas', key: 'locations-hub' },
      { label: 'Toronto & GTA communities', key: 'communities-hub' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ]).slice(0, 10);
  }

  return [
    { label: 'GTA service areas', key: 'locations-hub' },
    { label: 'Toronto & GTA communities', key: 'communities-hub' },
    { label: 'Contact Vitalite', key: 'contact-us' },
  ];
}

function getGuideProfile(page: SeoPage) {
  const keyword = page.primaryKeyword.toLowerCase();
  const title = page.title.toLowerCase();
  const topic = `${keyword} ${title}`;

  if (topic.includes('proposal') || topic.includes('quote') || topic.includes('estimate') || topic.includes('allowance')) {
    return {
      answer: 'GTA construction proposals usually differ because contractors are not pricing the same scope. One proposal may include drawings, permit coordination, engineering, demolition, site protection, allowances, exclusions, trade management and inspection support, while another may leave those items undefined.',
      bullets: ['Scope normalization', 'Allowances and exclusions', 'Drawing and permit readiness', 'Management and inspection responsibility'],
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
      steps: ['Define the same project scope for every bidder', 'Review drawings, permit status and engineering assumptions', 'Compare allowances, exclusions and provisional sums', 'Clarify trade, inspection and site management responsibility', 'Choose the proposal with transparent scope and risk control'],
    };
  }

  if (topic.includes('pre-construction') || topic.includes('readiness') || (topic.includes('checklist') && !topic.includes('permit-ready'))) {
    return {
      answer: `${page.primaryKeyword} should confirm feasibility, zoning, survey information, drawings, engineering inputs, permit path, budget assumptions, procurement, trade sequencing, inspection requirements and client decisions before site work begins.`,
      bullets: ['Feasibility and zoning inputs', 'Permit-ready drawings and engineering', 'Budget and procurement planning', 'Trade, inspection and site logistics'],
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
      steps: ['Confirm goals, address and property constraints', 'Collect survey, drawings, photos and existing-condition details', 'Review zoning, code, permit and engineering requirements', 'Build a budget with allowances, procurement and trade input', 'Set the construction sequence, inspections and closeout plan'],
    };
  }

  if (topic.includes('permit-ready')) {
    return {
      answer: 'A Toronto permit-ready drawing package requires clear scope, existing-condition information, zoning and building code review, architectural drawings, structural details where needed, HVAC or mechanical coordination, and a permit submission plan that can respond to municipal comments.',
      bullets: ['Existing conditions and survey review', 'Architectural permit drawings', 'Structural, HVAC and mechanical inputs', 'Submission comments and construction handoff'],
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
      steps: ['Confirm address, project scope and available survey information', 'Gather existing drawings, photos and site constraints', 'Complete zoning and building code review', 'Coordinate architectural, structural and HVAC documentation', 'Submit the permit package and respond to municipal comments'],
    };
  }

  if (topic.includes('general contractor')) {
    return {
      answer: 'In the GTA, design-build vs general contractor is a delivery model decision. Design-build connects design, approvals, budgeting and construction management earlier, while a traditional general contractor is usually most effective after drawings, specifications and permit scope are already complete.',
      bullets: ['When drawings are complete', 'When approvals are uncertain', 'When budget feedback should shape design', 'Who manages trades, permits and inspections'],
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
      steps: ['Identify whether drawings and scope are complete', 'Review zoning, permit and engineering risk', 'Decide when budget feedback should enter design', 'Assign responsibility for trades, inspections and change control', 'Choose the delivery model before final pricing'],
    };
  }

  if (topic.includes('construction management') || topic.includes('construction manager')) {
    return {
      answer: 'GTA construction management helps control schedule, budget, trades, inspections, procurement, site communication, quality and closeout across a complex project. It is especially useful when multiple consultants, approvals and sub-trades need active coordination.',
      bullets: ['Schedule and budget controls', 'Trade and procurement coordination', 'Inspection and quality management', 'Client communication and closeout'],
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
      steps: ['Define the project controls and reporting rhythm', 'Set the baseline schedule, budget and scope tracker', 'Organize trades, procurement and site logistics', 'Manage inspections, quality control and change decisions', 'Complete PDI, closeout documents and warranty-oriented follow-up'],
    };
  }

  if (topic.includes('cost') || topic.includes('per square foot') || topic.includes('budget')) {
    return {
      answer: `${page.primaryKeyword} depends on scope, structure, site access, drawings, approvals, finish level, procurement and construction management. Reliable budgeting starts with feasibility review, then moves into permit-ready drawings, trade input, contingency planning and a construction sequence that matches the property conditions.`,
      bullets: ['Scope and existing conditions', 'Drawings, permits and engineering', 'Structural, mechanical and servicing work', 'Finish level, procurement and contingency'],
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
      steps: ['Define scope and property constraints', 'Review zoning, surveys and existing conditions', 'Coordinate drawings and engineering inputs', 'Build a budget with allowances and contingencies', 'Sequence procurement, permits, trades and inspections'],
    };
  }

  if (topic.includes('permit') || topic.includes('drawings') || topic.includes('laws') || topic.includes('approval')) {
    return {
      answer: `${page.primaryKeyword} starts with zoning and building code review, then moves into architectural drawings, structural or mechanical coordination, permit submission, municipal comments, revisions and inspection planning. Owners should confirm approval requirements before committing to final scope or construction pricing.`,
      bullets: ['Zoning and building code review', 'Architectural drawing coordination', 'Structural, HVAC or mechanical inputs', 'Permit submission and inspection planning'],
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
      steps: ['Confirm project scope and property address', 'Review zoning, code and existing drawings', 'Coordinate architectural and engineering documents', 'Submit permit package and respond to comments', 'Prepare trades, inspections and site logistics'],
    };
  }

  if (topic.includes('timeline') || topic.includes('how long')) {
    return {
      answer: `${page.primaryKeyword} is shaped by design decisions, permit review, engineering coordination, material lead times, trade availability, inspection timing and the amount of structural or mechanical work. A realistic schedule separates pre-construction planning from the active construction phase.`,
      bullets: ['Consultation and feasibility', 'Design, drawings and engineering', 'Permit review and procurement', 'Construction, inspections and closeout'],
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
      steps: ['Set project goals and target move-in window', 'Complete feasibility and concept planning', 'Prepare drawings, engineering and permits', 'Order long-lead materials and schedule trades', 'Manage construction, inspections, PDI and closeout'],
    };
  }

  if (topic.includes('design-build') || topic.includes('architect')) {
    return {
      answer: `${page.primaryKeyword} compares how project responsibility is organized. Design-build connects planning, permits, budgeting and construction management under one delivery model, while architect-led work can require more owner coordination between designers, engineers, contractors and trades.`,
      bullets: ['Single-team accountability', 'Earlier budget feedback', 'Permit and drawing coordination', 'Construction-aware design decisions'],
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
      steps: ['Clarify whether you need design only or design plus construction', 'Review zoning and permit complexity', 'Decide how budget feedback will enter design decisions', 'Assign responsibility for trades and site management', 'Choose the delivery model before drawings go too far'],
    };
  }

  if (topic.includes('neighbourhood') || topic.includes('rosedale') || topic.includes('forest hill') || topic.includes('lawrence park') || topic.includes('leaside') || topic.includes('willowdale') || topic.includes('unionville') || topic.includes('port credit') || topic.includes('lorne park')) {
    return {
      answer: `${page.primaryKeyword} should start with address-specific feasibility because mature GTA neighbourhoods can involve zoning limits, tree protection, older structures, access constraints, design continuity, permit drawings and careful construction logistics.`,
      bullets: ['Local property and streetscape context', 'Zoning, setbacks, trees and grading', 'Design fit and structural scope', 'Construction access and inspection planning'],
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
      steps: ['Start with address and survey review', 'Check zoning, trees, grading and local constraints', 'Develop concept plans with budget direction', 'Coordinate permit drawings and engineering', 'Plan construction access, trades and inspections'],
    };
  }

  return {
    answer: `${page.primaryKeyword} should be planned as a connected design-build process. The key is to confirm feasibility, drawings, approvals, budget, construction sequence and inspection requirements before committing to a final scope or contractor price.`,
    bullets: ['Early feasibility and scope review', 'Permit and drawing requirements', 'Budget drivers and construction sequencing', 'Questions to ask before committing'],
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
    steps: ['Define project goals and constraints', 'Review zoning, drawings and approvals', 'Set budget direction and scope priorities', 'Coordinate trades, procurement and schedule', 'Manage construction, inspections and closeout'],
  };
}

function createGeneratedLandingPage(page: SeoPage): DetailPageContent {
  const isServiceArea = page.key.startsWith('location-') || page.key.startsWith('community-');
  const isCommunity = page.key.startsWith('community-');
  const parent: MainPageKey = isServiceArea ? 'services' : 'blog';
  const local = getLocalMatchForSeoPage(page);
  const serviceName = getGeneratedServiceName(page);
  const guideProfile = isServiceArea ? undefined : getGuideProfile(page);

  return {
    parent,
    category: isCommunity ? 'COMMUNITY SERVICE AREA' : isServiceArea ? 'GTA SERVICE AREA' : 'TORONTO GUIDE',
    title: page.title.split('|')[0].trim(),
    subtitle: page.description,
    image: imageForSeoPage(page),
    intro: isServiceArea
      ? `Vitalite supports ${page.primaryKeyword} projects with design-build planning, drawings, permit coordination, engineering input, budget planning, site management, inspections and closeout support.${local?.context ? ` ${local.context.planningContext}` : ''}`
      : `Use this guide to understand ${page.primaryKeyword} before committing to drawings, pricing or a contractor. It explains the decisions, documents, approvals, budget assumptions and construction-management details that shape a stronger GTA project plan.`,
    bullets: isServiceArea
      ? [
          `${serviceName} feasibility`,
          local?.label ? `${local.label} zoning and approval review` : 'Local feasibility and zoning review',
          'Drawings, permits and engineering coordination',
          'Budget, trades, inspections and closeout',
        ]
      : guideProfile?.bullets ?? ['Early feasibility and scope review', 'Permit and drawing requirements', 'Budget drivers and construction sequencing', 'Questions to ask before committing'],
    sections: isServiceArea
      ? buildLocalServiceSections(page, local, serviceName)
      : guideProfile?.sections ?? [
        {
          heading: 'What Shapes The Answer',
          text: 'The right plan depends on property conditions, zoning, structural scope, drawings, engineering, finish level, procurement, inspection timing and the project delivery model.',
        },
        {
          heading: 'Design-Build Planning',
          text: 'Vitalite connects early design, permit strategy, budgeting and construction management so owners can make decisions with fewer handoff gaps between consultants and trades.',
        },
      ],
    answer: isServiceArea ? buildServiceAreaAnswer(page, local, serviceName) : guideProfile?.answer,
    steps: guideProfile?.steps,
    faqs: buildPageFaq(page),
    relatedLinks: getGeneratedRelatedLinks(page),
  };
}

function imageForSeoPage(page: SeoPage) {
  const keyword = `${page.key} ${page.primaryKeyword}`.toLowerCase();
  if (keyword.includes('garden') || keyword.includes('laneway') || keyword.includes('adu')) {
    return PLACEHOLDER_IMAGE;
  }
  if (keyword.includes('multiplex') || keyword.includes('multi-unit') || keyword.includes('suite')) {
    return PLACEHOLDER_IMAGE;
  }
  if (keyword.includes('addition') || keyword.includes('walkout') || keyword.includes('storey')) {
    return PLACEHOLDER_IMAGE;
  }
  if (keyword.includes('permit') || keyword.includes('drawings') || keyword.includes('manager') || keyword.includes('management') || keyword.includes('proposal') || keyword.includes('checklist') || keyword.includes('general contractor')) {
    return PLACEHOLDER_IMAGE;
  }
  return PLACEHOLDER_IMAGE;
}

const subPageHeroes: Record<MainPageKey, { category: string; title: string; desc: string; image: string }> = {
  services: {
    category: 'SERVICES',
    title: 'Full-Service Design-Build Renovations in the GTA',
    desc: 'Vitalite brings consultation, drawings, permits, engineering coordination, construction management and delivery under one accountable Toronto-area team.',
    image: PLACEHOLDER_IMAGE,
  },
  'why-vitalite': {
    category: 'WHY VITALITE',
    title: 'A Toronto Design-Build Partner Built for Complex Projects',
    desc: 'We combine local permit knowledge, disciplined construction management and residential-commercial delivery experience so clients can move from idea to occupancy with fewer gaps.',
    image: PLACEHOLDER_IMAGE,
  },
  'our-work': {
    category: 'OUR WORK',
    title: 'Custom Homes, Multiplex Housing, Additions and ICI Projects',
    desc: 'Our work categories reflect the projects GTA owners, investors and commercial clients ask for most.',
    image: PLACEHOLDER_IMAGE,
  },
  blog: {
    category: 'BLOG',
    title: 'Toronto Building Guides for Owners and Investors',
    desc: 'Practical articles for people planning custom homes, multiplex conversions, additions, garden suites, permits, budgets and construction timelines in the GTA.',
    image: PLACEHOLDER_IMAGE,
  },
  'contact-us': {
    category: 'CONTACT US',
    title: 'Start With a Clear Project Conversation',
    desc: 'Tell us what you are planning, where the property is located and what stage you are in. Vitalite can help clarify scope, approvals, budget and construction path.',
    image: PLACEHOLDER_IMAGE,
  },
};

const processSteps = [
  'Initial Consultation',
  'On-Site Evaluation',
  'Conceptual Design',
  'Budgetary Plan & Quotation',
  'Contract Agreement',
  'Zoning Review & Permit Drawings',
  'Building Code Review & Permits',
  'Construction, PDI & Warranty',
];

const SubPageHeading = ({ title, dark = false }: { title: string; dark?: boolean }) => (
  <div className="mb-10">
    <div className="w-16 h-1 bg-kiewit-yellow mb-6"></div>
    <h2 className={`text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight ${dark ? 'text-black' : 'text-white'}`}>
      {title}
    </h2>
  </div>
);

const SubPageHero = ({ page }: { page: MainPageKey }) => {
  const hero = subPageHeroes[page];

  return (
    <div className="relative h-[74svh] min-h-[560px] md:min-h-[620px] w-full overflow-hidden bg-black">
      <motion.div
        key={page}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        className="absolute inset-0"
      >
        <img src={hero.image} alt={hero.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45"></div>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent pointer-events-none"></div>

      <div className="relative h-full flex items-center px-5 sm:px-8 md:px-24 pt-20">
        <div className="max-w-4xl text-white">
          <div className="inline-block border-b border-white pb-1 mb-6 text-[11px] font-bold tracking-[0.2em] uppercase">
            {hero.category}
          </div>
          <h1 className="text-[2.45rem] sm:text-5xl md:text-7xl font-bold mb-6 leading-[1.08] tracking-tight text-white drop-shadow-md">
            {hero.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl max-w-3xl mb-8 font-light text-gray-200">
            {hero.desc}
          </p>
          <a href={routeHref('contact-us')} className="group inline-flex items-center text-lg sm:text-xl font-medium hover:text-gray-300 transition-colors">
            Start a consultation
            <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};

const CardRail = ({ cards }: { cards: ImageCard[] }) => (
  <div className="flex gap-6 overflow-x-auto pb-8 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
    {cards.map((card) => (
      <a key={card.title} href={routeHrefFromLegacyHash(card.href ?? '#contact-us')} className="min-w-[82vw] sm:min-w-[300px] md:min-w-[360px] h-[430px] sm:h-[500px] rounded-2xl overflow-hidden relative group cursor-pointer snap-start shrink-0 block">
        <img src={card.image} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
          {card.eyebrow && <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-kiewit-yellow mb-3">{card.eyebrow}</div>}
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{card.title}</h3>
          <p className="text-sm text-gray-200 leading-relaxed mb-5">{card.summary}</p>
          <div className="flex items-center text-[15px] font-medium text-white group-hover:text-gray-300 transition-colors">
            Read more <ChevronRight className="w-5 h-5 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </a>
    ))}
  </div>
);

const CardGrid = ({ cards }: { cards: ImageCard[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {cards.map((card) => (
      <a key={card.title} href={routeHrefFromLegacyHash(card.href ?? '#contact-us')} className="h-[330px] sm:h-[390px] rounded-2xl overflow-hidden relative group cursor-pointer block">
        <img src={card.image} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-5 sm:p-7 w-full">
          <h3 className="text-xl sm:text-[24px] font-bold text-white leading-tight mb-3">{card.title}</h3>
          <p className="text-sm text-gray-200 leading-relaxed">{card.summary}</p>
        </div>
        <Plus className="absolute right-6 bottom-6 w-6 h-6 text-white" />
      </a>
    ))}
  </div>
);

const TextCardGrid = ({ cards, dark = false }: { cards: TextCard[]; dark?: boolean }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {cards.map((card) => {
      const cardClass = dark
        ? 'group border border-white/10 bg-white/5 rounded-2xl p-6 sm:p-8 text-white hover:border-kiewit-yellow transition-colors'
        : 'group border border-gray-200 bg-white rounded-2xl p-6 sm:p-8 text-black shadow-sm hover:border-kiewit-yellow transition-colors';
      const content = (
        <>
          {card.eyebrow ? (
            <div className={`text-[11px] font-bold tracking-[0.18em] uppercase mb-4 ${dark ? 'text-kiewit-yellow' : 'text-gray-500 group-hover:text-kiewit-yellow'}`}>
              {card.eyebrow}
            </div>
          ) : null}
          <h3 className="text-2xl sm:text-3xl font-semibold leading-tight mb-5">{card.title}</h3>
          <p className={`text-base leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{card.text}</p>
          {card.pageKey ? (
            <div className={`mt-6 inline-flex items-center text-sm font-bold tracking-[0.12em] uppercase ${dark ? 'text-kiewit-yellow' : 'text-black group-hover:text-kiewit-yellow'}`}>
              View page <ChevronRight className="w-4 h-4 ml-2" />
            </div>
          ) : null}
        </>
      );

      return card.pageKey ? (
        <a key={card.title} href={routeHref(card.pageKey)} className={cardClass}>
          {content}
        </a>
      ) : (
        <article key={card.title} className={cardClass}>
          {content}
        </article>
      );
    })}
  </div>
);

const MainPageFaq = ({ faqs, dark = false }: { faqs: Array<{ question: string; answer: string }>; dark?: boolean }) => {
  if (!faqs.length) return null;

  return (
    <section className={`${dark ? 'bg-kiewit-dark text-white' : 'bg-white text-black'} py-20 md:py-28 px-5 sm:px-8 md:px-24`}>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-5xl mx-auto">
        <SubPageHeading title="Frequently Asked Questions" dark={!dark} />
        <div className={`divide-y ${dark ? 'divide-white/10 border-y border-white/10' : 'divide-gray-200 border-y border-gray-200'}`}>
          {faqs.map((item) => (
            <article key={item.question} className="py-7">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">{item.question}</h2>
              <p className={`text-base sm:text-lg leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{item.answer}</p>
            </article>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

const SeoHubPage = ({ pageKey }: { pageKey: 'locations-hub' | 'communities-hub' }) => {
  const seoPage = seoPages.find((page) => page.key === pageKey);
  const isLocations = pageKey === 'locations-hub';
  const cards = isLocations ? locationSeoCards : communitySeoCards;
  const category = isLocations ? 'GTA SERVICE AREAS' : 'NEIGHBOURHOOD SERVICE AREAS';
  const title = seoPage?.title.split('|')[0].trim() ?? (isLocations ? 'GTA Design-Build Service Areas' : 'Toronto & GTA Neighbourhood Construction Pages');
  const subtitle =
    seoPage?.description ??
    (isLocations
      ? 'Browse Vitalite city pages for custom homes, garden suites, multiplexes and additions across the GTA.'
      : 'Browse Vitalite neighbourhood pages for custom homes, renovations, garden suites, multiplexes and permit drawings.');
  const intro = isLocations
    ? 'These city pages stay outside the main navigation so the site remains clean, while still giving Google, AI search engines and owners a crawlable path into local design-build service pages.'
    : 'These neighbourhood pages follow the Gallery-style SEO pattern: they are available through internal links, sitemap and search, but they do not crowd the homepage or primary navigation.';
  const faqs = seoPage ? buildPageFaq(seoPage) : [];

  return (
    <>
      <div className="relative h-[62vh] min-h-[520px] bg-kiewit-dark overflow-hidden">
        <img
          src={isLocations ? PLACEHOLDER_IMAGE : PLACEHOLDER_IMAGE}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/15"></div>
        <div className="relative h-full flex items-center px-5 sm:px-8 md:px-24 pt-20">
          <div className="max-w-4xl text-white">
            <a href={routeHref('services')} className="inline-block border-b border-white pb-1 mb-6 text-[11px] font-bold tracking-[0.2em] uppercase hover:text-kiewit-yellow transition-colors">
              {category}
            </a>
            <h1 className="text-[2.35rem] sm:text-5xl md:text-7xl font-bold mb-6 leading-[1.08] tracking-tight text-white drop-shadow-md">
              {title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl max-w-3xl mb-8 font-light text-gray-200">{subtitle}</p>
            <a href={routeHref('contact-us')} className="group inline-flex items-center text-lg sm:text-xl font-medium hover:text-gray-300 transition-colors">
              Start a project review
              <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-[1400px] mx-auto">
          <SubPageHeading title={isLocations ? 'City Service Pages' : 'Community Service Pages'} dark />
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">{intro}</p>
          <CardGrid cards={cards} />
        </motion.div>
      </section>

      {faqs.length ? (
        <section className="bg-kiewit-dark py-20 md:py-28 px-5 sm:px-8 md:px-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-5xl mx-auto">
            <SubPageHeading title="FAQ" />
            <div className="divide-y divide-white/10 border-y border-white/10">
              {faqs.map((item) => (
                <article key={item.question} className="py-7">
                  <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">{item.question}</h2>
                  <p className="text-base sm:text-lg text-gray-300 leading-relaxed">{item.answer}</p>
                </article>
              ))}
            </div>
          </motion.div>
        </section>
      ) : null}
    </>
  );
};

const ProjectStatusBadge = ({ status, label }: { status: string; label: string }) => {
  const colour =
    status === 'ongoing-2025'
      ? 'bg-kiewit-yellow text-black'
      : status === 'coming-2026'
      ? 'bg-white/20 text-white border border-white/40'
      : 'bg-white/10 text-gray-300 border border-white/20';
  return (
    <span className={`inline-block px-3 py-1 text-[11px] font-bold tracking-[0.15em] uppercase rounded ${colour}`}>
      {label}
    </span>
  );
};

const DetailPage = ({ pageKey }: { pageKey: string }) => {
  const page = allDetailPages[pageKey];
  const projectCards: Array<{ project: ProjectEntry; content: DetailPageContent }> = (page.projectKeys ?? [])
    .map((key) => {
      const project = projectsByKey.get(key);
      const content = generatedProjectDetailPages[key];
      return project && content ? { project, content } : null;
    })
    .filter((x): x is { project: ProjectEntry; content: DetailPageContent } => x !== null);

  return (
    <>
      <div className="relative h-[72svh] min-h-[540px] md:min-h-[600px] w-full overflow-hidden bg-black">
        <motion.div
          key={pageKey}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img src={page.image} alt={page.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50"></div>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent pointer-events-none"></div>
        <div className="relative h-full flex items-center px-5 sm:px-8 md:px-24 pt-20">
          <div className="max-w-4xl text-white">
            <a href={routeHref(page.parent)} className="inline-block border-b border-white pb-1 mb-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:text-kiewit-yellow transition-colors">
              {page.category}
            </a>
            {page.isProject && page.projectMeta ? (
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <ProjectStatusBadge status={page.projectMeta.status} label={page.projectMeta.statusLabel} />
                <span className="text-[13px] font-medium text-gray-300">{page.projectMeta.location} · {page.projectMeta.size}</span>
              </div>
            ) : null}
            <h1 className="text-[2.35rem] sm:text-5xl md:text-7xl font-bold mb-6 leading-[1.08] tracking-tight text-white drop-shadow-md">
              {page.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl max-w-3xl mb-8 font-light text-gray-200">
              {page.subtitle}
            </p>
            <a href={routeHref('contact-us')} className="group inline-flex items-center text-lg sm:text-xl font-medium hover:text-gray-300 transition-colors">
              {page.isProject ? 'Start a similar project' : 'Discuss this project type'}
              <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-16">
          <div>
            <SubPageHeading title={page.title} dark />
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-10">
              {page.intro}
            </p>
            {page.answer ? (
              <div className="border-l-4 border-kiewit-yellow bg-gray-50 p-5 sm:p-6 mb-10">
                <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-3">Short Answer</div>
                <p className="text-base sm:text-lg text-gray-800 leading-relaxed">{page.answer}</p>
              </div>
            ) : null}
            <a href={routeHref(page.parent)} className="group inline-flex items-center text-lg sm:text-xl font-medium text-black hover:text-gray-600 transition-colors">
              Back to {navItems.find((item) => item.key === page.parent)?.label ?? 'Our Work'}
              <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {page.bullets.map((item) => (
              <div key={item} className="border border-gray-200 bg-gray-50 rounded-lg p-5 text-black font-medium">
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {page.sections.length > 0 ? (
        <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {page.sections.map((section) => (
              <article key={section.heading} className="border border-white/10 bg-white/5 rounded-2xl p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-medium text-white mb-5">{section.heading}</h2>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed">{section.text}</p>
              </article>
            ))}
          </motion.div>
        </section>
      ) : null}

      {projectCards.length > 0 ? (
        <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
            <SubPageHeading title="Projects in This Category" dark />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectCards.map(({ project, content }) => (
                <a key={project.key} href={routeHref(project.key)} className="group border border-gray-200 rounded-2xl overflow-hidden hover:border-kiewit-yellow transition-colors bg-gray-50">
                  <div className="aspect-[16/9] bg-kiewit-dark overflow-hidden">
                    <img src={PLACEHOLDER_IMAGE} alt={content.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <ProjectStatusBadge status={project.status} label={projectStatusLabels[project.status]} />
                      <span className="text-[11px] text-gray-500 font-medium">{project.locationLabel}</span>
                    </div>
                    <h3 className="text-base font-semibold text-black leading-snug mb-2 group-hover:text-kiewit-yellow transition-colors">
                      {content.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{project.headline}</p>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        </section>
      ) : null}

      {page.steps?.length ? (
        <section className="bg-white text-black py-16 md:py-24 px-5 sm:px-8 md:px-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
            <SubPageHeading title="Planning Sequence" dark />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {page.steps.map((step, index) => (
                <article key={step} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                  <div className="text-3xl font-bold text-kiewit-yellow mb-4">{String(index + 1).padStart(2, '0')}</div>
                  <h2 className="text-base font-semibold leading-snug">{step}</h2>
                </article>
              ))}
            </div>
          </motion.div>
        </section>
      ) : null}

      {page.relatedLinks?.length ? (
        <section className="bg-white text-black py-16 md:py-24 px-5 sm:px-8 md:px-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
            <SubPageHeading title="Related Vitalite Pages" dark />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {page.relatedLinks.map((link) => (
                <a key={link.key} href={routeHref(link.key)} className="border border-gray-200 rounded-lg p-5 font-semibold hover:border-kiewit-yellow hover:bg-gray-50 transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        </section>
      ) : null}

      {page.faqs?.length ? (
        <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-5xl mx-auto">
            <SubPageHeading title="Frequently Asked Questions" dark />
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {page.faqs.map((faq) => (
                <article key={faq.question} className="py-7">
                  <h2 className="text-xl sm:text-2xl font-semibold text-black mb-3">{faq.question}</h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{faq.answer}</p>
                </article>
              ))}
            </div>
          </motion.div>
        </section>
      ) : null}
    </>
  );
};

const ServicesPage = () => (
  <>
    <SubPageHero page="services" />
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeInVariants} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <SubPageHeading title="Full-Service Design-Build Renovations Include:" />
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
            Vitalite packages the front-end planning, approval work and site execution that Toronto-area owners usually have to coordinate across separate teams.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {serviceInclusions.map((item) => (
            <a key={item.href} href={routeHrefFromLegacyHash(item.href)} className="border border-white/10 bg-white/5 rounded-lg p-5 text-white font-medium hover:border-kiewit-yellow hover:text-kiewit-yellow transition-colors">
              {item.label}
            </a>
          ))}
        </div>
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-[1400px] mx-auto">
        <SubPageHeading title="Toronto-Area Service Lines" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-3xl mb-12 md:mb-16">
          A Toronto service structure adapted to Vitalite's actual business scope across custom homes, multiplex housing, additions, permits, project management and ICI work.
        </p>
        <CardRail cards={servicePageCards} />
      </motion.div>
    </section>
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="How Vitalite Organizes the Work" />
        <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          The services are not separate menu items only. They form one managed path from early planning to approvals, construction and handover.
        </p>
        <TextCardGrid cards={serviceWorkflowCards} dark />
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="Choose the Right Starting Point" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          Owners often arrive at different stages. These paths help you enter the process based on what is already known and what still needs to be resolved.
        </p>
        <TextCardGrid cards={serviceStartingPointCards} />
      </motion.div>
    </section>
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-[1400px] mx-auto">
        <SubPageHeading title="GTA Service Area Pages" />
        <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          City and district pages are organized around the way owners search for local design-build help across custom homes, garden suites, multiplex projects and additions.
        </p>
        <CardGrid cards={locationSeoCards} />
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-[1400px] mx-auto">
        <SubPageHeading title="Neighbourhood & Community Pages" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          Community pages target the smaller Toronto and GTA search patterns that owners use for custom homes, additions, garden suites, multiplex projects and permit-ready planning.
        </p>
        <CardGrid cards={communitySeoCards} />
      </motion.div>
    </section>
    <MainPageFaq faqs={servicesFaqs} dark />
  </>
);

const WhyVitalitePage = () => (
  <>
    <SubPageHero page="why-vitalite" />
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="Why Vitalite" />
        <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-4xl mb-12 md:mb-14">
          Vitalite is positioned as a one-stop design-build and construction management partner, not just a construction crew and not just a drawing office. The value is coordinated accountability from planning to closeout.
        </p>
        <CardGrid cards={whyPageCards} />
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="What Makes the Model Different" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          Vitalite is built for owners who need decisions, approvals and construction to stay connected instead of handing a project from one disconnected party to the next.
        </p>
        <TextCardGrid cards={whyProofCards} />
      </motion.div>
    </section>
    <section className="bg-kiewit-blue py-20 md:py-32 px-5 sm:px-8">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium text-center text-white mb-12 md:mb-16 tracking-tight">
          The Vitalite Way
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {processSteps.map((step, index) => (
            <div key={step} className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent mb-4 md:mb-5 tracking-tighter" style={{ WebkitTextStroke: '2px var(--color-kiewit-yellow)' }}>
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="text-lg md:text-xl text-white font-medium leading-tight">{step}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="Owner Control Points" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          A design-build process should make decisions visible before they become expensive field changes. These are the points where Vitalite helps owners keep control.
        </p>
        <TextCardGrid cards={whyControlCards} />
      </motion.div>
    </section>
    <MainPageFaq faqs={whyVitaliteFaqs} dark />
  </>
);

const OurWorkPage = () => (
  <>
    <SubPageHero page="our-work" />
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-3xl">
            <SubPageHeading title="Our Work" dark />
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light">
              Project categories are organized the way Toronto clients search: custom homes, condos, multiplex housing, garden suites, additions, full interiors and managed construction.
            </p>
          </div>
          <a href={routeHref('contact-us')} className="group inline-flex items-center text-lg sm:text-xl font-medium text-black hover:text-gray-600 transition-colors">
            View all before + afters <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <CardGrid cards={workPageCards} />
      </motion.div>
    </section>
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="How Vitalite Frames Project Work" />
        <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          The work section is organized around client intent: build a new home, add density, expand a property, modernize interiors or deliver a practical ICI space.
        </p>
        <TextCardGrid cards={workFrameworkCards} dark />
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="What to Look For in a Project" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          Finished images matter, but complex GTA projects also need evidence of planning quality, approval readiness, site management and closeout discipline.
        </p>
        <TextCardGrid cards={workEvidenceCards} />
      </motion.div>
    </section>
    <MainPageFaq faqs={ourWorkFaqs} dark />
  </>
);

const BlogPage = () => (
  <>
    <SubPageHero page="blog" />
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-3xl">
            <SubPageHeading title="Our Most Popular Content" />
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-light">
              A Toronto content plan focused on costs, timelines, approvals and owner decisions in the GTA.
            </p>
          </div>
          <a href={routeHref('blog')} className="group inline-flex items-center text-lg sm:text-xl font-medium text-white hover:text-gray-300 transition-colors">
            View Blog In Full <ChevronRight className="w-6 h-6 ml-2 text-kiewit-yellow group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <CardGrid cards={blogPageCards} />
      </motion.div>
    </section>
    <section className="bg-gray-100 text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="Find the Guide That Matches Your Decision" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          Vitalite's content hub is built around the questions owners ask before hiring a builder: cost, permits, timeline, delivery model, local constraints and investment potential.
        </p>
        <TextCardGrid cards={blogIntentCards} />
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-[1400px] mx-auto">
        <SubPageHeading title="Toronto Long-Tail Planning Guides" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          These pages target the specific permit, cost, timing and project-planning questions GTA homeowners and investors search before contacting a contractor.
        </p>
        <CardGrid cards={longTailSeoCards} />
      </motion.div>
    </section>
    <MainPageFaq faqs={blogFaqs} dark />
  </>
);

const ContactForm = () => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setStatus('success');
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-kiewit-dark text-white rounded-2xl p-10 text-center space-y-4">
        <div className="text-kiewit-yellow text-5xl font-bold">&#10003;</div>
        <h3 className="text-2xl font-bold">Message Received</h3>
        <p className="text-gray-300">We typically respond within one business day.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-kiewit-yellow text-sm underline underline-offset-2"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-kiewit-dark text-white rounded-2xl p-6 sm:p-8 md:p-10 space-y-5">
      <div>
        <label className="block text-sm font-semibold tracking-[0.12em] uppercase mb-2">Name</label>
        <input name="name" required className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 outline-none focus:border-kiewit-yellow" placeholder="Your name" />
      </div>
      <div>
        <label className="block text-sm font-semibold tracking-[0.12em] uppercase mb-2">Email</label>
        <input name="email" type="email" required className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 outline-none focus:border-kiewit-yellow" placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-sm font-semibold tracking-[0.12em] uppercase mb-2">Project Type</label>
        <input name="project_type" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 outline-none focus:border-kiewit-yellow" placeholder="Custom home, addition, permit, multiplex..." />
      </div>
      <div>
        <label className="block text-sm font-semibold tracking-[0.12em] uppercase mb-2">Project Details</label>
        <textarea name="message" className="w-full min-h-[150px] bg-white/10 border border-white/20 rounded-lg px-4 py-3 outline-none focus:border-kiewit-yellow" placeholder="Tell us the property location, project stage, budget direction and timeline." />
      </div>
      {status === 'error' && (
        <p className="text-red-400 text-sm">
          Something went wrong. Please email us directly at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full bg-kiewit-yellow text-black font-bold tracking-[0.08em] uppercase py-4 rounded-lg hover:bg-white transition-colors disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending...' : 'Start Consultation'}
      </button>
    </form>
  );
};

const ContactPage = () => (
  <>
    <SubPageHero page="contact-us" />
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <SubPageHeading title="Contact Us" dark />
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-10">
            Share the property location, project type and current stage. Vitalite reviews design-build, permit, construction management and ICI inquiries across Toronto and the GTA, then helps clarify scope, approval path, budget direction and delivery model.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="border border-gray-200 rounded-2xl p-5">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-2">Phone</div>
              <a href={`tel:${CONTACT_PHONE_TEL}`} className="text-xl font-bold hover:text-kiewit-yellow transition-colors">{CONTACT_PHONE_DISPLAY}</a>
            </div>
            <div className="border border-gray-200 rounded-2xl p-5">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-2">Email</div>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-base font-bold break-all hover:text-kiewit-yellow transition-colors">{CONTACT_EMAIL}</a>
            </div>
            <div className="border border-gray-200 rounded-2xl p-5 sm:col-span-2">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-2">Office</div>
              <div className="text-base font-bold">{CONTACT_ADDRESS_LINE1}</div>
              <div className="text-base font-bold">{CONTACT_ADDRESS_LINE2}</div>
            </div>
          </div>
          <div className="space-y-5">
            {['Custom home or rebuild', 'Multiplex, garden suite or laneway house', 'Addition, alteration or full renovation', 'Drawings, permits and engineering coordination', 'Commercial, industrial or institutional project'].map((item) => (
              <div key={item} className="flex items-start gap-4 text-base sm:text-lg font-medium">
                <span className="w-3 h-3 bg-kiewit-yellow rounded-full shrink-0 mt-1.5"></span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <ContactForm />
      </motion.div>
    </section>
    <section className="bg-kiewit-dark py-20 md:py-28 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="What Happens After You Reach Out" />
        <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          The first conversation is used to identify the right next step, not to force every inquiry into the same construction quote.
        </p>
        <TextCardGrid cards={contactNextStepCards} dark />
      </motion.div>
    </section>
    <section className="bg-gray-100 text-black py-20 md:py-28 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <SubPageHeading title="What To Include" dark />
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-8">
            Clear intake details help Vitalite identify whether the next step should be feasibility review, drawings, permit coordination, budgeting or construction planning.
          </p>
          <div className="space-y-4">
            {contactIntakeItems.map((item) => (
              <div key={item} className="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm">
                <span className="w-3 h-3 bg-kiewit-yellow rounded-full shrink-0 mt-1.5"></span>
                <span className="text-base sm:text-lg font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SubPageHeading title="Project Paths" dark />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactPriorityLinks.map((item) => (
              <a key={item.key} href={routeHref(item.key)} className="group bg-white rounded-2xl p-5 min-h-[132px] flex flex-col justify-between shadow-sm hover:bg-kiewit-dark hover:text-white transition-colors">
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 group-hover:text-kiewit-yellow">Start here</span>
                <span className="text-lg font-bold leading-snug">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-28 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-5xl mx-auto">
        <SubPageHeading title="Contact FAQ" dark />
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {contactFaqs.map((item) => (
            <div key={item.question} className="py-7">
              <h3 className="text-xl sm:text-2xl font-bold mb-3">{item.question}</h3>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  </>
);

const Footer = ({ language }: { language: Language }) => {
  return (
    <footer className="w-full">
      <div className="bg-black py-16 md:py-20 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
            <div className="border-2 border-white px-4 py-2 text-white font-bold text-xl tracking-widest whitespace-nowrap">
              {copy('GTA DESIGN-BUILD', language)}
            </div>
            <div className="flex flex-wrap justify-start md:justify-end gap-x-10 gap-y-4 text-white text-[15px]">
              {navItems.map((item) => (
                <a key={item.key} href={routeHref(item.key)} className="hover:text-kiewit-yellow transition-colors">
                  {copy(item.label, language)}
                </a>
              ))}
              {footerSeoLinks.map((item) => (
                <a key={item.key} href={routeHref(item.key)} className="hover:text-kiewit-yellow transition-colors">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row flex-wrap gap-6 text-[14px] text-gray-400">
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="hover:text-kiewit-yellow transition-colors">{CONTACT_PHONE_DISPLAY}</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-kiewit-yellow transition-colors">{CONTACT_EMAIL}</a>
            <span>{CONTACT_ADDRESS_LINE1}, {CONTACT_ADDRESS_LINE2}</span>
          </div>
        </div>
      </div>
      <div className="bg-kiewit-yellow py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-start gap-12">
          <div className="flex space-x-4">
            {[
              { Icon: Facebook, id: 'fb', label: 'Facebook', href: 'https://www.facebook.com/vitaliteconstruction' },
              { Icon: Instagram, id: 'ig', label: 'Instagram', href: 'https://www.instagram.com/vitalite_construction' },
              { Icon: Linkedin, id: 'li', label: 'LinkedIn', href: 'https://www.linkedin.com/company/vitalite-construction' },
            ].map(({ Icon, id, label, href }) => (
              <a key={id} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-kiewit-yellow hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" fill="currentColor" strokeWidth={0} />
              </a>
            ))}
          </div>
          <div className="text-black text-sm">
            <p className="font-bold">{copy('(c) 2026 Vitalite Construction Corp. All rights reserved.', language)}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

const HomePage = () => (
  <>
    <Hero />
    <IntegratedSolutions />
    <Stats />
    <Expertise />
    <Markets />
    <ProjectProcess />
  </>
);

const renderPage = (activePage: PageKey) => {
  if (activePage === 'locations-hub' || activePage === 'communities-hub') {
    return <SeoHubPage pageKey={activePage} />;
  }

  if (Object.prototype.hasOwnProperty.call(allDetailPages, activePage)) {
    return <DetailPage pageKey={activePage} />;
  }

  switch (activePage) {
    case 'services':
      return <ServicesPage />;
    case 'why-vitalite':
      return <WhyVitalitePage />;
    case 'our-work':
      return <OurWorkPage />;
    case 'blog':
      return <BlogPage />;
    case 'contact-us':
      return <ContactPage />;
    case 'home':
    default:
      return <HomePage />;
  }
};

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>(() => resolvePage());
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem('vitalite-language') === 'fr' ? 'fr' : 'en';
  });
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const syncPage = () => setActivePage(resolvePage());
    window.addEventListener('hashchange', syncPage);
    window.addEventListener('popstate', syncPage);
    syncPage();
    return () => {
      window.removeEventListener('hashchange', syncPage);
      window.removeEventListener('popstate', syncPage);
    };
  }, []);

  useEffect(() => {
    const handleInternalRouteClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target || anchor.getAttribute('href') === '#') return;

      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;

      const pageKey = getPageKeyFromUrl(url) as PageKey | null;
      if (!pageKey) return;

      event.preventDefault();
      window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
      setActivePage(pageKey);
    };

    document.addEventListener('click', handleInternalRouteClick);
    return () => document.removeEventListener('click', handleInternalRouteClick);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  useEffect(() => {
    applySeo(activePage);
  }, [activePage]);

  useEffect(() => {
    document.documentElement.lang = language === 'fr' ? 'fr-CA' : 'en';
    window.localStorage.setItem('vitalite-language', language);
    window.setTimeout(() => translateVisibleText(language), 0);
  }, [activePage, language, searchOpen]);

  return (
    <div className="font-sans antialiased text-white bg-kiewit-dark">
      <Navbar activePage={activePage} language={language} onLanguageChange={setLanguage} onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} language={language} />
      {renderPage(activePage)}
      <Footer language={language} />
    </div>
  );
}
