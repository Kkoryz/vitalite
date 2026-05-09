import React, { Suspense, useEffect, useRef, useState } from 'react';
const ToolsHub = React.lazy(() => import('./Calculators').then((m) => ({ default: m.ToolsHub })));
const AdditionCostCalculator = React.lazy(() => import('./Calculators').then((m) => ({ default: m.AdditionCostCalculator })));
const LanewayCostCalculator = React.lazy(() => import('./Calculators').then((m) => ({ default: m.LanewayCostCalculator })));
const TeardownDecisionTool = React.lazy(() => import('./Calculators').then((m) => ({ default: m.TeardownDecisionTool })));
const PermitTimelineEstimator = React.lazy(() => import('./Calculators').then((m) => ({ default: m.PermitTimelineEstimator })));
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Menu,
  Pause,
  PhoneCall,
  Play,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  getLeadDisqualification,
  shouldShowMobileContactBar,
  type LeadInquiryType,
} from './leadQualification';
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
import seoContexts from './seo-contexts.json';

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
  image?: string;
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
  officialResources?: Array<{ label: string; url: string; note?: string }>;
  projectKeys?: string[];
  isProject?: boolean;
  projectMeta?: {
    status: string;
    statusLabel: string;
    location: string;
    size: string;
    headline: string;
    narrative: string[];
    duration?: string;
    approvalPath?: string;
    projectType?: string;
    permitRoute?: string;
    scope: string[];
    outcome?: string;
  };
};

type Language = 'en' | 'fr';
type LocalSeoContext = {
  planningContext: string;
  projectFit: string;
  approvalFocus: string;
  serviceNotes?: Record<string, { serviceScope: string; shortAnswer: string; introNote?: string; readinessNote?: string; helpNote?: string }>;
};
type SeoDataWithLocalContext = typeof seoData & {
  locations?: Array<{ slug: string; name: string }>;
  communityLocations?: Array<{ slug: string; name: string; municipality: string }>;
  locationServices?: Array<{ keyPrefix: string; serviceName: string }>;
  communityServices?: Array<{ keyPrefix: string; serviceName: string }>;
  locationContexts?: Record<string, LocalSeoContext>;
  communityContexts?: Record<string, LocalSeoContext>;
};
type SeoContextData = Pick<SeoDataWithLocalContext, 'locationContexts' | 'communityContexts'>;
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
  { key: 'tools-hub', label: 'Free Tools' },
];

const pageKeys = navItems.map((item) => item.key);

const routeHref = (key: PageKey | MainPageKey | DetailPageKey) => getRouteHref(key);
const routeHrefFromLegacyHash = (href?: string) => getRouteHrefFromLegacyHash(href);
const mergeSeoContextData = <T extends SeoDataWithLocalContext>(base: T, contexts: SeoContextData): T => ({
  ...base,
  locationContexts: {
    ...(base.locationContexts ?? {}),
    ...(contexts.locationContexts ?? {}),
  },
  communityContexts: {
    ...(base.communityContexts ?? {}),
    ...(contexts.communityContexts ?? {}),
  },
});

const localSeoData = mergeSeoContextData(seoData as SeoDataWithLocalContext, seoContexts as SeoContextData);
const staticSeoPageKeys = [
  'locations-hub', 'communities-hub', 'faq', 'ai-gta-design-build-guide',
  'tools-hub', 'tool-addition-cost', 'tool-laneway-cost', 'tool-teardown-decision', 'tool-permit-timeline',
];

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

const visualAsset = (fileName: string) => publicAsset(`seo-placeholders/${fileName}.webp`);
const visuals = {
  designBuild: visualAsset('gta-design-build'),
  customHome: visualAsset('custom-home'),
  multiplex: visualAsset('multiplex-laneway'),
  gardenSuite: visualAsset('garden-suite'),
  addition: visualAsset('home-addition'),
  permits: visualAsset('permits-engineering'),
  management: visualAsset('construction-management'),
  ici: visualAsset('ici-construction'),
  process: visualAsset('vitalite-way'),
  willowdale: visualAsset('willowdale-custom-home'),
  renovationCost: visualAsset('renovation-cost'),
  multiplexCost: visualAsset('multiplex-cost'),
  permitGuide: visualAsset('permit-drawings-guide'),
  siteEvaluation: visualAsset('site-evaluation'),
  architectural: visualAsset('architectural-services'),
  interiorDesign: visualAsset('interior-design'),
  rendering: visualAsset('rendering'),
  materialSelection: visualAsset('material-selection'),
  boardApprovals: visualAsset('board-approvals'),
  apartment: visualAsset('apartment-renovations'),
  condo: visualAsset('condo-renovations'),
  heritage: visualAsset('heritage-renovations'),
  loft: visualAsset('loft-renovations'),
  gutRenovation: visualAsset('gut-renovations'),
  proofReferences: visualAsset('proof-references'),
  news: visualAsset('in-the-news'),
  buyerGuide: visualAsset('buyers-renovation-guide'),
  timeline: visualAsset('renovation-timeline'),
  fixerUpper: visualAsset('fixer-upper-vs-new'),
  designBuildVsArchitect: visualAsset('design-build-vs-architect'),
  bulletConceptLayouts: visualAsset('bullet-concept-layouts'),
  bulletPermitPackages: visualAsset('bullet-permit-packages'),
  bulletZoningReview: visualAsset('bullet-zoning-review'),
  bulletScopeCoordination: visualAsset('bullet-scope-coordination'),
  bulletSiteFeasibility: visualAsset('bullet-site-feasibility'),
  bulletBudgetPlanning: visualAsset('bullet-budget-planning'),
  bulletTradeScheduling: visualAsset('bullet-trade-scheduling'),
  bulletQualityInspection: visualAsset('bullet-quality-inspection'),
  bulletMepCoordination: visualAsset('bullet-mep-coordination'),
  bulletFireEgress: visualAsset('bullet-fire-egress'),
  bulletClientCommunication: visualAsset('bullet-client-communication'),
  bulletCloseoutWarranty: visualAsset('bullet-closeout-warranty'),
  serviceCustomHome: visualAsset('service-custom-home-design-build'),
  serviceMultiplex: visualAsset('service-multiplex-construction'),
  serviceGardenLaneway: visualAsset('service-garden-laneway-house'),
  serviceHomeAdditions: visualAsset('service-home-additions-renovations'),
  servicePermitsEngineering: visualAsset('service-drawings-permits-engineering'),
  serviceProjectManagement: visualAsset('service-project-construction-management'),
  serviceIci: visualAsset('service-ici-design-build'),
  serviceSiteManagement: visualAsset('service-construction-site-management'),
  serviceTownhouse: visualAsset('service-townhouse-renovations'),
  whyAboutUs: visualAsset('why-about-us'),
  whyVitaliteWay: visualAsset('why-vitalite-way'),
  workOverview: visualAsset('ai-work-overview'),
  workCustomHomes: visualAsset('ai-work-custom-homes'),
  workMultiplex: visualAsset('ai-work-multiplex'),
  workGardenSuites: visualAsset('ai-work-garden-suites'),
  workAdditions: visualAsset('ai-work-additions'),
  workIci: visualAsset('ai-work-ici'),
  workFullInteriors: visualAsset('ai-work-full-interiors'),
  workCondos: visualAsset('ai-work-condos-apartments'),
  workLofts: visualAsset('ai-work-lofts-open-concept'),
  workOlderHomes: visualAsset('ai-work-older-toronto-homes'),
  workTownhouses: visualAsset('ai-work-townhouses'),
  blogRenovationCosts: visualAsset('blog-renovation-costs'),
  blogRenovationLaws: visualAsset('blog-renovation-laws'),
  blogGardenSuiteIdeas: visualAsset('blog-garden-suite-ideas'),
  servicesOverviewScope: visualAsset('services-overview-scope-before-price'),
  servicesOverviewApprovals: visualAsset('services-overview-approval-buildability'),
  servicesOverviewCloseout: visualAsset('services-overview-closeout-management'),
  servicesOverviewProperty: visualAsset('services-overview-property-no-drawings'),
  servicesOverviewPermits: visualAsset('services-overview-permits-engineering'),
  servicesOverviewCompare: visualAsset('services-overview-compare-builders'),
  seoGtaServiceAreas: visualAsset('seo-gta-service-area-pages'),
  seoNeighbourhoodCommunities: visualAsset('seo-neighbourhood-community-pages'),
  homeHeroDesignBuild: visualAsset('home-hero-design-build'),
  homeHeroCustomHome: visualAsset('home-hero-custom-home'),
  homeHeroMultiUnit: visualAsset('home-hero-multi-unit'),
  homeIntegratedPermitPlanning: visualAsset('home-integrated-permit-planning'),
  homeIntegratedCustomHomeExterior: visualAsset('home-integrated-custom-home-exterior'),
  homeIntegratedManagementMeeting: visualAsset('home-integrated-management-meeting'),
  homeExpertiseCustomHome: visualAsset('home-expertise-custom-home'),
  homeExpertiseMultiplex: visualAsset('home-expertise-multiplex'),
  homeExpertiseGardenSuite: visualAsset('home-expertise-garden-suite'),
  homeExpertiseAddition: visualAsset('home-expertise-addition'),
  homeExpertisePermits: visualAsset('home-expertise-permits'),
  homeExpertiseManagement: visualAsset('home-expertise-management'),
  homeExpertiseIci: visualAsset('home-expertise-ici'),
  homeMarketCustomHomes: visualAsset('home-market-custom-homes'),
  homeMarketMultiplex: visualAsset('home-market-multiplex'),
  homeMarketGardenSuite: visualAsset('home-market-garden-suite'),
  homeMarketAdditions: visualAsset('home-market-additions'),
  homeMarketPermitsEngineering: visualAsset('home-market-permits-engineering'),
  homeMarketConstructionManagement: visualAsset('home-market-construction-management'),
  homeMarketIci: visualAsset('home-market-ici'),
  homeProcessConsultEvaluate: visualAsset('home-process-consult-evaluate'),
  homeProcessDesignPriceContract: visualAsset('home-process-design-price-contract'),
  homeProcessReviewEngineerPermit: visualAsset('home-process-review-engineer-permit'),
  homeProcessBuildInspectSupport: visualAsset('home-process-build-inspect-support'),
};

const longTailGuideImages: Record<string, string> = {
  'guide-garden-suite-cost-toronto': visualAsset('section-work-garden-cost-drivers'),
  'guide-laneway-house-permit-toronto': visuals.serviceGardenLaneway,
  'guide-multiplex-conversion-cost-toronto': visuals.multiplexCost,
  'guide-home-addition-permit-toronto': visuals.serviceHomeAdditions,
  'guide-second-storey-addition-toronto': visualAsset('section-work-additions-willowdale'),
  'guide-basement-walkout-permit-toronto': visualAsset('section-work-townhouses-basement-suite'),
  'guide-legal-basement-suite-toronto': visuals.bulletFireEgress,
  'guide-custom-home-build-cost-gta': visuals.customHome,
  'guide-design-build-construction-manager-toronto': visuals.management,
  'guide-toronto-permit-drawings': visuals.permitGuide,
  'guide-toronto-neighbourhood-custom-home-rebuilds': visuals.workCustomHomes,
  'guide-rosedale-forest-hill-renovation': visuals.heritage,
  'guide-lawrence-park-leaside-additions': visuals.addition,
  'guide-willowdale-multiplex': visualAsset('section-work-multiplex-bedford-park'),
  'guide-unionville-angus-glen-custom-homes': visualAsset('section-work-custom-markham'),
  'guide-port-credit-lorne-park-renovations': visuals.workFullInteriors,
  'guide-toronto-neighbourhood-garden-suite': visualAsset('section-work-garden-client-types'),
  'guide-gta-design-build-faq': visuals.designBuild,
  'guide-gta-construction-proposals-differ': visuals.servicesOverviewCompare,
  'guide-gta-pre-construction-checklist': visuals.siteEvaluation,
  'guide-design-build-vs-general-contractor-gta': visuals.designBuildVsArchitect,
  'guide-gta-construction-management': visuals.serviceProjectManagement,
  'guide-toronto-permit-ready-drawings-checklist': visuals.bulletPermitPackages,
};

