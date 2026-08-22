# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ArmaPC (tupcgamer.com) — a static educational site (HTML + CSS + vanilla JS, no framework, no build step) that teaches people how to build a gaming PC, with an interactive configurator that checks part compatibility in real time. Published via GitHub Pages (see `CNAME`). No `package.json`, no `npm install`, no bundler.

## Commands

**Run the site locally** (required for anything that `fetch()`s `data/*.json` — `file://` won't work):
```
python3 -m http.server 8000
```
then open `http://localhost:8000`. (VS Code's Live Server extension works too.)

**Run the compatibility engine tests** (loads the real `js/compatibilidad.js`, not a copy):
open `tests/compatibilidad.test.html` in a browser via the local server above — results show as PASS/FAIL on the page. No CLI runner.

**Validate the v2 data contract** (see "Two separate data systems" below):
```
node scripts/validate-v2.js              # validates data/v2/*.json against contract rules
node --test tests/v2/validate-v2.test.js  # unit tests for the validator itself
```
Both use only Node's built-ins (`node:test`, `node:assert`) — no dependencies, no `package.json`. Node 22+ assumed.

## Architecture

### Single source of truth, computed prices

`data/components.json` is the only place component data and prices live. It has `categories` (8: cpu, motherboard, ram, gpu, storage, psu, case, cooling), each with `items` carrying whatever compatibility-relevant fields apply to that category (`socket`, `ramType`, `formFactor`, `length`, `tdp`, etc.), and `tiers` (the 4 budget levels), each pointing at a preset of item **ids** (`components`) plus optional `alternatives` — never inline prices or duplicated specs. `js/nivel.js`, `js/home.js`, and `js/configurador.js` each independently sum prices from this same file, so the total shown on the homepage, a tier page, and the configurator can never drift apart. `data/guides.json` is separate and only holds guide index metadata (title, summary, tag, read time) — actual guide content lives in `guias/*.html`.

### i18n: three parallel HTML trees, one shared backend

Site content exists in 3 languages as **fully duplicated HTML files**, not templates: Spanish at the repo root, English under `en/`, Portuguese under `pt/` (mirroring `index.html`, `configurador.html`, `guias.html`, `sobre.html`, `contacto.html`, `privacidad.html`, `niveles/*.html`, `guias/*.html`). All three trees share the same `css/style.css` and `js/*.js` via relative `../` paths. The active language is read from `<html lang="es|en|pt">`; `rutaLocalizada()` in `js/main.js` rewrites a Spanish data path (`data/foo.json`) to its localized sibling (`data/foo.en.json`) so every JS module that fetches data automatically gets the right language without extra logic. **Editing content in one language does not propagate** — a change has to be applied by hand to the matching file in the other two trees.

### Compatibility engine (`js/compatibilidad.js`)

Three-state model per check, never a plain boolean:
- `incompatible` — confirmed by real data, blocks the pick.
- `aviso` — works but isn't ideal, doesn't block.
- `no_verificado` — missing data to decide either way. **Never treated as incompatible** — the engine refuses to block a part just because a spec is unknown.

`tests/compatibilidad.test.html` exercises this file directly (import, not reimplementation) with fixtures — some fixtures are intentionally synthetic (e.g. a DDR4 part that doesn't exist in the real catalog) to isolate a rule without touching the public data.

### Two separate data systems — do not conflate them

1. **Live site data**: `data/components.json` (+ `.en`/`.pt`) and `data/guides.json` (+ `.en`/`.pt`). This is what every page actually fetches and renders. `data/catalog.json` (+ `.en`/`.pt`) is a **different, older schema** (tier → inline `recommended` objects, no stable ids) that is **not read by any page or script** — it only exists as legacy source material.

2. **`data/v2/` — in-progress "Contrato V2" catalog redesign**: a from-scratch, not-yet-integrated data contract (`catalog.v2.json`, `offers.v2.json`, `presets.v2.json`, `evidence.v2.json`, JSON Schemas and controlled vocabularies under `data/v2/schema/`) that separates product *identity/specs* from *evidence*, from *commercial offers*, with a `family` (chip/chipset/platform) vs `product` (concrete, brand+model+part-number physical item) distinction and a strict verification model (`verification.status`, `officialSources`, `technicalFieldEvidence`) enforced by `scripts/validate-v2.js`. **Full rules, rationale, and current population status are in `docs/CONTRATO_V2.md` — read it before adding or changing anything under `data/v2/`.** Its central discipline: never fill a field from inference or from a source weaker than the documented hierarchy (official manufacturer page/datasheet > official retailer > third party, the last usable only for discovery, never as cited evidence) — leave it `null` and list it in `unknownFields` instead. This system is not wired into the live site yet.

### Security

All data-derived text goes through `escapeHtml()` (`js/main.js`) before any `innerHTML` insertion, sitewide.
