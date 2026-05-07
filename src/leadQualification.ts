export const LEAD_CTA_POPUP_DELAY_MS = 60_000;
export const LEAD_CTA_ENTRY_PLACEMENT = 'bottom-right';

export type LeadInquiryType =
  | 'project-owner'
  | 'owner-representative'
  | 'developer-business'
  | 'career'
  | 'vendor'
  | 'small-repair';

export type LeadDisqualificationReason = 'career' | 'vendor' | 'small-repair';

export type LeadQualificationInput = {
  inquiryType?: LeadInquiryType | string | null;
  message?: string | null;
  projectType?: string | null;
  name?: string | null;
  email?: string | null;
};

export type LeadDisqualification = {
  reason: LeadDisqualificationReason;
  message: string;
};

const disqualifiedInquiryTypes: Partial<Record<LeadInquiryType, LeadDisqualificationReason>> = {
  career: 'career',
  vendor: 'vendor',
  'small-repair': 'small-repair',
};

const keywordRules: Array<{ reason: LeadDisqualificationReason; patterns: RegExp[] }> = [
  {
    reason: 'career',
    patterns: [
      /\b(job application|looking for (a )?job|work for you|employment|career|resume|curriculum vitae)\b/i,
      /\bcv\b/i,
      /找工作|求职|应聘|简历|招聘|工作机会|上班/i,
    ],
  },
  {
    reason: 'vendor',
    patterns: [
      /\b(lead generation|marketing agency|seo|cold email|web design|website design|sales pitch|vendor pitch|outsourc(?:e|ing)|partnership proposal)\b/i,
      /\b(i am|i'm|we are|we're|our company is|as a)\b.{0,48}\b(vendor|supplier|subcontractor|agency|marketing partner)\b/i,
      /拉活|接活|获客|推广|广告投放|营销|外包|建站|网站建设|供应商|分包|合作推广|销售合作/i,
    ],
  },
  {
    reason: 'small-repair',
    patterns: [
      /\b(handyman|small repair|minor repair|quick fix|patch a wall|fix a leak|replace a faucet|one-room paint)\b/i,
      /散活|小活|小修|小维修|修水龙头|换灯|补墙|刷一间房/i,
    ],
  },
];

const messages: Record<LeadDisqualificationReason, string> = {
  career: 'Career inquiries are not accepted through this project form. This form is reserved for active GTA property projects.',
  vendor: 'Vendor, agency, subcontractor and sales pitches are not accepted through this project form. This form is reserved for property owners, owner representatives and active project decision-makers.',
  'small-repair': 'Small repair or handyman-only requests are outside Vitalite intake. This form is for design-build, permit, renovation, addition, multiplex, garden suite and ICI projects.',
};

const buildSearchText = (input: LeadQualificationInput) =>
  [input.name, input.email, input.projectType, input.message].filter(Boolean).join(' ');

export function getLeadDisqualification(input: LeadQualificationInput): LeadDisqualification | null {
  const inquiryType = input.inquiryType as LeadInquiryType | undefined;
  const inquiryTypeReason = inquiryType ? disqualifiedInquiryTypes[inquiryType] : undefined;

  if (inquiryTypeReason) {
    return {
      reason: inquiryTypeReason,
      message: messages[inquiryTypeReason],
    };
  }

  const searchText = buildSearchText(input);
  const matchedRule = keywordRules.find((rule) => rule.patterns.some((pattern) => pattern.test(searchText)));

  if (!matchedRule) return null;

  return {
    reason: matchedRule.reason,
    message: messages[matchedRule.reason],
  };
}

export function shouldBlockLeadSubmission(input: LeadQualificationInput) {
  return getLeadDisqualification(input) !== null;
}

export function shouldShowLeadCtaEntry(pageKey: string) {
  return pageKey !== 'contact-us';
}
