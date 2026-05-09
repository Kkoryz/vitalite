# Threat Model: kiewit-clone

This is the per-scan copy of `docs/security-scans/kiewit-clone/threat_model.md` for scan `78b876f_20260509-215226`.

## Application

Vitalite is a Vite/React single-page marketing site for a GTA design-build contractor. It includes route-based SEO metadata, project/service content, bilingual UI controls, search overlay, interactive calculators, and a contact form that posts to Formspree.

## Assets

- Visitor contact intent and project inquiry data.
- Brand and SEO content integrity.
- GA4 measurement configuration and conversion quality.
- Build-time environment variables.
- Static assets and generated production bundle.

## Trust Boundaries

- Browser visitor input enters the search overlay and contact form.
- Contact form data leaves the site and is posted to Formspree.
- GA4 receives selected event parameters when a measurement id is configured.
- Build-time environment variables enter the Vite build process.
- Public assets and static JSON are bundled into the client application.

## High-Impact Security Questions

1. Can build-time secrets be embedded in client JavaScript?
2. Can visitor input reach an HTML, script, route, filesystem, or network sink unsafely?
3. Can the contact form be abused to send low-quality or automated submissions?
4. Can analytics collect PII or leak user-entered message/search content?
5. Do dependencies introduce known vulnerable packages in the runtime surface?
