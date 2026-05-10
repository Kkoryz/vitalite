export type Language = 'en' | 'fr';

export type LocalizablePage = {
  key: string;
  path: string;
  title: string;
  description: string;
  kind: string;
  primaryKeyword: string;
};

export const DEFAULT_LANGUAGE: Language = 'en';
export const FRENCH_LANGUAGE: Language = 'fr';
export const EN_CA = 'en-CA';
export const FR_CA = 'fr-CA';

export const frenchBusinessDescription =
  'Vitalite Construction Corp. est une entreprise conception-construction, entrepreneur general et gestionnaire de construction dans le Grand Toronto. Elle coordonne faisabilite, plans de permis, ingenierie, budget, construction, inspections et cloture pour projets residentiels et ICI.';

export function stripLocalePrefix(path: string) {
  const normalized = normalizePath(path);
  if (normalized === '/fr') return '/';
  if (normalized.startsWith('/fr/')) return normalized.slice(3) || '/';
  return normalized;
}

export function getLanguageFromPath(path: string): Language {
  const normalized = normalizePath(path);
  return normalized === '/fr' || normalized.startsWith('/fr/') ? 'fr' : 'en';
}

export function localizedPathFor(path: string, language: Language = 'en') {
  const normalized = stripLocalePrefix(path);
  const canonical = normalized === '/' ? '/' : `${normalized.replace(/\/+$/, '')}/`;
  if (language === 'fr') return canonical === '/' ? '/fr/' : `/fr${canonical}`;
  return canonical;
}

export function localizedUrlFor(siteUrl: string, path: string, language: Language = 'en') {
  return `${siteUrl}${localizedPathFor(path, language)}`;
}

export function localizePage(page: LocalizablePage, language: Language = 'en'): LocalizablePage {
  if (language !== 'fr') return page;
  return {
    ...page,
    title: getFrenchTitle(page),
    description: getFrenchDescription(page),
    primaryKeyword: getFrenchKeyword(page),
  };
}

export function getFrenchTitle(page: LocalizablePage) {
  const manual = frenchTitleByKey[page.key];
  if (manual) return manual;

  const head = page.title.split('|')[0].trim();
  const generated = translateGeneratedTitle(head);
  if (generated) return `${generated} | Vitalite`;

  if (page.key.startsWith('project-')) return `Projet Vitalite: ${cleanBrand(head)} | Vitalite`;
  if (page.key.startsWith('guide-') || page.key.startsWith('blog-')) return `${translateTopic(head)} | Guide Vitalite`;
  if (page.key.startsWith('work-')) return `${translateTopic(head)} | Projets Vitalite`;
  if (page.key.startsWith('why-')) return `${translateTopic(head)} | Vitalite`;
  if (page.key.startsWith('service-')) return `${translateTopic(head)} | Vitalite`;

  return `${translateTopic(head)} | Vitalite`;
}

export function getFrenchDescription(page: LocalizablePage) {
  const manual = frenchDescriptionByKey[page.key];
  if (manual) return manual;

  const topic = getFrenchTitle(page).split('|')[0].trim();
  const local = extractLocalName(page);
  const localPhrase = local ? ` a ${local}` : ' dans le Grand Toronto';

  if (page.key.startsWith('project-')) {
    return `${topic}: preuve de projet Vitalite avec contexte local, portee, permis, coordination de chantier, inspections et lecons de planification pour proprietaires GTA.`;
  }

  if (page.key.startsWith('location-') || page.key.startsWith('community-')) {
    return `${topic}${localPhrase}: faisabilite, zonage, plans, permis, ingenierie, budget, chantier, inspections et cloture coordonnes par Vitalite.`;
  }

  if (page.kind === 'article' || page.key.startsWith('guide-') || page.key.startsWith('blog-')) {
    return `${topic}: guide en francais pour proprietaires GTA sur couts, permis, delais, conception-construction, risques, documents a preparer et prochaines etapes.`;
  }

  if (page.kind === 'contact') {
    return 'Contactez Vitalite pour une evaluation de projet dans le GTA. Partagez adresse, portee, plans, statut de permis, budget et delai vise.';
  }

  return `${topic}: Vitalite coordonne faisabilite, conception, plans, permis, ingenierie, budget, construction, inspections et cloture pour projets residentiels et ICI dans le GTA.`;
}

