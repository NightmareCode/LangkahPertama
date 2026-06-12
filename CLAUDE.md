# Langkah Pertama — Project Instructions

Personal-brand portfolio site for **Far** (full name Azfar — on the public site ALWAYS "Far"),
a 21-year-old full-stack developer from Malaysia, operating as the studio **Langkah Pertama**.

- Live site: https://langkahpertama.website/ (GitHub Pages, repo `NightmareCode/LangkahPertama`)
- Contact used on ALL pages: WhatsApp `wa.me/60172888202` (and `tel:+60172888202`). Never email.
- All showcased businesses are FICTIONAL ("rekaan") — keep disclaimers, invent creative names.

## Non-negotiable workflow rules

1. **Commit & push after EVERY completed change** — the user reviews via the live site, never
   locally. Local branch is `master`, remote default is `main`: push with
   `git push origin HEAD:main`.
2. Deploys run via `.github/workflows/static.yml` (GitHub Actions → Pages). After pushing,
   verify: poll `api.github.com/repos/NightmareCode/LangkahPertama/actions/runs` for the new
   head_sha + `"conclusion": "success"`, then curl the live URL with a cache-busting query.
3. Browser caches HTML for 10 min (Cache-Control max-age=600) — tell the user to hard-refresh.
4. Domain is registered at Namecheap. HTTPS works via GitHub's Let's Encrypt cert. If HTTPS
   ever breaks: check whether a Namecheap "URL Redirect Record" reappeared (it injects A record
   162.255.119.163 and blocks cert renewal). Correct DNS = four A records 185.199.108-111.153
   + CNAME www → nightmarecode.github.io.

## Site map

