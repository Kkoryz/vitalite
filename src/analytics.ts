type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;
type GtagFunction = (command: 'event', eventName: string, params?: Record<string, string | number | boolean>) => void;

const getGtag = () => (window as Window & { gtag?: GtagFunction }).gtag;

const cleanParams = (params: AnalyticsParams) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Record<string, string | number | boolean>;

export const trackEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (typeof window === 'undefined') return;
  const gtag = getGtag();
  if (typeof gtag !== 'function') return;

  gtag('event', eventName, cleanParams(params));
};

export const trackPageView = (pageTitle: string, canonical: string) => {
  const pageUrl = new URL(canonical);
  trackEvent('page_view', {
    page_title: pageTitle,
    page_location: canonical,
    page_path: pageUrl.pathname,
  });
};

export const trackCtaClick = (params: {
  cta_id: string;
  location: string;
  destination?: string;
  page_key?: string;
}) => {
  trackEvent('cta_clicked', params);
};

export const trackContactMethodClick = (params: {
  method: 'phone' | 'email' | 'social';
  location: string;
  page_key?: string;
  social_network?: string;
}) => {
  trackEvent('contact_method_clicked', params);
};

export const trackLeadFormEvent = (
  eventName: 'lead_form_attempted' | 'lead_form_blocked' | 'lead_form_submitted' | 'lead_form_error',
  params: {
    source: string;
    variant: 'full' | 'compact';
    inquiry_type?: string;
    block_reason?: string;
  },
) => {
  trackEvent(eventName, params);
};

export const trackSiteSearchEvent = (
  eventName: 'site_search_opened' | 'site_search_quick_selected' | 'site_search_result_clicked',
  params: {
    page_key?: string;
    search_type?: 'manual' | 'quick' | 'default';
    query_length?: number;
    results_count?: number;
    result_key?: string;
    quick_search?: string;
  },
) => {
  trackEvent(eventName, params);
};

export const trackToolEvent = (
  eventName: 'tool_input_changed' | 'tool_cta_clicked',
  params: {
    tool_id: string;
    control?: string;
    value?: string | number | boolean;
    destination?: string;
  },
) => {
  trackEvent(eventName, params);
};
