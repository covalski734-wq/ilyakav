# Marketing readiness audit — 6 November 2026

## Current scope — website compatibility only

The owner clarified that the marketer owns tags, triggers and automatic event settings. The proposed replacement JSON and its import recommendation are withdrawn. Do not import `GTM-TKPFHC7B_workspace7_fixed.json` as part of these website fixes. No live GTM edits or publication were performed. The file and transformer are historical local artifacts, not dependencies of the application or deployment.

The website no longer injects `autoConfig=false`; it forwards the marketer's Meta settings unchanged while retaining early library loading, consent handling and application events. The earlier automatic metadata observation below is information for the marketer, not a site-side override.

The new site deployment was confirmed at 12:05 UTC: nonce CSP, consent bootstrap and no-transform are live. A subsequent screenshot exposed a missing `https://ad.doubleclick.net` image source for Google's fallback transport. The local fix adds that exact origin to img-src (connect-src already permits it). Synthetic browser checks reproduced the failure under the live policy and success with this addition; Meta script loading is already allowed by the live CSP. `ERR_BLOCKED_BY_CLIENT` and the chrome-extension eval policy are separate browser-side restrictions. Site compatibility checks do not assert that the marketer's conversion mapping is approved or that private advertising accounts received events.

## Historical broader audit and withdrawn proposal

This is an audit of the local application with the published GTM container `GTM-TKPFHC7B`, GA4 destination `G-ZWJKT1GYSL`, and Meta Pixel `1076328401949671`. It is not a declaration that production or the private advertising accounts have passed acceptance.

Final local results: 30 unit tests passed; all 16 consent UI scenarios passed on both Worker and actual Pages middleware; actual-library consent/click checks passed in normal, delayed, and blocked modes. Separate compiled GTM-disabled and Meta-disabled builds passed. The unchanged published GTM passed only 22 of 30 marketing checks: it counted five form conversions for one confirmed success and missed email events. A test-only simulation of the proposed GTM repair passed all 30 checks. That simulation is not a published container or a validated server import.

## Confirmed findings

| Area | Evidence and required behavior |
| --- | --- |
| Production deployment | The public site still returned the old per-tag hash CSP when audited. Deploy the Functions/Worker together with assets; uploading only `dist` omits the HTML nonce middleware. |
| GTM Custom HTML | Per-tag hashes blocked new inline event tags. Local HTML middleware now supplies a fresh nonce and `strict-dynamic`, including nonce attributes on server-authored scripts. |
| Meta consent | Google consent does not control Meta. A queued `revoke` could prevent a later queued `grant` from executing. The site bridge now applies the latest choice directly when the Meta library is ready. |
| Confirmed form conversions | The published container fires GA `contact_form_submit`, Meta `Lead`, and the form branch of `AllLeads` on `gtm.formSubmit`. Actual browser tests observed conversions on invalid forms, HTTP failures, and `200 {ok:false}`. Retarget those existing tags to the site's `generate_lead`, `action=contact_form`, emitted only after confirmed API success. Do not add a second parallel Lead tag. |
| Spam trap | The API's neutral `ok:true` for a filled honeypot is not a delivered enquiry. The client now excludes that path from `generate_lead`. |
| Email | The published GA email tag fires once per document, losing repeat clicks; Meta has no explicit email event. Use the site's sanitized `cta_click`, `action=email`, once per event. Do not pass the full mailto URL or form draft. |
| Meta inferred events | The published Pixel's automatic event detection generated `SubscribedButtonClick` containing the private draft from the fallback mailto link. Disable automatic configuration before Pixel initialization; retain explicit PageView/contact/confirmed-lead tags. |
| Google tag ID | The published container includes a Google tag whose ID resolves to `1`. That is not a valid Google destination. Pause that tag; a real advertising destination must come from the owner's account. The valid GA4 destination is separate. |
| Page views | The extra request initially suspected to be a duplicate GA pageview was a separate Google Ads/consent ping without the GA4 destination ID. Count actual GA destination requests, not every request named `page_view`. |
| Browser filtering | `ERR_BLOCKED_BY_CLIENT` is browser/extension filtering. Website CSP cannot override it. Tests simulate this and require the site and Google events to remain functional. |

