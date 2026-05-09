# Vitalite Tracking Plan

## Overview

- Site: Vitalite Construction Corp. marketing site and project intake funnel
- Tooling: GA4 through `gtag.js`, loaded only when `VITE_GA_MEASUREMENT_ID` is configured
- Last updated: 2026-05-09
- Implementation entry point: `src/analytics.ts`

The tracking scope is intentionally narrow: capture funnel, contact, search, and calculator behavior without sending names, emails, phone numbers, free-text messages, or raw search queries to analytics.

## Business Questions

1. Which pages and service areas produce qualified project inquiries?
2. Which calls to action drive contact form starts, phone clicks, email clicks, or project form visits?
3. Which calculator inputs correlate with quote requests?
4. Which site search paths reveal missing or hard-to-find content?
5. Which inquiry types are blocked as non-fit leads so the intake funnel stays clean?

## Events

| Event name | Category | Properties | Trigger | Notes |
| --- | --- | --- | --- | --- |
| `page_view` | Pageview | `page_title`, `page_location`, `page_path` | Route SEO application | Manual pageview because GA4 auto pageview is disabled in `index.html`. |
| `cta_clicked` | User action | `cta_id`, `location`, `destination`, `page_key` | Links with `data-analytics-id` | Used for mobile project form and future explicit CTAs. |
| `contact_method_clicked` | User action | `method`, `location`, `page_key`, `social_network` | `tel:`, `mailto:`, Facebook, Instagram, LinkedIn links | Does not include phone number or email address as event properties. |
| `lead_form_attempted` | Funnel | `source`, `variant`, `inquiry_type` | Contact form submit attempt | Fired before local qualification checks. |
| `lead_form_blocked` | Funnel/data quality | `source`, `variant`, `inquiry_type`, `block_reason` | Honeypot or lead qualification reject | Tracks why non-fit or automated submissions are blocked. |
| `lead_form_submitted` | Conversion | `source`, `variant`, `inquiry_type` | Formspree success response | Recommended GA4 conversion. |
| `lead_form_error` | Reliability | `source`, `variant`, `inquiry_type` | Formspree error or network failure | Use for monitoring form delivery issues. |
| `site_search_opened` | Site search | `page_key` | Search overlay opens | Measures search demand by page. |
| `site_search_quick_selected` | Site search | `page_key`, `search_type`, `quick_search` | Quick search pill click | Quick search values are controlled labels only. |
| `site_search_result_clicked` | Site search | `page_key`, `search_type`, `query_length`, `results_count`, `result_key` | Search result click | Uses query length instead of raw user query. |
| `tool_input_changed` | Tool usage | `tool_id`, `control`, `value` | Calculator option and slider changes | Values are bounded option ids or numeric ranges. |
| `tool_cta_clicked` | Tool conversion | `tool_id`, `destination` | Calculator quote CTA click | Connects tool usage to quote intent. |
| `language_changed` | UX preference | `page_key`, `previous_language`, `language` | Language toggle | Helps evaluate bilingual content demand. |

## Custom Dimensions

| Name | Scope | Event parameter |
| --- | --- | --- |
| Page key | Event | `page_key` |
| CTA id | Event | `cta_id` |
| CTA location | Event | `location` |
| Contact method | Event | `method` |
| Inquiry type | Event | `inquiry_type` |
| Lead block reason | Event | `block_reason` |
| Tool id | Event | `tool_id` |
| Tool control | Event | `control` |
| Search type | Event | `search_type` |
| Search result key | Event | `result_key` |
| Language | Event | `language` |

## Conversions

| Conversion | Event | Counting | Why it matters |
| --- | --- | --- | --- |
| Qualified lead submitted | `lead_form_submitted` | Once per event | Primary website conversion. |
| Phone contact intent | `contact_method_clicked` where `method=phone` | Once per event | High-intent mobile and emergency-adjacent contact path. |
| Tool quote intent | `tool_cta_clicked` | Once per event | Measures calculators as lead-assist assets. |

## Privacy And Data Quality Rules

- Do not send visitor names, emails, phone numbers, message bodies, addresses, or raw search queries to GA4.
- Use stable ids and categorical properties instead of visible personal text.
- Keep `send_page_view: false` in the GA4 config so SPA pageviews are controlled by `applySeo`.
- Review GA4 DebugView before marking conversions live.
- If the site serves EU, UK, or Quebec traffic with tracking cookies, add consent mode before enabling analytics in production.

## Validation Checklist

- `VITE_GA_MEASUREMENT_ID` matches the `G-XXXXXXXXXX` format and loads the GA script.
- Route changes fire one `page_view` with the canonical path.
- Contact form attempts, blocks, successes, and errors fire exactly once per submit.
- Honeypot submissions fire `lead_form_blocked` with `block_reason=honeypot`.
- Calculator option clicks and slider release/blur events fire `tool_input_changed`.
- No PII appears in GA4 DebugView event parameters.
