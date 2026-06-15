# Langkah Pertama — Project Instructions

Portfolio site for **Far** (full name Azfar — publicly ALWAYS "Far"), 21, Malaysian full-stack dev, studio **Langkah Pertama**.
Live: https://langkahpertama.website/ (GitHub Pages, repo `NightmareCode/LangkahPertama`).
Contact: WhatsApp `wa.me/60172888202` / `tel:+60172888202` — ONLY on the main page (`/#contact`); never email. Sub-pages link internally to `/#contact` ("Contact/Hubungi Langkah Pertama →") and their demo flows (carts, reservation, reorders) end in in-page demo confirmations — no `wa.me` anywhere outside `/`.
All showcased businesses are FICTIONAL — keep disclaimers, invent creative names.

## Workflow (non-negotiable)

1. **Commit & push after EVERY completed change** — user reviews the live site only. Local `master` → remote `main`: `git push origin HEAD:main`.
2. Verify deploy: poll `api.github.com/repos/NightmareCode/LangkahPertama/actions/runs` for the new head_sha + `"conclusion": "success"`, then curl the live URL with a cache-busting query. HTML is cached 10 min — tell the user to hard-refresh.
3. If HTTPS breaks: a Namecheap "URL Redirect Record" reappeared (injects A 162.255.119.163, blocks cert renewal). Correct DNS = A records 185.199.108/109/110/111.153 + CNAME www → nightmarecode.github.io.

## Site map — every page has a UNIQUE design identity (never reuse fonts/layout)

| Path | What | Lang | Identity |
|---|---|---|---|
| `/` | Studio main page | EN | Dark + gold futuristic, Space Grotesk/Inter/JetBrains Mono, Three.js hero (assets/hero.glb, drag/tap) |
| `/wedding/` | Wedding catalog | BM | Cream + gold, Playfair Display; keeps its OWN wedding logo |
| `theme1–8_*/` | Wedding demos | BM | Individual products — don't restyle casually |
| `/menu/` | Menu hub | BM | Paper menu-cover: cream, Fraunces + Caveat, polaroids, wax stamp |
| `/menu/mamak/` | Mamak Kilat | BM | Neo-brutalist signboard: yellow/black, Anton, hard shadows |
| `/menu/luxe/` | LANGIT 56 fine dining | EN | Ivory editorial, Cormorant Garamond, reservation sheet (demo confirm, no cart) |
| `/menu/tomyam/` | Tomyam Halilintar | BM | Neon night market: pink/green, Kanit, bottom nav, spice picker (Sikit/Sedang/Halilintar) |
| `/dashboard/` | Dashboard hub | EN | Graphite, Outfit, Three.js data-wave terrain bg, glass cards |
| `/dashboard/restoran/` | Mamak Kilat dashboard | **BM** | Light SaaS white/indigo, Plus Jakarta Sans |
| `/dashboard/smarthome/` | Villa Seri IoT | EN | Dark glass + ice cyan, Sora; working toggles/thermostat/scenes |
| `/dashboard/sales/` | Gemilang Niaga analytics | EN | Navy + violet→cyan gradients, Manrope; sparklines, funnel, target ring |
| `/dashboard/trading/` | Menara Capital desk | EN | Terminal green/red, IBM Plex; REAL LIVE TradingView embed widgets |
| `/inventory/` | Inventory hub | EN | Blueprint grid paper, Archivo Black, dashed "bin" callouts (5 bins) |
| `/inventory/fnb/` | Stor Mamak Kilat | BM | Kraft + tape/stamps, Permanent Marker; burn rates, demo reorder stamps |
| `/inventory/pcparts/` | RigHub Computers | EN | Black + animated RGB, Chakra Petch; SKUs, warranty, margins |
| `/inventory/warehouse/` | WareSpeed Logistics | EN | Concrete + safety orange, Staatliches, hazard stripes; rack map, docks |
| `/inventory/farmasi/` | Farmasi Ceria | EN | Clinical mint, Nunito; batches, expiry chips (day-offsets — never stale), cold-chain |
| `/inventory/safety/` | Sentinel Safety | EN | Orange #FF6600 + navy-sidebar SaaS, Segoe UI, light/dark; single-file SPA (login→dashboard→products→reports→settings), product detail modal w/ 5 tabs, Chart.js. Recreates a real intern project (Airgas/Skybiz ERP) as a FICTIONAL company w/ generated data — never expose the real client name/logo/creds. Differentiator: "ERP-synced" (Skybiz). 50 sample PPE items |