export function getFrenchKeyword(page: LocalizablePage) {
  const manual = frenchKeywordByKey[page.key];
  if (manual) return manual;
  return getFrenchTitle(page)
    .split('|')[0]
    .trim()
    .toLowerCase()
    .replace(/^projet vitalite:\s*/, '');
}

export function getFrenchCategory(category: string) {
  return categoryTranslations[category] ?? translateTopic(category);
}

export function getFrenchCta(text: string) {
  return ctaTranslations[text] ?? translateTopic(text);
}

export function buildFrenchDetailIntro(pageTitle: string, pageKey: string) {
  const topic = pageTitle.split('|')[0].trim();
  if (pageKey.startsWith('project-')) {
    return `${topic} presente une preuve de projet utile pour evaluer la portee, le contexte local, les approbations, la sequence de chantier et les responsabilites avant de lancer un projet semblable.`;
  }
  if (pageKey.startsWith('location-') || pageKey.startsWith('community-')) {
    return `${topic} doit commencer par une verification de l'adresse, du zonage, des conditions du terrain, des arbres, des services, des plans requis, du budget et du chemin de permis avant de traiter le prix comme final.`;
  }
  if (pageKey.startsWith('guide-') || pageKey.startsWith('blog-')) {
    return `${topic} explique les decisions, documents, risques de permis, hypotheses de budget et etapes de construction que les proprietaires du GTA devraient clarifier avant de signer.`;
  }
  return `${topic} est gere comme un processus relie: faisabilite, conception, permis, ingenierie, budget, approvisionnement, chantier, inspections et cloture restent sous une meme responsabilite.`;
}

export function buildFrenchAnswer(pageTitle: string, pageKey: string) {
  const topic = pageTitle.split('|')[0].trim();
  if (pageKey.startsWith('project-')) {
    return `${topic} montre comment Vitalite relie portee, approbations, budget, trades, inspections et cloture dans un dossier de projet concret plutot qu'une simple galerie d'images.`;
  }
  return `${topic} fonctionne le mieux quand les proprietaires confirment d'abord l'adresse, les contraintes, les plans, les permis, les intrants d'ingenierie, les hypotheses de budget et la sequence de chantier.`;
}

export function buildFrenchBullets(pageKey: string) {
  if (pageKey.startsWith('project-')) {
    return ['Contexte du site et de la portee', 'Chemin de permis et d approbation', 'Coordination des trades et inspections', 'Signaux de preuve et cloture'];
  }
  if (pageKey.startsWith('guide-') || pageKey.startsWith('blog-')) {
    return ['Reponse directe et criteres de decision', 'Documents et preuves a preparer', 'Risques de couts, permis et delais', 'Prochaines etapes avec moins d incertitude'];
  }
  return ['Verification de faisabilite', 'Plans, permis et ingenierie', 'Budget, approvisionnement et trades', 'Inspections, PDI et cloture'];
}

export function buildFrenchSections(pageTitle: string, pageKey: string) {
  const topic = pageTitle.split('|')[0].trim();
  return [
    {
      heading: 'Ce qui change la recommandation',
      text: `${topic} depend de l'adresse, du zonage, des conditions existantes, de la structure, des arbres, du drainage, du niveau de finition, des intrants de consultants, du chemin de permis et des contraintes d'acces au chantier.`,
    },
    {
      heading: 'Pourquoi une equipe integree aide',
      text: 'Une approche conception-construction garde les plans, les commentaires municipaux, le budget, l ingenierie, l approvisionnement, les trades et les inspections dans un meme flux de responsabilite.',
    },
    {
      heading: pageKey.startsWith('project-') ? 'Comment lire cette preuve de projet' : 'Points de controle pour le proprietaire',
      text: pageKey.startsWith('project-')
        ? 'Comparez le type de projet, la taille, le secteur, les approbations, la portee, le statut, les contraintes et la sequence de cloture avant de l utiliser comme reference pour votre propre projet.'
        : 'Avant de vous engager, demandez une portee ecrite, les hypothese de permis, les exclusions, les allocations, les intrants d ingenierie, les delais de materiaux et les responsabilites d inspection.',
    },
  ];
}

