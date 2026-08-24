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
```

## Structure

```
src/
  App.tsx                  page composition — sections in order
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

- `sections/LaptopScene.tsx` — the lid opens and a page strip scrolls inside the screen.
- `sections/MorphScene.tsx` — one frame resizes from a desktop viewport into a phone, with the
  copy and the label swapping past 55% progress.

**Scroll reveals** — `hooks/useReveal.ts` fades an element, or its direct children in sequence, up
into view once. It clears its inline props on finish so no leftover transform can break a
`position: sticky` descendant. Applied to the flagship case, selected work, range, services, team,
process, about, FAQ, testimonials, closing CTA and footer.

**Continuous** — hero badge and footer availability dots breathe; the hero gradient fallback and
the closing CTA bloom drift slowly.

**Interaction**

- Header cross-fades from transparent-over-video to a solid pill that drops in past the hero.
- Hero video cross-fades over the gradient fallback once decoded.
- Burger morphs into a cross; the mobile menu slides down.
- Theme dot rotates 180°; work, range and services cards lift or shift on hover.
- Services preview cross-fades its copy and gradient when the active service changes.
- FAQ is an accessible accordion (`aria-expanded` / `role="region"`) animating on a `0fr → 1fr`
  grid row, with a `+` marker that folds into a `−`.

## Assets and pending pages

- **Hero video** — `public/media/hero.mp4` (path configurable in `config/site.ts`). If it is
  missing or fails to decode, the animated gradient fallback stays up and the "3D loop goes here"
  note reappears.
- **Screenshots and portrait** — the gradient placeholders carry the design's own captions.
- **Contact and case pages** are separate artboards in the design project and are not part of this
  page. Their links point at `ROUTES.contact` / `ROUTES.caseMarianaleus` in `config/site.ts` —
  wire a router to those paths when the pages land.