**Language rule:** BM only for the Mamak Kilat universe (mamak menu/dashboard/stor), tomyam menu, menu hub, and wedding pages. Everything else English.
**Main-page featured-work showcases — each line gets a DIFFERENT device/metaphor:** wedding = phone mockups, menus = hover-expand triptych, dashboards = laptop + dock chips (live iframes), inventory = goods-received-note manifest with scanner-beam check-in (`#invManifest`, hook `window.__lpManifest`; 5 rows — scan counter is dynamic off `.m-row` count).
All four product lines complete (wedding, menus, dashboards, inventory — inventory now has 5 demos). Still missing from user: personal photo, social links.

## Hard rules from user feedback

- **Completely different design per page** — layout, fonts, nav placement, not just colors. Check the table first.
- **Bahasa MALAYSIA, never Indonesian**: istimewa (not spesial), kontemporari (not kontemporer), reka bentuk (not desain), resipi (not resep).
- **Real photos for food, never emoji/cartoons.** Pipeline: Wikimedia Commons API → Openverse fallback, download + resize 640px JPEG q72 into `assets/menu/img/`, credit in `assets/menu/CREDITS.txt`, VISUALLY spot-check (past fails: "chicken chop" = person chopping; hotpot cover had a beer glass).
- **Brand-first main page**: "Langkah Pertama"/"we" up top; personal "I'm Far" intro in About, between Process and Contact.
- **Halal consistency**: shellfish fine (Shafi'i), no alcohol-implying dish names ("Thermidor", "beurre blanc").
- **Mobile-first**: no horizontal overflow at 375px, tap targets ≥ ~40px (invisible `::before` halos OK), bottom bars must not collide with the back-to-top button (`.cart-bar.show ~ .to-top` hop pattern).

## Tech conventions (single-file static pages, no build step)

- Reveal-on-scroll: IntersectionObserver + `.reveal/.in`, disabled by `prefers-reduced-motion`, `<noscript>` fallback.
- Sheets/dialogs: focus trap, Escape close, focus restore (`lastFocus !== document.body` fallback), `sheet.focus()` delayed ~60ms.
- `esc()` covers `& < " '`. If ever composing wa.me text (main page only): `encodeURIComponent` EVERY segment, join with literal `%0A`.
- `Element.closest()` polyfill at top of scripts. rAF loops suspend on `document.hidden` + wake on `visibilitychange`; counters get a `setTimeout` completion guarantee.
- Themed `#toTop` on every page (shows after ~600px).
- 3D: Three.js 0.160 jsdelivr importmap in `<script type="module">`, top-level await + try/catch hides container on failure. Blender MCP → GLBs in `assets/` (apply modifiers, name nodes). `touch-action: pan-y`.
- Branding: `assets/lp-mark-gold.png` (nav/footer), `assets/icon-512.png` (favicon), `assets/og-image.png` (1200×630; new URL busts WhatsApp preview cache). Wedding pages keep wedding branding.

## Verify before push

- Dev server: `.claude/launch.json` → `static-site` (python http.server 8731).
- Preview tab is often hidden: rAF/IO/lazy images/resize suspended, `elementFromPoint` in-viewport only, screenshots time out. Use DOM checks + test hooks (`window.__lpHero`, `window.__hubBg.tick()`).
- Mobile audit: `scrollWidth <= innerWidth+1` at 375px, clean console, key flows clicked programmatically.

## Windows/PowerShell traps

- PS 5.1 reads BOM-less `.ps1` as ANSI → mojibake. Write scripts with UTF-8 BOM.
- `''` inside a double-quoted PS string stays literal — has injected broken JS before. Escape JS apostrophes as `\'` instead.
- Commit messages: `@'…'@` here-strings; embedded `"` in plain `-m "…"` splits args.
- Sandbox false-flags inline PS (`'RM '` parsed as `rm`): write to a temp `.ps1` and execute.