export function buildFrenchSteps() {
  return [
    'Confirmer l adresse, les objectifs et les contraintes',
    'Verifier zonage, structure, arbres, acces et approbations',
    'Preparer plans, consultants, budget et exclusions',
    'Coordonner permis, approvisionnement, trades et calendrier',
    'Gerer chantier, inspections, PDI, cloture et suivi',
  ];
}

export function buildFrenchFaqs(pageTitle: string) {
  const topic = pageTitle.split('|')[0].trim();
  return [
    {
      question: `Quand faut-il commencer ${topic.toLowerCase()}?`,
      answer: 'Le meilleur moment est avant de figer les plans ou le prix, surtout si le projet touche au zonage, aux permis, a la structure, aux arbres, a l ingenierie ou a plusieurs corps de metier.',
    },
    {
      question: 'Quels documents dois-je preparer?',
      answer: 'Preparez adresse, releve ou survey, photos, plans existants si disponibles, objectif du projet, budget indicatif, delai souhaite, statut de permis et toute contrainte connue.',
    },
    {
      question: 'Pourquoi ne pas demander seulement un prix rapide?',
      answer: 'Un prix rapide peut ignorer les exclusions, les permis, les conditions cachees, les allocations, les commentaires municipaux et la sequence des inspections. Vitalite cherche d abord a reduire ces inconnues.',
    },
  ];
}

export function translateTopic(text: string) {
  let translated = cleanBrand(text);
  const replacements: Array<[RegExp, string]> = [
    [/\bGTA\b/g, 'GTA'],
    [/\bGreater Toronto Area\b/gi, 'Grand Toronto'],
    [/\bDesign-Build\b/gi, 'Conception-construction'],
    [/\bDesign Build\b/gi, 'Conception-construction'],
    [/\bCustom Home Builder\b/gi, 'Constructeur de maisons sur mesure'],
    [/\bCustom Home Projects\b/gi, 'Projets de maisons sur mesure'],
    [/\bCustom Home Design & Build\b/gi, 'Maisons sur mesure conception-construction'],
    [/\bCustom Homes\b/gi, 'Maisons sur mesure'],
    [/\bGarden Suite Builder\b/gi, 'Constructeur de garden suites'],
    [/\bGarden Suite\b/gi, 'Garden suite'],
    [/\bGarden Suites\b/gi, 'Garden suites'],
    [/\bLaneway House\b/gi, 'Maison de ruelle'],
    [/\bLaneway Houses\b/gi, 'Maisons de ruelle'],
    [/\bMultiplex Contractor\b/gi, 'Entrepreneur multiplex'],
    [/\bMultiplex Construction\b/gi, 'Construction multiplex'],
    [/\bMultiplex\b/gi, 'Multiplex'],
    [/\bMulti-Unit\b/gi, 'Multi-logements'],
    [/\bHome Additions Contractor\b/gi, 'Entrepreneur en agrandissements'],
    [/\bHome Addition\b/gi, 'Agrandissement de maison'],
    [/\bHome Additions\b/gi, 'Agrandissements de maison'],
    [/\bMajor Renovations\b/gi, 'Renovations majeures'],
    [/\bLuxury Home Renovation\b/gi, 'Renovation de luxe'],
    [/\bPermit Drawings\b/gi, 'Plans de permis'],
    [/\bPermits\b/gi, 'Permis'],
    [/\bEngineering\b/gi, 'Ingenierie'],
    [/\bConstruction Management\b/gi, 'Gestion de construction'],
    [/\bProject Management\b/gi, 'Gestion de projet'],
    [/\bConstruction Guide\b/gi, 'Guide de construction'],
    [/\bPlanning Guide\b/gi, 'Guide de planification'],
    [/\bVitalite Guide\b/gi, 'Guide Vitalite'],
    [/\bVitalite Blog\b/gi, 'Blogue Vitalite'],
    [/\bOur Work\b/gi, 'Projets Vitalite'],
    [/\bService Areas\b/gi, 'Secteurs de service'],
    [/\bNeighbourhood Construction Pages\b/gi, 'Pages de construction par quartier'],
    [/\bRenovation Cost Per Square Foot\b/gi, 'Cout de renovation par pied carre'],
    [/\bRenovation Cost\b/gi, 'Cout de renovation'],
    [/\bCost Calculator\b/gi, 'Calculateur de cout'],
    [/\bPermit Timeline Estimator\b/gi, 'Estimateur de delai de permis'],
    [/\bTeardown vs Renovation Tool\b/gi, 'Outil demolition-reconstruction ou renovation'],
    [/\bArchitectural Services\b/gi, 'Services architecturaux'],
    [/\bInterior Design\b/gi, 'Design interieur'],
    [/\b3D Rendering\b/gi, 'Rendu 3D'],
    [/\bMaterial Selection & Procurement\b/gi, 'Selection et approvisionnement des materiaux'],
    [/\bBuilding & Board Approvals\b/gi, 'Approbations municipales et de copropriete'],
    [/\bConstruction & Site Management\b/gi, 'Gestion de chantier'],
    [/\bApartment Renovations\b/gi, 'Renovations d appartements'],
    [/\bTownhouse Renovations\b/gi, 'Renovations de maisons en rangee'],
    [/\bCondo Renovations\b/gi, 'Renovations de condos'],
    [/\bOlder & Heritage Home Renovations\b/gi, 'Renovations de maisons anciennes et patrimoniales'],
    [/\bLoft & Open-Concept Renovations\b/gi, 'Renovations de lofts et espaces ouverts'],
    [/\bFull-Gut Renovations\b/gi, 'Renovations completes'],
    [/\bICI Construction\b/gi, 'Construction ICI'],
    [/\bIndustrial, Commercial & Institutional\b/gi, 'Industriel, commercial et institutionnel'],
    [/\bToronto\b/g, 'Toronto'],
    [/\bGTA\b/g, 'GTA'],
    [/\bGuide\b/g, 'Guide'],
    [/\bFAQ\b/g, 'FAQ'],
    [/\bCost\b/gi, 'Cout'],
    [/\bPermit\b/gi, 'Permis'],
    [/\bBuilder\b/gi, 'Constructeur'],
    [/\bContractor\b/gi, 'Entrepreneur'],
    [/\bProjects\b/gi, 'Projets'],
  ];
  for (const [pattern, replacement] of replacements) {
    translated = translated.replace(pattern, replacement);
  }
  return translated.replace(/\s+/g, ' ').trim();
}

