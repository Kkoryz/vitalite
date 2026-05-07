import assert from 'node:assert/strict';
import {
  LEAD_CTA_ENTRY_PLACEMENT,
  LEAD_CTA_POPUP_DELAY_MS,
  getLeadDisqualification,
  shouldShowLeadCtaEntry,
  shouldBlockLeadSubmission,
  type LeadInquiryType,
} from './leadQualification';

const blockedInquiryTypes: LeadInquiryType[] = ['career', 'vendor', 'small-repair'];

assert.equal(LEAD_CTA_POPUP_DELAY_MS, 60_000);
assert.equal(LEAD_CTA_ENTRY_PLACEMENT, 'bottom-right');
assert.equal(shouldShowLeadCtaEntry('home'), true);
assert.equal(shouldShowLeadCtaEntry('service-custom-homes'), true);
assert.equal(shouldShowLeadCtaEntry('contact-us'), false);

for (const inquiryType of blockedInquiryTypes) {
  assert.equal(
    shouldBlockLeadSubmission({
      inquiryType,
      message: 'I am not asking about an active design-build project.',
    }),
    true,
    `${inquiryType} inquiries should be blocked before submitting to Formspree`,
  );
}

assert.match(
  getLeadDisqualification({
    inquiryType: 'project-owner',
    message: '我想找工作，简历可以发给你们吗？',
  })?.message ?? '',
  /career/i,
);

assert.match(
  getLeadDisqualification({
    inquiryType: 'project-owner',
    message: '我们是SEO获客团队，可以帮你们拉活。',
  })?.message ?? '',
  /vendor/i,
);

assert.equal(
  shouldBlockLeadSubmission({
    inquiryType: 'project-owner',
    message: 'We own a Markham property and need permit drawings for a rear addition.',
  }),
  false,
);

assert.equal(
  shouldBlockLeadSubmission({
    inquiryType: 'project-owner',
    message: 'We already have a tile supplier and need help coordinating lead times for a renovation.',
  }),
  false,
);

console.log('lead qualification tests passed');