The form and email defects belong to the published GTM configuration. A successful application build does not repair private container settings. Unpublished workspace edits, the campaign's selected conversion, domain restrictions, and Events Manager receipt are not observable from the public container download.

## Repeatable checks

Run against a local preview. Never aim the form tests at production.

```sh
npm run build
npm test
npm run pages:check
npm run cf:check
npm run preview
# In another terminal, while the preview is running:
npm run test:consent
npm run test:analytics
npm run audit:marketing
npm run test:analytics-config
```

- `test:consent` mocks all external libraries and form delivery. It exercises the interface, category combinations, persistence, reload, withdrawal, multiple tabs, localized mobile/desktop views, and storage errors.
- `test:analytics` uses actual published GTM/Meta libraries with collection requests intercepted. It checks normal, delayed, and blocked-library behavior, restoration, withdrawal, and contact clicks.
- `audit:marketing` additionally tests repeat contacts and unsuccessful/successful forms. It intentionally exits unsuccessfully when the published tag configuration produces false conversions or misses required events. Keep these assertions; do not redefine success to match a broken container.
- `test:analytics-config` builds isolated variants in `artifacts/config-check`, leaving the deployable `dist` unchanged. It verifies disabled GTM and disabled Meta with the actual compiled configuration and, for the Meta-disabled case, the actual published Google container.
- `TEST_BASE_URL` selects a local preview. `TEST_DOCUMENT_PATH=/contact/index.html` supports the analytics check against Pages CLI configurations that expose explicit HTML paths.
- Browser artifacts go into ignored `artifacts/` directories. Requests to collectors are intercepted; passing tests proves client-side dispatch, not receipt or attribution inside advertising accounts.

For diagnosis only, `GTM_REPAIR_FIXTURE=true` models the earlier proposed trigger changes in an isolated browser. It is marked `simulated-repair-not-published` and refuses an unexpected container version. Those tag-level expectations belong to the historical audit, not the website compatibility acceptance.

## Withdrawn GTM repair proposal — historical record only

The helper requires an actual format-2 export of this container. It refuses a different container, changed tag ownership, ambiguous rules, or an existing output filename. It retains unrelated configuration and generates a separate file; it never publishes anything. The supplied `GTM-TKPFHC7B_workspace7.json` export (6 November 2026, 11:55:27 UTC) was successfully processed into `GTM-TKPFHC7B_workspace7_fixed.json` at the repository root. Six existing tags changed, one Meta email tag was added, along with two triggers and one variable; nothing was deleted. Original source content was preserved. Reference integrity, unique IDs/names, and repeat-operation stability passed; the change report is `artifacts/marketing-audit/workspace7-repair.json`.

```sh
npm run repair:gtm -- ACTUAL-EXPORT.json NEW-REPAIRED-EXPORT.json
```

This proposal was not imported or published and is no longer a recommended action for the website task. The source export was preserved. Tag-level observations and any future changes are for the marketer to decide.

## Historical marketing acceptance outline — for the marketer

1. Deploy the corrected site with its HTML middleware and confirm the public response has matching nonce CSP/script attributes, `no-store, no-transform`, and no injected email decoder.
2. Review the site's available events and select the intended conversion mapping in GTM. The existing export proposal is not required; the marketer owns these choices and tests them in Preview.
3. Check the actual Meta data source and campaign conversion selection. Verify receipt in Events Manager with the intended Pixel, first after accepting Marketing consent and then after withdrawal. Google measurement and Meta measurement have different consent behavior.
4. Test once in a normal unblocked browser and once with blocking enabled. Browser-only Pixel tracking cannot guarantee delivery from browsers that deliberately block Meta. Do not implement a consent bypass to change that.

Private GTM/Meta editor access was unavailable during this audit; the actual workspace export was supplied and repaired locally. A fresh public check at 11:57 UTC still returned the old site bootstrap/CSP and published GTM version 6. No deployment, container publication, ad launch, real conversion, or real enquiry was performed.