function translateGeneratedTitle(head: string) {
  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^Custom Home Builder (.+)$/i, (m) => `Constructeur de maisons sur mesure a ${m[1]}`],
    [/^Garden Suite Builder (.+)$/i, (m) => `Constructeur de garden suites a ${m[1]}`],
    [/^Multiplex Contractor (.+)$/i, (m) => `Entrepreneur multiplex a ${m[1]}`],
    [/^Home Additions Contractor (.+)$/i, (m) => `Entrepreneur en agrandissements a ${m[1]}`],
    [/^Luxury Home Renovation (.+)$/i, (m) => `Renovation de luxe a ${m[1]}`],
    [/^Permit Drawings (.+)$/i, (m) => `Plans de permis a ${m[1]}`],
  ];
  for (const [pattern, build] of patterns) {
    const match = head.match(pattern);
    if (match) return build(match);
  }
  return '';
}

function extractLocalName(page: LocalizablePage) {
  const head = page.title.split('|')[0].trim();
  const generated = head.match(/^(?:Custom Home Builder|Garden Suite Builder|Multiplex Contractor|Home Additions Contractor|Luxury Home Renovation|Permit Drawings)\s+(.+)$/i);
  return generated?.[1]?.trim() ?? '';
}

function cleanBrand(text: string) {
  return text
    .replace(/\s*\|\s*Vitalite(?: Construction(?: Corp\.)?)?/gi, '')
    .replace(/\s*\|\s*Before You Purchase/gi, '')
    .trim();
}

