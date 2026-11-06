# Consent and analytics integration

## Runtime behavior

GTM-TKPFHC7B loads asynchronously from the beginning of the HTML head, before React. Vite replaces the gtm-head marker with an external consent initializer and GTM script. VITE_GTM_ID overrides the container; an explicitly empty value disables it. VITE_META_ENABLED=false disables the site-owned Meta library and keeps the standard GTM Pixel bootstrap on a revoked stub; Google can remain enabled. Remove unused Meta tags from a reused site's container as well: arbitrary custom tags that bypass the standard fbq bootstrap are outside this adapter's control.

The CSP-compatible /gtm-init.js queues denied defaults for analytics_storage, ad_storage, ad_user_data and ad_personalization before gtm.js. The early bootstrap restores a valid saved choice before GTM starts, and the application keeps it synchronized before subsequent events. No choice, rejection, invalid or expired storage means denied, never granted.

All existing application events reach dataLayer regardless of consent: page_view, cta_click and generate_lead. Each carries consent_analytics and consent_marketing. CTA actions are contact, telegram, whatsapp and email. generate_lead uses contact_form and fires only after the API confirms success. Page views are deduplicated; changing consent neither reloads the page nor replays events.

Application-authored events contain only allowlisted actions, sanitized page paths and consent flags. Form values, raw mailto URLs, phone numbers and message bodies are excluded from those events. Independently configured vendor tags can still inspect page URLs and elements: the application dataLayer contract alone is not proof of vendor behavior. Withdrawal updates Google's consent signals and clears recognized accessible optional first-party cookies. Expired consent is checked by a bounded timer, before events, and when the tab resumes. Consent version 2 reflects the move from blocked events to measurement without cookies; prior choices are renewed.

Before restoring a saved grant, both the head bootstrap and runtime test write/remove access with the temporary necessary-storage key ilyakav-consent-storage-probe. Read-only storage cannot silently restore an unchangeable grant. Failed saves apply the current choice in memory and attempt to remove stale storage; they do not navigate or drop campaign parameters. The UI reports that the choice was not saved. Persistence cannot be guaranteed if the browser forbids storage: an undeletable older choice can remain when storage later becomes writable. Cross-tab updates and clearing stored choices update active tags and the UI.

## Required GTM container configuration

The repository does not publish the private GTM container. The public container audit found incorrect form and email triggers; see [marketing readiness](marketing-readiness.md) for the observed defects and reviewed-export repair tool. The following is the target integration contract, not a claim that the published container already matches it:

1. Use Google tags with built-in consent checks. Remove the previous consent_analytics=true trigger filter and additional analytics_storage requirement on those Google measurement tags if they should send cookieless measurements while denied. Do not force consent to granted. Third-party tags without built-in consent support still require explicit appropriate consent checks.
2. Initialize the Google tag once on page_view, with send_page_view=false. Use sequencing before GA4 event tags if needed. Forward page_view, cta_click and generate_lead via Custom Event triggers. Avoid duplicate automatic page views, outbound clicks or form events.
3. For email, filter cta_click by the Data Layer variable action=email; for WhatsApp use action=whatsapp. Pass action as an event parameter. Do not send Click URL: mailto links can contain draft form data.
4. Use sanitized page_location, page_path and empty page_referrer from the event. Do not enable user-provided data collection or enhanced conversions from form fields.
5. In Preview, verify events both before a choice and after reject/accept/withdrawal, and verify consent signals separately. Inspect GA4/network requests to confirm Google tags respect denied storage. Seeing a dataLayer event alone does not prove delivery to GA4.

Without consent, supported Google tags can send limited cookieless pings; this does not provide the same user/session attribution as consented measurement. See [Google Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode).

## Verification

Tests cover early head load order, denied defaults, page deduplication, CTA and successful-lead events across consent choices, and no replay on updates. The live GTM tag configuration and vendor behavior must be checked separately in Tag Assistant.

## Meta Pixel and CSP

