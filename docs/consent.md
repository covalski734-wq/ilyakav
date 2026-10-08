# Consent and analytics integration

## Current state

The repository had no GTM container, GA4 ID, analytics SDK or analytics event handlers. The new adapter remains disabled until `VITE_GTM_ID` is set at build time. No Google Ads or Meta Pixel has been added. Existing contact delivery is unchanged. Do not add a second GTM snippet, GA4 loader or noscript tracking iframe.

The frontend queues Google's supported on-page consent commands before loading GTM. All four v2 signals default to denied. Necessary state is local only. The site has no necessary GTM tags, so its optional container loads after an Analytics or Marketing grant. If necessary container functions are introduced later, audit them and separate their initialization from optional tag triggers; do not simply make analytics fire on All Pages.

References: [Google's Basic implementation, including GTM](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic), [consent debugging](https://developers.google.com/tag-platform/security/guides/consent-debugging). Commands are issued in site code, not GTM Custom HTML. This implementation does not use GTM Consent APIs or a custom template. Do not add a second consent default tag. If migrating to a template later, use `setDefaultConsentState` on Consent Initialization and `updateConsentState` through the supported template API.

## Manual GTM/GA4 configuration — required before enabling the ID

1. Audit the existing account/container, if one exists outside this repository. Export a backup. Confirm the actual GA4 stream. Set only that container's ID in `.env.local`/build environment; no direct GA4 ID is needed here.
2. Enable Consent Overview. **Built-in consent checks alone are insufficient for Basic mode**: they can permit cookieless pings. Every analytics tag must also require `analytics_storage`; every advertising tag must require `ad_storage`, `ad_user_data` and `ad_personalization`. Meta does not automatically obey Google's signals: require Marketing consent in its trigger and consent checks before adding it.
3. Create Data Layer variables `consent_analytics`, `consent_marketing`, `page_path`, `page_location`, `page_referrer` and `action`. `consent_updated` runs after the on-page consent update and carries category booleans. Never use this event itself as a conversion.
4. Initialize the single Google tag only on `page_view` with `consent_analytics` equal to true (and the additional consent requirement). Set it once per page; use tag sequencing to initialize it before the GA4 event tag if necessary. Set `send_page_view=false`. Disable enhanced measurement's page/history changes, outbound clicks and form interactions to avoid duplicate/automatic events. Disable user-provided data collection, enhanced conversions and Google Signals unless explicitly reviewed and documented.
5. One GA4 event tag accepts the exact custom events `page_view`, `cta_click`, `generate_lead`, with Analytics consent required. Do not also attach generic click/form/All Pages tags for these events. `action` is an enum: contact, telegram, email, contact_form. A lead event fires only after `/api/contact` confirms `ok:true`, not on a failed submit. Set a conversion/key event only on the existing agreed business event, not both click and successful lead for the same goal.
6. Set Google tag/event parameters `page_location` to a sanitized origin + allowlisted path, `page_referrer` to an empty string, and `page_title` to an approved static title or omit it. The application deliberately excludes URL query/hash, raw link text, names, email, phone and form contents. Do not enable URL passthrough or read form DOM fields in GTM. Audit vendor automatic collection as well as dataLayer.
7. On a later Marketing grant, advertising tags must trigger on `consent_updated` (Marketing true) as well as their consent-gated conversion event where applicable. If a container was already loaded with only Marketing, analytics still initializes on the first subsequent consented `page_view`. The adapter never replays denied interactions.
8. Before Google Ads or Meta is introduced, inventory providers/cookies/retention, update policy and `CONSENT_VERSION`, add vendor-specific cleanup/stop behavior and precise CSP endpoints. There is intentionally no Ads/Meta network allowlist or pixel today. The current CSP permits only the Google loader and GA4 collection endpoints; don't broaden it with wildcards or unsafe-inline. Preview's additional origins may require a separate staging-only CSP.

## Storage and withdrawal

`ilyakav-consent` contains `{version, chosenAt, analytics, marketing}`. The application validity period is explicitly 180 days, not a claimed legal requirement or a vendor cookie lifetime. localStorage itself does not expire; invalid/expired/malformed/future-dated choices are rejected. Change `CONSENT_VERSION` when purposes/providers materially change. Language/theme keys retain their existing behavior.

Preferences synchronize across tabs. Withdrawal updates consent immediately, blocks the event gateway and removes accessible first-party `_ga*`, `_gid`, `_gat*`, `_gcl_*`, `_fbp`, `_fbc` cookies on the current/root path and parent-domain variants. These are **cleanup patterns for possible future/previous tags, not an assertion that these cookies currently exist**. Third-party-domain, HttpOnly and unrelated-path cookies cannot all be deleted by this script. Browser site-data controls and provider deletion requests remain relevant. Loaded tags are stopped by a document reload after a downgrade. No reload is needed while no container is loaded. If storage fails, the user sees an explanation; for already-loaded tags a fail-closed reset URL prevents restoring a stale grant.

The adapter is framework independent, browser-initialized and SSR-safe; React only renders controls. A future Next.js client boundary can initialize it once and call `trackPage` on pathname changes. Never initialize it in shared server request state.

## Published-site acceptance checks

- New profile: all four signals denied; no GTM/GA4/Ads/Meta requests or optional cookies before a choice. Font/hosting requests are separate and documented.
- Accept, reject, Analytics only, Marketing only; reload and navigate real routes. Confirm additional consent checks prevent cookieless requests for denied categories even if GTM is loaded for the other category.
- In GTM Preview/Tag Assistant confirm default precedes update and tag initialization, all four signals match controls, initialization occurs once, and consent update enables only intended tags. Inspect tags that did NOT fire too.
- GA4 DebugView: one page_view per navigation, one CTA per click and one lead only per confirmed delivery. No query/hash/form values, automatic duplicate events or PII in requests.
- Withdraw in the same and another tab. Verify cookie cleanup, reload, no subsequent denied requests and no new optional cookies. Test returning after version bump and expiry.
- Desktop/mobile keyboard, Escape, focus return, settings link, rejected third-party scripts, blocked localStorage; inspect CSP console errors. Check real iOS Safari and Android Chrome.

Local tests can mock the GTM network endpoint to verify load ordering and event gating. They cannot certify the contents of a private GTM container or replace published Tag Assistant/GA4 checks.

## Legal confirmation required

Confirm controller legal name/address, vendor inventory (including any Cloudflare edge injection outside source control), cookie lifetimes from actual configuration, GA4 retention, purposes, recipients, transfers and legal bases. Review whether selected language/theme storage qualifies for the intended necessary exemption. Confirm the 180-day consent renewal policy. Review Google Fonts and the voluntarily loaded external Mariana demo separately. No GDPR compliance guarantee is made.