function normalizePath(path: string) {
  if (!path) return '/';
  const normalized = `/${path.replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
}

const frenchTitleByKey: Record<string, string> = {
  home: 'Conception-construction GTA | Vitalite',
  services: 'Services conception-construction GTA | Vitalite',
  'why-vitalite': 'Pourquoi Vitalite | Partenaire construction GTA',
  'our-work': 'Projets Vitalite | Maisons et renovations GTA',
  blog: 'Guides renovation et construction Toronto | Blogue Vitalite',
  'contact-us': 'Contactez Vitalite | Evaluation de projet GTA',
  'locations-hub': 'Secteurs de service GTA | Vitalite',
  'communities-hub': 'Quartiers construction GTA | Vitalite',
  faq: 'FAQ conception-construction GTA | Vitalite Construction',
  'ai-gta-design-build-guide': 'Guide conception-construction GTA lisible par IA | Vitalite',
  'tools-hub': 'Calculateurs de construction GTA | Outils Vitalite',
  'tool-addition-cost': 'Calculateur cout agrandissement maison GTA | Vitalite',
  'tool-laneway-cost': 'Calculateur cout maison de ruelle et garden suite Toronto | Vitalite',
  'tool-teardown-decision': 'Outil demolition-reconstruction ou renovation GTA | Vitalite',
  'tool-permit-timeline': 'Estimateur delai permis de construction GTA | Vitalite',
  'service-custom-homes': 'Maisons sur mesure Toronto | Vitalite',
  'service-garden-suites': 'Garden suites Toronto | Vitalite',
  'service-home-additions': 'Agrandissements Toronto | Vitalite',
  'service-drawings-permits': 'Plans et permis Toronto | Vitalite',
  'service-project-management': 'Gestion de construction GTA | Vitalite',
};

const frenchDescriptionByKey: Record<string, string> = {
  home: 'Vitalite coordonne maisons sur mesure, multiplex, agrandissements, garden suites et projets ICI dans le GTA, des plans aux permis et au chantier.',
  services: 'Services GTA pour maisons sur mesure, garden suites, multiplex, agrandissements, plans de permis, gestion de construction et projets ICI.',
  'why-vitalite': 'Pourquoi les proprietaires GTA choisissent Vitalite: faisabilite, plans prets pour permis, budget, gestion de construction, inspections et cloture sous une meme equipe.',
  'our-work': 'Categories de projets Vitalite dans le GTA: maisons sur mesure, multiplex, garden suites, agrandissements, ICI, condos, maisons anciennes, townhouses et interieurs complets.',
  blog: 'Guides Toronto et GTA avec reponses directes sur couts, permis, delais, conception-construction, garden suites, multiplex et preparation de projet.',
  'contact-us': 'Contactez Vitalite pour une evaluation de projet dans le GTA. Partagez adresse, portee, plans, statut de permis, budget et delai vise.',
  'locations-hub': 'Secteurs GTA servis par Vitalite pour conception, plans, permis, budget, construction, inspections et cloture de projets residentiels et ICI.',
  'communities-hub': 'Pages par quartier pour maisons sur mesure, renovations, garden suites, multiplex et plans de permis dans Toronto et le GTA.',
  'service-custom-homes': 'Maisons sur mesure a Toronto: faisabilite, conception, plans, permis, ingenierie, budget, chantier et cloture avec Vitalite.',
  'service-garden-suites': 'Garden suites et maisons de ruelle a Toronto: faisabilite du lot, plans, permis, services, budget, construction et inspections.',
  'service-home-additions': 'Agrandissements a Toronto: zonage, structure, plans, permis, ingenierie, budget, trades, inspections et cloture avec Vitalite.',
  'service-drawings-permits': 'Plans et permis a Toronto: zonage, dessins, structure, HVAC, ingenierie, soumission municipale et soutien jusqu aux commentaires.',
  'service-project-management': 'Gestion de construction GTA: budget, calendrier, trades, inspections, qualite, communication et cloture pour projets residentiels et ICI.',
};

const frenchKeywordByKey: Record<string, string> = {
  home: 'entrepreneur conception-construction GTA',
  services: 'services conception-construction Toronto',
  'contact-us': 'consultation conception-construction GTA',
};

const categoryTranslations: Record<string, string> = {
  SERVICES: 'SERVICES',
  'WHY VITALITE': 'POURQUOI VITALITE',
  'OUR WORK': 'PROJETS',
  BLOG: 'BLOGUE',
  'GTA SERVICE AREA': 'SECTEUR DE SERVICE GTA',
  'COMMUNITY SERVICE AREA': 'SECTEUR PAR QUARTIER',
  'GTA DESIGN-BUILD FAQ': 'FAQ CONCEPTION-CONSTRUCTION GTA',
  'TORONTO GUIDE': 'GUIDE TORONTO',
};

const ctaTranslations: Record<string, string> = {
  'Start a similar project': 'Demarrer un projet similaire',
  'Discuss this project type': 'Discuter de ce type de projet',
  'Back to': 'Retour a',
};