const detailSectionImages: Record<string, Record<string, string>> = {
  'why-about-us': {
    'Who We Work With': visualAsset('section-why-about-clients'),
    'How We Approach a Project': visualAsset('section-why-about-approach'),
    'Why the Structure Matters': visualAsset('section-why-about-structure'),
    'GTA Realities We Work Around Every Week': visualAsset('section-why-about-gta-realities'),
  },
  'why-the-vitalite-way': {
    'Consultation — Define What You Actually Need': visualAsset('section-why-way-consultation'),
    'Site and Existing-Condition Review': visualAsset('section-why-way-existing-conditions'),
    'Concept Design, Budget and Delivery Model': visualAsset('section-why-way-concept-budget'),
    'Zoning, Permits and Engineering': visualAsset('section-why-way-permits-engineering'),
    'Construction, PDI and Closeout': visualAsset('section-why-way-closeout'),
  },
  'why-design-build': {
    'The Problem Design-Build Solves': visualAsset('section-why-designbuild-problem'),
    'When It Is Most Useful': visualAsset('section-why-designbuild-useful'),
    'What Owners Still Control': visualAsset('section-why-designbuild-owner-control'),
    'When Traditional Delivery Still Works': visualAsset('section-why-designbuild-traditional'),
  },
  'why-testimonials': {
    'Relevant Project Context': visualAsset('section-why-proof-project-context'),
    'Documentation That Matters': visualAsset('section-why-proof-documentation'),
    'References By Project Type': visualAsset('section-why-proof-references'),
    'Closeout And Warranty-Oriented Support': visualAsset('section-why-proof-closeout'),
  },
  'why-in-the-news': {
    '2025 Active Projects': visualAsset('section-news-active-2025'),
    '2026 Project Pipeline': visualAsset('section-news-pipeline-2026'),
    'GTA Construction Market Context': visualAsset('section-news-market-context'),
    'Media and Industry Recognition': visualAsset('section-news-recognition'),
  },
  'work-custom-homes': {
    'Willowdale, North York': visualAsset('section-work-custom-willowdale'),
    'Markham': visualAsset('section-work-custom-markham'),
    'Toronto Infill and Lot Severance': visualAsset('section-work-custom-infill-severance'),
    'One Contract, Full Delivery': visualAsset('section-work-custom-one-contract'),
  },
  'work-multiplex': {
    'Lansdowne Toronto — Multi-Unit with Laneway Suite': visualAsset('section-work-multiplex-lansdowne'),
    'Bedford Park 2026 — Vertical Addition Over an Occupied Building': visualAsset('section-work-multiplex-bedford-park'),
    'Zoning and Permit Path': visualAsset('section-work-multiplex-zoning-permit'),
    'Investment Planning Before Design': visualAsset('section-work-multiplex-investment'),
  },
  'work-garden-suites': {
    'Zoning and Permit Path': visualAsset('section-work-garden-zoning-permit'),
    'What Drives the Cost': visualAsset('section-work-garden-cost-drivers'),
    'Rental Income and Long-Term Value': visualAsset('section-work-garden-rental-value'),
    'Who the Projects Are For': visualAsset('section-work-garden-client-types'),
  },
  'work-additions': {
    'Stouffville — Single-Storey Addition': visualAsset('section-work-additions-stouffville'),
    'Willowdale — 1,500 sq ft Expansion': visualAsset('section-work-additions-willowdale'),
    'Erindale Mississauga — Vertical Side-Split Addition': visualAsset('section-work-additions-erindale'),
    'Stouffville Retrofit — Multi-Space Expansion': visualAsset('section-work-additions-retrofit'),
  },
  'work-ici': {
    'Warehouse and Light Industrial': visualAsset('section-work-ici-warehouse'),
    'Office and Retail Construction': visualAsset('section-work-ici-office-retail'),
    'Institutional and Specialized Facilities': visualAsset('section-work-ici-institutional'),
    'Early Design-Build Engagement': visualAsset('section-work-ici-early-engagement'),
  },
  'work-condos': {
    'Board Package Preparation': visualAsset('section-work-condos-board-package'),
    'Material Selection and Procurement': visualAsset('section-work-condos-materials'),
    'Kitchen and Bathroom Sequencing': visualAsset('section-work-condos-kitchen-bath'),
    'Scope Examples': visualAsset('section-work-condos-scope-examples'),
  },
  'work-lofts': {
    'Structural and Mechanical Coordination': visualAsset('section-work-lofts-structural-mechanical'),
    'Lighting and Material Decisions': visualAsset('section-work-lofts-lighting-materials'),
    'Live-Work Space Planning': visualAsset('section-work-lofts-live-work'),
    'Building Approval': visualAsset('section-work-lofts-building-approval'),
  },
  'work-older-homes': {
    'Existing Conditions Assessment': visualAsset('section-work-older-existing-conditions'),
    'Structural Alterations and Code Compliance': visualAsset('section-work-older-structural-code'),
    'Preserving Character While Improving Performance': visualAsset('section-work-older-character-performance'),
    'Hazardous Material Management': visualAsset('section-work-older-hazardous-materials'),
  },
  'work-townhouses': {
    'Party Wall and Structural Coordination': visualAsset('section-work-townhouses-party-wall'),
    'Narrow-Lot Site Logistics': visualAsset('section-work-townhouses-narrow-lot'),
    'Additions and Vertical Expansions': visualAsset('section-work-townhouses-vertical-expansion'),
    'Basement Alterations and Suite Creation': visualAsset('section-work-townhouses-basement-suite'),
  },
  'work-full-interiors': {
    'Kitchen Renovations': visualAsset('section-work-interiors-kitchen'),
    'Bathroom Renovations': visualAsset('section-work-interiors-bathroom'),
    'Material Procurement and Lead Times': visualAsset('section-work-interiors-procurement'),
    'Full Scope Projects': visualAsset('section-work-interiors-full-scope'),
  },
};

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
        { label: 'Proof & References', href: '#why-testimonials' },
        { label: 'In The News', href: '#why-in-the-news' },
      ],
    },
  ],
  'our-work': [
    {
      heading: 'New Builds & Density',
      links: [
        { label: 'Custom Homes', href: '#work-custom-homes' },
        { label: 'Multi-Unit & Multiplex', href: '#work-multiplex' },
        { label: 'Garden Suites & Laneway Houses', href: '#work-garden-suites' },
        { label: 'Additions & Major Renovations', href: '#work-additions' },
        { label: 'ICI Projects', href: '#work-ici' },
      ],
    },
    {
      heading: 'Renovations & Interiors',
      links: [
        { label: 'Full Interiors', href: '#work-full-interiors' },
        { label: 'Condos & Apartments', href: '#work-condos' },
        { label: 'Lofts & Open-Concept', href: '#work-lofts' },
        { label: 'Older Toronto Homes', href: '#work-older-homes' },
        { label: 'Townhouses & Semi-Detached', href: '#work-townhouses' },
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
          src={publicAsset('vitalite-logo.svg?v=20260430-1340')}
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

type HeroSlide = {
  category: string;
  title: string;
  desc: string;
  link: string;
  displayDurationMs: number;
  image: string;
  video?: string;
};

const heroSlides = [
  {
    category: 'GTA DESIGN-BUILD',
    title: 'Design, Permits and Construction Under One GTA Team',
    desc: 'Vitalite helps owners move from feasibility review to permit-ready drawings, construction management, inspections and warranty-oriented closeout without splitting the project across disconnected teams.',
    link: 'Explore design-build services',
    displayDurationMs: 16000,
    image: visuals.homeHeroDesignBuild,
  },
  {
    category: 'CUSTOM HOMES',
    title: 'Custom Homes Planned Before They Are Priced',
    desc: 'We connect lifestyle goals, lot constraints, architectural direction, budgets and site execution before construction starts, so each custom home has a clear path from concept to handover.',
    link: 'Custom home design & build',
    displayDurationMs: 6500,
    image: visuals.homeHeroCustomHome,
  },
  {
    category: 'MULTI-UNIT HOUSING',
    title: 'Multiplex, Garden Suite and Addition Projects Built for Approval',
    desc: 'For investors and homeowners adding density or space, Vitalite coordinates feasibility, zoning, drawings, permits, trades and inspections around one managed construction plan.',
    link: 'Plan residential investment work',
    displayDurationMs: 6500,
    image: visuals.homeHeroMultiUnit,
  },
] as HeroSlide[];

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
    video.volume = 0;
    video.playsInline = true;
    video.setAttribute('muted', '');
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
              preload="metadata"
              onVolumeChange={(event) => {
                event.currentTarget.muted = true;
                event.currentTarget.defaultMuted = true;
                event.currentTarget.volume = 0;
              }}
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
          <img src={visuals.homeIntegratedPermitPlanning} alt="Construction planning" loading="lazy" decoding="async" className="absolute top-4 right-0 w-[45%] h-[200px] object-cover rounded-2xl z-0 shadow-xl" />
          <img src={visuals.homeIntegratedCustomHomeExterior} alt="Custom home exterior" loading="lazy" decoding="async" className="absolute left-0 top-1/2 -translate-y-1/2 w-[75%] h-[420px] object-cover rounded-2xl z-10 shadow-2xl" />
          <img src={visuals.homeIntegratedManagementMeeting} alt="Project management meeting" loading="lazy" decoding="async" className="absolute bottom-4 right-8 w-[40%] h-[220px] object-cover rounded-2xl z-20 shadow-xl" />
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
    image: visuals.homeExpertiseCustomHome,
  },
  {
    tab: 'Multiplex Housing',
    title: 'Multi-Unit & Multiplex Residential Construction',
    desc: 'We help investors and property owners evaluate unit strategy, zoning fit, code requirements, systems upgrades, rental potential and construction sequencing for compliant multi-unit residential projects.',
    link: 'Multiplex construction',
    image: visuals.homeExpertiseMultiplex,
  },
  {
    tab: 'Garden Suites',
    title: 'Garden Suites, Laneway Houses & Coach Houses',
    desc: 'We coordinate garden suites, laneway houses and coach houses from early feasibility through drawings, permits, servicing, access planning and managed construction.',
    link: 'Secondary dwelling units',
    image: visuals.homeExpertiseGardenSuite,
  },
  {
    tab: 'Additions',
    title: 'Home Additions & Major Renovations',
    desc: 'We plan additions and major renovations around structure, code, permit path, existing-home conditions and finish continuity, so added space feels intentional rather than patched on.',
    link: 'Addition and renovation work',
    image: visuals.homeExpertiseAddition,
  },
  {
    tab: 'Permits & Engineering',
    title: 'Drawings, Permits & Engineering Coordination',
    desc: 'We organize architectural drawings, structural inputs, HVAC or mechanical coordination, zoning review and permit applications so construction pricing is based on a clearer scope.',
    link: 'Permit-ready documentation',
    image: visuals.homeExpertisePermits,
  },
  {
    tab: 'Project Management',
    title: 'Project Management & Construction Management',
    desc: 'We manage schedules, budgets, trades, procurement, inspections, site meetings, quality control and client communication so complex projects have visible accountability.',
    link: 'Construction management',
    image: visuals.homeExpertiseManagement,
  },
  {
    tab: 'ICI Construction',
    title: 'Industrial, Commercial & Institutional Construction',
    desc: 'We support warehouses, offices, retail spaces and institutional facilities with practical design-build and construction management focused on compliance, durability and operating needs.',
    link: 'ICI construction services',
    image: visuals.homeExpertiseIci,
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
              <img src={activeExpertise.image} alt={activeExpertise.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
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
      img: visuals.homeMarketCustomHomes,
    },
    {
      name: 'Multi-Unit / Multiplex',
      summary: 'Multi-unit housing, separate suites and investment residential projects planned for code compliance and rental potential.',
      img: visuals.homeMarketMultiplex,
    },
    {
      name: 'Garden Suite / Laneway House',
      summary: 'Secondary dwelling units that add family flexibility, rental income potential and long-term property value.',
      img: visuals.homeMarketGardenSuite,
    },
    {
      name: 'Home Additions & Alterations',
      summary: 'Additions, extensions, structural changes and whole-house renovations coordinated with permits and existing conditions.',
      img: visuals.homeMarketAdditions,
    },
    {
      name: 'Drawings, Permits & Engineering',
      summary: 'Permit-ready drawings, structural coordination, HVAC inputs, zoning review and municipal submission support.',
      img: visuals.homeMarketPermitsEngineering,
    },
    {
      name: 'Project / Construction Management',
      summary: 'Budget, schedule, trades, procurement, quality control, inspections and client communication managed together.',
      img: visuals.homeMarketConstructionManagement,
    },
    {
      name: 'ICI Construction',
      summary: 'Warehouse, office, retail, industrial and institutional projects planned around compliance, durability and operations.',
      img: visuals.homeMarketIci,
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
              <img src={market.img} alt={market.name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
      img: visuals.homeProcessConsultEvaluate,
    },
    {
      title: 'Design, Price & Contract',
      detail: 'Concept design, 2D or 3D planning, budgetary quotation and the right contracting model for the project.',
      img: visuals.homeProcessDesignPriceContract,
    },
    {
      title: 'Review, Engineer & Permit',
      detail: 'Zoning review, building code review, structural, HVAC and mechanical coordination, then permit submission.',
      img: visuals.homeProcessReviewEngineerPermit,
    },
    {
      title: 'Build, Inspect & Support',
      detail: 'Pre-construction preparation, site management, quality control, PDI, move-in support and aftercare warranty.',
      img: visuals.homeProcessBuildInspectSupport,
    },
  ];

  return (
    <section className="relative py-20 md:py-32 px-5 sm:px-8 overflow-hidden bg-[#111]">
      <div className="absolute inset-0 z-0">
        <img src={visuals.process} alt="Construction site" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-20" />
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
              <img src={card.img} alt={card.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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

const serviceInclusions: Array<{ label: string; href: `#${DetailPageKey}`; image: string }> = [
  { label: 'Architectural Services', href: '#service-architectural-services', image: visuals.architectural },
  { label: 'Interior Design', href: '#service-interior-design', image: visuals.interiorDesign },
  { label: 'Rendering', href: '#service-rendering', image: visuals.rendering },
  { label: 'Material Selection / Procurement', href: '#service-material-selection', image: visuals.materialSelection },
  { label: 'Building + Board Approvals', href: '#service-building-board-approvals', image: visuals.boardApprovals },
  { label: 'Construction & Site Management', href: '#service-construction-site-management', image: visuals.serviceSiteManagement },
];

const servicePageCards: ImageCard[] = [
  {
    title: 'Custom Home Design & Build',
    eyebrow: 'Custom homes',
    summary: 'A GTA custom home where the designer and the builder answer to the same contract — so what gets drawn is what gets built.',
    image: visuals.serviceCustomHome,
    href: '#service-custom-homes',
  },
  {
    title: 'Multi-Unit & Multiplex Construction',
    eyebrow: 'Multiplex & investment housing',
    summary: 'Multi-unit residential built to current zoning, code and rental market realities — without the surprises that come from disconnected consultants.',
    image: visuals.serviceMultiplex,
    href: '#service-multiplex',
  },
  {
    title: 'Garden Suites & Laneway Houses',
    eyebrow: 'Secondary suites',
    summary: 'A separate structure on your existing lot — for rental income, a family member, or long-term flexibility — designed and built under one roof.',
    image: visuals.serviceGardenLaneway,
    href: '#service-garden-suites',
  },
  {
    title: 'Home Additions & Major Renovations',
    eyebrow: 'Additions',
    summary: 'More space without moving — if the structure, zoning and budget can support it. Vitalite checks before the drawings start.',
    image: visuals.serviceHomeAdditions,
    href: '#service-home-additions',
  },
  {
    title: 'Drawings, Permits & Engineering',
    eyebrow: 'Permit-ready planning',
    summary: 'Permit drawings that pass on the first submission — and engineering that does not hold up the build while the inspector waits.',
    image: visuals.servicePermitsEngineering,
    href: '#service-drawings-permits',
  },
  {
    title: 'Project & Construction Management',
    eyebrow: 'Budget and schedule control',
    summary: 'Budget, schedule and trade accountability when the project is too complex to manage with a weekly phone call.',
    image: visuals.serviceProjectManagement,
    href: '#service-project-management',
  },
  {
    title: 'Industrial, Commercial & Institutional',
    eyebrow: 'ICI construction',
    summary: 'Commercial and institutional construction that stays on schedule and keeps the building operational during the work.',
    image: visuals.serviceIci,
    href: '#service-ici-construction',
  },
];

const serviceRenovationCards: ImageCard[] = [
  {
    title: 'Full-Gut Renovations',
    eyebrow: 'Complete rebuilds',
    summary: 'Everything non-structural comes out. Systems are replaced, the floor plan is reconsidered and the interior is rebuilt from scratch — under one accountable team.',
    image: visuals.gutRenovation,
    href: '#service-gut-renovations',
  },
  {
    title: 'Loft & Open-Concept Renovations',
    eyebrow: 'Structural reconfiguration',
    summary: 'Removing a wall is not always simple. Vitalite confirms load-bearing conditions, coordinates mechanical rerouting and manages the trades before demolition begins.',
    image: visuals.loft,
    href: '#service-loft-renovations',
  },
  {
    title: 'Condo Renovations',
    eyebrow: 'Condo & strata',
    summary: 'Board package, design, material selection and trade management — all coordinated within the building rules so the renovation does not stall at the approval stage.',
    image: visuals.condo,
    href: '#service-condo-renovations',
  },
  {
    title: 'Apartment Renovations',
    eyebrow: 'Rental & investment units',
    summary: 'Elevator windows, working-hour restrictions and board documentation managed as part of the project plan — not discovered when the first trade shows up.',
    image: visuals.apartment,
    href: '#service-apartment-renovations',
  },
  {
    title: 'Townhouse & Semi-Detached Renovations',
    eyebrow: 'Tight-lot & party wall',
    summary: 'Shared walls, limited site access and permit-sensitive structural changes managed from concept through construction in Toronto townhouses and semis.',
    image: visuals.serviceTownhouse,
    href: '#service-townhouse-renovations',
  },
  {
    title: 'Heritage & Older Home Renovations',
    eyebrow: 'Pre-1960s homes',
    summary: 'Knob-and-tube wiring, balloon framing and heritage designations are planned for before demolition starts — not discovered at full trade cost during construction.',
    image: visuals.heritage,
    href: '#service-heritage-renovations',
  },
];

const whyPageCards: ImageCard[] = [
  {
    title: 'About Vitalite',
    summary: 'Vitalite Construction Corp. is a GTA-based design-build, general contracting and construction management company for residential and ICI projects.',
    image: visuals.whyAboutUs,
    href: '#why-about-us',
  },
  {
    title: 'The Vitalite Way',
    summary: 'We move through consultation, site evaluation, concept design, budget planning, zoning review, permits, construction, PDI and warranty support.',
    image: visuals.whyVitaliteWay,
    href: '#why-the-vitalite-way',
  },
  {
    title: 'Why Design-Build?',
    summary: 'A single accountable team reduces gaps between design, approvals, engineering and site execution, especially on complex GTA properties.',
    image: visuals.designBuildVsArchitect,
    href: '#why-design-build',
  },
  {
    title: 'Proof & References',
    summary: 'Project-specific proof, reference pathways and trust documents for owners evaluating a GTA design-build partner.',
    image: visuals.proofReferences,
    href: '#why-testimonials',
  },
  {
    title: 'In The News',
    summary: 'Company updates, local project features and media mentions can live here without mixing them into service pages.',
    image: visuals.news,
    href: '#why-in-the-news',
  },
];

const workPageCards: ImageCard[] = [
  {
    title: 'Custom Homes',
    summary: 'Teardown-rebuilds, new detached homes and lot severances — delivered under one contract from permit drawings to handover.',
    image: visuals.workCustomHomes,
    href: '#work-custom-homes',
  },
  {
    title: 'Multi-Unit / Multiplex',
    summary: 'Multi-unit residential built for rental yield: fire separation, independent egress and separate services planned from the first zoning check.',
    image: visuals.workMultiplex,
    href: '#work-multiplex',
  },
  {
    title: 'Garden Suites & Laneway Houses',
    summary: 'Rental income on your existing lot — zoning eligibility confirmed, permit drawings prepared and construction managed without a separate consultant for each step.',
    image: visuals.workGardenSuites,
    href: '#work-garden-suites',
  },
  {
    title: 'Additions & Major Renovations',
    summary: 'More space without moving — if the structure, zoning and budget support it. Vitalite checks all three before drawings start.',
    image: visuals.workAdditions,
    href: '#work-additions',
  },
  {
    title: 'Industrial / Commercial / Institutional',
    summary: 'Commercial and institutional construction that keeps the building operational and hits the occupancy date.',
    image: visuals.workIci,
    href: '#work-ici',
  },
  {
    title: 'Full Interiors',
    summary: 'Kitchen, bathroom and full-suite interior renovations where the trade sequencing is as important as the finish selection.',
    image: visuals.workFullInteriors,
    href: '#work-full-interiors',
  },
  {
    title: 'Condos & Apartments',
    summary: 'Toronto condo renovations with board approval coordination, elevator scheduling and building-rule compliance built into the project plan.',
    image: visuals.workCondos,
    href: '#work-condos',
  },
  {
    title: 'Lofts & Open-Concept',
    summary: 'Open-plan renovations where structural exposure means every trade decision is a design decision — coordinated before demolition begins.',
    image: visuals.workLofts,
    href: '#work-lofts',
  },
  {
    title: 'Older Toronto Homes',
    summary: 'Pre-war and mid-century homes renovated after a condition assessment — so knob-and-tube wiring and balloon framing are in the budget before drawings start.',
    image: visuals.workOlderHomes,
    href: '#work-older-homes',
  },
  {
    title: 'Townhouses & Semi-Detached',
    summary: 'Party wall coordination, narrow-lot logistics and permit-sensitive structural changes managed from concept through construction.',
    image: visuals.workTownhouses,
    href: '#work-townhouses',
  },
];

const blogPageCards: ImageCard[] = [
  {
    title: "Buyer's Renovation Guide",
    summary: 'What GTA buyers should understand before purchasing a property that needs additions, permits or major renovation work.',
    image: visuals.buyerGuide,
    href: '#blog-buyers-renovation-guide',
  },
  {
    title: 'Toronto Renovations: Cost Per SQ FT',
    summary: 'How custom home, addition, multiplex and renovation budgets are shaped by scope, structure, finishes and approvals.',
    image: visuals.blogRenovationCosts,
    href: '#blog-renovation-costs',
  },
  {
    title: 'Design-Build Vs Architect',
    summary: 'When a design-build contractor makes sense, when to separate design and construction, and how accountability changes.',
    image: visuals.designBuildVsArchitect,
    href: '#blog-design-build-vs-architect',
  },
  {
    title: 'How Long Is A GTA Renovation?',
    summary: 'A practical timeline guide covering design, engineering, permits, procurement, construction and final inspection.',
    image: visuals.timeline,
    href: '#blog-renovation-timeline',
  },
  {
    title: 'Toronto Renovation Laws',
    summary: 'A plain-English introduction to zoning review, building permits, drawings and inspections for residential projects.',
    image: visuals.blogRenovationLaws,
    href: '#blog-renovation-laws',
  },
  {
    title: 'Garden Suite Ideas 2026',
    summary: 'Design, rental and approval considerations for owners planning a garden suite, laneway house or coach house.',
    image: visuals.blogGardenSuiteIdeas,
    href: '#blog-garden-suite-ideas',
  },
  {
    title: 'Renovating A Fixer-Upper vs Buying New',
    summary: 'Better value strategies for owners comparing secondary suites, additions, full interiors and investment housing.',
    image: visuals.fixerUpper,
    href: '#blog-fixer-upper-vs-new',
  },
];

type OfficialResource = { label: string; url: string; note?: string };

const torontoOfficialLinks = {
  buildingPermits: { label: 'Building Permits — City of Toronto', url: 'https://www.toronto.ca/services-payments/building-construction/apply-for-a-building-permit/', note: 'Official permit application portal' },
  gardenSuites: { label: 'Garden Suites — City of Toronto', url: 'https://www.toronto.ca/city-government/planning-development/planning-studies-initiatives/garden-suites/', note: 'Zoning rules, eligibility and application guidance' },
  lanewaySuites: { label: 'Laneway Suites — City of Toronto', url: 'https://www.toronto.ca/city-government/planning-development/planning-studies-initiatives/laneway-suites/', note: 'By-law requirements, fire access and servicing rules' },
  multiplex: { label: 'Multiplex Considerations — City of Toronto', url: 'https://www.toronto.ca/city-government/planning-development/planning-studies-initiatives/multiplexes/', note: 'As-of-right permissions and design considerations' },
  treeProtection: { label: 'Tree & Ravine Protection — City of Toronto', url: 'https://www.toronto.ca/services-payments/building-construction/tree-ravine-protection-permits/tree-protection/', note: 'Protected tree and ravine permit guidance' },
};

const municipalityOfficialLinks: Record<string, OfficialResource[]> = {
  toronto: [torontoOfficialLinks.buildingPermits, torontoOfficialLinks.treeProtection],
  markham: [
    { label: 'Building Permit Process — City of Markham', url: 'https://www.markham.ca/economic-development-business/building-permits/building-permit-process', note: 'Permit process, ePLAN, zoning and applicable law checks' },
    { label: 'Zoning & Development By-laws — City of Markham', url: 'https://www.markham.ca/economic-development-business/planning-development-services/zoning-and-development-law-information', note: 'Comprehensive zoning by-law and development by-law information' },
    { label: 'Tree Permit Application — City of Markham', url: 'https://www.markham.ca/neighbourhood-services/trees/tree-permit-application', note: 'Private tree permit requirements for protected trees' },
  ],
  'richmond-hill': [
    { label: 'Building Permits — City of Richmond Hill', url: 'https://www.richmondhill.ca/en/online-services/Building-Permits.aspx', note: 'Permit applications, fees and review requirements' },
    { label: 'Zone Richmond Hill — City of Richmond Hill', url: 'https://www.richmondhill.ca/en/zone-richmond-hill.aspx', note: 'Comprehensive zoning by-law and additional residential unit context' },
    { label: 'Trees on Private Property — City of Richmond Hill', url: 'https://www.richmondhill.ca/en/learn-more/Tree-Cutting-Permit.aspx', note: 'Tree preservation and removal permit requirements' },
  ],
  vaughan: [
    { label: 'Building Permits — City of Vaughan', url: 'https://www.vaughan.ca/residential/building-and-construction/building-permits', note: 'Building permit applications and applicable law checks' },
    { label: 'Residential Building Permits — City of Vaughan', url: 'https://www.vaughan.ca/residential/building-and-construction/building-permits/permit-applications/residential-building-permits', note: 'Residential permits for homes, additions and alterations' },
    { label: 'Tree Removal Permits — City of Vaughan', url: 'https://www.vaughan.ca/residential/parks-and-trees/forestry-operations/tree-removal-permits-and-protection', note: 'Tree removal and protection requirements' },
  ],
  mississauga: [
    { label: 'Building & Renovating — City of Mississauga', url: 'https://www.mississauga.ca/services-and-programs/building-and-renovating/', note: 'Building permits, property information and development services' },
    { label: 'When A Building Permit Is Required — City of Mississauga', url: 'https://www.mississauga.ca/services-and-programs/building-and-renovating/building-permits/when-a-building-permit-is-required/', note: 'Project types that require permits' },
    { label: 'Zoning By-law — City of Mississauga', url: 'https://www.mississauga.ca/services-and-programs/building-and-renovating/zoning-information/zoning-by-law/', note: 'Interactive zoning by-law and property zoning guidance' },
    { label: 'Tree Permits — City of Mississauga', url: 'https://www.mississauga.ca/services-and-programs/forestry-and-environment/trees/request-to-injure-or-remove-trees/', note: 'Public and private tree permit guidance' },
  ],
};

const detailPages: Record<DetailPageKey, DetailPageContent> = {
  'service-architectural-services': {
    parent: 'services',
    category: 'SERVICES',
    title: 'Architectural Services',
    subtitle: "Drawings that account for zoning, structure, budget and the permit reviewer — not just what looks good on screen.",
    image: visuals.architectural,
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
    image: visuals.interiorDesign,
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
    image: visuals.rendering,
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
    image: visuals.materialSelection,
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
    image: visuals.boardApprovals,
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
    image: visuals.serviceSiteManagement,
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
    image: visuals.serviceCustomHome,
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
    image: visuals.apartment,
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
    image: visuals.serviceTownhouse,
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
    image: visuals.condo,
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
    image: visuals.heritage,
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
    image: visuals.loft,
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
    image: visuals.gutRenovation,
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
    image: visuals.serviceMultiplex,
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
    officialResources: [torontoOfficialLinks.multiplex, torontoOfficialLinks.buildingPermits],
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
    image: visuals.serviceGardenLaneway,
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
    officialResources: [torontoOfficialLinks.gardenSuites, torontoOfficialLinks.lanewaySuites, torontoOfficialLinks.buildingPermits],
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
    image: visuals.serviceHomeAdditions,
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
    image: visuals.servicePermitsEngineering,
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
    officialResources: [torontoOfficialLinks.buildingPermits],
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
    image: visuals.serviceProjectManagement,
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
    image: visuals.serviceIci,
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
    image: visuals.whyAboutUs,
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
    image: visuals.whyVitaliteWay,
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
    image: visuals.designBuildVsArchitect,
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
    title: 'Proof & References',
    subtitle: 'How Vitalite builds trust before a GTA owner signs: project context, documentation, references and closeout accountability.',
    image: visuals.proofReferences,
    intro: 'High-value construction decisions should not rely on decorative badges or vague testimonials. Owners need to see whether the company has handled similar scope, similar approval risk, similar construction complexity and similar handover responsibility. Vitalite organizes proof around the project type being discussed.',
    bullets: ['Project-specific portfolio context', 'Permit and documentation trail', 'Reference pathways by project type', 'PDI and closeout accountability'],
    sections: [
      { heading: 'Relevant Project Context', text: 'Custom homes, multiplexes, additions and garden suites are not interchangeable proof points. Vitalite frames past and active work by location, size, scope, approval path, status and construction challenge so owners can compare it to what they are planning.' },
      { heading: 'Documentation That Matters', text: 'Before construction, the useful trust signals are the documents that reduce project risk: drawings, zoning review, permit applications, engineering coordination, contractor insurance requirements, trade scopes, municipal comments and inspection planning.' },
      { heading: 'References By Project Type', text: 'When appropriate, prospective clients can request a reference pathway tied to a similar project type. A custom home owner should hear custom home context. An investor planning a multiplex should hear about approvals, unit strategy, inspections and rental-driven construction decisions.' },
      { heading: 'Closeout And Warranty-Oriented Support', text: 'Trust continues after the visible work is complete. Vitalite tracks PDI items, deficiencies, inspection follow-up and warranty-oriented support as part of project closeout rather than treating them as informal follow-up.' },
    ],
    faqs: [
      { question: 'Can I review proof before choosing Vitalite?', answer: 'Yes. The right proof depends on the project type. Vitalite can discuss relevant project context, documentation, scope structure and reference pathways during intake.' },
      { question: 'Why not publish anonymous testimonials everywhere?', answer: 'Generic testimonials are weak proof for a high-value construction decision. Vitalite prioritizes project-specific evidence: what was built, where, under what constraints, and how the work was managed.' },
      { question: 'Can I speak with a past client?', answer: 'Reference conversations are handled by project fit and client permission. Ask during consultation if you want a reference pathway for a similar custom home, addition, multiplex or garden suite project.' },
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
    image: visuals.news,
    intro: 'Vitalite is an active GTA design-build contractor with ongoing projects in Willowdale, Markham, Mississauga, Lansdowne Toronto and across the wider region. This page tracks company developments, completed project news and local construction perspective as it becomes available.',
    bullets: ['Completed project features', 'Company milestones', 'GTA construction market commentary', 'Awards and local recognition'],
    sections: [
      { heading: '2025 Active Projects', text: 'Vitalite currently has active sites across the GTA: a 4,700 sq ft luxury custom home in Willowdale, a multi-unit build with laneway suite in Lansdowne Toronto, a single-storey addition in Preston Lake Stouffville, and a major vertical side-split expansion in Erindale Mississauga.' },
      { heading: '2026 Project Pipeline', text: 'Six projects are scheduled to begin construction in 2026, including a lot severance and two new semi-detached homes in York Toronto, a five-rental-unit vertical addition over a mixed-use building in Bedford Park, and multiple custom home builds in Avondale, Stouffville and Willowdale.' },
      { heading: 'GTA Construction Market Context', text: 'Toronto and the surrounding region continue to see strong demand for custom home rebuilds, multiplex conversions and laneway suites as zoning rules evolve. Vitalite publishes construction commentary and planning guides through the blog.' },
      { heading: 'Media and Industry Recognition', text: 'Vitalite project announcements, completed project features and recognition in the GTA design-build space will be shared here as they occur.' },
    ],
    faqs: [
      { question: 'Is Vitalite currently taking on new projects in the GTA?', answer: 'Yes. Vitalite is actively scheduling projects for 2026 across Toronto, North York, Markham, Mississauga and Stouffville. Current capacity includes custom homes, multiplex conversions, home additions and major renovations. Contact us to discuss your timeline and scope.' },
      { question: 'Where has Vitalite built in the GTA?', answer: 'Completed projects span Willowdale, Cachet Markham, Bullock Markham, Richvale Richmond Hill, Don Valley, Bayview Village, Lansdowne Toronto and Erindale Mississauga. Active builds are currently underway in Willowdale, Lansdowne Toronto, Preston Lake Stouffville and Erindale Mississauga.' },
      { question: 'How do I find out if Vitalite is the right fit for my project?', answer: 'The best starting point is a direct conversation. Vitalite reviews scope, site, zoning and budget at the first meeting — no cost, no obligation. Use the contact page to get in touch and describe what you have in mind.' },
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
    subtitle: 'Custom homes where the design team and the build team answer to the same project.',
    image: visuals.workCustomHomes,
    intro: "Most GTA custom home delays happen in the gap between the architect who draws the plans and the contractor who builds them. When construction budget feedback arrives after the design is finished, the drawings get revised — and the revision rounds cost time and money that owners didn't budget for. Vitalite delivers custom homes under one contract, so construction input reaches the design before the drawings are committed.",
    answer: "Active builds include a 4,700 sq ft modern build in Willowdale and a two-semi lot severance in York Toronto. Completed projects span Cachet Markham, Bullock Markham, Richvale Richmond Hill, Don Valley and Bayview Village.",
    bullets: ['New detached custom homes', 'Teardown-rebuilds on existing lots', 'Lot severance and infill', 'Luxury interiors and exterior detailing'],
    sections: [
      { heading: 'Willowdale, North York', text: "A 4,700 sq ft modern build currently under construction in Willowdale — one of the GTA's most active teardown-rebuild markets. Vitalite has completed multiple custom homes in Willowdale over the past four years, where aging bungalow stock, strong resale values and 40-foot lots make teardown-rebuild a common investment strategy." },
      { heading: 'Markham', text: 'Cachet and Bullock are mature Markham neighbourhoods where estate-style custom home buyers expect high-specification detailing, tight trade scheduling and disciplined site management. Six completed homes across Markham.' },
      { heading: 'Toronto Infill and Lot Severance', text: "A 38x120 ft lot in York Toronto is being severed into two 19-foot lots, each delivering a 2,100 sq ft semi-detached home. Lot severance projects require Committee of Adjustment approval, architectural drawings for both semis, structural coordination of the shared wall and separate permit applications — Vitalite manages all of it." },
      { heading: 'One Contract, Full Delivery', text: 'Every custom home project includes zoning review, architectural drawings, structural engineering, permit applications, all trade contracts, site management, inspections and post-occupancy support. Owners work with one team from the first site visit to handover.' },
    ],
    faqs: [
      { question: "What is included in a Vitalite custom home project?", answer: "The scope runs from first zoning check through handover: architectural drawings, structural engineering, permit applications, all trade contracts, site management, inspections and a post-occupancy walkthrough. Owners are not required to coordinate separate consultants." },
      { question: "How long does a GTA custom home take to build?", answer: "From design start to occupancy, most GTA custom homes take 18 to 30 months. Design and permit preparation typically takes 6 to 12 months. Construction adds 10 to 16 months depending on size, finish level and site complexity." },
      { question: "What is the difference between a teardown-rebuild and a major renovation?", answer: "A teardown-rebuild removes the existing structure down to the foundation (or replaces it) and builds new. A major renovation retains the existing structure and works within it. Teardown-rebuilds are typically more predictable in cost because unknown existing conditions are eliminated at demolition." },
    ],
    relatedLinks: [
      { label: 'Custom home design and build service', key: 'service-custom-homes' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
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
    subtitle: 'Multi-unit residential built for rental yield — not just for the building permit.',
    image: visuals.workMultiplex,
    intro: "A multiplex is not a house with more units attached. It requires fire separation between units, independent egress from each, separate utility metering and a permit path with more review layers than a single-family project. Get any of those wrong and the building either doesn't pass inspection or doesn't function as a rental asset. Vitalite plans multiplexes around those realities from the first zoning check.",
    answer: "Active projects include a ground-up multi-unit build with integrated laneway suite in Lansdowne Toronto and a five-rental-unit vertical addition over an occupied mixed-use building in Bedford Park — scheduled for 2026.",
    bullets: ['Ground-up multi-unit residential builds', 'Vertical additions over occupied buildings', 'Laneway suites integrated with main build', 'Investment-focused unit layouts'],
    sections: [
      { heading: 'Lansdowne Toronto — Multi-Unit with Laneway Suite', text: 'A purpose-built multi-unit building in Lansdowne where each floor is a self-contained unit with independent access and egress. A garage-rooftop laneway suite at the rear adds a second rental income stream on the same lot. Every unit was planned for rental market appeal: layout efficiency, noise separation, exterior durability and individual metering.' },
      { heading: 'Bedford Park 2026 — Vertical Addition Over an Occupied Building', text: 'Two new storeys and five rental apartments built above an active mixed-use building in Bedford Park North York — with commercial and residential tenants below remaining operational during construction. Occupancy protection, shoring, fire separation and phased access are all coordinated before a beam goes up.' },
      { heading: 'Zoning and Permit Path', text: 'Toronto multiplex projects move through zoning review, Committee of Adjustment where variances are required, and permit drawings that address fire separation, egress, mechanical risers and parking before any structural work begins. Vitalite manages the full approval path so owners are not navigating municipal processes independently.' },
      { heading: 'Investment Planning Before Design', text: 'Owners planning multiplex projects typically start from a rental income and land-use strategy. Vitalite works through zoning feasibility, unit mix, construction budget and projected rental return before drawings are commissioned — so the investment case is clear before design cost is spent.' },
    ],
    faqs: [
      { question: "How many units can I add to my Toronto lot?", answer: "Under current bylaw changes, many Toronto residential lots support up to four units as of right. Garden suites or laneway houses on qualifying lots add further density. The actual number depends on lot size, zoning category, parking requirements and the existing structure. Vitalite confirms feasibility for a specific property at first consultation." },
      { question: "What makes a vertical addition over an occupied building so complex?", answer: "The structure below is active — people are living or working in it. Every phase of the addition has to protect the building's waterproofing, mechanical systems and egress while new structure is added above. Shoring plans, sequencing and occupancy protection all need to be resolved before work starts." },
      { question: "Is a Committee of Adjustment required for a multiplex?", answer: "Not always. Many multiplex configurations now comply as of right under updated zoning. Variances — setbacks, height, lot coverage — require a CoA hearing. Vitalite assesses the zoning position at the start of the project so owners know the approval path before committing to drawings." },
    ],
    relatedLinks: [
      { label: 'Multiplex construction service', key: 'service-multiplex' },
      { label: 'Garden suites and laneway houses', key: 'service-garden-suites' },
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
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
    subtitle: 'Rental income on your existing lot — without selling, subdividing or moving.',
    image: visuals.workGardenSuites,
    intro: "A garden suite or laneway house lets GTA homeowners add a self-contained dwelling unit on their existing lot. No lot severance, no major rezoning application — just a careful review of local by-laws, setbacks, lot coverage, site access and servicing before the design begins. Vitalite handles the full process from eligibility check through construction.",
    answer: "Vitalite designs, permits and builds garden suites and laneway houses across the City of Toronto, Whitchurch-Stouffville, Mississauga and other GTA municipalities — zoning review, permit drawings, engineering and site construction under one contract.",
    bullets: ['Garden suites in rear yards', 'Laneway houses over rear garages', 'Coach house and detached ADU construction', 'Rental-use feasibility and permit coordination'],
    sections: [
      { heading: 'Zoning and Permit Path', text: "Lot eligibility for a garden suite depends on lot dimensions, rear-yard setbacks, existing coverage and access — either from a lane or across the main lot. Vitalite reviews these against the applicable by-law before any design work begins, so the permit set is built around what is actually allowed on the specific property." },
      { heading: 'What Drives the Cost', text: 'Foundation type, site servicing (water, sewer and electrical tie-in to the main house), site access conditions, insulation specification and finish level are the main budget variables for ADU projects. Getting clarity on these before drawings are commissioned prevents design rework when construction pricing comes in higher than expected.' },
      { heading: 'Rental Income and Long-Term Value', text: 'Many garden suite projects are planned around the rental income they will generate. The interplay between construction budget, projected rent, lot constraints, servicing costs and long-term property value should be worked through before design decisions are made. Vitalite helps owners run that analysis at the project start.' },
      { heading: 'Who the Projects Are For', text: 'Garden suite clients typically include homeowners who want a rental income stream, families housing an aging parent or adult child, and investors who purchased a lot specifically for its ADU potential. Vitalite works with all three groups, and the planning conversation looks different depending on the intended use.' },
    ],
    faqs: [
      { question: "Does my Toronto lot qualify for a garden suite?", answer: "Eligibility depends on lot depth, existing lot coverage, access to the rear yard and proximity to utilities. The City of Toronto requires a minimum rear yard depth of 17 m in most cases. Vitalite reviews eligibility for a specific property as part of the initial consultation." },
      { question: "How much does a garden suite cost in the GTA?", answer: "Most GTA garden suites range from $275,000 to $450,000 depending on size, foundation type, site servicing requirements and finish level. Laneway houses tend to cost more when they involve a new second-storey structure over an existing garage. Vitalite provides a project-specific estimate after the site and zoning review." },
      { question: "Can a garden suite be rented out legally?", answer: "Yes. A garden suite or laneway house built with a building permit and to current building code can be rented legally. Vitalite builds to the standards required for legal occupancy and assists clients in understanding the landlord-tenant obligations that apply." },
    ],
    officialResources: [torontoOfficialLinks.gardenSuites, torontoOfficialLinks.lanewaySuites, torontoOfficialLinks.buildingPermits],
    relatedLinks: [
      { label: 'Garden suites and laneway houses service', key: 'service-garden-suites' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-toronto-laneway-suite-over-garage',
      'project-stouffville-backyard-garden-suite',
    ],
  },
  'work-additions': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Additions & Major Renovations',
    subtitle: 'More space without moving — if the structure, zoning and budget can support it.',
    image: visuals.workAdditions,
    intro: "A home addition is not just a room at the back. It is a foundation assessment, a zoning check, a structural review of the existing framing, permit drawings with engineering coordination and a construction sequence that keeps the house livable through the build. Vitalite manages GTA home additions with the same delivery discipline as a custom home — because for most families, the complexity is comparable.",
    answer: "Active projects include a single-storey addition in Preston Lake Stouffville, a major vertical expansion in Erindale Mississauga and a whole-home retrofit in Stouffville. Completed work includes a 1,500 sq ft expansion that grew a Willowdale home from 3,700 to 5,200 sq ft.",
    bullets: ['Single-storey rear and side additions', 'Vertical additions and second-storey expansions', 'Whole-home retrofits and reconfiguration', 'Basement walkout and foundation extensions'],
    sections: [
      { heading: 'Stouffville — Single-Storey Addition', text: 'A 200 sq ft dining and family room extension in Preston Lake Stouffville under a vaulted cathedral roof with a heated crawl space below. Compact additions require precise foundation, framing and tie-in work to connect cleanly to the existing house — the engineering challenge is proportionally larger than the footprint suggests.' },
      { heading: 'Willowdale — 1,500 sq ft Expansion', text: 'Coming 2026: a Willowdale home grows from 3,700 to 5,200 sq ft with the original foundation retained and main-floor ceiling height rising to 11 ft. Retaining the original foundation reduces demolition and grading cost but requires structural analysis to confirm it can carry the added load above.' },
      { heading: 'Erindale Mississauga — Vertical Side-Split Addition', text: 'A four-storey side-split expands to six storeys with a new trussed roof, vaulted foyer and aluminum alloy windows throughout. Vertical additions on side-splits are among the more structurally complex residential scopes — existing walls, floors and foundation are all reviewed before new structure is added above the existing roofline.' },
      { heading: 'Stouffville Retrofit — Multi-Space Expansion', text: 'Coming 2026: a major retrofit adds a front foyer, study, sunroom and basement walkup staircase while transforming the existing roof into a cathedral ceiling. Projects at this scope blend addition, renovation and structural alteration — the permit set and trade sequencing need to address all three together.' },
    ],
    faqs: [
      { question: "How do I know if my lot can support a home addition?", answer: "Zoning setbacks, lot coverage limits and height restrictions determine what can be added and where. The existing foundation type affects what loads can be placed above. Vitalite reviews all of these at first consultation before any design cost is committed." },
      { question: "Do I need a building permit for a home addition?", answer: "Yes. Any structural addition requires a building permit — this includes rear additions, second-storey additions and structural changes that increase floor area. Vitalite prepares and submits the complete permit package." },
      { question: "Can I stay in my home during a home addition?", answer: "Most addition clients stay in their homes during construction. Vitalite phases work to maintain a weathertight envelope and functional kitchen and bathroom access through the build. The impact on daily life is discussed at project start, not discovered during construction." },
    ],
    relatedLinks: [
      { label: 'Home additions and major renovations service', key: 'service-home-additions' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
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
    subtitle: 'Commercial and institutional construction that keeps the building operational while the work gets done.',
    image: visuals.workIci,
    intro: "Commercial construction clients have a different set of priorities than residential owners. The building often has to stay open during the work. The schedule has a hard end date tied to a lease or a business opening. Code compliance — accessibility, fire separation, occupancy load — carries more review weight. Vitalite applies the same design-build coordination model to ICI work that it uses on residential projects, adapted for commercial timelines and compliance requirements.",
    answer: "Vitalite builds and fits out warehouses, offices, retail tenant spaces and institutional facilities across the GTA — managing trades, permits, inspections and occupancy coordination from drawings through closeout.",
    bullets: ['Warehouse and light industrial projects', 'Office build-outs and tenant improvements', 'Retail space construction', 'Institutional facility improvements'],
    sections: [
      { heading: 'Warehouse and Light Industrial', text: 'Warehouse build-outs and light industrial fits involve a specific set of coordination points: clear height, mechanical and electrical services, loading dock requirements, fire suppression, concrete floor specifications and Ontario Building Code Group F occupancy requirements. Vitalite works through these at the design stage so the permit set reflects actual operating requirements.' },
      { heading: 'Office and Retail Construction', text: 'Office build-outs and retail tenant improvements are schedule-driven. Move-in dates and lease commencement dates are fixed, and a construction delay creates real business cost. Vitalite manages trade scheduling and municipal inspections to keep these projects on track, and coordinates with building management and landlords on access, approvals and base-building tie-ins.' },
      { heading: 'Institutional and Specialized Facilities', text: "Educational facilities, community spaces and healthcare-adjacent buildings carry more rigorous accessibility, life safety, acoustic and finish requirements than standard commercial space. Vitalite's pre-construction process addresses these requirements at the design stage so they are in the permit set from the first submission." },
      { heading: 'Early Design-Build Engagement', text: "ICI projects benefit from design-build engagement earlier than most commercial clients expect. The earlier that trade, budget and code feedback reaches the design, the fewer revision rounds before permit submission. Vitalite brings construction input to ICI projects from the first design meeting — not after the drawings are finished." },
    ],
    faqs: [
      { question: "Can Vitalite keep a building operational during ICI construction?", answer: "Yes, for most ICI project types. Vitalite plans phased construction, temporary egress, dust barriers, utility isolation and occupancy separation so the building continues to function during the work. The phasing plan is reviewed with the client and building management before construction begins." },
      { question: "What permits are required for a GTA commercial renovation?", answer: "Most commercial renovations require a building permit. Depending on scope, sprinkler modifications, fire alarm updates, HVAC changes and electrical panel work may trigger additional permit categories. Vitalite reviews permit requirements at the project start." },
      { question: "How does Vitalite price ICI construction?", answer: "ICI projects are priced based on a defined scope — architectural drawings, finish specifications, mechanical and electrical requirements and occupancy date. Vitalite can provide a preliminary budget range from a brief and a site visit before drawings are commissioned." },
    ],
    relatedLinks: [
      { label: 'ICI construction service', key: 'service-ici-construction' },
      { label: 'Project and construction management', key: 'service-project-management' },
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-gta-warehouse-office-fitout',
      'project-toronto-retail-tenant-improvement',
    ],
  },
  'work-condos': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Condos & Apartments',
    subtitle: 'Condo renovations that get board approval and stay within the building rules — from the first meeting.',
    image: visuals.workCondos,
    intro: "Condo renovations in Toronto carry a layer of constraints that detached-home renovations do not. Building management needs to approve the scope, the contractor, the insurance, the schedule and the noise plan before a single tool enters the suite. Elevator windows are limited and booked weeks in advance. The suite below cares about your plumbing work. Vitalite treats these constraints as project planning, not administrative overhead.",
    answer: "Vitalite delivers Toronto condo and apartment renovations under a managed process: board package preparation, design, material selection, trade sequencing and construction within the building's rules and access windows.",
    bullets: ['Full interior renovations', 'Kitchen and bathroom rebuilds', 'Board approval package preparation', 'Material procurement and site sequencing'],
    sections: [
      { heading: 'Board Package Preparation', text: 'The building management package for a Toronto condo renovation needs to include contractor insurance certificates, a scope description, a trade schedule, noise management notes, elevator booking confirmation and a damage deposit. A complete submission gets approved. An incomplete one gets rejected and rescheduled — adding two to four weeks. Vitalite prepares complete packages.' },
      { heading: 'Material Selection and Procurement', text: "Condo renovation budgets concentrate in the kitchen and bathrooms — and finish decisions in those rooms compound quickly. Tile pattern, fixture rough-in, niche framing, cabinetry dimensions and appliance sizes all have to be confirmed before the trade sequence begins. Vitalite works through material and finish selections with the client before the schedule is committed." },
      { heading: 'Kitchen and Bathroom Sequencing', text: 'Most condo renovation value is built in the kitchen and the primary bathroom. Vitalite plans these rooms from rough-in through tile and fixture installation, with a trade schedule that avoids the common mistake of tiling before the plumbing rough-in is inspected.' },
      { heading: 'Scope Examples', text: 'Full unit gut renovations, kitchen and primary bathroom rebuilds, flooring replacement across an entire suite, custom millwork and built-in cabinetry installation, and lighting upgrade packages. Larger scopes with layout changes require a building permit — Vitalite confirms permit requirements at the project start.' },
    ],
    faqs: [
      { question: "How long does condo board approval take?", answer: "Most condo boards respond within two to four weeks of a complete submission. Incomplete submissions are returned and require resubmission — adding two to four more weeks. Vitalite prepares complete packages to avoid that delay." },
      { question: "Can I do a full gut renovation in a Toronto condo?", answer: "Yes. A full gut renovation — stripping all non-structural finishes and replacing systems — is one of the most common condo renovation scopes. It requires a building permit when electrical, plumbing or structural changes are involved. Board approval is required in all cases." },
      { question: "What if the condo declaration restricts certain work?", answer: "Many condo declarations restrict plumbing penetrations through the slab, flooring types (for acoustic reasons), HVAC modifications and exterior changes. Vitalite reviews the declaration before design begins — so the scope is designed to comply, not revised after a board rejection." },
    ],
    relatedLinks: [
      { label: 'Condo renovations service', key: 'service-condo-renovations' },
      { label: 'Apartment renovations service', key: 'service-apartment-renovations' },
      { label: 'Building and board approvals', key: 'service-building-board-approvals' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-downtown-toronto-condo-renovation',
      'project-north-york-apartment-suite-renovation',
    ],
  },
  'work-lofts': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Lofts & Open-Concept',
    subtitle: 'Open-plan renovations where every trade decision is also a design decision.',
    image: visuals.workLofts,
    intro: "In a conventional apartment renovation, walls and ceilings conceal the wiring, the ductwork and the plumbing. Trades can work independently without their decisions being visible. In a loft renovation, nothing is concealed. The electrical conduit, HVAC ductwork, sprinkler heads and structural beams all sit in plain view. Vitalite routes these elements as part of the design intent — not after finishes are selected.",
    answer: "Vitalite coordinates Toronto loft renovations from structural review and mechanical rerouting through interior design, material selection and finish-trade installation — managing all trades under one project schedule.",
    bullets: ['Open-concept layout planning', 'Exposed structural feature finishing', 'Integrated kitchen and living areas', 'Mechanical, electrical and HVAC planning in open plan'],
    sections: [
      { heading: 'Structural and Mechanical Coordination', text: "Open-plan lofts expose joists, beams, ductwork and sprinkler piping that a conventional apartment renovation would conceal above a dropped ceiling. Vitalite routes these elements as part of the design intent — the ductwork run, the lighting grid and the exposed beam positions are all resolved on paper before any ceiling comes down." },
      { heading: 'Lighting and Material Decisions', text: "Lofts rely on lighting and material choices to define zones within the open plan — the kitchen is separated from the living area not by a wall but by a ceiling treatment, a flooring transition or a lighting zone. These decisions compound: changing the flooring type affects the transition to the kitchen, the baseboard profile and the acoustic performance. Vitalite resolves them early so trades are not waiting on owner choices mid-construction." },
      { heading: 'Live-Work Space Planning', text: 'Many Toronto loft renovations need to accommodate a home office within the same open volume — which means electrical outlets, data connections, acoustic treatment and furniture layout need to be resolved at the design stage, before the concrete slab is cut and the floor goes in.' },
      { heading: 'Building Approval', text: 'Hard-loft buildings — typically converted industrial or warehouse buildings — often have building management or strata structures that require approval before structural, mechanical or electrical work begins. Vitalite handles the building approval coordination alongside the design and construction process.' },
    ],
    faqs: [
      { question: "Do I need a building permit for a Toronto loft renovation?", answer: "Structural changes, electrical upgrades and plumbing modifications require a building permit. Cosmetic work does not. Vitalite confirms permit requirements at the start of the project." },
      { question: "How do you manage acoustic performance in an open-plan loft?", answer: "Acoustic performance depends on flooring type, ceiling treatment and the mass of the slab. Vitalite specifies flooring underlayment, ceiling design and wall construction to meet the building's requirements and the owner's expectations." },
      { question: "What does a Toronto loft renovation cost?", answer: "Cost depends on structural changes, mechanical rerouting, finish level and existing system condition. A full open-concept loft renovation in Toronto typically ranges from $150,000 to $350,000 depending on size and specification. Vitalite provides a project-specific estimate after a site review." },
    ],
    relatedLinks: [
      { label: 'Loft and open-concept renovations service', key: 'service-loft-renovations' },
      { label: 'Interior design service', key: 'service-interior-design' },
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-toronto-hard-loft-open-plan',
      'project-open-concept-penthouse-renovation',
    ],
  },
  'work-older-homes': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Older Toronto Homes',
    subtitle: 'Older home renovations where the condition assessment happens before the drawings — not during demolition.',
    image: visuals.workOlderHomes,
    intro: "Every older Toronto home carries unknowns that do not show up on a listing sheet: knob-and-tube electrical still feeding the top floor, balloon framing that makes air sealing impossible without gutting, a foundation that was never designed for vertical load. Vitalite's pre-construction condition assessment finds these before drawings are commissioned — so the budget and scope reflect what is actually there.",
    answer: "Vitalite renovates pre-war and mid-century Toronto homes — managing structural assessment, hazardous material abatement coordination, code upgrade requirements and character-sensitive finish planning as part of one organized project.",
    bullets: ['Pre-war and mid-century detached homes', 'Structural assessment and alteration', 'Electrical, plumbing and HVAC upgrades', 'Character-sensitive finish planning'],
    sections: [
      { heading: 'Existing Conditions Assessment', text: 'Before scope is finalized on an older-home renovation, Vitalite reviews accessible structural members, electrical and plumbing systems, mechanical equipment, insulation type and the likely presence of hazardous materials. This step identifies what drives cost and what can stay — so the budget is not built on assumptions that demolition will later disprove.' },
      { heading: 'Structural Alterations and Code Compliance', text: 'Opening a floor plan, adding a second storey or improving foundation performance in an older home requires structural engineering to be involved before the design is finalized. Vitalite coordinates the structural engineer from the concept stage so the engineering shapes the drawings, not the other way around.' },
      { heading: 'Preserving Character While Improving Performance', text: 'Many owners of older Toronto homes want to keep what makes the house distinct — trim profiles, plaster ceilings, original hardwood, proportion of the rooms — while gaining modern insulation, electrical and mechanical performance. Vitalite plans that balance at the design stage, so character elements are protected during demolition.' },
      { heading: 'Hazardous Material Management', text: 'Older Toronto homes commonly contain vermiculite insulation, asbestos-containing drywall compound or floor tile, and lead paint in pre-1970s finishes. Vitalite identifies known and probable hazardous materials at the pre-construction review and coordinates licensed abatement as part of the project scope.' },
    ],
    faqs: [
      { question: "What is a pre-renovation condition assessment?", answer: "A structured site visit before drawings begin, identifying structural issues, electrical and plumbing conditions, hazardous materials and heritage constraints. It informs the renovation budget and permit strategy before design costs are spent — and prevents expensive discoveries during construction." },
      { question: "What if asbestos or lead is found during the renovation?", answer: "Vitalite works with licensed Ontario abatement contractors to manage hazardous materials per regulatory requirements. When materials are identified during construction, the scope change is documented and managed. Pre-construction assessment reduces the likelihood of mid-project discoveries." },
      { question: "Does heritage designation restrict interior renovation?", answer: "Individual heritage designation and Heritage Conservation District boundaries restrict exterior alterations — windows, cladding, doors, roofline — but typically leave interior renovation scope unrestricted. Vitalite checks heritage status at the start of every older-home project." },
    ],
    relatedLinks: [
      { label: 'Heritage and older home renovations service', key: 'service-heritage-renovations' },
      { label: 'Full-gut renovations', key: 'service-gut-renovations' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-cabbagetown-older-home-renovation',
      'project-high-park-mid-century-renovation',
    ],
  },
  'work-townhouses': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Townhouses & Semi-Detached Homes',
    subtitle: 'Party wall, narrow lot and permit-sensitive structural changes — planned for before drawings start.',
    image: visuals.workTownhouses,
    intro: "Toronto townhouses and semis concentrate several construction constraints into one property type. The shared party wall is load-bearing on the neighbour's side. The lot is 15 to 20 feet wide. Site access for equipment and materials is limited. And the basement is often the only place to add space without zoning review. Vitalite plans townhouse renovations around these realities before a drawing line is committed.",
    answer: "Vitalite manages townhouse and semi-detached renovations in Toronto — structural review, party wall engineering, permit coordination, basement alterations and narrow-site construction logistics, from concept through closeout.",
    bullets: ['Rear additions on narrow lots', 'Second-storey additions with party wall coordination', 'Basement walkouts and underpinning', 'Whole-home renovations from gut to finish'],
    sections: [
      { heading: 'Party Wall and Structural Coordination', text: "Structural work within two metres of a shared wall requires engineering review — not just for your structure, but for what happens to the neighbour's foundation and framing when loads shift. Ontario's Party Wall Act requires formal notice to the adjacent property owner before structural alterations to a shared wall. Vitalite coordinates the structural engineering and party wall notice as part of the permit process." },
      { heading: 'Narrow-Lot Site Logistics', text: 'Many Toronto townhouse lots have 15 to 20 foot frontages, no rear lane access and neighbours on both sides. Trade deliveries, equipment staging, concrete pours and waste removal all have to be planned around the lot geometry. Vitalite maps site logistics before construction begins — including crane or lift access for second-storey addition work.' },
      { heading: 'Additions and Vertical Expansions', text: "Rear additions and second-storey additions on Toronto semis and townhouses are common in mature neighbourhoods where moving is expensive and square footage is the limiting factor. Vitalite handles zoning review, architectural drawings, structural engineering and permit submission so additions move through the process without late surprises." },
      { heading: 'Basement Alterations and Suite Creation', text: "Basement lowering, walkout creation and legal suite conversion are frequently requested in Toronto townhouses. Basement work on a party-wall property requires underpinning engineering that accounts for the adjacent foundation. Vitalite reviews basement feasibility and structural implications before any design is committed." },
    ],
    faqs: [
      { question: "Do I need my neighbour's permission to work on a shared wall?", answer: "For structural work affecting the party wall, Ontario law requires formal notice to the adjacent property owner before construction. For work that does not affect the party wall directly, neighbour permission is not legally required — though Vitalite recommends proactive communication as standard practice." },
      { question: "Can I add a legal basement suite to my Toronto townhouse?", answer: "It depends on basement height, ceiling clearance, egress window size and plumbing connection locations. Vitalite reviews basement suite feasibility at the start of the project, including the structural, code and fire separation requirements for a second dwelling unit." },
      { question: "What permits are required for a Toronto townhouse renovation?", answer: "Structural changes, additions, basement alterations, plumbing relocations and HVAC modifications all require building permits. The application needs to address party wall conditions and structural review where applicable. Vitalite prepares and submits the complete package." },
    ],
    relatedLinks: [
      { label: 'Townhouse renovations service', key: 'service-townhouse-renovations' },
      { label: 'Home additions and major renovations', key: 'service-home-additions' },
      { label: 'Drawings, permits and engineering', key: 'service-drawings-permits' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-toronto-semi-detached-rear-addition',
      'project-gta-townhouse-basement-walkout',
    ],
  },
  'work-full-interiors': {
    parent: 'our-work',
    category: 'OUR WORK',
    title: 'Full Interiors',
    subtitle: 'Interior renovations where the finish is only as good as the sequencing that set it up.',
    image: visuals.workFullInteriors,
    intro: "A full interior renovation looks like a finish project — new tile, new cabinetry, new floors. But the quality of those finishes depends entirely on what happened before they were installed: whether the plumbing rough-in was placed correctly, whether the substrate was waterproofed and cured, whether the cabinetry arrived before the countertop template was taken. Vitalite manages interiors from material procurement through finish installation so the sequencing problems that cause most renovation failures are resolved before they hit the schedule.",
    answer: "Vitalite delivers full interior renovations across GTA residential and condo properties — managing design direction, material procurement, trade scheduling and quality control from rough-in through final finish.",
    bullets: ['Kitchen and bathroom gut renovations', 'Millwork, cabinetry and built-ins', 'Flooring, tile and surface finishes', 'Lighting design and fixture procurement'],
    sections: [
      { heading: 'Kitchen Renovations', text: 'Kitchen renovations concentrate the highest number of sequencing dependencies in the smallest footprint. Plumbing rough-in, electrical panel capacity, cabinetry lead times, countertop fabrication and appliance delivery all have to land in the right order. A cabinetry installation before the rough-in is inspected means the cabinets come back out. Vitalite sequences kitchen projects so trades arrive in the order that prevents that.' },
      { heading: 'Bathroom Renovations', text: 'Bathroom renovations are where material decisions compound fastest. Tile pattern, niche framing, linear drain placement, fixture rough-in height and waterproofing specification all have to be finalized before the first tile goes in — because nothing that follows can be adjusted without removing what came before. Vitalite works through these choices with the client before the trade schedule is committed.' },
      { heading: 'Material Procurement and Lead Times', text: "Italian porcelain, engineered stone slabs, custom millwork and European hardware all carry lead times that must be built into the construction schedule. A one-week supplier delay on a tile that is needed in week eight stops the project for that week. Vitalite builds procurement timing into the schedule from the project start — not after the trades are already waiting." },
      { heading: 'Full Scope Projects', text: 'Full interior scope typically includes kitchen and primary bathroom complete rebuilds, secondary bathroom renovation, flooring replacement across all areas, millwork and built-in cabinetry, lighting redesign and fixture procurement, and paint and trim throughout. Vitalite manages the complete scope or a defined subset, depending on what the owner wants to coordinate directly.' },
    ],
    faqs: [
      { question: "How long does a full interior renovation take?", answer: "A complete interior renovation of a typical Toronto home — kitchen, two bathrooms, new flooring and lighting throughout — typically takes 10 to 18 weeks of active construction. Material procurement and design decisions add 6 to 10 weeks before construction begins." },
      { question: "Can I live in my home during a full interior renovation?", answer: "It depends on the scope. Simultaneous kitchen and all-bathroom renovation typically makes the home uninhabitable. A phased approach that keeps one bathroom and a temporary kitchen functional allows some clients to stay. Vitalite discusses living arrangements at project start and plans the phasing accordingly." },
      { question: "How does Vitalite handle material selection and procurement?", answer: "Vitalite assists with material selection within a defined direction and budget, coordinates with suppliers to confirm lead times, places orders at the right point in the schedule and manages delivery to site. Owners are not expected to manage supplier relationships or chase delivery confirmations." },
    ],
    relatedLinks: [
      { label: 'Interior design service', key: 'service-interior-design' },
      { label: 'Material selection and procurement', key: 'service-material-selection' },
      { label: 'The Vitalite Way', key: 'why-the-vitalite-way' },
      { label: 'Contact Vitalite', key: 'contact-us' },
    ],
    projectKeys: [
      'project-gta-full-interior-renovation',
      'project-toronto-kitchen-bath-millwork-renovation',
    ],
  },
  'blog-buyers-renovation-guide': {
    parent: 'blog',
    category: 'BLOG',
    title: "Buyer's Renovation Guide",
    subtitle: 'What GTA buyers need to check before removing conditions on a property that needs work.',
    image: visuals.buyerGuide,
    intro: 'Most renovation surprises in the GTA are not surprises — they are things the buyer could have known before closing. A pre-offer walkthrough with the right questions changes what you offer, what you budget and whether you proceed.',
    answer: 'Before making an offer on a GTA property that needs renovation, check four things: lot constraints and zoning potential, condition of structure and mechanical systems, permit history (what was done without permits), and a realistic cost range for your goals. Do this before removing conditions — not after closing.',
    bullets: [
      'Confirm lot dimensions, setbacks and zoning designation before offer',
      'Have a general contractor or design-build team walk the property with you',
      'Pull the permit history at the city or request disclosure from the seller',
      'Get a rough budget range tied to your actual renovation goals — not generic averages',
    ],
    sections: [
      { heading: 'Zoning tells you what is possible — not just what is there', text: 'The existing house tells you what was approved in the past. Zoning tells you what you can do next. A lot in an R2 zone may support a garden suite or a second unit. A heritage-designated property may restrict your exterior changes. Check zoning before you fall in love with a property — it determines whether your planned renovation is even permitted.' },
      { heading: 'Condition determines your real budget — not the asking price', text: "A property listed as a 'renovation opportunity' could mean cosmetic updates or it could mean knob-and-tube wiring, galvanized plumbing, balloon framing and a foundation that has shifted. The condition of structure and mechanical systems drives renovation cost more than any other factor. A contractor or design-build firm who knows what to look for can give you a rough scope picture before you make an offer." },
      { heading: 'Permit history shows you what was done without approval', text: 'Undisclosed work without permits is one of the most common hidden risks in GTA property purchases. A finished basement, a garage conversion, a structural wall that was removed — any of these could have been done without permits, meaning they may not meet code and may require costly remediation. Request permit disclosure from the seller and cross-reference against the current state of the property.' },
      { heading: 'Timeline and carrying costs are part of the purchase price', text: 'A renovation that takes 12 months means 12 months of carrying costs on top of your purchase price. For complex projects — additions, multi-unit conversions, gut renovations — the design, permit and construction timeline can run longer than owners expect. Factor the carrying cost of that timeline into your purchase-price calculation before removing conditions.' },
      { heading: 'What Vitalite reviews before you close', text: 'Vitalite offers pre-purchase feasibility reviews for GTA buyers who want a construction-informed read on a property before committing. We look at lot constraints, structural condition, zoning potential, rough renovation scope and permit risk — and give you a realistic picture of what your planned project will take before the purchase is final.' },
    ],
    faqs: [
      { question: 'Can I get a renovation cost estimate before I make an offer?', answer: 'Yes — a rough budgetary range is possible before detailed drawings exist. Vitalite can walk a property with you and give you a scope-based cost range for your intended renovation. It will not be a fixed construction price, but it gives you enough to negotiate with and to decide whether the property makes financial sense for your goals.' },
      { question: 'What is a pre-purchase feasibility review and when do I need one?', answer: 'A feasibility review is a structured assessment of whether a property supports your intended project — covering lot constraints, zoning, structural condition, approvals required and rough cost range. You need it when your purchase decision depends on being able to complete a specific renovation: an addition, a second unit, a major gut renovation or a garden suite.' },
      { question: 'What happens if I find permit issues after closing?', answer: 'Unpermitted work discovered after closing becomes the new owner\'s problem. The city can require you to obtain retroactive permits, bring the work up to current code or remove the non-compliant work entirely. The cost varies widely depending on what was done and when. It is far less expensive to find this before closing than to manage it after.' },
    ],
    relatedLinks: [
      { label: 'Architectural Services', key: 'service-architectural-services' },
      { label: 'Drawings & Permits', key: 'service-drawings-permits' },
      { label: 'Project Management', key: 'service-project-management' },
      { label: 'Additions & Major Renovations', key: 'work-additions' },
    ],
  },
  'blog-renovation-costs': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Toronto Renovations: Cost Per SQ FT',
    subtitle: 'Why cost-per-square-foot numbers mislead GTA owners — and what actually drives renovation budgets.',
    image: visuals.blogRenovationCosts,
    intro: 'The number most GTA owners hear first — cost per square foot — is the least useful one for planning a specific project. It averages across conditions, finishes, structural complexity and approvals that may have nothing to do with your property or your goals.',
    answer: 'GTA renovation costs are driven by six factors: structural condition, mechanical systems age, finish and material selection, permit and engineering requirements, site access constraints, and trade sequencing complexity. Square footage tells you how many decisions you need to make. It does not tell you how any single one will price out.',
    bullets: [
      'Structure and mechanical systems set the floor on your renovation budget',
      'Finishes are the most adjustable variable — but only after structure is priced',
      'Permit and engineering costs are fixed regardless of project size',
      'Site access, condo restrictions and working-hour limits add cost in dense GTA locations',
    ],
    sections: [
      { heading: 'Structure comes before finishes', text: 'A renovation that requires underpinning, load-bearing wall removal or floor-level changes carries structural engineering cost regardless of what finishes you choose. This is the part of the budget that cannot be negotiated down after the fact. Structural condition — not square footage — is what separates a $150/sq ft kitchen refresh from a $400/sq ft full-floor renovation.' },
      { heading: 'Mechanical systems reset the budget', text: 'Knob-and-tube wiring, galvanized plumbing and undersized HVAC are common in pre-1970s Toronto homes. Replacing them is not optional when a full renovation is underway — building inspectors will require it. A project on a mid-century home that looks like a cosmetic gut renovation often includes a complete mechanical overhaul that more than doubles the apparent scope.' },
      { heading: 'Finishes are the most controllable variable', text: 'Once structure and mechanical work is priced, finishes are where owners have the most control. The difference between mid-grade and high-end tile, millwork and fixtures can be $50–$100/sq ft across a full interior. But that flexibility only exists after the structural and mechanical scope is fixed. Pricing finishes before structure is priced produces estimates that do not survive contact with the project.' },
      { heading: 'Permits and engineering add fixed costs', text: 'Building permit fees, engineer drawings, structural reviews and inspection scheduling are relatively fixed regardless of project size. A 400 sq ft addition and a 1,200 sq ft addition may carry the same permit and engineering cost. This is why cost-per-square-foot calculations tend to overstate costs on large projects and understate them on small ones.' },
      { heading: 'Contingency is not optional in GTA renovations', text: 'GTA renovations — particularly those on older properties — carry a meaningful risk of scope changes once walls are opened. Standard practice is a 10–15% contingency for projects on homes built before 1980, and 5–10% for newer construction. Contractors who present firm prices without contingency either have not priced the unknowns or have built them into the base price without telling you.' },
    ],
    faqs: [
      { question: 'What does a GTA custom home cost per square foot in 2026?', answer: 'A new custom home in the GTA typically runs $350–$600+ per square foot for construction, depending on finishes, structural complexity and site conditions. High-specification homes with premium finishes, custom millwork and complex structural elements exceed this range. This does not include soft costs — architecture, engineering, permits and project management — which add 15–25% on top of construction.' },
      { question: 'Why do renovation quotes from different contractors vary so much?', answer: 'Different contractors scope the same project differently. One may include structural engineering, the other may not. One prices allowances for finishes that will increase when selections are made; another quotes a specific finish schedule. One includes a contingency; another prices only known work. A quote that is 30% lower than others is usually missing scope — not offering a better price.' },
      { question: 'How does Vitalite estimate budget before drawings are done?', answer: 'Vitalite uses a scope-first approach to budgeting. Before any drawings are produced, we assess the property, confirm the intended project scope and apply current market pricing to the key cost drivers: structural, mechanical, finishes, permits and project-type-specific requirements. This gives owners a defensible budget range before committing to design fees.' },
    ],
    relatedLinks: [
      { label: 'Project Management', key: 'service-project-management' },
      { label: 'Architectural Services', key: 'service-architectural-services' },
      { label: 'Custom Homes', key: 'work-custom-homes' },
      { label: 'Additions & Major Renovations', key: 'work-additions' },
    ],
  },
  'blog-design-build-vs-architect': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Design-Build Vs Architect',
    subtitle: 'When integrated delivery outperforms separated design and construction — and when it does not.',
    image: visuals.designBuildVsArchitect,
    intro: 'The traditional model separates the person who designs your project from the person who builds it. For straightforward projects this can work. For GTA custom homes, additions and complex renovation projects, that separation creates a gap where cost overruns and schedule delays live.',
    answer: 'Design-build is worth considering when your project has budget sensitivity, structural complexity, permit requirements or investment return as a goal. An architect-led separate-contract process works when design integrity is the primary objective and construction complexity is low. Most GTA renovation and new-build owners benefit more from integrated delivery than they realize before they start.',
    bullets: [
      'Design-build connects cost feedback to design decisions before drawings are finalized',
      'One point of accountability covers design, permits and construction',
      'Approval delays and field conflicts are managed within one team — not between two contracts',
      'Construction input shapes design decisions rather than inheriting them',
    ],
    sections: [
      { heading: 'Where the separate-contract model fails GTA owners', text: "When an architect designs a project and hands off drawings to a general contractor, the GC prices what the drawings show — not what the owner expected to spend. If the drawings exceed budget, the owner must go back to the architect for revisions (additional fees), then back to the GC for a revised price. This loop — common on GTA custom homes and additions — costs time and money at exactly the point when owners are most committed to the project." },
      { heading: 'What design-build actually means in practice', text: 'In a design-build model, the same firm is responsible for drawings, permits and construction. Budget feedback is continuous — the construction team reviews drawings as they develop and flags scope that does not match the budget before the drawings are submitted for permit. This does not mean design is compromised. It means the builder is in the room when design decisions are made.' },
      { heading: 'Budget feedback before the drawings are finished', text: 'The most valuable thing a design-build approach provides is budget feedback while there is still time to act on it. A design decision made at 30% drawing completion is easy to revise. The same decision made at 90% drawing completion — when permit submission is imminent — is expensive to change. Vitalite reviews design against cost at every milestone, so owners do not discover budget problems at the worst possible moment.' },
      { heading: 'Accountability when something goes wrong on site', text: 'When a problem emerges during construction — a structural discovery, a site condition that was not visible in drawings, a municipal requirement that was missed — the question is: whose problem is it? In a separate-contract model, this becomes a dispute between the architect, the engineer and the contractor. In a design-build model, one team is responsible for resolving it.' },
      { heading: 'When to choose each model', text: 'An architect-led separate process makes sense for landmark design projects, institutional work or situations where a specific architect\'s design vision is the primary driver. Design-build is typically the stronger choice for owner-funded residential projects — custom homes, additions, multiplexes, gut renovations — where budget, schedule and accountability matter as much as design outcome.' },
    ],
    faqs: [
      { question: 'Can I use a design-build firm and still have input on design?', answer: 'Yes. Design-build does not mean the owner is removed from design decisions — it means the design and construction are managed by the same accountable team. Owners at Vitalite are involved in every design milestone: site planning, floor plan review, elevations, material selection and finish packages. The difference is that budget and buildability feedback happens in those same conversations.' },
      { question: 'Does design-build cost more than hiring separate firms?', answer: 'Not typically — and often less, when you account for the cost of design revisions driven by budget misalignment. The separate-contract model appears cheaper at the design stage because architecture fees are presented in isolation. But when you add the construction price, revision cycles and change orders that result from design-to-budget disconnects, the total project cost is often higher than a well-managed design-build engagement.' },
      { question: 'How does design-build handle permit applications?', answer: 'In a design-build model, the same team that produces drawings also manages permit submission and follow-up. At Vitalite, this means permit strategy is considered during design — zoning requirements, site plan conditions, conservation authority overlays and structural code requirements are incorporated before drawings are submitted, not after the municipality flags them.' },
    ],
    relatedLinks: [
      { label: 'Architectural Services', key: 'service-architectural-services' },
      { label: 'Why Design-Build', key: 'why-design-build' },
      { label: 'Project Management', key: 'service-project-management' },
      { label: 'Custom Homes', key: 'work-custom-homes' },
    ],
  },
  'blog-renovation-timeline': {
    parent: 'blog',
    category: 'BLOG',
    title: 'How Long Is A GTA Renovation?',
    subtitle: 'Real timelines for custom homes, additions, multiplex and interior renovations — phase by phase.',
    image: visuals.timeline,
    intro: '"Six months" is not a GTA renovation timeline. It is a guess that has not accounted for permit intake queues, engineering revisions, trade procurement or inspection scheduling. Owners who plan for a realistic timeline spend less money correcting for a rushed one.',
    answer: 'A full GTA renovation — from first consultation to occupancy — typically runs 12–20 months for additions and custom homes, 8–14 months for complex interior and multiplex work, and 4–8 months for contained interior renovations. The longest phase is almost always pre-construction: design, engineering and municipal approval. Most schedule failures happen here, not in construction.',
    bullets: [
      'Pre-construction (design through permits) takes longer than owners expect — plan for 6–14 months',
      'Toronto and Markham permit review times vary by project type and current intake volume',
      'Trade procurement for custom and specialty items can require 10–16 week lead times',
      'Construction schedules slip when pre-construction is rushed — the two phases are connected',
    ],
    sections: [
      { heading: 'Consultation and feasibility: 2–6 weeks', text: 'The first phase covers site review, zoning confirmation, owner goal alignment and rough budget. For straightforward projects this can move quickly. For properties with heritage overlaps, complex lot conditions or investment-return calculations, this phase requires more time and should not be compressed. Decisions made in feasibility shape every phase that follows.' },
      { heading: 'Design and drawings: 6–16 weeks', text: 'Permit-ready drawings for an addition or custom home require architectural drawings, structural engineering, mechanical/electrical design and site plan documentation. The timeline depends on project complexity, design revision cycles and the speed of engineering coordination. Complex projects — multi-unit conversions, additions with below-grade work, properties with site plan conditions — take longer. Rushed drawings produce permit comments that extend the overall timeline.' },
      { heading: 'Permits and engineering approvals: 8–20 weeks', text: 'Toronto Building Division intake, comment review and permit issuance timelines vary by project type and current volume. Minor permits for interior work can move in 4–6 weeks. Full building permits for additions, garden suites and new construction typically run 10–16 weeks at current intake volumes. Projects requiring Committee of Adjustment or conservation authority review add 8–14 weeks on top of the building permit timeline.' },
      { heading: 'Procurement and pre-mobilization: 4–10 weeks', text: 'Custom cabinetry, structural steel, windows, doors and specialty mechanical equipment often carry 10–16 week lead times. Procurement should start at or before permit submission — not after permit issuance. Projects that delay procurement until the permit arrives arrive at the start of construction without their long-lead materials, which stalls progress immediately.' },
      { heading: 'Construction and closeout: varies by scope', text: 'Interior renovations run 8–16 weeks of active construction. Additions and full gut renovations run 4–8 months. Custom homes run 8–14 months from site mobilization to occupancy permit. Closeout — the final inspection, occupancy permit, punch list completion and utility connections — adds 4–8 weeks beyond apparent completion. Projects that run cleanly through trade coordination and inspection scheduling finish predictably; those that do not typically extend 20–40% past the initial construction schedule.' },
    ],
    faqs: [
      { question: 'Why does the building permit take so long in Toronto?', answer: 'Toronto Building Division processes permits against current building code, zoning bylaws and applicable site plan conditions. Complex projects — additions, new construction, multi-unit conversions — require review by structural, mechanical and zoning examiners. First-comment turnaround at current volumes is typically 6–10 weeks for complex permits. Each response cycle adds additional review time. Projects with complete, code-compliant submissions move faster than those requiring multiple revision rounds.' },
      { question: 'Can construction start before the permit is approved?', answer: 'No — in Ontario, construction cannot begin until a building permit is issued and posted on site. Some owners begin site preparation work (demolition of non-structural elements, hazmat abatement) under a limited permit, but structural work, foundation and framing require the full building permit. Starting without a permit creates significant liability and can result in orders to stop work, remove unpermitted work or pay significant fines.' },
      { question: 'What causes the most delays in GTA renovations?', answer: 'Three things cause most GTA renovation delays: permit comments resulting from incomplete drawings, trade scheduling gaps caused by late procurement, and field discoveries during construction on older properties. All three are predictable and manageable with proper pre-construction planning. Projects that rush through design and permit preparation to get to construction faster almost always finish later than projects that take the time to do pre-construction right.' },
    ],
    relatedLinks: [
      { label: 'Drawings & Permits', key: 'service-drawings-permits' },
      { label: 'Project Management', key: 'service-project-management' },
      { label: 'Architectural Services', key: 'service-architectural-services' },
      { label: 'Additions & Major Renovations', key: 'work-additions' },
    ],
  },
  'blog-renovation-laws': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Toronto Renovation Laws',
    subtitle: 'Permits, zoning, building code and board approvals — explained for GTA homeowners.',
    image: visuals.blogRenovationLaws,
    intro: 'Most GTA owners do not realize how many of their planned renovation steps require a permit, a drawing or an engineer\'s stamp. The ones who find out after starting construction pay twice.',
    answer: 'In Toronto and the GTA, any work that changes structure, adds living space, alters mechanical systems or modifies the building footprint requires a building permit. This includes basement underpinning, additions, second-unit creation, structural wall removal and major HVAC work. Condo and rental building work adds a second approval layer: the building\'s property management or board.',
    bullets: [
      'Building permits are required for structural changes, additions, second units and major mechanical work',
      'Zoning bylaws determine what your lot is allowed to have — independent of what the building code allows',
      'Engineering stamps are required when structural changes affect load-bearing elements',
      'Condo and rental buildings require board or property management approval before any trade work begins',
    ],
    sections: [
      { heading: 'Zoning: what your lot is allowed to have', text: 'Zoning bylaws in Toronto and GTA municipalities determine permitted uses, maximum building coverage, setbacks from lot lines, building height limits and lot-specific conditions. A homeowner who wants to add a garden suite, convert a garage, add a second storey or extend the rear of their home must confirm the planned project fits within zoning before any design work begins. Zoning violations discovered after drawings are produced require redesign — at additional cost.' },
      { heading: 'Building permits: what requires approval in Ontario', text: "Under Ontario's Building Code, a permit is required for any work that affects structure, changes the use of space, creates new dwelling units, alters the building envelope or modifies plumbing, HVAC or electrical systems. Cosmetic work — painting, flooring, replacing fixtures in kind — generally does not require a permit. Any work that changes how a space is used, adds square footage or touches structural elements does. When in doubt, check with the local building department before starting." },
      { heading: 'Engineering: when a structural stamp is required', text: "Structural engineering drawings stamped by a licensed engineer (P.Eng) are required when work involves load-bearing walls, beam replacement, floor openings, underpinning or any modification to the building's structural system. The permit examiner will not approve drawings for structural changes without an engineer's review. Projects that proceed without required engineering stamps will receive building code orders requiring compliance before work can continue or close." },
      { heading: 'Condo board approvals: a parallel process', text: 'Owners in Toronto condos and strata buildings face two separate approval processes: the municipal building permit and the building\'s own board or property management approval. Most buildings require a renovation agreement, proof of contractor insurance, approved working hours, elevator booking, floor protection plans and post-renovation inspections. The board approval process runs on a different timeline from the city permit and must be managed in parallel, not sequentially.' },
      { heading: 'What happens when work is done without permits', text: 'Unpermitted work in Ontario can result in orders to stop work, retroactive permit applications, required demolition and rebuilding to code, fines and — at sale — disclosure obligations that reduce property value or complicate financing. The City of Toronto investigates unpermitted work upon complaint or inspection. It is significantly less expensive to get permits in advance than to address violations after construction is complete.' },
    ],
    faqs: [
      { question: 'What happens if I renovate without a permit in Toronto?', answer: 'The City of Toronto can issue an order to comply, requiring you to obtain retroactive permits or demonstrate code compliance for work already done. If compliance cannot be demonstrated, the order may require that work be removed or opened for inspection. Fines under Ontario\'s Building Code Act can reach $50,000 for individuals. The real cost for most owners is the remediation work required to bring unpermitted construction up to code — which often exceeds what the permits would have cost.' },
      { question: 'Do kitchen and bathroom renovations need permits in Toronto?', answer: 'Cosmetic kitchen and bathroom updates — replacing cabinets, counters, tiles and fixtures in kind — do not require permits. Work that moves plumbing, adds electrical circuits, removes walls, lowers ceilings or reconfigures the layout typically does. If you are unsure whether your planned scope crosses the permit threshold, contact Toronto Building or have a design-build firm review your scope before starting.' },
      { question: 'How long does a Toronto building permit take?', answer: 'Toronto Building Division permit timelines vary by project type and current intake volume. Minor interior renovation permits can be issued in 4–8 weeks. Full building permits for additions, new construction and garden suites typically run 10–18 weeks at current volumes. Projects requiring a Committee of Adjustment hearing, site plan amendment or conservation authority review add 2–4 months to the timeline. Submitting complete, code-compliant drawings reduces review time; incomplete submissions trigger comment cycles that extend the timeline.' },
    ],
    relatedLinks: [
      { label: 'Drawings & Permits', key: 'service-drawings-permits' },
      { label: 'Building & Board Approvals', key: 'service-building-board-approvals' },
      { label: 'Architectural Services', key: 'service-architectural-services' },
      { label: 'Additions & Major Renovations', key: 'work-additions' },
    ],
  },
  'blog-garden-suite-ideas': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Garden Suite Ideas 2026',
    subtitle: 'Design, approval and budget considerations for GTA owners planning a backyard dwelling.',
    image: visuals.blogGardenSuiteIdeas,
    intro: 'The City of Toronto legalized garden suites city-wide in 2022. The zoning permission exists. What most owners discover is that lot constraints, utility connections, setback requirements and construction cost make some properties far better candidates than others — and that finding out before spending money on design matters.',
    answer: 'A garden suite on a suitable GTA lot can generate $2,000–$3,500/month in rental income, create independent living space for family or increase property value. Feasibility depends on lot depth, rear access, utility service capacity and zoning setbacks. Confirm these before committing to design fees.',
    bullets: [
      'Lot depth of at least 40m (130 ft) typically supports a viable garden suite footprint',
      'Rear laneway access significantly reduces construction logistics cost and disruption',
      'Service upgrades (water, gas, electrical) can add $20,000–$50,000 depending on connection distance',
      'City of Toronto permits garden suites up to 60 sq m (645 sq ft) as of right in most residential zones',
    ],
    sections: [
      { heading: 'What Toronto\'s zoning rules allow in 2026', text: 'Under Toronto\'s 2022 Garden Suite By-law, properties in most residential zones can build a detached garden suite in the rear yard as of right — meaning no Committee of Adjustment hearing is required. Maximum permitted size is 60 sq m of gross floor area. Maximum height is 6 metres. Setbacks from the rear lot line, side lot lines and the main dwelling apply. Some properties in conservation authority floodplains, with heritage designations or within specific site plan areas may have additional restrictions.' },
      { heading: 'Lot constraints that determine feasibility', text: 'The most common feasibility blockers for Toronto garden suites are: insufficient lot depth (properties shorter than 30–35m typically cannot meet setbacks and accommodate a useful footprint), tree protection zones that restrict where structures can be built, grading challenges that make drainage or foundation conditions difficult, and insufficient utility service capacity to support a second dwelling. A feasibility review before design commitment identifies these blockers before drawing fees are spent.' },
      { heading: 'Design ideas for compact garden suites', text: 'A 40–60 sq m garden suite can function as a complete one-bedroom dwelling when designed intentionally. Open-plan living, dining and kitchen areas make the main floor feel larger. Storage built into walls and under stairs recovers functional space. High ceilings and large windows reduce the sense of compression. Durable exterior materials — fiber cement, metal cladding, quality wood siding — reduce long-term maintenance. The design decisions that matter most in compact dwellings are ventilation, light penetration and acoustic separation from the main house.' },
      { heading: 'Approval path: drawings, engineering and permits', text: 'A garden suite requires permit drawings, structural engineering and a building permit from the City of Toronto. The permit process typically runs 10–16 weeks at current volumes. Projects near water features, ravines or conservation authority lands may require additional review. Utility connections — a separate electrical meter, gas line and water service — require coordination with the relevant utilities and are separate from the building permit. The full pre-construction timeline from feasibility to permit issuance typically runs 5–9 months.' },
      { heading: 'Construction cost and rental yield', text: 'Garden suite construction in the GTA currently runs $250,000–$450,000 for a complete 40–60 sq m unit, depending on structural approach, finishes, site conditions and utility connection costs. Rental income in Toronto for a well-located one-bedroom garden suite runs $2,000–$3,200/month as of 2026, depending on neighbourhood and finish level. Owners evaluating financial return should model the full cost — construction, soft costs, utility connections, landscaping restoration — against realistic rental income and tax implications.' },
    ],
    faqs: [
      { question: 'What is the difference between a garden suite and a laneway house?', answer: 'In Toronto planning terminology, a garden suite is a detached dwelling in the rear yard of a property without rear lane access. A laneway house is a detached dwelling on a property with rear lane access (a public lane running behind the property). Both are now permitted city-wide as of right, but laneway houses have been permitted since 2018 and the design and access conditions differ. Laneway properties typically have simpler construction logistics because materials can be delivered and trades can access the site from the lane.' },
      { question: 'Can I build a garden suite on any Toronto property?', answer: 'No. While garden suites are permitted as of right in most residential zones, individual lot conditions can block feasibility. Properties shorter than approximately 30m depth often cannot meet the required setbacks and still achieve a usable footprint. Properties with significant tree coverage may face tree protection restrictions. Flood-prone properties within conservation authority regulated areas may require additional approvals. Heritage-designated properties may have restrictions on rear yard structures. A feasibility review specific to your property is the only way to confirm what is possible.' },
      { question: 'How long does it take to get a garden suite built?', answer: 'From initial feasibility review to occupancy, a Toronto garden suite typically takes 12–18 months. Feasibility and design: 2–4 months. Permit processing: 3–5 months. Utility connections and pre-construction: 1–2 months. Construction: 4–6 months. Closeout and occupancy permit: 1–2 months. Projects with complex lot conditions, conservation authority involvement or utility service challenges take longer. Starting with a property feasibility review before committing to design fees is the single most effective way to avoid timeline surprises.' },
    ],
    relatedLinks: [
      { label: 'Garden Suites & Laneway Houses', key: 'service-garden-suites' },
      { label: 'Drawings & Permits', key: 'service-drawings-permits' },
      { label: 'Garden Suites Portfolio', key: 'work-garden-suites' },
      { label: 'Architectural Services', key: 'service-architectural-services' },
    ],
  },
  'blog-fixer-upper-vs-new': {
    parent: 'blog',
    category: 'BLOG',
    title: 'Renovating A Fixer-Upper vs Buying New',
    subtitle: 'Which creates better value in the GTA — and how to run the numbers before you decide.',
    image: visuals.fixerUpper,
    intro: 'The question is not which is better in general. The question is which is better for your lot, your goals, your financing and the GTA market in 2026. The answer looks different for every property.',
    answer: 'In most established GTA neighbourhoods, a well-located older property renovated by the right team creates more value than a similar budget spent on a newer property in a less desirable location. The renovation advantage depends on land value, zoning potential, structural condition and rental income opportunity. The disadvantage is timeline, carrying cost and scope risk — all of which can be planned for.',
    bullets: [
      'Location is the only variable that cannot be changed — it drives land value and long-term appreciation',
      'Zoning potential on older GTA properties often allows additions, second units and garden suites that newer properties do not',
      'Structural condition determines the real renovation budget — get a construction assessment before committing',
      'Carrying costs during renovation (mortgage, property tax, interim housing) are part of the comparison',
    ],
    sections: [
      { heading: 'Location is the variable that cannot be changed', text: 'A fixer-upper in Roncesvalles, Leslieville or High Park is a different calculation than a newer property in a suburb with less established amenity. The land value in established Toronto neighbourhoods compresses over time — meaning the renovation cost is a smaller percentage of total property value than it might appear. A $300,000 renovation on a $1.2M lot in an appreciating neighbourhood has different economics than the same renovation in a market with flatter appreciation.' },
      { heading: 'Zoning potential can multiply the return', text: 'Many older GTA properties sit on lots that are now eligible for garden suites, second units, additions or even lot severances under updated zoning rules. This potential is invisible in the purchase price but real in the return. A fixer-upper on a 45-foot lot in a neighbourhood where garden suites are permitted represents significantly different economics than a newer property on a smaller lot in a restricted zone. Zoning eligibility should be part of the purchase analysis.' },
      { heading: 'Structural condition determines the real renovation budget', text: 'The risk in buying a fixer-upper is not the renovation — it is underestimating the renovation. Pre-war Toronto homes frequently have knob-and-tube wiring, galvanized plumbing, balloon framing and inadequate insulation. A cosmetic gut renovation on a 1930s semi-detached can become a full mechanical overhaul when walls are opened. Getting a construction professional to walk the property before purchase — not just a home inspector — gives you a cost range tied to actual scope, not assumptions.' },
      { heading: 'Carrying costs are part of the comparison', text: 'A 14-month renovation on an $800,000 property at a 6% mortgage rate means roughly $56,000 in interest during construction, plus property taxes, utilities and any interim housing cost. This needs to appear in the fixer-upper budget alongside construction cost. Owners who compare the purchase price of a fixer-upper to the purchase price of a newer property without factoring carrying costs often find the gap is smaller than the renovation quote suggested.' },
      { heading: 'When a newer property is the better choice', text: 'Buying newer makes more sense when the fixer-upper requires structural work that eliminates the price advantage, when the renovation timeline conflicts with a hard move-in requirement, when financing constraints make the gap between purchase price and renovation cost difficult to bridge, or when the property has conditions — heritage designation, conservation authority overlay, lot access issues — that significantly complicate the project. The newer property\'s advantage is predictability: what you see is approximately what you get.' },
    ],
    faqs: [
      { question: 'Is it worth buying a fixer-upper in Toronto\'s market?', answer: 'It depends on the property and your goals. In established Toronto neighbourhoods with strong land values, a structurally sound fixer-upper renovated to a high standard can outperform a newer property on total return — particularly when zoning potential (garden suite, second unit, addition) is included in the calculation. The key is knowing the renovation cost before committing to the purchase price — not discovering it after closing.' },
      { question: 'How do I know if a GTA property has good renovation potential?', answer: 'Four factors determine renovation potential: lot location and land value, zoning eligibility for the improvements you want, structural condition of the existing building, and the gap between current market value and post-renovation value. A pre-purchase construction assessment — not just a home inspection — tells you which of these factors is working for the property and which is working against it.' },
      { question: 'Can I add a second suite or garden suite to an older Toronto home?', answer: 'In most Toronto residential zones, yes — older homes are eligible for the same zoning permissions as newer ones. A legal second unit (basement apartment) can be created in most semi-detached and detached properties with sufficient ceiling height and code-compliant conditions. A garden suite can be added to properties with sufficient lot depth. Both require building permits, drawings and in some cases engineering. Vitalite can review zoning eligibility and scope for both as part of a pre-purchase assessment.' },
    ],
    relatedLinks: [
      { label: 'Project Management', key: 'service-project-management' },
      { label: 'Architectural Services', key: 'service-architectural-services' },
      { label: 'Additions & Major Renovations', key: 'work-additions' },
      { label: 'Older Toronto Homes', key: 'work-older-homes' },
    ],
  },
};

const staticDetailPages: Record<string, DetailPageContent> = {
  faq: {
    parent: 'contact-us',
    category: 'FAQ',
    title: 'GTA Design-Build FAQ',
    subtitle: 'Common questions about Vitalite consultation, drawings, permits, budgets, construction management and project delivery.',
    image: visuals.permitGuide,
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
    image: visuals.designBuild,
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
    .filter((page) => page.key.startsWith('location-') || page.key.startsWith('community-') || page.key.startsWith('guide-') || page.key === 'faq' || page.key === 'ai-gta-design-build-guide')
    .map((page) => [page.key, createGeneratedLandingPage(page)]),
);

const projectVisuals: Partial<Record<string, string>> = {
  'project-willowdale-custom-home-4700': visualAsset('ai-project-willowdale-custom-home-4700'),
  'project-preston-lake-stouffville-addition': visualAsset('ai-project-preston-lake-stouffville-addition'),
  'project-lansdowne-toronto-multiplex-laneway': visualAsset('ai-project-lansdowne-toronto-multiplex-laneway'),
  'project-erindale-mississauga-side-split-addition': visualAsset('ai-project-erindale-mississauga-side-split-addition'),
  'project-york-toronto-lot-severance-semi': visualAsset('ai-project-york-toronto-lot-severance-semi'),
  'project-bedford-park-mixed-use-rental': visualAsset('ai-project-bedford-park-mixed-use-rental'),
  'project-avondale-custom-home-3200': visualAsset('ai-project-avondale-custom-home-3200'),
  'project-stouffville-retrofit-cathedral-walkup': visualAsset('ai-project-stouffville-retrofit-cathedral-walkup'),
  'project-rural-stouffville-american-country': visualAsset('ai-project-rural-stouffville-american-country'),
  'project-willowdale-expansion-5200': visualAsset('ai-project-willowdale-expansion-5200'),
  'project-past-willowdale-1': visualAsset('ai-project-past-willowdale-1'),
  'project-past-cachet-markham-1': visualAsset('ai-project-past-cachet-markham-1'),
  'project-past-cachet-markham-2': visualAsset('ai-project-past-cachet-markham-2'),
  'project-past-richvale-richmond-hill': visualAsset('ai-project-past-richvale-richmond-hill'),
  'project-past-willowdale-2': visualAsset('ai-project-past-willowdale-2'),
  'project-past-bullock-markham-1': visualAsset('ai-project-past-bullock-markham-1'),
  'project-past-cachet-markham-3': visualAsset('ai-project-past-cachet-markham-3'),
  'project-past-bullock-markham-2': visualAsset('ai-project-past-bullock-markham-2'),
  'project-past-don-valley-north-york': visualAsset('ai-project-past-don-valley-north-york'),
  'project-past-willowdale-3': visualAsset('ai-project-past-willowdale-3'),
  'project-past-bullock-markham-3': visualAsset('ai-project-past-bullock-markham-3'),
  'project-past-bayview-village-north-york': visualAsset('ai-project-past-bayview-village-north-york'),
  'project-toronto-laneway-suite-over-garage': visualAsset('ai-project-toronto-laneway-suite-over-garage'),
  'project-stouffville-backyard-garden-suite': visualAsset('ai-project-stouffville-backyard-garden-suite'),
  'project-gta-warehouse-office-fitout': visualAsset('ai-project-gta-warehouse-office-fitout'),
  'project-toronto-retail-tenant-improvement': visualAsset('ai-project-toronto-retail-tenant-improvement'),
  'project-downtown-toronto-condo-renovation': visualAsset('ai-project-downtown-toronto-condo-renovation'),
  'project-north-york-apartment-suite-renovation': visualAsset('ai-project-north-york-apartment-suite-renovation'),
  'project-toronto-hard-loft-open-plan': visualAsset('ai-project-toronto-hard-loft-open-plan'),
  'project-open-concept-penthouse-renovation': visualAsset('ai-project-open-concept-penthouse-renovation'),
  'project-cabbagetown-older-home-renovation': visualAsset('ai-project-cabbagetown-older-home-renovation'),
  'project-high-park-mid-century-renovation': visualAsset('ai-project-high-park-mid-century-renovation'),
  'project-toronto-semi-detached-rear-addition': visualAsset('ai-project-toronto-semi-detached-rear-addition'),
  'project-gta-townhouse-basement-walkout': visualAsset('ai-project-gta-townhouse-basement-walkout'),
  'project-gta-full-interior-renovation': visualAsset('ai-project-gta-full-interior-renovation'),
  'project-toronto-kitchen-bath-millwork-renovation': visualAsset('ai-project-toronto-kitchen-bath-millwork-renovation'),
};

function imageForProject(project: ProjectEntry) {
  return projectVisuals[project.key] ?? visuals.workOverview;
}

function buildProjectPermitRoute(project: ProjectEntry) {
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

function buildProjectOutcome(project: ProjectEntry, categoryLabel: string) {
  if (project.outcome) return project.outcome;

  const scopeSummary = project.scope.slice(0, 2).join(' and ').toLowerCase();
  if (project.status === 'completed') {
    return `Completed ${categoryLabel.toLowerCase()} reference in ${project.locationLabel}, with ${scopeSummary} delivered as part of a managed design-build scope.`;
  }
  if (project.status === 'ongoing-2025') {
    return `Active 2025 delivery with scope, approvals, trades, inspections and closeout managed under one Vitalite project path.`;
  }
  if (project.status === 'coming-2026') {
    return `2026 pipeline project with feasibility, approval route and construction sequencing defined before site work begins.`;
  }

  return `Representative ${categoryLabel.toLowerCase()} case study showing the scope, approval path and construction decisions owners should evaluate before starting a similar project.`;
}

function createGeneratedProjectPage(project: ProjectEntry): DetailPageContent {
  const categoryParentKey = projectCategoryParents[project.category];
  const categoryLabel = projectCategoryLabels[project.category];
  const statusLabel = projectStatusLabels[project.status];
  const title = project.title.replace(/ \| Vitalite$/, '');
  const permitRoute = buildProjectPermitRoute(project);
  const outcome = buildProjectOutcome(project, categoryLabel);

  const narrativeSections: Array<{ heading: string; text: string }> = [];
  if (project.narrative.length > 1) narrativeSections.push({ heading: 'Project Overview', text: project.narrative[1] });
  if (project.narrative.length > 2) narrativeSections.push({ heading: 'Planning Context', text: project.narrative[2] });
  narrativeSections.push({ heading: 'Permit Route', text: permitRoute });
  narrativeSections.push({ heading: 'Outcome', text: outcome });

  return {
    parent: 'our-work',
    category: categoryLabel.toUpperCase(),
    title,
    subtitle: project.headline,
    image: imageForProject(project),
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
      duration: project.duration,
      approvalPath: project.approvalPath,
      projectType: project.projectType,
      permitRoute,
      scope: project.scope,
      outcome,
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
    title: 'Scope before price',
    text: 'Construction numbers based on incomplete drawings will move. Vitalite establishes the property, zoning, owner goals and approval path before a build price is treated as a commitment.',
    image: visuals.servicesOverviewScope,
  },
  {
    eyebrow: '02',
    title: 'Connect approvals to buildability',
    text: "Your architect's drawings don't automatically reflect your engineer's requirements or your contractor's procurement constraints. Vitalite reviews them together so field surprises get caught on paper first.",
    image: visuals.servicesOverviewApprovals,
  },
  {
    eyebrow: '03',
    title: 'Manage through closeout',
    text: 'Trade gaps, inspection delays and unresolved punch lists are the three things that stretch GTA projects past their schedule. Vitalite manages all three from site mobilization to final inspection.',
    image: visuals.servicesOverviewCloseout,
  },
];

const serviceStartingPointCards: TextCard[] = [
  {
    title: 'I have a property but no drawings',
    text: 'Most permit delays start with drawings that missed a zoning requirement, a structural constraint or a site access issue. Start here to get clarity before the drawings begin.',
    image: visuals.servicesOverviewProperty,
    pageKey: 'service-architectural-services',
  },
  {
    title: 'I need permits or engineering coordinated',
    text: 'The permit office will flag structural questions. The engineer will flag mechanical questions. Use this path when you need someone who can answer both.',
    image: visuals.servicesOverviewPermits,
    pageKey: 'service-drawings-permits',
  },
  {
    title: 'I am comparing builders or proposals',
    text: 'Conflicting contractor proposals usually mean the scope was not defined tightly enough. This path adds construction management discipline before a single trade is hired.',
    image: visuals.servicesOverviewCompare,
    pageKey: 'service-project-management',
  },
];

const whyProofCards: TextCard[] = [
  {
    title: 'Project-specific proof, not generic badges',
    text: 'Vitalite shows trust through project context: location, scope, status, permit path, engineering needs, inspection milestones and closeout responsibilities. Prospective clients can review proof that matches the type of project they are planning.',
  },
  {
    title: 'Paperwork before site work',
    text: 'Each serious project is organized around the documents that reduce risk: drawings, zoning review, permit applications, engineering coordination, insurance requirements, trade scopes, municipal comments and inspection planning.',
  },
  {
    title: 'Closeout is part of the contract',
    text: 'PDI items, deficiencies, inspection follow-up, warranty-oriented support and owner handover are treated as delivery work, not afterthoughts once the trades leave site.',
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

function getOfficialMunicipalitySlugs(pageKey: string, local?: LocalSeoMatch): string[] {
  const context = `${pageKey} ${local?.label ?? ''} ${local?.municipality ?? ''}`.toLowerCase();
  const slugs: string[] = [];
  if (context.includes('markham') || context.includes('unionville') || context.includes('angus-glen')) slugs.push('markham');
  if (context.includes('richmond-hill') || context.includes('richmond hill')) slugs.push('richmond-hill');
  if (context.includes('vaughan') || context.includes('kleinburg') || context.includes('woodbridge')) slugs.push('vaughan');
  if (context.includes('mississauga') || context.includes('port-credit') || context.includes('port credit') || context.includes('lorne-park') || context.includes('lorne park') || context.includes('mineola')) slugs.push('mississauga');
  if (!slugs.length) slugs.push('toronto');
  return [...new Set(slugs)];
}

function uniqueOfficialResources(resources: OfficialResource[]): OfficialResource[] {
  const seen = new Set<string>();
  return resources.filter((resource) => {
    if (seen.has(resource.url)) return false;
    seen.add(resource.url);
    return true;
  });
}

function getOfficialResources(pageKey: string, local?: LocalSeoMatch): OfficialResource[] {
  const k = pageKey.toLowerCase();
  const resources = getOfficialMunicipalitySlugs(pageKey, local).flatMap((slug) => municipalityOfficialLinks[slug] ?? []);
  if (k.includes('garden-suite') || k.includes('garden_suite') || k.includes('laneway')) {
    resources.push(torontoOfficialLinks.gardenSuites, torontoOfficialLinks.lanewaySuites);
  }
  if (k.includes('multiplex')) {
    resources.push(torontoOfficialLinks.multiplex);
  }
  if (k.includes('permit') || k.includes('drawing')) {
    resources.push(torontoOfficialLinks.buildingPermits);
  }
  return uniqueOfficialResources(resources).slice(0, 6);
}

function getServiceKey(pageKey: string): string {
  const k = pageKey.toLowerCase();
  if (k.includes('custom-homes')) return 'custom-homes';
  if (k.includes('garden-suites')) return 'garden-suites';
  if (k.includes('multiplex')) return 'multiplex';
  if (k.includes('home-additions')) return 'home-additions';
  if (k.includes('luxury-renovations')) return 'luxury-renovations';
  if (k.includes('permit-drawings')) return 'permit-drawings';
  return '';
}

function buildLocalServiceSections(page: SeoPage, local: LocalSeoMatch | undefined, serviceName: string) {
  const focus = getServicePlanningFocus(page);
  const label = local?.label ?? 'the GTA';
  const serviceKey = getServiceKey(page.key);
  const notes = serviceKey ? local?.context?.serviceNotes?.[serviceKey] : undefined;
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
      text: notes?.serviceScope ?? `${serviceName} planning in ${label} can include ${focus.projectType}, with early attention to ${focus.searchIntent}.`,
    },
    {
      heading: 'Project Readiness',
      text: notes?.readinessNote ?? `Before pricing or construction, owners should gather ${focus.readiness}. Vitalite uses that information to connect design direction, approvals, trade input and schedule planning.`,
    },
    {
      heading: 'How Vitalite Helps',
      text: notes?.helpNote ?? `Vitalite coordinates ${focus.approvals}, then carries the project into procurement, site management, inspections, quality control and closeout through one accountable GTA design-build process.`,
    },
  ];
}

function buildServiceAreaAnswer(page: SeoPage, local: LocalSeoMatch | undefined, serviceName: string) {
  const label = local?.label ?? 'the GTA';
  const serviceKey = getServiceKey(page.key);
  const notes = serviceKey ? local?.context?.serviceNotes?.[serviceKey] : undefined;
  if (notes?.shortAnswer) return notes.shortAnswer;
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

  if (page.key === 'guide-garden-suite-cost-toronto') {
    return {
      answer: 'Garden suite cost in Toronto depends less on square footage than on lot feasibility, servicing, access, drawings, permits, structure, finishes and site logistics. The right first step is a property-specific feasibility review before paying for full drawings or relying on generic cost ranges.',
      bullets: ['Lot and zoning feasibility', 'Servicing, access and grading', 'Permit drawings and consultant inputs', 'Construction, finishes and contingency'],
      sections: [
        {
          heading: 'Why Garden Suite Cost Varies',
          text: 'Two garden suites with the same floor area can price very differently. A clear rear access route, simple servicing and straightforward grading create one budget. A tight lot, utility upgrades, tree protection, complex drainage or limited staging creates another. The cost conversation should start with the site, not the floor plan.',
        },
        {
          heading: 'Soft Costs To Plan For',
          text: 'Owners should budget for feasibility review, survey information, architectural drawings, structural input, HVAC or mechanical coordination, permit fees, municipal comments and construction management. These costs are easy to overlook when the discussion starts with construction price only.',
        },
        {
          heading: 'Construction Cost Drivers',
          text: 'The main construction variables are foundation type, utility runs from the main house, building envelope performance, window and door package, kitchen and bath specifications, exterior materials, landscaping repair, site access and how much work must be done by hand because machinery cannot reach the rear yard.',
        },
        {
          heading: 'How Vitalite Reduces Budget Risk',
          text: 'Vitalite checks lot fit, zoning, servicing, access, drawing requirements and construction logistics before the project is priced as a build. That sequence helps owners avoid spending on a design that later proves difficult or uneconomic to permit and construct.',
        },
      ],
      steps: ['Confirm property address and lot conditions', 'Review zoning, access, trees, grading and servicing', 'Develop concept scope and budget direction', 'Prepare permit drawings and engineering inputs', 'Price construction with allowances and contingency'],
    };
  }

  if (page.key === 'guide-multiplex-conversion-cost-toronto') {
    return {
      answer: 'Toronto multiplex conversion cost is driven by unit count, fire separation, egress, structure, mechanical systems, plumbing, electrical capacity, sound control, permit complexity and whether the work happens inside an existing building or as a larger rebuild. Unit strategy should be tested before drawings are finalized.',
      bullets: ['Unit count and layout strategy', 'Fire separation, egress and sound control', 'Mechanical, plumbing and electrical upgrades', 'Permit path, inspections and phasing'],
      sections: [
        {
          heading: 'Start With Unit Strategy',
          text: 'A multiplex budget only makes sense after the owner knows how many units are being created, whether each unit has independent access, how rentable the layouts are and whether the existing structure can support the plan. A design that maximizes unit count but creates weak rental layouts can hurt the investment case.',
        },
        {
          heading: 'Life Safety Is A Major Cost Driver',
          text: 'Multiplex projects must resolve fire separation, egress, smoke alarms, interconnected systems, exits, stairs, guardrails and sometimes sprinklers or upgraded assemblies. These items are not finish upgrades. They determine whether the building can legally function as multiple units.',
        },
        {
          heading: 'Building Systems Often Need Rework',
          text: 'Separate kitchens, bathrooms, laundry, heating, cooling and ventilation usually require more plumbing, electrical and mechanical capacity than the original home was built for. Service upgrades and routing decisions should be identified before pricing is treated as reliable.',
        },
        {
          heading: 'Cost Control For Investors',
          text: 'The project should be reviewed against rental return, financing timeline, permit risk, carrying cost and construction phasing. Vitalite connects zoning review, drawings, engineering, trade pricing and site management so the budget supports the investment thesis instead of surprising it.',
        },
      ],
      steps: ['Define target unit count and rental strategy', 'Check zoning, parking, egress and existing structure', 'Coordinate architectural, structural and mechanical drawings', 'Build a budget around life-safety and system upgrades', 'Sequence permits, trades, inspections and occupancy'],
    };
  }

  if (page.key === 'guide-toronto-permit-drawings') {
    return {
      answer: 'Toronto permit drawings need to show more than a design idea. A useful package includes existing conditions, proposed plans, elevations or sections where needed, zoning data, building code notes, structural details, HVAC or mechanical coordination and enough scope clarity for municipal review and construction handoff.',
      bullets: ['Existing and proposed drawings', 'Zoning and building code review', 'Structural, HVAC and mechanical coordination', 'Permit submission and comment response'],
      sections: [
        {
          heading: 'What A Permit Package Usually Includes',
          text: 'Most residential permit packages include site information, existing and proposed floor plans, elevations, sections, construction notes, zoning data, building code references and details for any structural or mechanical changes. The exact package depends on the scope and municipality.',
        },
        {
          heading: 'Where Permit Drawings Fail',
          text: 'Applications slow down when drawings leave out setbacks, lot coverage, height, fire separation, egress, structural openings, HVAC changes, drainage, grading, tree protection or consultant references. Missing information creates comment rounds that push construction further out.',
        },
        {
          heading: 'Engineering Coordination',
          text: 'Structural and mechanical inputs should be coordinated before submission, not after the examiner asks for them. Beams, load paths, HVAC routing and code requirements often change the design enough that late engineering creates rework.',
        },
        {
          heading: 'After The Permit Is Approved',
          text: 'Approved drawings still need to become a construction plan. Vitalite translates the permit scope into trade coordination, procurement, inspection milestones, site logistics and closeout responsibilities so the project does not stall after approval.',
        },
      ],
      steps: ['Collect survey, photos and existing drawings where available', 'Confirm project scope and zoning constraints', 'Prepare architectural drawings and code notes', 'Coordinate structural, HVAC or mechanical inputs', 'Submit, respond to comments and hand off to construction'],
    };
  }

  if (page.key === 'guide-laneway-house-permit-toronto') {
    return {
      answer: 'A Toronto laneway house permit is more involved than a typical accessory structure because the city checks fire truck access, water and sewer servicing, tree protection, TRCA review where applicable, and runs the file through a two-stage permit process. The earliest cost and schedule risk sits in feasibility, not in finishes.',
      bullets: ['Lane access and fire truck routing', 'Water, sanitary and electrical servicing', 'TRCA, tree and grading review', 'Two-stage permit submission'],
      sections: [
        {
          heading: 'Zoning Eligibility',
          text: 'Most Toronto residential zones allow laneway suites as-of-right, but each lot must still pass tests for lane width, lot depth, separation distance, height and angular plane. A short feasibility check identifies any zoning relief before drawings are commissioned.',
        },
        {
          heading: 'Fire Access Requirements',
          text: 'The laneway must give a fire truck a clear route within a defined distance from the suite. If the lane is narrow, blocked or unimproved, the design has to add fire-rated assemblies, sprinklers, or both. These items affect cost more than most owners expect.',
        },
        {
          heading: 'Servicing Connection',
          text: 'Water, sanitary and electrical services usually run from the main house through the rear yard to the suite. Trenching across the yard, upgrading the existing service, and protecting trees and grading along the route all need to be coordinated before pricing is final.',
        },
        {
          heading: 'TRCA and Tree Review',
          text: 'Lots near ravines or regulated areas trigger TRCA review, which adds drawings, fees and time. Mature trees in the rear yard or along the lane require an arborist report and a tree protection plan that the city signs off on before excavation.',
        },
        {
          heading: 'Two-Stage Permit',
          text: 'Toronto reviews laneway projects in two stages: zoning and planning first, then building code and construction details. The two stages can be sequenced or run in parallel, but each stage has its own comment cycle and revision rounds.',
        },
        {
          heading: 'After Permit Approval',
          text: 'Once the permit is issued, the project still needs trade procurement, site protection, hand-dig allowances where machinery cannot reach, an inspection schedule and a closeout plan. The handoff from permit to construction is where projects gain or lose weeks.',
        },
      ],
      steps: ['Check lot, lane and servicing feasibility', 'Confirm zoning, fire access and TRCA conditions', 'Prepare architectural and structural permit drawings', 'Submit two-stage permit and respond to comments', 'Hand off approved drawings to construction with logistics plan'],
    };
  }

  if (page.key === 'guide-home-addition-permit-toronto') {
    return {
      answer: 'A Toronto home addition permit needs a zoning check on setbacks, height and lot coverage, structural input on the existing house, mechanical and HVAC coordination, and a permit package that survives a two-stage municipal review without repeated revisions.',
      bullets: ['Zoning, setback and coverage review', 'Structural assessment of existing house', 'HVAC and mechanical coordination', 'Permit submission and comment response'],
      sections: [
        {
          heading: 'Zoning Checks First',
          text: 'Before drawings move forward, confirm front, side and rear setbacks, lot coverage, height, angular plane and any overlay rules in the neighbourhood. Catching a zoning issue at concept stage avoids expensive redesigns later.',
        },
        {
          heading: 'Structural Coordination',
          text: 'Additions usually open new structural connections to the existing house. Foundations, beams, load paths and tie-ins should be reviewed by an engineer early so that the architectural plan and the structural plan stay aligned.',
        },
        {
          heading: 'Mechanical and HVAC',
          text: 'New square footage often outgrows the existing furnace, ductwork, electrical panel and plumbing. Mechanical scope should be sized against the addition and the rest of the house at the same time, not after construction starts.',
        },
        {
          heading: 'Permit Package Contents',
          text: 'A clean permit package shows existing and proposed plans, elevations, sections, zoning data, code notes, structural details and any HVAC or grading items needed. Missing references to lot coverage, fire separation or structural openings drive most comment rounds.',
        },
        {
          heading: 'Comment Response',
          text: 'Toronto permit examiners typically issue comments after the first review. The package should be set up so comments can be answered with targeted revisions instead of redesigning core parts of the addition.',
        },
        {
          heading: 'Construction Handoff',
          text: 'Approved drawings need to be turned into a construction plan with trade scheduling, inspections, owner decisions on finishes, temporary protection of the existing house, and a closeout list. Vitalite manages that handoff so the schedule does not stall after approval.',
        },
      ],
      steps: ['Confirm zoning, lot coverage and setback constraints', 'Coordinate structural and mechanical inputs early', 'Prepare a complete permit package with code notes', 'Submit permit and respond to comments efficiently', 'Plan trades, inspections and owner decisions before site work'],
    };
  }

  if (page.key === 'guide-second-storey-addition-toronto') {
    return {
      answer: 'A Toronto second-storey addition needs a structural assessment of the existing foundation and walls, a complete permit package, mechanical and HVAC integration with the rest of the house, and a realistic plan for living during construction or moving out for the duration.',
      bullets: ['Foundation and wall assessment', 'Permit drawings and code notes', 'HVAC and electrical capacity', 'Living arrangement during construction'],
      sections: [
        {
          heading: 'Structural Starting Point',
          text: 'A second storey loads the existing foundation, walls and footings in ways the original design may not have planned for. An engineer should review the foundation, framing and load paths before drawings are finalized so any reinforcement is built into the scope.',
        },
        {
          heading: 'Permit Package',
          text: 'The permit package should include existing and proposed plans, elevations, sections, structural details, mechanical changes, energy and code notes and any zoning relief items. Toronto pays particular attention to height, angular plane and rear-yard projections on second-storey work.',
        },
        {
          heading: 'Mechanical Integration',
          text: 'Adding a full second floor usually pushes the furnace, ductwork, hot water and electrical panel beyond their original sizing. Mechanical and electrical capacity should be sized for the whole house, not just the new floor, before pricing is finalized.',
        },
        {
          heading: 'Living Through Construction',
          text: 'Owners need to decide early whether to stay in the home with temporary protection or move out during the structural and roof work. The decision affects schedule, cost, dust control, security and how trades are sequenced.',
        },
        {
          heading: 'Schedule and Inspections',
          text: 'Second storey additions move through framing, roof tie-in, mechanical rough-ins, insulation, drywall and finishes with several inspection points along the way. A realistic schedule plans for weather, inspection waits and material lead times.',
        },
        {
          heading: 'Closeout',
          text: 'Closeout includes final inspections, deficiency walks, mechanical balancing, paint touch-ups, hardware adjustments and warranty documentation. A clear closeout list keeps the last two weeks of the project from stretching into months.',
        },
      ],
      steps: ['Assess foundation, walls and load paths with an engineer', 'Prepare a complete second-storey permit package', 'Confirm mechanical and electrical capacity for the full house', 'Choose a living arrangement and plan site protection', 'Sequence framing, inspections and finish trades to closeout'],
    };
  }

  if (page.key === 'guide-basement-walkout-permit-toronto') {
    return {
      answer: 'A Toronto basement walkout almost always needs a building permit because it changes the foundation, drainage and egress. The scope sits at the intersection of excavation, structural work, waterproofing, grading and code-compliant egress, which is more involved than most owners expect.',
      bullets: ['Excavation and structural opening', 'Waterproofing and drainage rework', 'Egress and code compliance', 'Site logistics and access'],
      sections: [
        {
          heading: 'When a Permit Is Required',
          text: 'A walkout almost always triggers a permit because the work involves cutting a foundation wall, modifying drainage and creating a new egress. Some lots also need zoning input where the walkout affects rear-yard grading or projection rules.',
        },
        {
          heading: 'Structural and Excavation Scope',
          text: 'The work usually requires excavation along the foundation, shoring, a new lintel above the opening and underpinning where the new floor level drops below existing footings. The excavation plan should consider tree roots, services and neighbour fences before digging starts.',
        },
        {
          heading: 'Drainage and Waterproofing',
          text: 'Once the wall is cut and grading changes, weeping tile, waterproofing membranes, sump connection and grading slope away from the wall all need to be reviewed. Walkouts that skip drainage rework leak within a few seasons.',
        },
        {
          heading: 'Egress Requirements',
          text: 'A code-compliant egress door, stair, guardrail and landing are required, along with safe sightlines for the user and clear separation from grade water. If the walkout serves a separate suite, additional fire and life-safety rules apply.',
        },
        {
          heading: 'Permit Package',
          text: 'The permit package should show existing and proposed grading, structural details for the wall opening and any underpinning, waterproofing assemblies, drainage details and the egress configuration. A clean package answers most reviewer comments before they are written.',
        },
        {
          heading: 'Site Logistics',
          text: 'Basement walkouts are tight construction zones with excavated soil, exposed foundations, weather risk and limited access. Site protection, soil management, inspection coordination and weather contingency belong in the construction plan from day one.',
        },
      ],
      steps: ['Confirm whether the walkout creates a separate suite', 'Coordinate structural, excavation and waterproofing details', 'Prepare grading, drainage and egress drawings', 'Submit permit and respond to municipal comments', 'Sequence excavation, structural work and waterproofing on site'],
    };
  }

  if (page.key === 'guide-legal-basement-suite-toronto') {
    return {
      answer: 'A legal basement suite in Toronto requires minimum ceiling height, code-compliant egress windows, fire separation between units, a separate entrance and a building permit. Renting a suite without these items creates serious liability and can block insurance claims, sales and refinancing.',
      bullets: ['Ceiling height and layout', 'Egress windows and exit', 'Fire separation between units', 'Permit and registration'],
      sections: [
        {
          heading: 'What Makes a Suite Legal',
          text: 'A legal second suite meets the Ontario Building Code and Toronto zoning rules at the same time. The suite must be a self-contained dwelling with its own kitchen, bathroom, living and sleeping space, and it must satisfy life-safety requirements that protect both units.',
        },
        {
          heading: 'Ceiling Height and Egress',
          text: 'Ceiling height must meet the code minimum across the required living area. Each bedroom needs an egress window sized and located for emergency exit. Older basements often fail one or both of these tests before any other work begins.',
        },
        {
          heading: 'Fire Separation Requirements',
          text: 'Fire separation between the suites includes rated assemblies at floors and shared walls, self-closing doors, smoke alarms wired together across both units and continuous separation around mechanical penetrations. This is where most informal basement suites fail to qualify.',
        },
        {
          heading: 'Separate Entrance',
          text: 'A legal suite generally needs its own exterior entrance. That can be a side entrance with a stair down, a rear walkout or a shared vestibule that is fire-separated. The entrance details affect cost, grading, drainage and zoning compliance.',
        },
        {
          heading: 'Permit Process',
          text: 'The legal suite is created through a building permit that shows the layout, separations, egress, mechanical changes and life-safety items. After construction, the suite is inspected and registered, which is the document owners need for insurance, financing and rental compliance.',
        },
        {
          heading: 'Renting After Registration',
          text: 'Once registered, the suite can be rented under standard residential tenancy rules. Owners should keep the permit, inspection records and registration on file because lenders, insurers and buyers will ask for them.',
        },
      ],
      steps: ['Measure ceiling height, window sizes and existing layout', 'Plan fire separation, egress and entrance strategy', 'Prepare permit drawings and mechanical changes', 'Submit permit and complete inspections', 'Register the suite and document for insurance and rental use'],
    };
  }

  if (page.key === 'guide-custom-home-build-cost-gta') {
    return {
      answer: 'GTA custom home build cost typically ranges from about $350 per square foot for a basic build to over $700 per square foot for a high-end home. The real drivers are the lot, structure, envelope, mechanical and electrical scope, finish level, soft costs and site access, not square footage alone.',
      bullets: ['Lot conditions and site access', 'Structure, envelope and mechanical', 'Finishes, fixtures and appliances', 'Soft costs and contingency'],
      sections: [
        {
          heading: 'Lot and Site Costs',
          text: 'Demolition, site grading, retaining walls, driveway access, tree protection and servicing connections vary widely by lot. A flat lot with utilities at the curb prices very differently from a sloped lot near a ravine with TRCA review.',
        },
        {
          heading: 'Soft Costs',
          text: 'Soft costs include survey, architectural and structural drawings, mechanical and energy consultants, permit fees, deposits, insurance, financing carrying cost and project management. Together they typically account for 10 to 15 percent of the total budget on a custom home.',
        },
        {
          heading: 'Structural and Envelope',
          text: 'Foundation type, framing system, window and door package, exterior cladding, roofing and insulation drive a large share of the build cost. Higher-performance envelope choices add cost upfront but reduce long-term operating cost.',
        },
        {
          heading: 'Mechanical and Electrical',
          text: 'Heating, cooling, ventilation, plumbing fixtures, electrical capacity, lighting, automation, networking and backup power all scale with the home. A modest mechanical package and a fully integrated smart-home package can differ by a factor of three.',
        },
        {
          heading: 'Finishes and Fixtures',
          text: 'Kitchens, bathrooms, millwork, flooring, tile, lighting, hardware and appliances are the most visible budget items. Finish level decisions made at design stage protect the budget far better than cuts made during construction.',
        },
        {
          heading: 'Contingency and Management',
          text: 'A realistic budget includes a contingency for unknown site conditions and design changes, plus a clear construction management fee. Skipping contingency does not lower cost; it only moves the cost into change orders later.',
        },
      ],
      steps: ['Confirm lot, zoning and site access conditions', 'Set design intent and target finish level', 'Coordinate architectural, structural and mechanical drawings', 'Build a budget with allowances, soft costs and contingency', 'Sequence construction, procurement and inspections to occupancy'],
    };
  }

  if (page.key === 'guide-toronto-neighbourhood-custom-home-rebuilds') {
    return {
      answer: 'Teardown-rebuild projects in Toronto neighbourhoods involve zoning review, neighbour notice, tree permits, two-stage permit review and 16 to 22 months of design and construction. The right lot and a clean approval path matter as much as the design itself.',
      bullets: ['Lot acquisition and feasibility', 'Zoning, tree and neighbour notices', 'Two-stage permit review', 'Construction sequence and timeline'],
      sections: [
        {
          heading: 'Buying the Right Lot',
          text: 'Lot width, depth, frontage, services, trees, easements and zoning overlay rules all affect what can be built. A short feasibility review before the offer closes helps avoid lots that cannot deliver the home the buyer wants.',
        },
        {
          heading: 'Zoning and Design Constraints',
          text: 'Toronto zoning controls height, gross floor area, lot coverage, side yards, angular plane and front yard character. Some neighbourhoods add character or heritage overlays that further shape massing and material choices.',
        },
        {
          heading: 'Tree and Neighbour Notices',
          text: 'Mature trees on the lot or near the property line trigger arborist reports and tree protection plans. Larger projects also require posted neighbour notices, and unresolved objections can delay the file at Committee of Adjustment.',
        },
        {
          heading: 'Permit Timeline',
          text: 'Toronto reviews custom home permits in two stages: zoning and planning first, then building code and construction details. From application to permit issuance, expect 4 to 8 months on a clean file, longer where variances or heritage are involved.',
        },
        {
          heading: 'Construction Sequence',
          text: 'Construction usually runs demolition, excavation, foundation, framing, envelope, mechanical rough-in, drywall, finishes, exterior and landscape over 12 to 16 months. Long-lead windows, doors and millwork should be ordered well before they are needed on site.',
        },
        {
          heading: 'Neighbourhood-Specific Factors',
          text: 'Each established neighbourhood has its own character expectations, tree canopy, narrow streets and parking constraints. A construction plan that respects the street keeps neighbours, the city and the schedule on the same side.',
        },
      ],
      steps: ['Check feasibility before closing on the lot', 'Coordinate design with zoning and tree review', 'Prepare a complete permit package and notices', 'Run the two-stage permit through to issuance', 'Sequence demolition, structure, envelope and finishes to occupancy'],
    };
  }

  if (page.key === 'guide-rosedale-forest-hill-renovation') {
    return {
      answer: 'Rosedale and Forest Hill renovations combine heritage or tree approvals with premium finishes and 12 to 18 month construction schedules. The right team manages the approval side and the finish side at the same time so neither one stalls the other.',
      bullets: ['Heritage and tree approvals', 'Structural and systems modernization', 'Premium finishes and millwork', 'Construction logistics on quiet streets'],
      sections: [
        {
          heading: 'Heritage and Character Context',
          text: 'Many homes in Rosedale and Forest Hill sit within heritage districts or character overlays. Exterior changes, additions and rear extensions need to respect the streetscape, and approvals can include heritage permits in addition to standard building permits.',
        },
        {
          heading: 'What Owners Typically Tackle',
          text: 'Common scopes include kitchen and bath rebuilds, full main floor reconfiguration, primary suite expansion, basement underpinning, third floor finishing and rear extensions. Many projects combine several of these into a coordinated 12 to 18 month build.',
        },
        {
          heading: 'Structural and Systems Work',
          text: 'Older homes here usually need structural reinforcement at openings, new mechanical and electrical capacity, updated plumbing, and envelope upgrades to support modern comfort. These items belong in the design phase, not in change orders.',
        },
        {
          heading: 'Finish Expectations',
          text: 'Owners in these neighbourhoods expect custom millwork, integrated appliances, stone, hardwood, custom lighting and detailed trim. Finish decisions should be made early to keep procurement aligned with the construction schedule.',
        },
        {
          heading: 'Approval and Pre-Construction',
          text: 'Pre-construction includes survey, architectural and structural drawings, mechanical input, heritage or tree review where applicable, permit submission and a comment response plan. A clean package at submission shortens the path to a building permit.',
        },
        {
          heading: 'Schedule and Coordination',
          text: 'Quiet streets, narrow driveways and tight setbacks make site logistics part of the project plan from the beginning. Neighbour communication, parking, hoarding, dust control and daily site management protect both the schedule and the relationship with the street.',
        },
      ],
      steps: ['Confirm heritage, tree and zoning conditions for the property', 'Define the renovation scope and finish level', 'Coordinate architectural, structural and mechanical drawings', 'Submit permits and any heritage or tree approvals', 'Sequence construction with site logistics and finish procurement'],
    };
  }

  if (page.key === 'guide-lawrence-park-leaside-additions') {
    return {
      answer: 'Lawrence Park and Leaside additions need to respect existing streetscape character while delivering the space families need. Both second-storey additions and rear extensions have strong precedent here, and the right choice depends on the lot, the existing house and the family plan.',
      bullets: ['Second-storey vs rear extension', 'Character and streetscape rules', 'Structural and mechanical scope', 'School zone value and stay-or-move decision'],
      sections: [
        {
          heading: 'Why Owners Add Rather Than Move',
          text: 'Families in Lawrence Park and Leaside often choose to add rather than move because of school catchments, established trees and walkable streets. An addition can deliver the bedrooms, primary suite or family room the home is missing without leaving the neighbourhood.',
        },
        {
          heading: 'Second-Storey vs Rear Extension',
          text: 'Second-storey additions add bedrooms and a primary suite while keeping the footprint. Rear extensions open up the kitchen and family area and connect to the garden. Many projects combine the two when the budget and zoning allow.',
        },
        {
          heading: 'Character and Streetscape Rules',
          text: 'Both neighbourhoods have streetscape and character expectations around roof form, materials, window proportions and front yard treatment. Designs that respect the street usually move through approvals faster and resell better.',
        },
        {
          heading: 'Structural and Mechanical Scope',
          text: 'Second storey work loads the existing foundation and walls, while rear extensions tie into existing structure and mechanical systems. Both require engineering input, and both usually trigger furnace, electrical panel and plumbing upgrades.',
        },
        {
          heading: 'School Zone Value',
          text: 'Investments in well-designed additions tend to hold value strongly here because the school catchment supports family demand. Owners should still test their plan against comparable sales before committing to the largest scope.',
        },
        {
          heading: 'Permit and Schedule',
          text: 'A typical addition runs 4 to 7 months on permits and 8 to 14 months on construction, depending on scope. A realistic plan accounts for living arrangements during construction, weather windows for roof tie-ins and long-lead window and door deliveries.',
        },
      ],
      steps: ['Confirm zoning, setback and character constraints', 'Choose between second-storey, rear extension or both', 'Coordinate structural, mechanical and architectural drawings', 'Submit permits and respond to municipal comments', 'Sequence construction around living arrangements and procurement'],
    };
  }

  if (page.key === 'guide-willowdale-multiplex') {
    return {
      answer: 'Willowdale lots, often around 50 feet wide, qualify for multiplex builds under Toronto as-of-right zoning. The key decisions are unit count, rental strategy, FSI, life-safety scope and a budget that supports the rental pro forma rather than fighting it.',
      bullets: ['As-of-right multiplex eligibility', 'Unit count and rental strategy', 'Life-safety and fire separation', 'FSI, parking and zoning constraints'],
      sections: [
        {
          heading: 'As-Of-Right Multiplex Eligibility',
          text: 'Toronto allows up to four units as-of-right on most residential lots, including many Willowdale properties. The owner still has to satisfy zoning on FSI, height, setbacks and parking, and the building has to meet code for life safety across the units.',
        },
        {
          heading: 'Unit Count and Layout Strategy',
          text: 'Three two-bedroom units rent differently than four one-bedroom units. A multiplex pro forma should test layout options against rental demand, parking, storage, outdoor space and the owners long-term plan before drawings are finalized.',
        },
        {
          heading: 'Life Safety Requirements',
          text: 'Multiplex projects must resolve fire separation between units, interconnected smoke alarms, exit routes, stair widths, guards and sometimes sprinklers. These items are not finish upgrades; they decide whether the building can legally operate as multiple suites.',
        },
        {
          heading: 'FSI and Zoning Constraints',
          text: 'FSI, height, angular plane and rear-yard rules cap the achievable building envelope. A feasibility review before drawings tells the owner how much building can actually fit on the lot, which protects the pro forma from a design that does not meet zoning.',
        },
        {
          heading: 'Budget and Pro Forma',
          text: 'The investment case depends on construction cost, financing, rental income, vacancy assumptions and operating expenses. A multiplex budget should support the pro forma at realistic rents, not at the optimistic top of the market.',
        },
        {
          heading: 'Permit and Construction Timeline',
          text: 'A typical Willowdale multiplex runs 6 to 9 months on design and permits and 12 to 18 months on construction, depending on scope and whether the project is a conversion or a new build. Procurement and inspections drive the back half of the schedule.',
        },
      ],
      steps: ['Test as-of-right eligibility for the specific lot', 'Choose unit count and layout against rental demand', 'Coordinate architectural, structural and life-safety drawings', 'Submit permits and confirm FSI, parking and life-safety items', 'Sequence construction, inspections and lease-up to occupancy'],
    };
  }

  if (page.key === 'guide-unionville-angus-glen-custom-homes') {
    return {
      answer: 'Custom home projects in Unionville and Angus Glen run through Markham detailed design review, subdivision design controls and long-lead procurement. From design start to occupancy, owners should plan for 20 to 26 months on a typical project.',
      bullets: ['Markham design review process', 'Subdivision design controls', 'Heritage near Unionville', 'Long-lead procurement and timeline'],
      sections: [
        {
          heading: 'Markham Design Review Process',
          text: 'Markham reviews custom homes more closely than many GTA municipalities, with attention to massing, materials, roof form and street character. Submitting a design that already aligns with the city expectations shortens the review cycle and reduces revisions.',
        },
        {
          heading: 'Subdivision Design Controls',
          text: 'Many Angus Glen and newer Unionville pockets sit inside subdivision design control areas. The architectural control consultant reviews material selections, exterior elevations and front yard treatment alongside the city building permit process.',
        },
        {
          heading: 'Lot and Site Conditions',
          text: 'Lot grading, Berczy Creek proximity, mature trees and existing services all affect the build. A site review before the design moves forward identifies cost drivers around foundations, drainage, retaining walls and tree protection.',
        },
        {
          heading: 'Heritage Near Unionville',
          text: 'Properties near Main Street Unionville may sit within or beside heritage districts. Exterior work, additions and rebuilds in those zones need heritage review in addition to standard permits, and material choices are scrutinized more carefully.',
        },
        {
          heading: 'Material Procurement',
          text: 'Custom homes here usually specify long-lead windows, doors, stone, custom millwork and high-end appliances. Procurement should start during design so trades have what they need when they reach each stage of the build.',
        },
        {
          heading: 'Construction Timeline',
          text: 'A typical schedule runs 8 to 12 months on design and approvals and 14 to 18 months on construction. Weather, inspection waits and material lead times all sit inside that window, so a realistic plan builds in float.',
        },
      ],
      steps: ['Confirm subdivision design control and heritage status', 'Coordinate design with Markham review expectations', 'Prepare permit drawings and engineering inputs', 'Submit permits and architectural control review in parallel', 'Sequence procurement, construction and inspections to occupancy'],
    };
  }

  if (page.key === 'guide-port-credit-lorne-park-renovations') {
    return {
      answer: 'Port Credit and Lorne Park renovation and rebuild projects involve Credit Valley Conservation review, the Mississauga private tree bylaw and high finish expectations suited to lakefront-adjacent living. The approval path and the finish path both need management from the start.',
      bullets: ['Credit Valley Conservation review', 'Mississauga private tree bylaw', 'Renovation vs custom rebuild decision', 'Finish level and procurement'],
      sections: [
        {
          heading: 'Conservation Authority Review',
          text: 'Many Port Credit and Lorne Park properties fall inside Credit Valley Conservation regulated areas. Work that affects grading, drainage or proximity to the Credit River or Lake Ontario triggers CVC review on top of the city building permit.',
        },
        {
          heading: 'Mississauga Tree Bylaw',
          text: 'The Mississauga private tree bylaw protects mature trees on private property. Removals or work near protected trees require permits, arborist reports and tree protection plans, and the bylaw also affects where additions and pools can sit on the lot.',
        },
        {
          heading: 'What Owners Are Doing Here',
          text: 'Common scopes include kitchen and primary suite rebuilds, rear extensions to open the home to the garden, full second-storey additions, basement walkouts and full custom rebuilds on lakefront-adjacent lots. Several of these often combine into a single project.',
        },
        {
          heading: 'Custom vs Renovation Decision',
          text: 'On many lots, a deep renovation and a full rebuild end up within striking distance on cost. The right answer depends on the existing house, the lot, the heritage of the home and how long the owners plan to stay. A feasibility study can answer that question quickly.',
        },
        {
          heading: 'Permit and Schedule',
          text: 'Permit timelines run longer where CVC or tree approvals are involved. A clean package, early consultant coordination and a willingness to engage the conservation authority early all keep the file moving.',
        },
        {
          heading: 'Finish Level and Procurement',
          text: 'Owners here typically specify custom millwork, stone, hardwood, integrated appliances and lakeview-oriented glazing. These items have long lead times and should be ordered during design so the schedule does not stall waiting on materials.',
        },
      ],
      steps: ['Check CVC and tree bylaw conditions for the property', 'Decide between deep renovation and full rebuild', 'Coordinate architectural, structural and conservation inputs', 'Submit permits and tree or CVC approvals in parallel', 'Sequence procurement, construction and finishes to closeout'],
    };
  }

  if (page.key === 'guide-toronto-neighbourhood-garden-suite') {
    return {
      answer: 'Garden suites are as-of-right in most Toronto residential zones, but each property still needs an individual feasibility review. Lane or side access, fire requirements, servicing from the main house, tree protection and rear-yard depth determine whether a garden suite is actually viable.',
      bullets: ['As-of-right zoning eligibility', 'Lane access and fire requirements', 'Servicing from the main house', 'Tree protection and rear-yard depth'],
      sections: [
        {
          heading: 'As-Of-Right Eligibility',
          text: 'Toronto allows garden suites as-of-right in most residential zones, subject to size, height, separation and lot coverage rules. Each lot still needs a feasibility check against those numbers before drawings are commissioned.',
        },
        {
          heading: 'Lane Access and Fire Requirements',
          text: 'Garden suites need a clear path for emergency access from the street or lane to the suite door within a defined distance. Where the path is longer or constrained, the design has to add fire-rated assemblies or sprinklers, which affects cost.',
        },
        {
          heading: 'Servicing from the Main House',
          text: 'Water, sanitary and electrical services usually run from the main house through the rear yard to the suite. The route, the upgrade scope at the panel and meter, and the impact on existing landscaping all need to be planned before pricing is final.',
        },
        {
          heading: 'Tree Protection',
          text: 'Mature trees in the rear yard or along the route to the suite trigger arborist reports and tree protection zones. The protection zones can shift the suite footprint, the access path or the servicing route, so trees should be reviewed early in design.',
        },
        {
          heading: 'Design and Permit Process',
          text: 'A garden suite permit package shows the suite, the access path, fire and servicing details, tree protection and grading. Toronto reviews garden suites through the standard permit process, with a focus on fire access and servicing details that often drive comments.',
        },
        {
          heading: 'Construction and Rental',
          text: 'Construction usually runs 6 to 10 months once permits are issued, depending on access and scope. Once finished, the suite can be rented under standard residential rules, which makes it a long-term income asset for many owners.',
        },
      ],
      steps: ['Run a property-specific feasibility review', 'Confirm fire access, servicing and tree conditions', 'Prepare permit drawings and engineering inputs', 'Submit permit and respond to municipal comments', 'Sequence construction, inspections and rental setup'],
    };
  }

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

function buildVisibleGeoEvidenceSections(pageKey: string, page: DetailPageContent) {
  const focus = getServicePlanningFocus({
    key: pageKey,
    path: '',
    title: page.title,
    description: page.subtitle,
    kind: 'service',
    primaryKeyword: page.title,
  });
  const projectFacts = page.isProject && page.projectMeta
    ? `This project record includes ${page.projectMeta.location}, ${page.projectMeta.size}, ${page.projectMeta.projectType}, ${page.projectMeta.statusLabel}, ${page.projectMeta.permitRoute} Scope includes ${page.projectMeta.scope.join(', ')}.`
    : `This page should be evaluated with the property address, survey, existing drawings, current permit status, target budget, timeline and known structural, access, tree, grading or inspection constraints.`;
  const proofSignals = page.isProject && page.projectMeta
    ? `Project proof signals include approval path, permit route, scope, size, status, outcome and closeout responsibilities.`
    : `Proof signals include service area clarity, permit or approval context, planning steps, related Vitalite pages, project examples and official resources where applicable.`;

  return [
    {
      heading: 'Key Facts',
      text: `${page.title} is a planning decision before it is a construction decision. According to the GEO citation research pattern, visible pages should explain the evidence behind an answer instead of relying only on hidden fallback copy or FAQ markup. Owners should confirm zoning, building code, drawings, engineering inputs, budget assumptions, inspection path and trade sequencing before treating a contractor price as final. ${projectFacts} This page is written as an evidence page: direct answer first, then facts, decision criteria, process steps and caveats that can be checked against the property.`,
    },
    {
      heading: 'Comparison Framework',
      text: `Compare options by responsibility, timing and evidence. A design-only path can clarify drawings, but the owner still has to connect pricing, permit comments, engineering and site management. A bid-after-drawings path can work when scope is complete, but gaps appear late if allowances or exclusions were not priced. A design-build path fits when feasibility, drawings, permits, budget, procurement, trades, inspections and closeout need one accountable team.`,
    },
    {
      heading: 'Planning Sequence',
      text: `Start with the address and project goal, then collect survey information, photos, existing drawings and owner priorities. Review zoning, lot conditions, structure, servicing, access, trees, drainage and any board or municipal requirements. Define the drawing and consultant inputs, price the scope with allowances and exclusions visible, then schedule procurement, trades, inspections, PDI and closeout around the approved work.`,
    },
    {
      heading: 'Evidence To Prepare',
      text: `Prepare ${focus.readiness}. Useful supporting evidence includes photos, inspection notes, municipal comments, budget direction, finish expectations, preferred start window, access limits and known mechanical or structural issues. ${proofSignals} These details help distinguish a simple interior scope from a permit-driven custom home, addition, garden suite, multiplex, legal suite, renovation or ICI project.`,
    },
    {
      heading: 'Caveats And Boundaries',
      text: `The right next step depends on the actual property. Early pages can explain common ranges, approval issues and decision criteria, but they cannot replace address-specific feasibility review. Budgets change when drawings are incomplete, existing conditions are hidden, finishes are undefined, engineering is not scoped, municipal comments require revisions or selections change during construction. Treat early numbers as planning ranges until scope, approvals, drawings and trade input are connected.`,
    },
  ];
}

function createGeneratedLandingPage(page: SeoPage): DetailPageContent {
  const isServiceArea = page.key.startsWith('location-') || page.key.startsWith('community-');
  const isCommunity = page.key.startsWith('community-');
  const isFaqStylePage = page.key === 'faq' || page.key === 'ai-gta-design-build-guide';
  const parent: MainPageKey = isServiceArea ? 'services' : isFaqStylePage ? 'why-vitalite' : 'blog';
  const local = getLocalMatchForSeoPage(page);
  const serviceName = getGeneratedServiceName(page);
  const guideProfile = isServiceArea ? undefined : getGuideProfile(page);

  return {
    parent,
    category: isCommunity ? 'COMMUNITY SERVICE AREA' : isServiceArea ? 'GTA SERVICE AREA' : isFaqStylePage ? 'GTA DESIGN-BUILD FAQ' : 'TORONTO GUIDE',
    title: page.title.split('|')[0].trim(),
    subtitle: page.description,
    image: imageForSeoPage(page),
    intro: isServiceArea
      ? (() => {
          const sk = getServiceKey(page.key);
          const introNote = sk ? local?.context?.serviceNotes?.[sk]?.introNote : undefined;
          return introNote
            ? introNote
            : `Vitalite supports ${page.primaryKeyword} projects with design-build planning, drawings, permit coordination, engineering input, budget planning, site management, inspections and closeout support.${local?.context ? ` ${local.context.planningContext}` : ''}`;
        })()
      : isFaqStylePage
        ? 'Use these answers to understand how Vitalite scopes GTA design-build projects before drawings, pricing or construction commitments are treated as final.'
      : `Use this guide to understand ${page.primaryKeyword} before committing to drawings, pricing or a contractor. It explains the decisions, documents, approvals, budget assumptions and construction-management details that shape a stronger GTA project plan.`,
    bullets: isServiceArea
      ? [
          `${serviceName} feasibility`,
          local?.label ? `${local.label} zoning and approval review` : 'Local feasibility and zoning review',
          'Drawings, permits and engineering coordination',
          'Budget, trades, inspections and closeout',
        ]
      : isFaqStylePage
        ? ['Project fit and minimum scope', 'Permit drawing and approval timelines', 'Budget range and change-order control', 'City comment response responsibility']
      : guideProfile?.bullets ?? ['Early feasibility and scope review', 'Permit and drawing requirements', 'Budget drivers and construction sequencing', 'Questions to ask before committing'],
    sections: isServiceArea
      ? buildLocalServiceSections(page, local, serviceName)
      : isFaqStylePage
        ? [
            {
              heading: 'How To Use This FAQ',
              text: 'Start with project fit, then review timing, budget and permit responsibility. The strongest inquiries include an address or municipality, project type, current drawings, target scope and budget direction.',
            },
            {
              heading: 'Why These Answers Matter',
              text: 'Most preventable construction risk appears before site work starts: unclear scope, missing permit inputs, undefined allowances, unresolved municipal comments or no owner decision schedule.',
            },
          ]
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
    officialResources: getOfficialResources(page.key, local),
    relatedLinks: getGeneratedRelatedLinks(page),
  };
}

function imageForSeoPage(page: SeoPage) {
  const keyword = `${page.key} ${page.primaryKeyword}`.toLowerCase();
  if (longTailGuideImages[page.key]) return longTailGuideImages[page.key];
  if (page.key.startsWith('location-') || page.key.startsWith('community-')) return visualAsset(`seo-${page.key}`);
  if (page.key === 'guide-garden-suite-cost-toronto') return visuals.gardenSuite;
  if (page.key === 'guide-multiplex-conversion-cost-toronto') return visuals.multiplexCost;
  if (page.key === 'guide-toronto-permit-drawings') return visuals.permitGuide;

  if (keyword.includes('garden') || keyword.includes('laneway') || keyword.includes('adu')) {
    return visuals.gardenSuite;
  }
  if (keyword.includes('multiplex') || keyword.includes('multi-unit') || keyword.includes('suite')) {
    return visuals.multiplex;
  }
  if (keyword.includes('addition') || keyword.includes('walkout') || keyword.includes('storey')) {
    return visuals.addition;
  }
  if (keyword.includes('permit') || keyword.includes('drawings') || keyword.includes('manager') || keyword.includes('management') || keyword.includes('proposal') || keyword.includes('checklist') || keyword.includes('general contractor')) {
    return visuals.permits;
  }
  if (keyword.includes('cost') || keyword.includes('budget')) {
    return visuals.renovationCost;
  }
  if (keyword.includes('custom home') || keyword.includes('rebuild')) {
    return visuals.customHome;
  }
  return visuals.designBuild;
}

function imageForDetailBullet(item: string, page: DetailPageContent) {
  const text = `${item} ${page.title} ${page.category}`.toLowerCase();
  const has = (...terms: string[]) => terms.some((term) => text.includes(term));

  if (has('fire separation', 'egress', 'life-safety', 'life safety', 'sound control', 'smoke alarm', 'sprinkler')) {
    return visuals.bulletFireEgress;
  }
  if (has('structural', 'hvac', 'mechanical', 'electrical', 'plumbing', 'servicing', 'rough-in', 'engineering')) {
    return visuals.bulletMepCoordination;
  }
  if (has('pdi', 'warranty', 'closeout', 'handover', 'aftercare', 'deficiency', 'move-in')) {
    return visuals.bulletCloseoutWarranty;
  }
  if (has('communication', 'reporting', 'client', 'owner', 'progress', 'reference')) {
    return visuals.bulletClientCommunication;
  }
  if (has('inspection', 'quality', 'building code', 'code review', 'code-compliant')) {
    return visuals.bulletQualityInspection;
  }
  if (has('permit', 'drawing package', 'submission', 'municipal', 'approval', 'comment response', 'board package')) {
    return visuals.bulletPermitPackages;
  }
  if (has('zoning', 'bylaw', 'setback', 'lot coverage', 'variance', 'committee', 'grading', 'tree', 'streetscape')) {
    return visuals.bulletZoningReview;
  }
  if (has('budget', 'price', 'pricing', 'cost', 'allowance', 'exclusion', 'estimate', 'contingency', 'rental return')) {
    return visuals.bulletBudgetPlanning;
  }
  if (has('trade', 'schedule', 'sequencing', 'site management', 'construction management', 'phasing', 'staging')) {
    return visuals.bulletTradeScheduling;
  }
  if (has('material', 'finish', 'fixture', 'procurement', 'cabinet', 'millwork', 'tile', 'flooring', 'kitchen', 'bath')) {
    return visuals.materialSelection;
  }
  if (has('scope coordination', 'design-build scope', 'single-team', 'accountability', 'delivery model', 'proposal')) {
    return visuals.bulletScopeCoordination;
  }
  if (has('concept', 'layout', 'design direction', 'visualization', 'massing', 'elevation', 'space planning')) {
    return visuals.bulletConceptLayouts;
  }
  if (has('feasibility', 'site review', 'existing condition', 'survey', 'property address', 'local property')) {
    return visuals.bulletSiteFeasibility;
  }

  return page.image;
}

function imageForDetailSection(section: { heading: string; text: string }, page: DetailPageContent, pageKey?: string) {
  const explicitImage = pageKey ? detailSectionImages[pageKey]?.[section.heading] : undefined;
  if (explicitImage) return explicitImage;

  const text = `${section.heading} ${section.text}`.toLowerCase();
  const has = (...terms: string[]) => terms.some((term) => text.includes(term));

  if (has('when you need this')) return visuals.architectural;
  if (has('what makes gta drawing coordination difficult')) return visuals.bulletZoningReview;
  if (has('what vitalite coordinates')) return visuals.bulletScopeCoordination;
  if (has('connection to construction')) return visuals.serviceSiteManagement;
  if (has('where interior decisions affect construction')) return visuals.bulletMepCoordination;
  if (has('design-build advantage')) return visuals.designBuildVsArchitect;
  if (has('lead time is a construction variable')) return visuals.bulletBudgetPlanning;
  if (has('selection connected to budget')) return visuals.materialSelection;
  if (has('supplier coordination')) return visuals.serviceProjectManagement;
  if (has('owner experience')) return visuals.bulletClientCommunication;
  if (has('condo board and property manager requirements')) return visuals.boardApprovals;
  if (has('municipal permit applications')) return visuals.servicePermitsEngineering;
  if (has('stacking multiple approvals')) return visuals.bulletScopeCoordination;
  if (has('committee of adjustment')) return visuals.bulletZoningReview;
  if (has('what makes a gta custom home difficult')) return visuals.bulletZoningReview;
  if (has('how vitalite approaches a custom home')) return visuals.serviceCustomHome;
  if (has('gta portfolio')) return visuals.workCustomHomes;
  if (has('what changed in gta zoning')) return visuals.bulletZoningReview;
  if (has('building code complexity')) return visuals.bulletFireEgress;
  if (has('investor value')) return visuals.multiplexCost;
  if (has('active projects')) return visuals.workMultiplex;
  if (has('what makes a good garden suite site')) return visuals.bulletSiteFeasibility;
  if (has('what these projects add')) return visuals.serviceGardenLaneway;
  if (has('approval and permit coordination')) return visuals.bulletPermitPackages;
  if (has('construction and site logistics')) return visuals.serviceSiteManagement;
  if (has('what to confirm before designing')) return visuals.bulletSiteFeasibility;
  if (has('structural coordination')) return visuals.bulletMepCoordination;
  if (has('active examples')) return visuals.workAdditions;
  if (has('living through construction')) return visuals.bulletClientCommunication;
  if (has('what a complete permit package includes')) return visuals.bulletPermitPackages;
  if (has('common reasons permits get returned')) return visuals.bulletQualityInspection;
  if (has('engineering coordination')) return visuals.bulletMepCoordination;
  if (has('municipal comment response')) return visuals.servicePermitsEngineering;
  if (has('budget control')) return visuals.bulletBudgetPlanning;
  if (has('owner communication')) return visuals.bulletClientCommunication;
  if (has('municipal inspections')) return visuals.bulletPermitPackages;
  if (has('quality control')) return visuals.bulletQualityInspection;
  if (has('trade accountability', 'what active site management prevents', 'standing trade')) return visuals.bulletTradeScheduling;
  if (has('define what you actually need')) return visuals.bulletClientCommunication;
  if (has('project management is separate', 'separate project manager', 'general contractor', 'delivery model')) return visuals.designBuildVsArchitect;
  if (has('what gets managed', 'scope change', 'scope changes', 'managed decisions')) return visuals.bulletScopeCoordination;
  if (has('who we work with')) return visuals.whyAboutUs;
  if (has('how we approach a project')) return visuals.whyVitaliteWay;
  if (has('why the structure matters')) return visuals.designBuildVsArchitect;
  if (has('gta realities')) return visuals.siteEvaluation;
  if (has('consultation')) return visuals.bulletClientCommunication;
  if (has('site and existing-condition review')) return visuals.bulletSiteFeasibility;
  if (has('concept design, budget')) return visuals.bulletBudgetPlanning;
  if (has('zoning, permits and engineering')) return visuals.bulletPermitPackages;
  if (has('construction, pdi and closeout')) return visuals.bulletCloseoutWarranty;

  if (has('proof', 'reference', 'documentation', 'trust', 'closeout and warranty')) return visuals.proofReferences;
  if (has('news', 'media', 'market context', 'project pipeline', 'company milestone', 'recognition')) return visuals.news;
  if (has('about', 'who we work with', 'how we approach', 'why the structure matters', 'gta realities')) {
    return visuals.whyAboutUs;
  }
  if (has('vitalite way', 'site and existing-condition', 'pdi', 'aftercare')) {
    return visuals.whyVitaliteWay;
  }
  if (has('custom home', 'teardown', 'willowdale', 'markham', 'infill', 'lot severance')) {
    return visuals.workCustomHomes;
  }
  if (has('multiplex', 'multi-unit', 'rental unit', 'unit strategy', 'fire separation', 'lansdowne', 'bedford park')) {
    return visuals.workMultiplex;
  }
  if (has('garden suite', 'laneway', 'coach house', 'backyard dwelling')) return visuals.workGardenSuites;
  if (has('addition', 'vertical expansion', 'rear addition', 'side addition', 'second-storey')) return visuals.workAdditions;
  if (has('warehouse', 'office', 'retail', 'institutional', 'tenant', 'commercial', 'ici construction')) return visuals.workIci;
  if (has('townhouse', 'semi-detached', 'party wall', 'narrow lot')) return visuals.workTownhouses;
  if (has('cost per square foot', 'cost driver', 'carrying cost')) return visuals.blogRenovationCosts;
  if (has('renovation law', 'permit', 'zoning', 'building code', 'board approval')) return visuals.blogRenovationLaws;
  if (has('garden suite ideas', 'rental income', 'secondary suite')) return visuals.blogGardenSuiteIdeas;

  if (has('portfolio', 'active examples', 'scope examples', 'project types', 'examples')) return page.image;
  if (has('pdi', 'warranty', 'closeout', 'handover', 'aftercare', 'deficiency', 'move-in')) return visuals.bulletCloseoutWarranty;
  if (has('municipal inspection', 'municipal inspections', 'permit office', 'permit reviewer')) return visuals.bulletPermitPackages;
  if (has('trade', 'schedule', 'sequencing', 'standing time', 'standing trade', 'sub-trade', 'sub-trades')) return visuals.bulletTradeScheduling;
  if (has('communication', 'reporting', 'client', 'owner', 'progress', 'reference')) return visuals.bulletClientCommunication;
  if (has('inspection', 'quality', 'building code', 'code review', 'code-compliant')) return visuals.bulletQualityInspection;
  if (has('budget', 'pricing', 'cost', 'lead time', 'procurement')) return visuals.bulletBudgetPlanning;
  if (has('condo board', 'property manager', 'committee of adjustment', 'municipal permit', 'approval')) return visuals.boardApprovals;
  if (has('drawing', 'permit package', 'submission', 'engineering coordination', 'comment response')) return visuals.servicePermitsEngineering;
  if (has('zoning', 'setback', 'lot coverage', 'height', 'lot', 'bylaw', 'site feasibility')) {
    return visuals.bulletZoningReview;
  }
  if (has('structural', 'mechanical', 'hvac', 'electrical', 'plumbing', 'foundation')) {
    return visuals.bulletMepCoordination;
  }
  if (has('interior', 'finish', 'material', 'kitchen', 'bath', 'millwork', 'cabinetry')) {
    return visuals.interiorDesign;
  }
  if (has('site logistics', 'site sequencing', 'living through construction', 'occupied', 'operational', 'active site management')) {
    return visuals.serviceSiteManagement;
  }

  return imageForDetailBullet(`${section.heading} ${section.text}`, page);
}

const subPageHeroes: Record<MainPageKey, { category: string; title: string; desc: string; image: string }> = {
  services: {
    category: 'SERVICES',
    title: 'One team for drawings, permits and construction — not three separate ones',
    desc: 'Most GTA project overruns happen in the gaps: between the designer and the builder, the builder and the permit office, the permit office and the engineer. Vitalite is structured to close those gaps.',
    image: visuals.designBuild,
  },
  'why-vitalite': {
    category: 'WHY VITALITE',
    title: 'A Toronto Design-Build Partner Built for Complex Projects',
    desc: 'We combine local permit knowledge, disciplined construction management and residential-commercial delivery experience so clients can move from idea to occupancy with fewer gaps.',
    image: visuals.whyVitaliteWay,
  },
  'our-work': {
    category: 'OUR WORK',
    title: 'Projects that moved from drawings to permit to site — under one team',
    desc: 'Custom homes, multiplex housing, garden suites, additions, ICI construction and full interiors across the GTA. Every project went through the same managed delivery path.',
    image: visuals.workOverview,
  },
  blog: {
    category: 'BLOG',
    title: 'Toronto Building Guides for Owners and Investors',
    desc: 'Practical articles for people planning custom homes, multiplex conversions, additions, garden suites, permits, budgets and construction timelines in the GTA.',
    image: visuals.buyerGuide,
  },
  'contact-us': {
    category: 'CONTACT US',
    title: 'Start With a Clear Project Conversation',
    desc: 'Tell us what you are planning, where the property is located and what stage you are in. Vitalite can help clarify scope, approvals, budget and construction path.',
    image: visuals.siteEvaluation,
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
        <img src={card.image} alt={card.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
        <img src={card.image} alt={card.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
        ? `group border border-white/10 bg-white/5 rounded-2xl ${card.image ? 'overflow-hidden' : 'p-6 sm:p-8'} text-white hover:border-kiewit-yellow transition-colors`
        : `group border border-gray-200 bg-white rounded-2xl ${card.image ? 'overflow-hidden' : 'p-6 sm:p-8'} text-black shadow-sm hover:border-kiewit-yellow transition-colors`;
      const content = (
        <>
          {card.image ? (
            <img src={card.image} alt={card.title} loading="lazy" decoding="async" className="h-44 w-full object-cover" />
          ) : null}
          <div className={card.image ? 'p-6 sm:p-8' : ''}>
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
          </div>
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

type MainGeoEvidenceProfile = {
  eyebrow: string;
  answer: string;
  facts: string[];
  comparison: string;
  steps: string[];
  caveat: string;
};

const mainGeoEvidenceProfiles: Record<'home' | MainPageKey, MainGeoEvidenceProfile> = {
  home: {
    eyebrow: 'GTA design-build contractor answer',
    answer:
      'Vitalite Construction Corp. is a GTA design-build contractor and construction management company that coordinates feasibility review, drawings, permits, engineering inputs, budget planning, site management, inspections and closeout for residential and ICI projects.',
    facts: [
      'Core project types include custom homes, multiplex housing, garden suites, laneway houses, home additions, permit drawings, major renovations and ICI construction.',
      'The company serves Toronto and the Greater Toronto Area from its Markham office, with service-area pages for Toronto, North York, Markham, Richmond Hill, Vaughan, Mississauga, Scarborough and Etobicoke.',
      'Useful first-review inputs include the address, survey or drawings if available, current permit status, project goal, target budget direction and timeline.',
    ],
    comparison:
      'Compared with a design-only or bid-after-drawings path, design-build is strongest when budget, permit comments, engineering, procurement, trade sequencing and inspections need to shape decisions before construction begins.',
    steps: [
      'Confirm project fit, address and owner goals',
      'Review zoning, lot conditions, structure and approval path',
      'Coordinate concept design, drawings, engineering and budget direction',
      'Prepare permits, procurement plan, trade sequence and inspection path',
      'Manage construction, PDI, closeout and warranty-oriented follow-up',
    ],
    caveat:
      'Early cost and timeline guidance is directional until drawings, hidden existing conditions, finish level, consultant inputs and municipal comments are connected to a defined scope.',
  },
  services: {
    eyebrow: 'Design-build service answer',
    answer:
      'Vitalite services combine design-build planning, general contracting and construction management for GTA owners who need drawings, approvals, budgets and construction delivery connected under one accountable team.',
    facts: [
      'Service coverage includes architectural coordination, interior planning, renderings, material selection, board approvals, site management, custom homes, multiplexes, garden suites, additions, permit drawings, project management and ICI.',
      'Most permit-driven projects need zoning review, building code review, structural or HVAC coordination, municipal comments and inspection planning before site work starts.',
      'The service pages are organized by both project type and local service area so owners can compare scope, approvals and readiness requirements.',
    ],
    comparison:
      'Use standalone design when you only need drawings, use a traditional contractor when drawings and scope are complete, and use design-build when feasibility, approvals, budget, procurement and site execution need to move together.',
    steps: [
      'Identify the project type and current stage',
      'Gather survey, drawings, photos and budget direction',
      'Review local zoning, code, engineering and permit requirements',
      'Define scope, allowances, exclusions and procurement timing',
      'Move into construction management, inspections and closeout',
    ],
    caveat:
      'A service page can explain the planning path, but the exact scope depends on the property, municipality, existing conditions, finish level and whether approvals are already in progress.',
  },
  'why-vitalite': {
    eyebrow: 'Why Vitalite answer',
    answer:
      'Owners choose Vitalite when a GTA construction project needs one team to connect feasibility, drawings, permits, budgets, trades, inspections and closeout instead of leaving the owner to manage disconnected handoffs.',
    facts: [
      'Vitalite is positioned for permit-sensitive projects where design decisions affect construction cost, schedule and approval risk.',
      'The process separates early feasibility, concept design, permit coordination, construction planning, active site management and final closeout.',
      'Owner control points include scope definition, allowance visibility, budget direction, material selections, permit comments, change decisions and inspection readiness.',
    ],
    comparison:
      'A fragmented model can work on simple scopes, but larger GTA projects often expose gaps between designer, engineer, contractor and trades. Vitalite reduces that coordination burden by managing those dependencies earlier.',
    steps: [
      'Consultation and project-fit review',
      'Existing-condition and site review',
      'Concept, budget and delivery model selection',
      'Zoning, drawings, engineering and permit coordination',
      'Construction management, PDI and closeout support',
    ],
    caveat:
      'Design-build does not remove municipal review, hidden-condition risk or owner decision timelines. It makes those risks visible earlier so they can be priced, sequenced and assigned.',
  },
  'our-work': {
    eyebrow: 'Project evidence answer',
    answer:
      'Vitalite project pages show the planning evidence behind GTA custom homes, multiplexes, garden suites, additions, ICI spaces, condos, older homes, townhouses and full interiors, not only finished images.',
    facts: [
      'Case-study facts include location, size, project type, status, approval path, permit route, scope and outcome where available.',
      'Categories are organized by owner intent: build new, add density, expand an existing property, modernize interiors or deliver a practical commercial/ICI space.',
      'A useful project example explains constraints, approvals, structural or mechanical scope, trade sequencing and closeout responsibilities.',
    ],
    comparison:
      'A photo gallery helps with style, but an evidence-rich project page helps owners and AI systems understand what was actually coordinated: approvals, drawings, scope, trades, inspections and handover.',
    steps: [
      'Choose the closest project category',
      'Review location, size, approval path and status',
      'Compare the visible scope to your own property constraints',
      'Check related service pages and local pages',
      'Contact Vitalite with address, drawings and target scope',
    ],
    caveat:
      'A project example is not a fixed quote. Similar homes can differ materially because of structure, site access, municipal comments, hidden conditions, finishes and procurement choices.',
  },
  blog: {
    eyebrow: 'GTA construction guide answer',
    answer:
      'The Vitalite blog is a GTA construction planning library for owners comparing costs, permits, timelines, design-build delivery, garden suites, multiplexes, additions and pre-construction readiness before hiring a contractor.',
    facts: [
      'The strongest guides answer a specific question first, then add cost drivers, permit inputs, decision criteria, process steps and caveats.',
      'Long-tail pages cover topics such as Toronto garden suite cost, laneway permits, multiplex conversion cost, home addition permits, second-storey additions, legal basement suites and permit-ready drawings.',
      'Blog pages link back to service, location, community and contact pages so readers can move from research to address-specific review.',
    ],
    comparison:
      'A short opinion article is weaker than a structured guide for GEO. Vitalite guides are written as explainers with definitions, numbers, comparisons, how-to sequences and local constraints.',
    steps: [
      'Start with the guide that matches the decision',
      'Identify likely permit, zoning and budget drivers',
      'Collect the property-specific documents the guide names',
      'Compare delivery model and scope options',
      'Book a project review before relying on generic ranges',
    ],
    caveat:
      'Guides support research and planning, but they do not replace municipal review, engineering input or a property-specific construction estimate.',
  },
  'contact-us': {
    eyebrow: 'Project intake answer',
    answer:
      'Contact Vitalite when you have a GTA property, project type and current stage to review. The first response is used to clarify whether the next step is feasibility review, drawings, permit coordination, budgeting or construction planning.',
    facts: [
      'Qualified inquiries should include the property city or address, project type, drawings or permit status, target budget direction, timeline and known zoning or structural concerns.',
      'Vitalite reviews custom homes, rebuilds, multiplexes, garden suites, laneway houses, additions, major renovations, permit drawings, construction management and ICI work.',
      'The office is in Markham and the service area includes Toronto and the Greater Toronto Area.',
    ],
    comparison:
      'A generic quote request often misses scope assumptions. A useful intake gives enough context to decide whether the project needs feasibility, drawings, permitting, construction management or a full design-build path.',
    steps: [
      'Send address or municipality and project type',
      'Share current drawings, permits, photos or survey if available',
      'Explain the target scope, budget direction and timeline',
      'Flag known issues such as trees, grading, structure, access or board approval',
      'Review the next planning step with Vitalite',
    ],
    caveat:
      'Vitalite does not treat early intake as a final construction quote. Pricing becomes reliable only after scope, drawings, approvals, site constraints, finishes and trade input are clear.',
  },
};

const MainGeoEvidenceSection = ({ pageKey }: { pageKey: 'home' | MainPageKey }) => {
  const profile = mainGeoEvidenceProfiles[pageKey];

  return (
    <section className="bg-gray-50 text-black py-20 md:py-28 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <div className="max-w-4xl mb-10 md:mb-14">
          <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500 mb-4">{profile.eyebrow}</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight mb-6">Citation-Ready Planning Summary</h2>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{profile.answer}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
          <article className="border border-gray-200 bg-white rounded-lg p-6 sm:p-7">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4">Key Facts</h3>
            <ul className="space-y-3 text-base text-gray-700 leading-relaxed">
              {profile.facts.map((fact) => (
                <li key={fact} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-kiewit-yellow" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="border border-gray-200 bg-white rounded-lg p-6 sm:p-7">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4">Comparison Criteria</h3>
            <p className="text-base text-gray-700 leading-relaxed">{profile.comparison}</p>
          </article>
          <article className="border border-gray-200 bg-white rounded-lg p-6 sm:p-7">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4">Planning Sequence</h3>
            <ol className="space-y-3 text-base text-gray-700 leading-relaxed">
              {profile.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="font-bold text-kiewit-yellow">{String(index + 1).padStart(2, '0')}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>
          <article className="border border-gray-200 bg-white rounded-lg p-6 sm:p-7">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4">Caveat</h3>
            <p className="text-base text-gray-700 leading-relaxed">{profile.caveat}</p>
          </article>
        </div>
      </motion.div>
    </section>
  );
};

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
          src={isLocations ? visuals.seoGtaServiceAreas : visuals.seoNeighbourhoodCommunities}
          alt={title}
          loading="eager"
          decoding="async"
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
  const visibleGeoEvidenceSections = buildVisibleGeoEvidenceSections(pageKey, page);

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
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
          <SubPageHeading title={page.title} dark />
          {page.isProject && page.projectMeta ? (
            <div className="mb-12">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-400 mb-4">Project Case Study Facts</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden">
              {[
                { label: 'Project Type', value: page.projectMeta.projectType },
                { label: 'Location', value: page.projectMeta.location },
                { label: 'Size', value: page.projectMeta.size },
                { label: 'Duration', value: page.projectMeta.duration },
                { label: 'Status', value: page.projectMeta.statusLabel },
                { label: 'Approval Path', value: page.projectMeta.approvalPath, wide: true },
                { label: 'Permit Route', value: page.projectMeta.permitRoute, wide: true },
                { label: 'Scope', value: page.projectMeta.scope.join(' / '), wide: true },
                { label: 'Outcome', value: page.projectMeta.outcome, wide: true },
              ].filter((f) => f.value).map((fact) => (
                <div key={fact.label} className={`bg-white px-4 py-4 ${fact.wide ? 'lg:col-span-2' : ''}`}>
                  <dt className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 mb-1">{fact.label}</dt>
                  <dd className="text-sm font-medium text-gray-900 leading-snug">{fact.value}</dd>
                </div>
              ))}
              </dl>
            </div>
          ) : null}
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-16">
            <div>
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
          <div className="flex flex-col border-t border-gray-200 mt-6 lg:mt-0">
            {page.bullets.map((item, index) => {
              return (
                <div key={`${pageKey}-${item}`} className="group flex flex-col sm:flex-row sm:items-center py-6 sm:py-8 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-default">
                  <div className="flex items-center gap-6 sm:w-1/4 mb-3 sm:mb-0">
                    <span className="text-sm font-bold text-gray-400 tracking-widest">{String(index + 1).padStart(2, '0')}</span>
                    <div className="hidden sm:block w-12 h-px bg-gray-300 group-hover:bg-kiewit-yellow transition-colors"></div>
                  </div>
                  <div className="flex-1 flex justify-between items-center sm:pl-6">
                    <h3 className="text-xl sm:text-2xl font-medium text-black group-hover:text-kiewit-yellow transition-colors">{item}</h3>
                    <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-kiewit-yellow group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </motion.div>
      </section>

      {page.sections.length > 0 ? (
        <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {page.sections.map((section) => {
              const sectionImage = ['SERVICES', 'WHY VITALITE', 'OUR WORK', 'BLOG'].includes(page.category) ? imageForDetailSection(section, page, pageKey) : null;

              return (
                <article key={section.heading} className={`border border-white/10 bg-white/5 rounded-2xl ${sectionImage ? 'overflow-hidden' : 'p-6 sm:p-8'}`}>
                  {sectionImage ? (
                    <img src={sectionImage} alt={`${page.title}: ${section.heading}`} loading="lazy" decoding="async" className="h-56 w-full object-cover opacity-90" />
                  ) : null}
                  <div className={sectionImage ? 'p-6 sm:p-8' : ''}>
                    <h2 className="text-2xl sm:text-3xl font-medium text-white mb-5">{section.heading}</h2>
                    <p className="text-base sm:text-lg text-gray-300 leading-relaxed">{section.text}</p>
                  </div>
                </article>
              );
            })}
          </motion.div>
        </section>
      ) : null}

      <section className="bg-gray-50 text-black py-20 md:py-28 px-5 sm:px-8 md:px-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
          <SubPageHeading title="Planning Evidence" dark />
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-10 md:mb-14">
            These blocks make the page easier for owners and AI search systems to evaluate: direct facts, comparison criteria, process steps, evidence inputs and boundaries.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleGeoEvidenceSections.map((section) => (
              <article key={section.heading} className="border border-gray-200 bg-white rounded-lg p-6 sm:p-7">
                <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4">{section.heading}</h2>
                <p className="text-base text-gray-700 leading-relaxed">{section.text}</p>
              </article>
            ))}
          </div>
        </motion.div>
      </section>

      {projectCards.length > 0 ? (
        <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
            <SubPageHeading title="Projects in This Category" dark />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectCards.map(({ project, content }) => (
                <a key={project.key} href={routeHref(project.key)} className="group border border-gray-200 rounded-2xl overflow-hidden hover:border-kiewit-yellow transition-colors bg-gray-50">
                  <div className="aspect-[16/9] bg-kiewit-dark overflow-hidden">
                    <img src={content.image} alt={content.title} loading="lazy" decoding="async" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
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

      {page.officialResources?.length ? (
        <section className="bg-gray-50 text-black py-12 md:py-16 px-5 sm:px-8 md:px-24 border-t border-gray-200">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-400 mb-5">Official Reference</p>
            <div className="flex flex-wrap gap-3">
              {page.officialResources.map((res) => (
                <a key={res.url} href={res.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-800 hover:border-kiewit-yellow hover:bg-white transition-colors">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  {res.label}
                </a>
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
    </>
  );
};

const ServicesPage = () => (
  <>
    <SubPageHero page="services" />
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeInVariants} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <SubPageHeading title="What one accountable team handles for you" />
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
            When drawings, permits and construction answer to the same team, there is nobody to blame-shift and no gap for scope changes to fall through.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {serviceInclusions.map((item) => (
            <a key={item.href} href={routeHrefFromLegacyHash(item.href)} className="group overflow-hidden border border-white/10 bg-white/5 rounded-lg text-white font-medium hover:border-kiewit-yellow hover:text-kiewit-yellow transition-colors">
              <img src={item.image} alt={item.label} loading="lazy" decoding="async" className="h-28 w-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
              <div className="p-5">{item.label}</div>
            </a>
          ))}
        </div>
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-[1400px] mx-auto">
        <SubPageHeading title="Find your project type" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-3xl mb-12 md:mb-16">
          Custom homes, multiplex housing, additions, garden suites, ICI construction — pick the project type that matches what you are building.
        </p>
        <CardRail cards={servicePageCards} />
      </motion.div>
    </section>
    <section className="bg-kiewit-dark py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-[1400px] mx-auto">
        <SubPageHeading title="Renovation services" />
        <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-light max-w-3xl mb-12 md:mb-16">
          Most GTA renovation failures are not design failures — they are coordination failures. Gut renovations, open-concept reconfiguration, condo and apartment work, and heritage properties each carry constraints that need to be planned for before a trade sets foot on site.
        </p>
        <CardRail cards={serviceRenovationCards} />
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="Three phases that stay connected" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          Most GTA project failures share the same cause: the next phase does not know what the previous phase decided. Vitalite structures work so each phase informs the one after it.
        </p>
        <TextCardGrid cards={serviceWorkflowCards} />
      </motion.div>
    </section>
    <section className="bg-white text-black py-20 md:py-32 px-5 sm:px-8 md:px-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInVariants} className="max-w-7xl mx-auto">
        <SubPageHeading title="Where are you in the process?" dark />
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-4xl mb-12 md:mb-16">
          Some owners arrive with approved drawings. Others have a property and an idea. These three paths match where you actually are.
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
    <MainGeoEvidenceSection pageKey="services" />
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
    <MainGeoEvidenceSection pageKey="why-vitalite" />
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
              Every project here moved through the same path: zoning check, permit drawings, engineering coordination, construction management and closeout — under one accountable team. Pick the category that matches your project.
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
    <MainGeoEvidenceSection pageKey="our-work" />
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
    <MainGeoEvidenceSection pageKey="blog" />
    <MainPageFaq faqs={blogFaqs} dark />
  </>
);

const leadInquiryTypeOptions: Array<{ value: LeadInquiryType; label: string }> = [
  { value: 'project-owner', label: 'Property owner with an active project' },
  { value: 'owner-representative', label: 'Owner representative / realtor / designer' },
  { value: 'developer-business', label: 'Developer / business / property manager' },
  { value: 'small-repair', label: 'Small repair / handyman request' },
  { value: 'career', label: 'Job or career inquiry' },
  { value: 'vendor', label: 'Vendor / subcontractor / agency pitch' },
];

const getFormString = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
};

type ContactFormProps = {
  variant?: 'full' | 'compact';
  source?: string;
  onSuccess?: () => void;
};

const ContactForm = ({ variant = 'full', source = 'contact-page', onSuccess }: ContactFormProps) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [filterMessage, setFilterMessage] = useState<string | null>(null);
  const isCompact = variant === 'compact';
  const labelClass = isCompact
    ? 'block text-[12px] font-semibold uppercase mb-1.5 text-white/80'
    : 'block text-sm font-semibold tracking-[0.12em] uppercase mb-2';
  const fieldClass = isCompact
    ? 'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-kiewit-yellow'
    : 'w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 outline-none focus:border-kiewit-yellow';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const disqualification = getLeadDisqualification({
      inquiryType: getFormString(data, 'inquiry_type'),
      message: getFormString(data, 'message'),
      projectType: getFormString(data, 'project_type'),
      name: getFormString(data, 'name'),
      email: getFormString(data, 'email'),
    });

    if (disqualification) {
      setStatus('idle');
      setFilterMessage(disqualification.message);
      return;
    }

    setFilterMessage(null);
    setStatus('sending');
    data.set('lead_source', source);
    data.set('lead_filter', 'qualified-project-inquiry');
    data.set('_subject', 'Vitalite project inquiry');

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setStatus('success');
        form.reset();
        onSuccess?.();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className={isCompact ? 'border border-white/10 bg-white/5 rounded-lg p-5 text-center space-y-3' : 'bg-kiewit-dark text-white rounded-2xl p-10 text-center space-y-4'}>
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
    <form onSubmit={handleSubmit} className={isCompact ? 'space-y-4' : 'bg-kiewit-dark text-white rounded-2xl p-6 sm:p-8 md:p-10 space-y-5'}>
      <div>
        <label className={labelClass}>Name</label>
        <input name="name" required className={fieldClass} placeholder="Your name" />
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input name="email" type="email" required className={fieldClass} placeholder="you@example.com" />
      </div>
      <div>
        <label className={labelClass}>Inquiry Type</label>
        <select name="inquiry_type" required defaultValue="" className={fieldClass}>
          <option value="" disabled>Select project fit</option>
          {leadInquiryTypeOptions.map((option) => (
            <option key={option.value} value={option.value} className="text-black">
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Project Type</label>
        <input name="project_type" className={fieldClass} placeholder="Custom home, addition, permit, multiplex..." />
      </div>
      <div>
        <label className={labelClass}>Project Details</label>
        <textarea name="message" className={isCompact ? `${fieldClass} min-h-[104px]` : `${fieldClass} min-h-[150px]`} placeholder="Tell us the property location, project stage, budget direction and timeline." />
      </div>
      {filterMessage && (
        <div role="alert" className="border border-kiewit-yellow/40 bg-kiewit-yellow/10 rounded-lg p-4 text-sm text-white">
          <p>{filterMessage}</p>
          <a href={`tel:${CONTACT_PHONE_TEL}`} className="mt-3 inline-flex items-center gap-2 text-kiewit-yellow font-bold hover:text-white transition-colors">
            <PhoneCall className="w-4 h-4" />
            Active project? Call {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm">
          Something went wrong. Please email us directly at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className={isCompact ? 'w-full bg-kiewit-yellow text-black font-bold uppercase py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-60' : 'w-full bg-kiewit-yellow text-black font-bold tracking-[0.08em] uppercase py-4 rounded-lg hover:bg-white transition-colors disabled:opacity-60'}
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
    <MainGeoEvidenceSection pageKey="contact-us" />
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

const MobileContactBar = ({ activePage }: { activePage: PageKey }) => {
  if (!shouldShowMobileContactBar(activePage)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] bg-black/92 border-t border-white/10 px-4 py-3 sm:hidden">
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${CONTACT_PHONE_TEL}`}
          className="inline-flex items-center justify-center gap-2 bg-kiewit-yellow text-black font-bold rounded-lg py-3"
        >
          <PhoneCall className="w-4 h-4" />
          Call
        </a>
        <a
          href={routeHref('contact-us')}
          className="inline-flex items-center justify-center gap-2 border border-white/25 text-white font-bold rounded-lg py-3 hover:border-kiewit-yellow hover:text-kiewit-yellow transition-colors"
        >
          Project Form
        </a>
      </div>
    </div>
  );
};

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
    <MainGeoEvidenceSection pageKey="home" />
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
    case 'tools-hub':
      return <Suspense fallback={<div className="min-h-screen bg-white" />}><ToolsHub /></Suspense>;
    case 'tool-addition-cost':
      return <Suspense fallback={<div className="min-h-screen bg-white" />}><AdditionCostCalculator /></Suspense>;
    case 'tool-laneway-cost':
      return <Suspense fallback={<div className="min-h-screen bg-white" />}><LanewayCostCalculator /></Suspense>;
    case 'tool-teardown-decision':
      return <Suspense fallback={<div className="min-h-screen bg-white" />}><TeardownDecisionTool /></Suspense>;
    case 'tool-permit-timeline':
      return <Suspense fallback={<div className="min-h-screen bg-white" />}><PermitTimelineEstimator /></Suspense>;
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
    <div className={`font-sans antialiased text-white bg-kiewit-dark ${shouldShowMobileContactBar(activePage) ? 'pb-[72px] sm:pb-0' : ''}`}>
      <Navbar activePage={activePage} language={language} onLanguageChange={setLanguage} onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} language={language} />
      {renderPage(activePage)}
      <MobileContactBar activePage={activePage} />
      <Footer language={language} />
    </div>
  );
}
