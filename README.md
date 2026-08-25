# ilyakav.com

Home page implemented from the Claude Design artboard `Home.dc.html`.

**Stack:** Vite · React 18 · TypeScript · styled-components · i18next (RU / UA / EN, one JSON per language) · GSAP ScrollTrigger.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle into dist/
npm run preview    # serve the built bundle
npm run typecheck
npm run cf:preview # build and preview through Cloudflare Workers locally
npm run cf:deploy  # build and deploy to Cloudflare Workers
```

## Structure

```
src/
  App.tsx                  lightweight pathname routing and page composition
  main.tsx                 entry: i18n, theme provider, global style
  config/site.ts           contacts, routes, section ids, feature flags, hero video
  i18n/
    index.ts               i18next setup (localStorage + navigator detection)
    resources.d.ts         types translation keys from ru.json
    locales/{ru,uk,en}.json
  theme/
    tokens.ts              light/dark token sets (colors, shadows, radii, fonts, layout)
    ThemeContext.tsx       mode state, localStorage, styled-components provider
    GlobalStyle.ts         reset, keyframes, shared media mixin
  components/              header, mobile menu, language switcher, theme toggle, bottom bar
  components/ui/           styled primitives shared across sections
  pages/                   about, privacy, contact, Mariana Leus case study and 404
  sections/                one file per page section
  hooks/                   media query / reduced motion, body scroll lock
  lib/gsap.ts              single ScrollTrigger registration
```

## i18n

Three languages live in `src/i18n/locales/`. `ru.json` is the reference shape — `resources.d.ts`
types every `t()` call against it, so a missing or misspelled key fails the type check.

Language resolution: `localStorage` (`ilyakav-lang`) → browser language → `ru`. The switcher in the
header and footer writes the choice back to storage and updates `<html lang>`.

To add a language: drop a JSON file next to the others, register it in `resources` and `LANGUAGES`
in `src/i18n/index.ts`, and add its label to `LANGUAGE_LABELS`.

## Theme

Light and dark token sets in `src/theme/tokens.ts` feed the styled-components `ThemeProvider`.
The mode is stored under `ilyakav-theme` and falls back to `prefers-color-scheme`.

## Motion

Every animation below is disabled or collapsed to its end state under `prefers-reduced-motion`.

**Pinned scroll scenes** (GSAP ScrollTrigger)

- `sections/LaptopScene.tsx` — the lid opens onto a code-native product demo; its live CSS motion
  and long interface scroll inside the screen without video or an iframe.
- `sections/MorphScene.tsx` — a code-native dashboard resizes from desktop into mobile; container
  queries rebuild its navigation, content hierarchy and card grid inside the changing frame.

**Scroll reveals** — `hooks/useReveal.ts` fades an element, or its direct children in sequence, up
into view once. It clears its inline props on finish so no leftover transform can break a
`position: sticky` descendant. Applied to the flagship case, selected work, range, services, team,
process, about, FAQ, testimonials, closing CTA and footer.

**Continuous** — hero badge and footer availability dots breathe; the hero gradient fallback and
the closing CTA bloom drift slowly.

**Interaction**

- Header starts integrated into the hero and becomes a solid floating pill after the first 24px
  of scrolling.
- Hero video cross-fades over the gradient fallback once decoded.
- Burger morphs into a cross; the mobile menu slides down.
- Theme dot rotates 180°; work, range and services cards lift or shift on hover.
- Services preview cross-fades its copy and gradient when the active service changes.
- FAQ is an accessible accordion (`aria-expanded` / `role="region"`) animating on a `0fr → 1fr`
  grid row, with a `+` marker that folds into a `−`.

## Cloudflare Workers deployment

The site is configured for **Workers Static Assets** in `wrangler.jsonc`; there is no Worker script
or runtime invocation for normal requests. Wrangler uploads `dist/`, and unmatched URLs fall back
to `index.html` so direct visits to SPA routes work.

For Cloudflare Workers Builds, import this repository and use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main` (or the repository's actual default branch)

The Worker name in Cloudflare must be `ilyakav`, matching `wrangler.jsonc`. After the first deploy,
attach the custom domain in **Workers & Pages → ilyakav → Settings → Domains & Routes**. Security
headers and long-lived browser caching for Vite's fingerprinted `/assets/*` files live in
`public/_headers` and are copied into the build output automatically.

## Assets and routes

- **Hero video** — `public/media/hero.mp4` (path configurable in `config/site.ts`). If it is
  missing or fails to decode, the animated gradient fallback stays up. Mobile, reduced-motion and
  data-saver clients intentionally use that lightweight fallback instead of downloading the video.
- **Case screenshots** — `public/media/marianaleus-{desktop,mobile}.jpg`. The case keeps these
  stable captures as its default preview and loads the external live site only after an explicit
  desktop click.
- **Routes** — `/`, `/about`, `/privacy`, `/contact`, `/case/marianaleus`, plus an in-app 404.
  Workers Static Assets returns `index.html` for unmatched requests so refreshes and deep links work
  after deployment.