The early external bootstrap owns the Meta library, compatible fbq queue, consent, and automatic-event policy. It queues revoke before any GTM initialization, then grants only when saved Marketing consent is valid. The library may download before a choice, but Pixel measurement/storage are controlled through the Meta consent API. Before each init call the adapter disables autoConfig for the ID supplied by GTM, preventing inferred events from scraping email drafts. GTM remains the single owner of pixel IDs, initialization and explicit tracking event tags. There is no second site-side PageView or conversion tag. This ordering also follows the [Meta-owned GTM template](https://github.com/facebook/GoogleTagManager-WebTemplate-For-FacebookPixel/blob/main/template.tpl).

Runtime acceptance, rejection, expiry and withdrawal update the Meta bridge before consent_updated. While the library is loading, the bridge stores only the latest choice; its load callback applies that choice directly. This avoids trapping a queued grant behind Meta's revoked queue lock. Once loaded, grant/revoke is applied immediately. Meta may release its vendor-held event queue after a later grant; the application's no-replay guarantee is about application events, not Meta's queue. Google application events still enter dataLayer in every state. Meta does not automatically inherit Google consent signals. If an optional GTM tag also has additional consent requirements, those requirements remain effective.

Cloudflare Pages middleware and the Worker apply a fresh nonce to every HTML response and all server-authored script elements. CSP uses that nonce plus strict-dynamic, allowing trusted GTM scripts to create Custom HTML event scripts without maintaining per-tag hashes. Nonce alone was insufficient for the current Custom HTML tags; nonce plus strict-dynamic was verified with the actual published container. No unsafe-inline or unsafe-eval is enabled for scripts. Inline event handlers stay disabled. Non-script source restrictions remain in place.

HTML responses use no-store, no-transform so transformed documents/nonces are not reused by shared caches or modified by Cloudflare email obfuscation. Fingerprinted assets retain their existing cache headers. Deploy the Pages Functions or Worker together with the static build: static-only hosting does not execute the nonce middleware. Do not add another CSP header at the hosting layer, since multiple policies are enforced together. Required Google Ads and Meta image, connection, iframe, and POST transport endpoints are included; changing providers still requires reviewing their actual endpoints. References: [Google CSP](https://developers.google.com/tag-platform/security/guides/csp), [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/), [Cloudflare email obfuscation](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/).

### End-to-end check

Run a local Worker with npm run preview, then node scripts/analytics-check.mjs (PLAYWRIGHT_CHANNEL=chrome if needed). TEST_BASE_URL selects another local preview. For Pages CLI configurations that expose only explicit HTML assets, TEST_DOCUMENT_PATH=/contact/index.html tests the actual Pages middleware while preserving the browser-visible /contact/ URL.

The check exercises the published GTM and actual Meta library against the local build under an isolated browser origin. All measurement endpoints are intercepted, so no test conversions reach Google/Meta. It covers denied/granted consent, reload/restoration, withdrawal, Google/Meta contact events, no CSP violations, and delayed/blocked Meta libraries. A standard Chrome User-Agent is used because Meta intentionally filters HeadlessChrome as bot traffic. Passing this check proves client-side dispatch; receiving events inside the private analytics accounts is a separate final published-site check. Run npm run audit:marketing as well: that stricter check catches incorrect vendor form triggers, missing email events, and unintended form-data collection.

ERR_BLOCKED_BY_CLIENT for fbevents.js indicates browser/extension filtering, which site CSP cannot override. A CSP error naming chrome-extension:// belongs to the extension, not this website. Test with extensions/tracking protection disabled for the site in a clean browser profile; no need to weaken the site's eval policy.

## Reusing the system

Keep public/gtm-init.js (early vendor adapter), src/lib/consent.ts (state and event API), and shared/htmlSecurity.ts plus the hosting middleware together. Keep the parity tests: the tiny classic head script and TypeScript runtime both validate saved choices. src/components/CookieConsent.tsx, its styles, and consentText.ts are the replaceable interface; a different design must continue calling the same saveConsent/getConsent/subscribeConsent/openCookieSettings API. src/main.tsx initializes the adapter independently of rendering the banner.

For a new project, set its VITE_GTM_ID, provider switches, storage namespace, public-route allowlist, and user-facing provider information. Pixel/destination IDs and the canonical event mapping live in that project's GTM container. Replace those settings before deployment so the new site does not send events to this site's accounts. Bump the consent version in both validators when the processing purposes/providers change. Styling alone does not require a version change.

Retain the build/unit/UI/vendor checks and run them after a container change, not just a code change. The core is reusable with a replaceable UI; it is not a universal auto-configurator for arbitrary GTM containers or a guarantee that browser blockers will deliver advertising events.
