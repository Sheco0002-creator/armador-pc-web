# Hero CGI Breakdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `.trace-line` decorative SVG and static copy in `index.html`'s Hero with a CGI Breakdown composition (GPU/RAM/CPU/motherboard/cooler exploded view) driven by GSAP + ScrollTrigger (pin-scroll and mouse parallax), with a fully static/accessible fallback.

**Architecture:** A single inline SVG (`.hero-composition`) built from layered `<g>` groups, each with baked-in CSS custom properties (`--depth`, `--base-x`, `--base-y`) that compute their own transform from three globals (`--explode`, `--mx`, `--my`) written by `js/hero.js`. GSAP only ever writes those three numbers (plus `--hero-fade-opacity`/`--hero-fade-scale`) — all per-layer interpolation happens in CSS `calc()`, never in JS. No-JS / `prefers-reduced-motion` leaves a fixed `--explode: 0.6` baseline that already reads as intentional.

**Tech Stack:** Vanilla HTML/CSS/SVG (existing site stack) + GSAP 3.15.0 core + ScrollTrigger plugin, vendored locally (no CDN, no npm/build step — matches the repo's zero-build architecture).

**Spec:** `docs/superpowers/specs/2026-08-26-hero-cgi-breakdown-design.md`

## Global Constraints

- Scope is exclusively the `<section class="hero">` block of `index.html` (Spanish root). `en/index.html`, `pt/index.html` are explicitly out of scope this phase.
- Do not modify: `data/*`, `js/compatibilidad.js`, `js/configurador.js`, `js/v2-adapter.js`, `js/nivel.js`, `js/home.js`, `js/guias.js`, `js/main.js`, `js/moneda.js`, `js/previews.js`, `js/motion.js`, any URL/route structure, existing translations.
- `.eyebrow` (`css/style.css:73`) and `.btn`/`.btn-primary`/`.btn-ghost` (`css/style.css:86-100`) are shared across 51+ files (guías, niveles, configurador, contacto, etc.). Never edit these base rules — any Hero-specific sizing goes in scoped selectors (`.hero-inner .eyebrow`, `.hero-actions .btn`).
- CTA text and `href` values must stay exactly as they are today: "Empezar a armar" → `configurador.html`, "Ver niveles de presupuesto" → `#presupuestos`. Visual restyling only.
- `<title>`, meta description, and OG tags in `<head>` are not touched — they retain the long-form SEO copy since the H1 is shortening.
- Breakpoint constant for all "mobile mode" behavior (no pin, no parallax, fewer composition layers) is **767px and below**; **768px and above** gets the full effect. Use this exact number in both CSS (`@media (max-width: 767px)`) and JS (`matchMedia('(min-width: 768px)')`) — do not introduce a different number.
- GSAP/ScrollTrigger version is pinned to **3.15.0** (verified current on npm as of 2026-08-26). Do not use a CDN — vendor the files into `js/vendor/`.
- Every animated/parallax code path must no-op cleanly if `prefers-reduced-motion: reduce` matches, or if `gsap`/`ScrollTrigger` failed to load — the static `--explode: 0.6` CSS baseline is the required fallback in both cases.
- Manual verification is this project's actual test methodology for UI (no JS unit-test framework covers CSS/SVG/motion). Every task's verification step must be run against `python3 -m http.server 8000` → `http://localhost:8000/index.html`, per `CLAUDE.md`.

---

### Task 1: Vendor GSAP + ScrollTrigger

**Files:**
- Create: `js/vendor/gsap.min.js`
- Create: `js/vendor/ScrollTrigger.min.js`
- Modify: `index.html:178-180` (script tags at end of `<body>`)

**Interfaces:**
- Produces: global `gsap` object and `ScrollTrigger` (attached to `window`) available to any script loaded after these two tags.

- [ ] **Step 1: Download the pinned files**

```bash
curl -sL "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js" -o js/vendor/gsap.min.js
curl -sL "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js" -o js/vendor/ScrollTrigger.min.js
```

- [ ] **Step 2: Verify the files are real, non-empty JS**

Run: `node -e "const fs=require('fs'); for (const f of ['js/vendor/gsap.min.js','js/vendor/ScrollTrigger.min.js']) { const s = fs.statSync(f); if (s.size < 10000) throw new Error(f + ' too small: ' + s.size); } console.log('OK: both files present and non-trivial size');"`

Expected: `OK: both files present and non-trivial size`

- [ ] **Step 3: Add the script tags to `index.html`**

Replace the existing end-of-body block:

```html
<script src="js/main.js"></script>
<script src="js/home.js"></script>
</body>
```

with:

```html
<script src="js/main.js"></script>
<script src="js/home.js"></script>
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
</body>
```

(`js/hero.js` itself is added in Task 4, after GSAP is confirmed working — keeps this task's diff focused on vendoring.)

- [ ] **Step 4: Verify in-browser**

Start `python3 -m http.server 8000`, open `http://localhost:8000/index.html`, open DevTools console, run `typeof gsap` and `typeof ScrollTrigger`.
Expected: both print `"object"` or `"function"` (not `"undefined"`), zero console errors.

- [ ] **Step 5: Commit**

```bash
git add js/vendor/gsap.min.js js/vendor/ScrollTrigger.min.js index.html
git commit -m "build(hero): vendor GSAP 3.15.0 + ScrollTrigger locally"
```

---

### Task 2: Static CGI Breakdown composition (SVG + CSS, no motion yet)

**Files:**
- Modify: `index.html:73-83` (replace the `.trace-line` `<svg>` with `.hero-composition`)
- Modify: `css/style.css` (replace `.trace-line` rule at line 83 and the `@media (max-width: 720px) { .trace-line { display: none; } }` rule at line 184; add new `/* ===== Hero: composición CGI Breakdown ===== */` block after the existing Hero block, and extend the `@media (prefers-reduced-motion: reduce)` block at lines 171-180)

**Interfaces:**
- Produces: `.hero-composition` element (with class hooks `.hc-board`, `.hc-cpu`, `.hc-ram-1`, `.hc-ram-2`, `.hc-cooler`, `.hc-gpu`, `.hc-ssd`) and CSS custom properties `--explode`, `--explode-scale`, `--mx`, `--my`, `--hero-fade-opacity`, `--hero-fade-scale` on `.hero-composition` — Tasks 4-6 (`js/hero.js`) write to these.

- [ ] **Step 1: Replace the hero SVG markup in `index.html`**

Replace:

```html
    <svg class="trace-line" viewBox="0 0 480 420" fill="none" aria-hidden="true">
      <path d="M40 30 H210 V110 H380 V190" stroke="#5FAE8C" stroke-width="1.5" opacity="0.5"/>
      <path d="M90 420 V300 H260 V200 H440" stroke="#5FAE8C" stroke-width="1.5" opacity="0.5"/>
      <path d="M40 30 V-10" stroke="#5FAE8C" stroke-width="1.5" opacity="0.5"/>
      <circle cx="210" cy="110" r="4" fill="#D4A24C"/>
      <circle cx="380" cy="190" r="4" fill="#D4A24C"/>
      <circle cx="260" cy="200" r="4" fill="#D4A24C"/>
      <circle cx="40" cy="30" r="3" fill="#5FAE8C"/>
      <circle cx="440" cy="200" r="3" fill="#5FAE8C"/>
      <circle cx="90" cy="420" r="3" fill="#5FAE8C"/>
    </svg>
```

with:

```html
    <div class="hero-composition">
      <svg class="hc-svg" viewBox="0 0 640 640" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="hc-copper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#D4A24C" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#8a6a2f" stop-opacity="0.55"/>
          </linearGradient>
          <linearGradient id="hc-mint" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#5FAE8C" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="#16211C" stop-opacity="0.12"/>
          </linearGradient>
          <radialGradient id="hc-spotlight" cx="46%" cy="40%" r="55%">
            <stop offset="0%" stop-color="#5FAE8C" stop-opacity="0.14"/>
            <stop offset="60%" stop-color="#5FAE8C" stop-opacity="0.03"/>
            <stop offset="100%" stop-color="#5FAE8C" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="640" height="640" fill="url(#hc-spotlight)"/>

        <g class="hc-board">
          <rect x="190" y="210" width="260" height="260" rx="14" fill="rgba(22,33,28,0.4)" stroke="url(#hc-mint)" stroke-width="2"/>
          <rect x="285" y="255" width="70" height="70" rx="6" stroke="#5FAE8C" stroke-width="1.4" opacity="0.35"/>
          <circle cx="205" cy="225" r="4" fill="#5FAE8C" opacity="0.25"/>
          <circle cx="435" cy="225" r="4" fill="#5FAE8C" opacity="0.25"/>
          <circle cx="205" cy="455" r="4" fill="#5FAE8C" opacity="0.25"/>
          <circle cx="435" cy="455" r="4" fill="#5FAE8C" opacity="0.25"/>
          <path d="M210 240 H270 V300" stroke="#5FAE8C" stroke-width="1" opacity="0.2"/>
          <path d="M430 240 H370 V300" stroke="#5FAE8C" stroke-width="1" opacity="0.2"/>
          <path d="M210 440 H260 V400" stroke="#5FAE8C" stroke-width="1" opacity="0.2"/>
          <rect x="400" y="220" width="10" height="60" rx="2" stroke="#D4A24C" stroke-width="1" opacity="0.3"/>
          <rect x="418" y="220" width="10" height="60" rx="2" stroke="#D4A24C" stroke-width="1" opacity="0.3"/>
          <rect x="220" y="450" width="120" height="12" rx="2" fill="#D4A24C" opacity="0.25"/>
        </g>

        <g class="hc-cpu">
          <line x1="320" y1="220" x2="320" y2="255" stroke="#5FAE8C" stroke-width="1.4" stroke-dasharray="3 4" opacity="0.45"/>
          <circle cx="320" cy="255" r="3" fill="#D4A24C"/>
          <rect x="285" y="150" width="70" height="70" rx="6" fill="url(#hc-copper)" stroke="#D4A24C" stroke-width="1.5"/>
          <rect x="300" y="165" width="40" height="40" rx="3" fill="none" stroke="#0D1512" stroke-width="1.2" opacity="0.5"/>
          <g stroke="#5FAE8C" stroke-width="1.4" opacity="0.4">
            <line x1="295" y1="145" x2="295" y2="150"/><line x1="320" y1="145" x2="320" y2="150"/><line x1="345" y1="145" x2="345" y2="150"/>
            <line x1="295" y1="220" x2="295" y2="225"/><line x1="320" y1="220" x2="320" y2="225"/><line x1="345" y1="220" x2="345" y2="225"/>
          </g>
        </g>

        <g class="hc-ram-1">
          <line x1="405" y1="175" x2="405" y2="210" stroke="#5FAE8C" stroke-width="1.2" stroke-dasharray="3 4" opacity="0.4"/>
          <circle cx="405" cy="172" r="2.5" fill="#D4A24C"/>
          <rect x="393" y="95" width="24" height="110" rx="3" fill="url(#hc-mint)" stroke="#5FAE8C" stroke-width="1.4"/>
          <g stroke="#D4A24C" stroke-width="1" opacity="0.35">
            <line x1="398" y1="115" x2="412" y2="115"/><line x1="398" y1="135" x2="412" y2="135"/>
            <line x1="398" y1="155" x2="412" y2="155"/><line x1="398" y1="175" x2="412" y2="175"/>
          </g>
        </g>

        <g class="hc-ram-2">
          <line x1="423" y1="170" x2="423" y2="210" stroke="#5FAE8C" stroke-width="1.2" stroke-dasharray="3 4" opacity="0.4"/>
          <circle cx="423" cy="167" r="2.5" fill="#D4A24C"/>
          <rect x="411" y="85" width="24" height="110" rx="3" fill="url(#hc-mint)" stroke="#5FAE8C" stroke-width="1.4"/>
          <g stroke="#D4A24C" stroke-width="1" opacity="0.35">
            <line x1="416" y1="105" x2="430" y2="105"/><line x1="416" y1="125" x2="430" y2="125"/>
            <line x1="416" y1="145" x2="430" y2="145"/><line x1="416" y1="165" x2="430" y2="165"/>
          </g>
        </g>

        <g class="hc-cooler">
          <line x1="320" y1="140" x2="320" y2="150" stroke="#5FAE8C" stroke-width="1.2" stroke-dasharray="3 4" opacity="0.35"/>
          <circle cx="320" cy="95" r="46" fill="url(#hc-copper)" opacity="0.12" stroke="#5FAE8C" stroke-width="1.6"/>
          <circle cx="320" cy="95" r="6" fill="#D4A24C"/>
          <g stroke="#5FAE8C" stroke-width="1.3" opacity="0.4">
            <line x1="320" y1="55" x2="320" y2="70"/><line x1="320" y1="120" x2="320" y2="135"/>
            <line x1="280" y1="95" x2="295" y2="95"/><line x1="345" y1="95" x2="360" y2="95"/>
            <line x1="290" y1="65" x2="300" y2="75"/><line x1="340" y1="115" x2="350" y2="125"/>
            <line x1="350" y1="65" x2="340" y2="75"/><line x1="290" y1="125" x2="300" y2="115"/>
          </g>
        </g>

        <g class="hc-gpu">
          <line x1="280" y1="462" x2="280" y2="490" stroke="#5FAE8C" stroke-width="1.4" stroke-dasharray="3 4" opacity="0.45"/>
          <circle cx="280" cy="490" r="3" fill="#D4A24C"/>
          <rect x="162" y="486" width="10" height="113" rx="2" fill="url(#hc-copper)"/>
          <rect x="170" y="490" width="220" height="105" rx="10" fill="url(#hc-mint)" stroke="#5FAE8C" stroke-width="1.8"/>
          <circle cx="222" cy="542" r="28" fill="none" stroke="#5FAE8C" stroke-width="1.4" opacity="0.5"/>
          <circle cx="222" cy="542" r="4" fill="#D4A24C"/>
          <circle cx="308" cy="542" r="28" fill="none" stroke="#5FAE8C" stroke-width="1.4" opacity="0.5"/>
          <circle cx="308" cy="542" r="4" fill="#D4A24C"/>
        </g>

        <g class="hc-ssd">
          <line x1="380" y1="430" x2="380" y2="452" stroke="#5FAE8C" stroke-width="1" stroke-dasharray="2 3" opacity="0.35"/>
          <rect x="355" y="405" width="60" height="24" rx="3" fill="url(#hc-copper)" opacity="0.7" stroke="#D4A24C" stroke-width="1"/>
          <circle cx="365" cy="417" r="1.6" fill="#0D1512"/>
          <circle cx="378" cy="417" r="1.6" fill="#0D1512"/>
        </g>
      </svg>
    </div>
```

- [ ] **Step 2: Replace the `.trace-line` CSS rule in `css/style.css`**

Replace `.trace-line { position: absolute; top: 0; right: -40px; height: 100%; width: 420px; z-index: 1; pointer-events: none; }` (line 83) with:

```css
.hero-composition {
  position: absolute;
  top: 50%;
  right: -40px;
  z-index: 1;
  width: min(46vw, 620px);
  max-width: 100%;
  pointer-events: none;
  --explode: 0.6;
  --explode-scale: 1;
  --mx: 0;
  --my: 0;
  --hero-fade-opacity: 1;
  --hero-fade-scale: 1;
  opacity: var(--hero-fade-opacity);
  transform: translateY(-50%) scale(var(--hero-fade-scale));
}
.hero-composition .hc-svg { width: 100%; height: auto; display: block; overflow: visible; }

.hc-board, .hc-cpu, .hc-ram-1, .hc-ram-2, .hc-cooler, .hc-gpu, .hc-ssd {
  transform-box: fill-box;
  transform-origin: center;
  transform: translate(
    calc(var(--base-x) * var(--explode) * var(--explode-scale) + var(--mx) * var(--depth) * 6px),
    calc(var(--base-y) * var(--explode) * var(--explode-scale) + var(--my) * var(--depth) * 6px)
  );
}
.hc-board  { --depth: 1; --base-x: 0px;   --base-y: 0px; }
.hc-cpu    { --depth: 3; --base-x: 0px;   --base-y: -70px;  filter: drop-shadow(0 8px 14px rgba(0,0,0,0.35)); }
.hc-ram-1  { --depth: 4; --base-x: 20px;  --base-y: -55px;  filter: drop-shadow(0 10px 16px rgba(0,0,0,0.35)); }
.hc-ram-2  { --depth: 4; --base-x: 45px;  --base-y: -78px;  filter: drop-shadow(0 10px 16px rgba(0,0,0,0.35)); }
.hc-cooler { --depth: 5; --base-x: -10px; --base-y: -100px; filter: drop-shadow(0 14px 22px rgba(0,0,0,0.4)); }
.hc-gpu    { --depth: 5; --base-x: -15px; --base-y: 60px;   filter: drop-shadow(0 16px 26px rgba(0,0,0,0.45)); }
.hc-ssd    { --depth: 2; --base-x: 10px;  --base-y: 18px;   filter: drop-shadow(0 6px 10px rgba(0,0,0,0.3)); }
```

- [ ] **Step 3: Remove the now-obsolete mobile hide rule**

In `css/style.css:183-184`, remove `.trace-line { display: none; }` from the `@media (max-width: 720px)` block (the composition must stay visible on mobile per spec §7 — do not carry this rule forward).

- [ ] **Step 4: Extend the existing reduced-motion block**

In `css/style.css:171-180`, add one line inside the existing `@media (prefers-reduced-motion: reduce)` block (do not create a second block):

```css
  .hero-composition, .hero-composition * { animation: none !important; transition: none !important; }
```

- [ ] **Step 5: Verify in-browser**

Start the local server, open `http://localhost:8000/index.html`.
Expected: composition renders top-right of the hero at desktop widths, layers visibly separated (CPU/RAM/cooler above the board, GPU below), copper/mint gradient fills visible, no console errors, no horizontal scrollbar on the page (`document.body.scrollWidth <= document.body.clientWidth` in DevTools console).

- [ ] **Step 6: Commit**

```bash
git add index.html css/style.css
git commit -m "feat(hero): static CGI Breakdown composition (SVG + CSS, no motion)"
```

---

### Task 3: Copy & CTA restructuring

**Files:**
- Modify: `index.html:65-71` (hero text block)
- Modify: `css/style.css` (new Hero-scoped rules only — extends the `/* ===== Hero ===== */` block at line 70)

**Interfaces:**
- Produces: `.hero-eyebrow`, `.hero-title-line`, `.hero-title-accent` classes — consumed by Task 4's entrance timeline selectors.

- [ ] **Step 1: Replace the hero text block in `index.html`**

Replace:

```html
      <p class="eyebrow mono">Guía + configurador para armar PC</p>
      <h1>Arma tu PC gamer ideal,<br>sin importar tu presupuesto</h1>
      <p class="hero-sub">Aprende qué comprar y por qué. Un configurador que verifica la compatibilidad de cada pieza mientras armas tu build — no un catálogo más.</p>
      <div class="hero-actions">
        <a href="configurador.html" class="btn btn-primary">Empezar a armar</a>
        <a href="#presupuestos" class="btn btn-ghost">Ver niveles de presupuesto</a>
      </div>
```

with:

```html
      <p class="eyebrow hero-eyebrow mono">TU PC. A TU MANERA.</p>
      <h1><span class="hero-title-line">ARMA</span><span class="hero-title-line hero-title-accent">TU PC</span></h1>
      <p class="hero-sub">Aprende qué comprar y por qué. Un configurador que verifica la compatibilidad de cada pieza mientras armas tu build — no un catálogo más.</p>
      <div class="hero-actions">
        <a href="configurador.html" class="btn btn-primary">Empezar a armar</a>
        <a href="#presupuestos" class="btn btn-ghost">Ver niveles de presupuesto</a>
      </div>
```

- [ ] **Step 2: Add scoped styling in `css/style.css`**

Add after the `.hero-sub`/`.hero-actions` rules (do not touch the global `.eyebrow` rule at line 73 or the global `.btn`/`.btn-primary`/`.btn-ghost` rules at lines 86-100):

```css
.hero-inner .hero-eyebrow { letter-spacing: 0.12em; }
.hero h1 { font-family: var(--font-display); font-weight: 700; line-height: 0.95; margin: 4px 0 24px; }
.hero-title-line { display: block; font-size: clamp(48px, 8vw, 96px); letter-spacing: -0.02em; }
.hero-title-accent { color: var(--accent); }
.hero-actions .btn { padding: 16px 28px; font-size: 15px; }
```

- [ ] **Step 3: Verify in-browser**

Open `http://localhost:8000/index.html`. Expected: eyebrow reads "TU PC. A TU MANERA.", H1 renders as two stacked lines ("ARMA" / "TU PC" in copper), sub-paragraph unchanged, both CTA buttons unchanged text and slightly larger. Then open `http://localhost:8000/guias.html` and `http://localhost:8000/niveles/media.html` — their eyebrow labels ("Aprende a armar tu PC", price) must look exactly as before (unaffected by the scoped Hero rule).

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "feat(hero): restructure copy to short poster H1 + scoped CTA styling"
```

---

### Task 4: `js/hero.js` — entrance timeline

**Files:**
- Create: `js/hero.js`
- Modify: `index.html:177-181` (add the `hero.js` script tag)

**Interfaces:**
- Consumes: `gsap` (global, from Task 1), `.hero`, `.hero-composition`, `.hero-eyebrow`, `.hero-title-line`, `.hero-sub`, `.hero-actions` (from Tasks 2-3).
- Produces: nothing consumed by later tasks directly, but Task 5 and 6 append to this same file's IIFE.

- [ ] **Step 1: Create `js/hero.js` with the guard clause and entrance timeline**

```js
// ===== Motion del Hero: CGI Breakdown (Fase 3) =====
// Mejora progresiva: si prefers-reduced-motion está activo, o si GSAP/
// ScrollTrigger no cargaron (vendorizados en js/vendor/), esta función no
// ejecuta nada y queda la composición estática (--explode: 0.6 fijado por
// CSS en .hero-composition, sin JS) — ver css/style.css.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  var hero = document.querySelector('.hero');
  var composition = document.querySelector('.hero-composition');
  if (!hero || !composition) return;

  gsap.registerPlugin(ScrollTrigger);

  var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.from('.hero-eyebrow', { opacity: 0, y: 12, duration: 0.5 })
    .from('.hero-title-line', { opacity: 0, y: 18, duration: 0.6, stagger: 0.08 }, '-=0.25')
    .from('.hero-sub', { opacity: 0, y: 14, duration: 0.5 }, '-=0.3')
    .from('.hero-actions', { opacity: 0, y: 14, duration: 0.5 }, '-=0.3')
    .from(composition, { opacity: 0, duration: 0.7 }, '-=0.5')
    .fromTo(composition, { '--explode': 0.15 }, { '--explode': 0.6, duration: 0.9 }, '-=0.6');
})();
```

- [ ] **Step 2: Add the script tag in `index.html`**

Replace:

```html
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
</body>
```

with:

```html
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
<script src="js/hero.js"></script>
</body>
```

- [ ] **Step 3: Verify in-browser**

Reload `http://localhost:8000/index.html` with a hard refresh. Expected: on load, eyebrow → H1 lines (staggered) → sub → CTAs fade/slide in sequentially, then the composition fades in and settles from a more compact state to its resting separation. Zero console errors. Then enable "Emulate CSS prefers-reduced-motion: reduce" in DevTools Rendering tab, hard refresh again — expected: everything appears instantly, fully visible, no animation, composition in its resting position.

