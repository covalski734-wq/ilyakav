# Consent and analytics integration

## Runtime behavior

GTM-TKPFHC7B loads asynchronously from the beginning of the HTML head, before React. Vite replaces the gtm-head marker with an external consent initializer and GTM script. VITE_GTM_ID overrides the container; an explicitly empty value disables it.

The CSP-compatible /gtm-init.js queues denied defaults for analytics_storage, ad_storage, ad_user_data and ad_personalization before gtm.js. The application restores a valid saved choice and sends consent updates before application events. No choice, rejection, invalid or expired storage means denied, never granted.

All existing application events reach dataLayer regardless of consent: page_view, cta_click and generate_lead. Each carries consent_analytics and consent_marketing. CTA actions are contact, telegram, whatsapp and email. generate_lead uses contact_form and fires only after the API confirms success. Page views are deduplicated; changing consent neither reloads the page nor replays events.

Events contain only allowlisted actions, sanitized page paths and consent flags. Form values, raw mailto URLs, phone numbers and message bodies are excluded. Withdrawal updates Google's consent signals and clears recognized accessible optional first-party cookies. Expired consent is checked before events and when the tab resumes. Consent version 2 reflects the move from blocked events to measurement without cookies; prior choices are renewed.

## Required GTM container configuration

The repository does not configure or publish the private GTM container. To use advanced Consent Mode:

1. Use Google tags with built-in consent checks. Remove the previous consent_analytics=true trigger filter and additional analytics_storage requirement on those Google measurement tags if they should send cookieless measurements while denied. Do not force consent to granted. Third-party tags without built-in consent support still require explicit appropriate consent checks.
2. Initialize the Google tag once on page_view, with send_page_view=false. Use sequencing before GA4 event tags if needed. Forward page_view, cta_click and generate_lead via Custom Event triggers. Avoid duplicate automatic page views, outbound clicks or form events.
3. For email, filter cta_click by the Data Layer variable action=email; for WhatsApp use action=whatsapp. Pass action as an event parameter. Do not send Click URL: mailto links can contain draft form data.
4. Use sanitized page_location, page_path and empty page_referrer from the event. Do not enable user-provided data collection or enhanced conversions from form fields.
5. In Preview, verify events both before a choice and after reject/accept/withdrawal, and verify consent signals separately. Inspect GA4/network requests to confirm Google tags respect denied storage. Seeing a dataLayer event alone does not prove delivery to GA4.

Without consent, supported Google tags can send limited cookieless pings; this does not provide the same user/session attribution as consented measurement. See [Google Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode).

## Verification

Tests cover early head load order, denied defaults, page deduplication, CTA and successful-lead events across consent choices, and no replay on updates. The live GTM tag configuration and vendor behavior must be checked separately in Tag Assistant.
