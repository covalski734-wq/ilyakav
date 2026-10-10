# ilyakav.com

React 18 + Vite + TypeScript, styled-components, i18next (RU / UK / EN), GSAP. The production site combines generated HTML with a Cloudflare Worker for routing and the contact API. Analytics are not connected.

## Local development and checks

Use Node 24 LTS (minimum 22.18 for native TypeScript test imports) and npm (`npm.cmd` on Windows if PowerShell blocks npm.ps1).

```bash
npm ci
npm run dev          # Vite frontend, http://localhost:5173; no contact API
npm run typecheck    # frontend, shared modules and Worker
npm run build        # typecheck, client bundle, SSR bundle, static HTML
npm test             # validation, Worker with mocked Telegram, generated HTML
npm run cf:check     # Wrangler deployment dry-run; does not publish
npm run preview      # local Worker + built assets, default port 8787
```

Restart the local preview after rebuilding: Wrangler may retain an old asset manifest. For browser checks, keep `npm run preview` running in another terminal:

```bash
npx playwright install chromium
npm run test:browser
```

`TEST_BASE_URL` can override `http://127.0.0.1:8787`. Run browser tests against a local test instance. They test an invalid API request and intercept valid form submissions; they never intentionally send a real Telegram message. Evidence goes to `artifacts/verification-2026-10-07/`.

## Static generation and routes

`src/routes.tsx` dynamically imports the requested page. Home demos are in the HomePage chunk and are not loaded by direct contact, privacy, service or case visits. Shared React, i18n resources and animation utilities remain common.

`src/entry-server.tsx` renders each route with React and `ServerStyleSheet`. `scripts/prerender.mjs` combines that markup, its CSS and metadata with Vite's client entry. The temporary server bundle lives in `.ssg/`; only `dist/` is deployed. No browser is needed to generate HTML.

`shared/routes.ts` is the indexable route manifest:

- `/`, `/about`, `/contact`, `/privacy`
- `/case/marianaleus`, `/case/skyline-stretch-ceilings`, `/case/maryna-cleaning`, `/case/tile-expert-solutions`
- `/services/business-websites`, `/services/landing-pages`, `/services/website-redesign`, `/services/web-applications`, `/services/desktop-applications`, `/services/telegram-bots`, `/services/crm-automation`, `/services/booking-and-payments`

To add a page, update the manifest, dynamic loader and metadata mapping, then rebuild and run tests. Each route gets `dist/<route>/index.html`; the root gets `dist/index.html`. `dist/404.html` contains the existing 404 design and noindex metadata.

`worker/index.ts` maps public URLs explicitly to these files. Public URLs have no trailing slash except `/`; trailing slashes and public `index.html` aliases redirect with 308. Query parameters are preserved by redirects and excluded from canonical URLs. Unknown routes return the 404 page with HTTP 404. There is no SPA fallback. Static asset HTML handling is disabled so it cannot add conflicting slash redirects.

The build generates a real `robots.txt` (plain text, public indexing allowed, `/api/` disallowed) and `sitemap.xml` containing exactly the 16 public URLs. No query strings, API or 404 URLs are listed. Each page has its own title, description, canonical, Open Graph and Twitter Card tags. The social preview is a simple brand graphic at `public/brand/social-card.png`.

## Language, theme and hydration

Generated HTML uses RU and the light theme. The first client render uses the same values, including media-query defaults, to preserve hydration and styled-components IDs. After mounting, language resolves from `ilyakav-lang` in localStorage, then a supported browser language, then RU. Theme resolves from `ilyakav-theme`, defaulting to light. The switchers persist preferences and update `html lang`, metadata and theme. A stored preference may cause a brief change after hydration. Separate language URLs are not implemented.

The mobile menu retains its focus loop, Escape handling, focus restoration and inert background. Layout effects use a server-safe wrapper. Reduced-motion preferences disable or simplify animations after mounting.

## Contact API

The frontend posts JSON to `/api/contact`:

```json
{"name":"Name","contact":"person@example.com","type":"landing","brief":"Project details","company":""}
```

`type` is one of `site`, `landing`, `webApp`, `desktop`, `redesign`, `bot`, `automation`, `booking`, `other`. Service links use `/contact?type=TYPE#project-form`; the form restores this selection after hydration.

`shared/contact.ts` is used by both frontend and Worker. Name, contact and brief are trimmed; blank values, unknown types and overlong values are rejected. Contact accepts an email address or a standard Telegram `@username` (5–32 Latin letters, digits or underscores, beginning with a letter). Field limits: name 120, contact 200, brief 3500 characters. The JSON body is capped at 32 KiB, including streamed requests without Content-Length.

Responses are JSON with `Cache-Control: no-store`:

| Condition | Status |
| --- | --- |
| GET or another unsupported API method | 405, Allow: POST |
| Invalid JSON / body shape | 400 |
| Cross-origin browser submission | 403 |
| Body above limit | 413 |
| Non-JSON content type | 415 |
| Field validation error | 422 with `fields` error codes |
| Missing Telegram configuration | 503 |
| Telegram rejection, network error or 10-second timeout | 502 |
| Telegram explicitly confirms `ok: true` | 200, `{"ok":true}` |

The hidden `company` honeypot returns an inert success without contacting Telegram. No parse_mode is used; visitor input is plain text. The frontend has a 15-second timeout, prevents duplicate pending sends, shows field errors, and retains all input after delivery errors. Success appears only when an HTTP success response also contains `ok: true`. Direct Telegram and an email draft remain available on failure.

## Cloudflare Pages deployment

The contact form works on Pages through `functions/api/contact.ts`, which exposes
`/api/contact` and reuses the Telegram handler from `worker/index.ts`. Pages builds
the root `functions/` directory separately from the static `dist/` output.

For the existing Pages project:

1. Set the repository root as the project root, build command `npm run build`, and
   build output directory `dist`.
2. In **Workers & Pages → your Pages project → Settings → Variables and Secrets**,
   add `TELEGRAM_BOT_TOKEN` (the token from @BotFather) as a secret and
   `TELEGRAM_CHAT_ID` (the destination user/group/channel ID). Set them for
   Production, and separately for Preview if preview submissions are needed.
   Never prefix these names with `VITE_` or put their values in source files.
3. Open the bot in Telegram and press Start for a private chat, or add the bot to
   the destination group/channel with permission to send messages.
4. Redeploy the Pages project after saving the secrets. Deploy through the Git
   integration or run `npm run pages:deploy -- --project-name YOUR_PAGES_PROJECT`
   from the repository root. Dashboard drag-and-drop uploads do not build the
   `functions/` directory.

`wrangler.jsonc` remains the configuration for the optional standalone Workers
deployment below. It has no `pages_build_output_dir`, so Pages ignores that file
and uses the Pages project settings; Wrangler may print a warning about this.
Pages serves static HTML using its own URL handling; the standalone Worker's
HTML routing and redirects are not used by Pages.

Local checks: `npm run pages:check` compiles the Pages function without deploying;
`npm run pages:preview` builds and serves the actual Pages app locally. An ignored
`.dev.vars` file can supply the two Telegram variables for manual local testing.
`npm run dev` runs only Vite and does not run the API.

After deployment, `GET /api/contact` should return JSON with status 405 (not HTML),
and a valid form submission should deliver a Telegram message. A 503 means the
Telegram variables are missing; a 502 means Telegram rejected the request or did
not respond. Automated tests mock Telegram and do not send messages.

See [Pages Functions deployment](https://developers.cloudflare.com/pages/functions/get-started/)
and [secrets and bindings](https://developers.cloudflare.com/pages/functions/bindings/).

## Cloudflare Workers deployment (alternative)

The authoritative configuration is `wrangler.jsonc`: `main: worker/index.ts`, `assets.directory: dist`, `assets.binding: ASSETS`, `run_worker_first: true`, `not_found_handling: none`, `html_handling: none`.

Required production secrets (values never belong in source or any `VITE_*` variable):

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

For local manual integration only, use an ignored `.dev.vars` file containing these names. Automated tests inject dummy values and mock Telegram. The bot must have permission to send to the configured chat.

```bash
npm run cf:deploy    # builds and publishes Worker + dist together
```

For Cloudflare Workers Builds: build command `npm run build`, deploy command `npx wrangler deploy`, project root this repository, Worker name `ilyakav`. A static-only Pages deployment will not execute this Worker API. Do not upload only dist or replace this routing with SPA fallback.

Attach `ilyakav.com` to this Worker in **Workers & Pages → ilyakav → Settings → Domains & Routes**. Retain the zone's HTTPS configuration. The Worker also redirects production HTTP and `www.ilyakav.com` to HTTPS on the apex domain. The www redirect requires valid DNS, certificate and Worker/domain routing in Cloudflare; application code alone cannot fix a missing DNS record. No dashboard settings or production secrets are modified by the local build or checks.

`public/_headers` defines CSP and security headers for assets and HTML returned by the asset binding, plus cache policies for fingerprinted JS and media. After deployment, verify the public API GET is JSON 405, invalid JSON-object POST is JSON 422, robots/sitemap have correct content types, an unknown URL is 404 and public page source contains its H1. Confirm actual delivery only with an explicitly agreed test message.

## Content boundaries

Mariana, Skyline and Maryna are the three main portfolio projects. Tile remains available as a secondary case with the existing scope disclaimer. Maryna's combined advertising/site evidence and Skyline's limitations are preserved. Starting prices remain indicative: no fixed page counts, revision counts or delivery guarantees have been invented. Telegram bots, CRM and booking receive individual estimates. Analytics, new photographs, testimonials and unverified results are not added.