| Path | What | Language | Design identity (NEVER reuse across pages) |
|---|---|---|---|
| `/` | Studio main page | EN | Futuristic dark + gold, Space Grotesk/Inter/JetBrains Mono, Three.js hero (assets/hero.glb orbital core, drag/tap interactive) |
| `/wedding/` | Wedding invitation catalog | BM | Cream + gold elegant, Playfair Display; keeps its OWN wedding logo (TemplateAssets/logo.png) |
| `theme1_*`–`theme8_*/` | Wedding invitation demos | BM | Individual products — do not restyle casually |
| `/menu/` | Menu demo hub | BM | Paper menu-cover: cream, Fraunces + Caveat, polaroids, wax stamp |
| `/menu/mamak/` | Mamak Kilat menu | BM | Neo-brutalist kedai signboard: yellow/black, Anton, hard shadows, photo grid |
| `/menu/luxe/` | LANGIT 56 fine dining | EN | Light ivory editorial, Cormorant Garamond, WhatsApp table reservations (no cart) |
| `/menu/tomyam/` | Tomyam Halilintar | BM | Neon night market: pink/green glow, Kanit, bottom nav, spice picker (Sikit/Sedang/Halilintar) |
| `/dashboard/` | Dashboard hub | EN | Graphite + Outfit, procedural Three.js data-wave terrain bg, glass cards, hero stage |
| `/dashboard/restoran/` | Mamak Kilat dashboard | **BM** | Light SaaS white/indigo, Plus Jakarta Sans (the ONLY BM dashboard — user's rule) |
| `/dashboard/smarthome/` | Villa Seri IoT | EN | Dark glassmorphism + ice cyan, Sora; working toggles/thermostat/scenes/lock |
| `/dashboard/sales/` | Gemilang Niaga analytics | EN | Navy + violet→cyan gradients, Manrope; sparklines, funnel, target ring |
| `/dashboard/trading/` | Menara Capital trading desk | EN | Terminal green/red, IBM Plex; REAL LIVE data via official TradingView embed widgets |
| `/inventory/` | Inventory hub | EN | Blueprint: deep blue grid paper, Archivo Black, dashed callout "bins" |
| `/inventory/fnb/` | Stor Mamak Kilat | BM | Kraft cardboard + tape/stamps, Permanent Marker; daily burn rates, WhatsApp supplier reorders (completes Mamak Kilat trilogy) |
| `/inventory/pcparts/` | RigHub Computers | EN | Black + animated RGB gradient, Chakra Petch; SKUs, warranty, margins, low-stock RGB pulse |
| `/inventory/warehouse/` | WareSpeed Logistics | EN | Industrial concrete + safety orange, Staatliches, hazard stripes; interactive rack map, manifests, dock schedule |
| `/inventory/farmasi/` | Farmasi Ceria | BM | Clinical mint/white soft rounded, Nunito; batch numbers, expiry countdown chips (computed as days-from-today offsets so the demo never goes stale), cold-chain badges |

All four product lines are now complete (wedding, menus, dashboards, inventory).
Still missing from user: personal photo, social links.

## Hard rules learned from user feedback

- **Completely different design per page**: layout, fonts, alignment, nav placement — not just
  colors. Check the table above before picking fonts/identities for anything new.
- **Bahasa MALAYSIA, never Indonesian**: istimewa (not spesial), kontemporari (not kontemporer),
  reka bentuk (not desain), resipi (not resep). Casual mamak register where fitting.
- **Real photos for food** — never emoji/cartoons. Pipeline: research freely-licensed images
  (Wikimedia Commons API first, Openverse fallback), verify URLs serve real photos, download +
  resize to 640px JPEG q72 into `assets/menu/img/`, append attribution to `assets/menu/CREDITS.txt`.
  VISUALLY spot-check downloads (past failures: "chicken chop" matched a person chopping; a
  hotpot cover photo contained a beer glass — bad for halal positioning).
- **Brand-first voice on the main page**: hero/services/work/process say "Langkah Pertama"/"we";
  the personal "I'm Far" intro lives in About, BETWEEN Process and Contact, never at the top.
- **Halal consistency** on food pages: shellfish is fine (Shafi'i), but avoid alcohol-implying
  preparation names (no "Thermidor", no "beurre blanc").
- Mobile-first always: no horizontal overflow at 375px, tap targets ≥ ~40px (invisible
  `::before` halos are acceptable), bottom bars must not collide with the themed back-to-top
  button (use `.cart-bar.show ~ .to-top { bottom: … }` hop pattern).

## Tech conventions (single-file static pages, no build step)

Every page is one self-contained `index.html`. Shared patterns to copy from existing pages:

- Reveal-on-scroll via IntersectionObserver + `.reveal/.in`, with `prefers-reduced-motion`
  disabling everything and a `<noscript>` fallback making content visible.
- Bottom sheets/dialogs: focus trap (Tab cycling), Escape close, focus restore with
  `lastFocus !== document.body` fallback, `sheet.focus()` delayed ~60ms (visibility race).
- `esc()` HTML escaper must cover `& < " '`. WhatsApp links: `encodeURIComponent` EVERY text
  segment (em-dashes/unicode break otherwise) joined with literal `%0A`.
- `Element.closest()` polyfill at top of menu/dashboard scripts.
- rAF animations need throttle-safe fallbacks (`setTimeout` guarantee for counters) and loops
  must suspend on `document.hidden` + wake on `visibilitychange`.
- Themed back-to-top button on every page (`#toTop`, shows after ~600px scroll).
- 3D: Three.js 0.160 via jsdelivr importmap inside `<script type="module">` with top-level
  await + try/catch hiding the container on failure. Blender (MCP) builds GLBs into `assets/`
  (apply modifiers on export; name nodes for JS animation). Touch: `touch-action: pan-y` so
  vertical scroll survives.
- Branding assets: `assets/lp-mark-gold.png` (nav/footer mark), `assets/icon-512.png` (favicon
  for studio + demo pages), `assets/og-image.png` (1200×630 link preview). Wedding pages keep
  wedding branding. New og:image URLs bust WhatsApp's preview cache.

## Local verification (before every push)

- Dev server: `.claude/launch.json` → `static-site` (python http.server 8731), preview tools.
- **Preview quirks**: the panel often runs as a hidden tab — rAF, IntersectionObserver, lazy
  images, and window resize events are suspended; `elementFromPoint` only works in-viewport;
  the screenshot tool frequently times out. Verify behavior via DOM checks and exposed test
  hooks (`window.__lpHero`, `window.__hubBg.tick()`) instead of trusting visuals alone.
- Mobile audit checklist per page: `scrollWidth <= innerWidth+1` at 375px, console clean, key
  flows clicked programmatically (cart math, sheet open/Escape, range tabs, toggles).

## Windows/PowerShell traps (this repo is developed on Windows)

- PS 5.1 reads BOM-less UTF-8 `.ps1` as ANSI → mojibake. Write scripts with BOM, or re-encode
  before running.
- `''` inside a **double-quoted** PS string stays two literal apostrophes — it has injected
  broken JS into pages before. Escape JS apostrophes as `\'` in the replacement text instead.
- Quotes inside `git commit -m @'…'@` here-strings are fine, but embedded double quotes in
  plain `-m "…"` args split horribly — prefer here-strings without `"` characters.
- The sandbox occasionally false-flags inline scripts (e.g. `'RM '` parsing as `rm`): write
  the script to a temp `.ps1` and execute it.