- [ ] **Step 4: Commit**

```bash
git add js/hero.js index.html
git commit -m "feat(hero): GSAP entrance timeline for copy and composition"
```

---

### Task 5: Scroll-scrub with pin (desktop/tablet)

**Files:**
- Modify: `js/hero.js` (append inside the same IIFE, after the entrance timeline)

**Interfaces:**
- Consumes: `hero`, `composition` (already declared in Task 4's IIFE scope).
- Produces: nothing new consumed elsewhere; this is a terminal effect.

- [ ] **Step 1: Append the pin/scrub `matchMedia` block to `js/hero.js`**

Add at the end of the IIFE, after the `tl.from(...)` chain and before the closing `})();`:

```js

  var mm = gsap.matchMedia();

  mm.add('(min-width: 768px)', function () {
    var st = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '+=100%',
      pin: true,
      scrub: 1,
      onUpdate: function (self) {
        gsap.set(composition, {
          '--explode': gsap.utils.mapRange(0, 1, 0.35, 0.85, self.progress),
          '--hero-fade-opacity': gsap.utils.mapRange(0, 1, 1, 0.85, self.progress),
          '--hero-fade-scale': gsap.utils.mapRange(0, 1, 1, 0.96, self.progress),
        });
      },
    });

    return function () { st.kill(); };
  });
```

- [ ] **Step 2: Verify in-browser at desktop width**

Resize the browser window (or DevTools device toolbar) to 1440px wide. Reload `http://localhost:8000/index.html`, wait for the entrance animation to finish, then scroll down slowly. Expected: the hero section pins (stays fixed) for roughly one viewport height of scrolling while the composition's layers separate further and fade/scale down slightly, then releases and "Cómo funciona" scrolls up normally. Scroll back up — the effect reverses smoothly (no snapping/jumping).

- [ ] **Step 3: Verify at exactly 768px (tablet boundary)**

Set viewport width to 768px via DevTools. Expected: same pin/scrub behavior as desktop (this is the inclusive boundary per the Global Constraints — 768px gets the full effect).

- [ ] **Step 4: Verify at 767px (just below boundary)**

Set viewport width to 767px. Expected: no pin — scrolling behaves normally, hero scrolls past like any other section (mobile-mode CSS from Task 7 will further adjust the composition itself; this task only confirms the pin/scrub JS correctly does not activate).

- [ ] **Step 5: Commit**

```bash
git add js/hero.js
git commit -m "feat(hero): ScrollTrigger pin + scroll-scrub for explode progress"
```

---

### Task 6: Mouse parallax (desktop only)

**Files:**
- Modify: `js/hero.js` (append inside the same IIFE)

**Interfaces:**
- Consumes: `hero`, `composition`, `mm` (the `gsap.matchMedia()` instance from Task 5).

- [ ] **Step 1: Append the parallax `matchMedia` block to `js/hero.js`**

Add after the pin/scrub `mm.add(...)` block from Task 5, still inside the IIFE before `})();`:

```js

  mm.add('(pointer: fine) and (min-width: 768px)', function () {
    var setMx = gsap.quickTo(composition, '--mx', { duration: 0.6, ease: 'power3' });
    var setMy = gsap.quickTo(composition, '--my', { duration: 0.6, ease: 'power3' });

    function onPointerMove(e) {
      var rect = hero.getBoundingClientRect();
      var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      var ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setMx(nx);
      setMy(ny);
    }
    hero.addEventListener('pointermove', onPointerMove);

    return function () {
      hero.removeEventListener('pointermove', onPointerMove);
      gsap.set(composition, { '--mx': 0, '--my': 0 });
    };
  });
```

- [ ] **Step 2: Verify in-browser at desktop width**

At 1440px wide, move the mouse slowly across the hero section. Expected: composition layers shift subtly in the direction of the cursor, GPU/cooler (highest `--depth`) moving noticeably more than the board — smooth, lagged (not 1:1 instant), never more than ~30px of travel at the edges. Moving the mouse outside the hero should leave the last position (no snapping back required, but should feel stable, not jittery).

- [ ] **Step 3: Verify parallax is absent on touch/narrow**

In DevTools, switch to a mobile device emulation (e.g. iPhone 14, which reports `pointer: coarse`). Expected: no parallax response to simulated pointer events; `getComputedStyle(document.querySelector('.hero-composition')).getPropertyValue('--mx')` stays `0`.

- [ ] **Step 4: Commit**

```bash
git add js/hero.js
git commit -m "feat(hero): GSAP quickTo mouse parallax on desktop"
```

---

### Task 7: Responsive polish pass (mobile composition + full breakpoint sweep)

**Files:**
- Modify: `css/style.css` (new `@media (max-width: 767px)` block in the Hero section)

**Interfaces:**
- None — this is a pure CSS refinement of elements already produced by Tasks 2-3.

- [ ] **Step 1: Add the mobile-mode block to `css/style.css`**

Add after the Hero composition rules from Task 2:

```css
@media (max-width: 767px) {
  .hero { padding: 72px 0 56px; overflow: hidden; }
  .hero-inner { max-width: 100%; }
  .hero-composition {
    position: relative;
    top: auto;
    right: auto;
    margin: 32px auto 0;
    width: min(78vw, 380px);
    --explode-scale: 0.55;
    transform: none;
  }
  .hc-ssd, .hc-cooler { display: none; }
}
```

- [ ] **Step 2: Verify at 430px and 390px**

Set viewport width to 430px, then 390px, reload. Expected: single-column layout, text above composition, composition visibly present (not hidden) but smaller and with less separation, SSD and cooler shapes absent, zero horizontal scrollbar (`document.body.scrollWidth <= document.body.clientWidth`), CTA buttons remain tappable and fully visible.

- [ ] **Step 3: Verify at 1920px and 1366px**

Set viewport width to 1920px, then 1366px. Expected: two-column layout holds at both, composition does not overlap or crowd the text column, no layout breakage.

- [ ] **Step 4: Full keyboard pass**

At any desktop width, click the address bar then press Tab repeatedly. Expected order: logo → "Configurador" → "Presupuestos" → "Guías" → "Sobre" → language toggle → "Empezar a armar" → "Ver niveles de presupuesto" → into "Cómo funciona" section. Every focused element shows the existing mint `:focus-visible` outline, uncut by any `overflow: hidden`.

- [ ] **Step 5: Commit**

```bash
git add css/style.css
git commit -m "style(hero): mobile-mode composition sizing and layer reduction"
```

---

### Task 8: Full regression verification + diff report

**Files:** none modified — verification only.

**Interfaces:** none.

- [ ] **Step 1: Re-run the existing automated tests**

```bash
node scripts/validate-v2.js
node --test tests/v2/validate-v2.test.js
```

Expected: identical output to the pre-implementation baseline — `OK: contrato V2 valido. entries=71 offers=0 presets=0 evidence=76` and `# pass 38` / `# fail 0`.

- [ ] **Step 2: Manually check the compatibility engine test page**

Start `python3 -m http.server 8000`, open `http://localhost:8000/tests/compatibilidad.test.html`. Expected: same PASS/FAIL result as before any Hero work started (this file has no relationship to the Hero — a change here would indicate an unrelated regression, not a Hero bug).

- [ ] **Step 3: Sweep all 6 required breakpoints once more end-to-end**

1920px, 1440px, 1366px, 768px, 430px, 390px — for each, load `index.html` fresh and confirm: composition visible, no horizontal scroll, CTAs functional (click "Empezar a armar" → lands on `configurador.html`; click "Ver niveles de presupuesto" → scrolls to `#presupuestos`), nav toggle works below 720px.

- [ ] **Step 4: Confirm `prefers-reduced-motion` end-to-end**

With the OS-level or DevTools-emulated reduced-motion setting on, reload `index.html`. Expected: no entrance animation, no pin, no parallax, composition shown at its static resting position immediately.

- [ ] **Step 5: Produce the file-diff report**

```bash
git status --short
git diff --stat 1614c8e HEAD
```

Expected file list (nothing else): `index.html` (M), `css/style.css` (M), `js/hero.js` (A), `js/vendor/gsap.min.js` (A), `js/vendor/ScrollTrigger.min.js` (A), plus the two docs files from the spec/plan themselves. Paste this output into the final report to the user — this is the "revisar el diff completo y reportar exactamente qué archivos fueron modificados" deliverable requested before Fase 3 was approved.

- [ ] **Step 6: Final report to user (no commit — this task only verifies and reports)**

Summarize: baseline test results (before/after, identical), breakpoint sweep results, reduced-motion confirmation, and the exact file-diff list from Step 5.
