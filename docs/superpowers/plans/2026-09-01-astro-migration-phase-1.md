# Migración a Astro — Fase 1 (scaffold + home 3 idiomas + animejs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar Astro en el repo con build estático, portar la home (`index.html`, `en/index.html`, `pt/index.html`) a componentes Astro con i18n nativo, y tener `animejs` instalado y usándose en una animación de entrada del hero, sin romper ninguna URL pública ni el resto del sitio viejo.

**Architecture:** Astro se instala en la raíz del repo. Todo lo nuevo vive en `src/` y `public/`. Los HTML viejos y `js/`, `css/`, `data/` de la raíz siguen intactos y funcionales; solo `index.html`, `en/index.html` y `pt/index.html` se eliminan al final de esta fase, una vez verificada la paridad. El build (`npm run build`) genera `dist/` estático con `build.format: 'file'` para conservar la extensión `.html` en las URLs. Un workflow de GitHub Actions buildea y publica a GitHub Pages.

**Tech Stack:** Astro 4.x, Node 22 (ya instalado, v22.23.2 / npm 10.9.8), `animejs` 3.x, GitHub Actions (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`). Verificación con Node built-ins (`node:test`, `node:assert`) sobre `dist/`.

**Spec:** `docs/superpowers/specs/2026-09-01-astro-migration-design.md`

## Global Constraints

- **Sin backend.** Output 100% estático. Nada de SSR ni adapters de servidor.
- **Node 22+**, sin añadir herramientas de test nuevas: verificación solo con `node:test` / `node:assert`.
- **URLs públicas intactas:** la home debe seguir servida en `/` (es), `/en/` y `/pt/`. El resto de URLs (`/configurador.html`, `/guias.html`, `/niveles/*.html`, `/guias/*.html`, `/sobre.html`, `/contacto.html`, `/privacidad.html`) las sirve el sitio viejo copiado a `public/` sin cambios.
- **`astro.config.mjs`:** `site: 'https://tupcgamer.com'`, `base: '/'`, `build: { format: 'file' }`, `i18n: { defaultLocale: 'es', locales: ['es','en','pt'], routing: { prefixDefaultLocale: false } }`.
- **CSS compartido:** se sigue usando `css/style.css` tal cual (copiado a `public/css/style.css`). No se refactoriza CSS en esta fase.
- **Archivos que deben seguir sirviéndose desde la raíz del dominio:** `CNAME` (contenido: `tupcgamer.com`), `robots.txt`, `sitemap.xml`, `favicon.svg`, `favicon`/`googlec378141724be809c.html`, `.nojekyll` (nuevo, requerido por Pages para servir `_astro/`).
- **gtag:** el snippet de Google Analytics (`G-GH7D533JHR`) va en el layout base, idéntico al actual.
- **Todo texto derivado de datos se escapa** con `escapeHtml()` antes de `innerHTML` — en esta fase no hay datos externos nuevos, pero el helper migrado debe conservarse.
- **Mensajes de commit** en español, prefijo Conventional Commits (`feat:`, `chore:`, `docs:`, `test:`), como en el historial del repo.

---

### Task 1: Scaffold de Astro y configuración base

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/pages/index.astro` (placeholder temporal)
- Create: `.nojekyll`
- Modify: `.gitignore` (añadir `node_modules/`, `dist/`, `.astro/`)

**Interfaces:**
- Consumes: nada.
- Produces: proyecto Astro instalable con `npm install` y buildeable con `npm run build` → `dist/index.html`. Scripts npm: `dev` (`astro dev`), `build` (`astro build`), `preview` (`astro preview`).

- [ ] **Step 1: Crear `package.json`**

```json
{
  "name": "armapc",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check:dist": "node --test tests/dist/"
  },
  "devDependencies": {
    "astro": "^4.15.0"
  }
}
```

- [ ] **Step 2: Instalar dependencias**

Run: `npm install`
Expected: se crea `node_modules/` y `package-lock.json` sin errores.

- [ ] **Step 3: Crear `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tupcgamer.com',
  base: '/',
  build: { format: 'file' },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'pt'],
    routing: { prefixDefaultLocale: false },
  },
});
```

- [ ] **Step 4: Crear `tsconfig.json`**

```json
{ "extends": "astro/tsconfigs/strict" }
```

- [ ] **Step 5: Crear `.nojekyll` vacío y placeholder `src/pages/index.astro`**

`.nojekyll`: archivo vacío.

`src/pages/index.astro`:
```astro
---
---
<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>ArmaPC</title></head>
  <body><p>Astro scaffold OK</p></body>
</html>
```

- [ ] **Step 6: Actualizar `.gitignore`**

Contenido final:
```
.worktrees/
node_modules/
dist/
.astro/
```

- [ ] **Step 7: Verificar el build**

Run: `npm run build`
Expected: termina sin errores; existe `dist/index.html` conteniendo el texto `Astro scaffold OK`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json .nojekyll .gitignore src/pages/index.astro
git commit -m "chore: scaffold Astro con build estatico e i18n es/en/pt"
```

---

### Task 2: Copiar assets estáticos y páginas legacy a `public/`

**Files:**
- Create: `public/css/style.css` (copia de `css/style.css`)
- Create: `public/js/` (copia de todo `js/`)
- Create: `public/data/` (copia de todo `data/`, incluido `data/v2/`)
- Create: `public/img/`, `public/Icons/` (copias)
- Create: `public/favicon.svg`, `public/robots.txt`, `public/sitemap.xml`, `public/CNAME`, `public/googlec378141724be809c.html` (copias)
- Create: `public/configurador.html`, `public/guias.html`, `public/sobre.html`, `public/contacto.html`, `public/privacidad.html` (copias)
- Create: `public/niveles/` (copia de `niveles/`), `public/guias/` (copia de `guias/` — carpeta de páginas HTML, no confundir con `guias.html`)
- Create: `public/en/`, `public/pt/` EXCEPTO `en/index.html` y `pt/index.html` (esas las genera Astro en Task 6)

**Interfaces:**
- Consumes: proyecto Astro de Task 1.
- Produces: `dist/` tras `npm run build` contiene todas las URLs legacy servidas tal cual desde `public/`. Astro copia `public/` a `dist/` verbatim.

- [ ] **Step 1: Escribir el test de verificación de dist**

Create `tests/dist/legacy-assets.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');

const rutasQueDebenExistir = [
  'css/style.css',
  'js/compatibilidad.js',
  'js/main.js',
  'data/components.json',
  'data/components.en.json',
  'data/components.pt.json',
  'configurador.html',
  'guias.html',
  'sobre.html',
  'contacto.html',
  'privacidad.html',
  'robots.txt',
  'sitemap.xml',
  'favicon.svg',
  'CNAME',
  'googlec378141724be809c.html',
  '.nojekyll',
  'en/configurador.html',
  'pt/configurador.html',
];

for (const rel of rutasQueDebenExistir) {
  test(`dist contiene ${rel}`, () => {
    assert.ok(existsSync(join(dist, rel)), `falta dist/${rel}`);
  });
}

test('CNAME apunta a tupcgamer.com', () => {
  assert.equal(readFileSync(join(dist, 'CNAME'), 'utf8').trim(), 'tupcgamer.com');
});
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npm run build && npm run check:dist`
Expected: FAIL — la mayoría de rutas no existen todavía en `dist/`.

- [ ] **Step 3: Copiar los assets a `public/`**

Run (bash, desde la raíz):
```bash
mkdir -p public
cp -r css public/css
cp -r js public/js
cp -r data public/data
cp -r img public/img
cp -r Icons public/Icons
cp favicon.svg robots.txt sitemap.xml CNAME googlec378141724be809c.html public/
cp configurador.html guias.html sobre.html contacto.html privacidad.html public/
cp -r niveles public/niveles
cp -r guias public/guias
mkdir -p public/en public/pt
cp -r en/. public/en/
cp -r pt/. public/pt/
rm -f public/en/index.html public/pt/index.html
```

Nota: `css/`, `js/`, `data/` de la raíz se mantienen también (el sitio viejo sigue funcionando con `python -m http.server` hasta que toda la migración termine).

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npm run build && npm run check:dist`
Expected: PASS — todas las rutas existen, CNAME correcto.

- [ ] **Step 5: Commit**

```bash
git add public tests/dist/legacy-assets.test.js
git commit -m "chore: copiar assets y paginas legacy a public/ para build de Astro"
```

---

### Task 3: Layout base + helper i18n

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/i18n/es.json`
- Create: `src/i18n/en.json`
- Create: `src/i18n/pt.json`
- Create: `src/i18n/index.ts`
- Test: `tests/dist/base-layout.test.js`

**Interfaces:**
- Consumes: `astro.config.mjs` i18n de Task 1.
- Produces:
  - `Base.astro` — props: `{ lang: 'es'|'en'|'pt', title: string, description: string, canonical: string, ogLocale: string }`. Renderiza `<!doctype html>`, `<html lang>`, `<head>` completo (charset, viewport, favicon, description, canonical, 4 `hreflang`, OG/Twitter, preconnect+link de Google Fonts, `<link rel="stylesheet" href="/css/style.css">`, snippet gtag `G-GH7D533JHR`), y `<body><slot /></body>`.
  - `t(lang, key)` de `src/i18n/index.ts` — devuelve el string de `<lang>.json` por `key` (dot-path), con fallback a `es.json`, y a la key cruda si no existe en ninguno.

- [ ] **Step 1: Escribir el test**

Create `tests/dist/base-layout.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = () => readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8');

test('home lleva lang=es', () => {
  assert.match(html(), /<html[^>]*lang="es"/);
});
test('home carga /css/style.css', () => {
  assert.match(html(), /<link[^>]+href="\/css\/style\.css"/);
});
test('home incluye gtag G-GH7D533JHR', () => {
  assert.match(html(), /G-GH7D533JHR/);
});
test('home tiene los 3 hreflang + x-default', () => {
  const h = html();
  assert.match(h, /hreflang="es"[^>]*href="https:\/\/tupcgamer\.com\/"/);
  assert.match(h, /hreflang="en"[^>]*href="https:\/\/tupcgamer\.com\/en\/"/);
  assert.match(h, /hreflang="pt"[^>]*href="https:\/\/tupcgamer\.com\/pt\/"/);
  assert.match(h, /hreflang="x-default"/);
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `npm run build && node --test tests/dist/base-layout.test.js`
Expected: FAIL — el placeholder `index.astro` no tiene nada de eso.

- [ ] **Step 3: Crear los JSON de i18n (solo las keys de la home)**

`src/i18n/es.json`:
```json
{
  "meta": {
    "homeTitle": "ArmaPC — Arma tu PC gamer ideal, sin importar tu presupuesto",
    "homeDesc": "Aprende a armar tu propia PC gamer, desde el modelo más económico hasta el más caro, con un configurador que verifica la compatibilidad en tiempo real."
  },
  "nav": { "inicio": "Inicio", "configurador": "Configurador", "presupuesto": "Presupuesto", "guias": "Guías", "contacto": "Contacto", "sobre": "Sobre", "comenzar": "Comenzar" },
  "footer": { "sobre": "Sobre", "contacto": "Contacto", "privacidad": "Privacidad", "copyright": "© 2026 ArmaPC" },
  "lang": { "label": "Español" }
}
```

`src/i18n/en.json`:
```json
{
  "meta": {
    "homeTitle": "ArmaPC — Build your ideal gaming PC, on any budget",
    "homeDesc": "Learn how to build your own gaming PC, from the most affordable build to the most powerful, with a configurator that checks compatibility in real time."
  },
  "nav": { "inicio": "Home", "configurador": "Configurator", "presupuesto": "Budgets", "guias": "Guides", "contacto": "Contact", "sobre": "About", "comenzar": "Get started" },
  "footer": { "sobre": "About", "contacto": "Contact", "privacidad": "Privacy", "copyright": "© 2026 ArmaPC" },
  "lang": { "label": "English" }
}
```

`src/i18n/pt.json`:
```json
{
  "meta": {
    "homeTitle": "ArmaPC — Monte seu PC gamer ideal, seja qual for seu orçamento",
    "homeDesc": "Aprenda a montar seu próprio PC gamer, do modelo mais econômico ao mais caro, com um configurador que verifica a compatibilidade em tempo real."
  },
  "nav": { "inicio": "Início", "configurador": "Configurador", "presupuesto": "Orçamento", "guias": "Guias", "contacto": "Contato", "sobre": "Sobre", "comenzar": "Começar" },
  "footer": { "sobre": "Sobre", "contacto": "Contato", "privacidad": "Privacidade", "copyright": "© 2026 ArmaPC" },
  "lang": { "label": "Português" }
}
```

> Nota para el implementador: los textos EN/PT de arriba se toman de `en/index.html` y `pt/index.html` actuales. Si un string difiere del HTML legacy, gana el del HTML legacy — copiarlo textual.

- [ ] **Step 4: Crear `src/i18n/index.ts`**

```ts
import es from './es.json';
import en from './en.json';
import pt from './pt.json';

export type Lang = 'es' | 'en' | 'pt';
const dict: Record<Lang, unknown> = { es, en, pt };

function pick(obj: unknown, path: string): string | undefined {
  return path.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object' && k in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj) as string | undefined;
}

export function t(lang: Lang, key: string): string {
  return pick(dict[lang], key) ?? pick(dict.es, key) ?? key;
}

export const locales: Lang[] = ['es', 'en', 'pt'];

/** Reescribe una ruta de dato en español a su equivalente localizado. */
export function rutaLocalizada(ruta: string, lang: Lang): string {
  return lang === 'es' ? ruta : ruta.replace(/\.json$/, `.${lang}.json`);
}
```

- [ ] **Step 5: Crear `src/layouts/Base.astro`**

```astro
---
import type { Lang } from '../i18n';
interface Props {
  lang: Lang;
  title: string;
  description: string;
  canonical: string;
  ogLocale: string;
}
const { lang, title, description, canonical, ogLocale } = Astro.props;
---
<!doctype html>
<html lang={lang}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hreflang="es" href="https://tupcgamer.com/" />
  <link rel="alternate" hreflang="en" href="https://tupcgamer.com/en/" />
  <link rel="alternate" hreflang="pt" href="https://tupcgamer.com/pt/" />
  <link rel="alternate" hreflang="x-default" href="https://tupcgamer.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ArmaPC" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:locale" content={ogLocale} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/style.css" />
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-GH7D533JHR"></script>
  <script is:inline>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-GH7D533JHR');
  </script>
</head>
<body>
  <slot />
</body>
</html>
```

- [ ] **Step 6: Cablear el placeholder `src/pages/index.astro` al layout (temporal, solo para pasar el test)**

```astro
---
import Base from '../layouts/Base.astro';
import { t } from '../i18n';
---
<Base
  lang="es"
  title={t('es', 'meta.homeTitle')}
  description={t('es', 'meta.homeDesc')}
  canonical="https://tupcgamer.com/"
  ogLocale="es_PE"
>
  <p>home es — pendiente Task 5</p>
</Base>
```

- [ ] **Step 7: Correr y ver pasar**

Run: `npm run build && node --test tests/dist/base-layout.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/layouts/Base.astro src/i18n tests/dist/base-layout.test.js src/pages/index.astro
git commit -m "feat: layout base de Astro y helper i18n (es/en/pt)"
```

---

### Task 4: Componentes Header y Footer

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/NavScript.astro` (JS inline del menú móvil + selector de idioma, portado de `js/main.js`)
- Test: `tests/dist/header-footer.test.js`

**Interfaces:**
- Consumes: `t(lang, key)` de `src/i18n`.
- Produces:
  - `Header.astro` — props `{ lang: Lang }`. Marca el link activo con `aria-current="page"` cuando corresponde a "Inicio". Los `href` respetan el locale: en `es` son `/configurador.html`, en `en` son `/en/configurador.html`, en `pt` `/pt/configurador.html`. El selector de idioma enlaza a `/`, `/en/`, `/pt/`.
  - `Footer.astro` — props `{ lang: Lang }`. Links a `sobre.html`, `contacto.html`, `privacidad.html` con el mismo prefijo de locale.
  - `NavScript.astro` — sin props. Emite un `<script is:inline>` con el comportamiento de `js/main.js` (toggle `.lang-menu[hidden]`, toggle `.main-nav.open`, cerrar con click afuera y Escape). NO incluye `escapeHtml` ni `t()` de runtime (eso quedó server-side).

- [ ] **Step 1: Escribir el test**

Create `tests/dist/header-footer.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel) => readFileSync(join(process.cwd(), 'dist', rel), 'utf8');

test('header ES enlaza a /configurador.html', () => {
  assert.match(read('index.html'), /href="\/configurador\.html"/);
});
test('header EN enlaza a /en/configurador.html', () => {
  assert.ok(existsSync(join(process.cwd(), 'dist', 'en', 'index.html')));
  assert.match(read('en/index.html'), /href="\/en\/configurador\.html"/);
});
test('footer tiene link a privacidad', () => {
  assert.match(read('index.html'), /href="\/privacidad\.html"/);
});
test('nav trae el script de menu movil', () => {
  assert.match(read('index.html'), /nav-toggle/);
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `npm run build && node --test tests/dist/header-footer.test.js`
Expected: FAIL (`dist/en/index.html` no existe aún; falta el markup).

- [ ] **Step 3: Crear `src/components/Header.astro`**

Portar el `<header class="site-header">` de `index.html` (líneas ~39-78). Reemplazar textos por `t(lang, 'nav.*')`. Construir el prefijo de locale:
```astro
---
import { t } from '../i18n';
import type { Lang } from '../i18n';
interface Props { lang: Lang; current?: string }
const { lang, current } = Astro.props;
const p = lang === 'es' ? '' : `/${lang}`;
---
<header class="site-header">
  <div class="container header-inner">
    <a href={`${p}/index.html`.replace('/index.html', lang === 'es' ? '/' : `/${lang}/`)} class="logo">
      <svg class="logo-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2.6 20.4 7v10L12 21.4 3.6 17V7L12 2.6Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M12 12 20.4 7M12 12v9.4M12 12 3.6 7" stroke="currentColor" stroke-width="1.1" stroke-opacity="0.55"/>
      </svg>
      <span class="logo-text">Arma<span>PC</span></span>
    </a>
    <nav class="main-nav" id="main-nav" aria-label="Principal">
      <a href={lang === 'es' ? '/' : `/${lang}/`} class={current === 'inicio' ? 'is-current' : undefined} aria-current={current === 'inicio' ? 'page' : undefined}>{t(lang, 'nav.inicio')}</a>
      <a href={`${p}/configurador.html`}>{t(lang, 'nav.configurador')}</a>
      <a href="#presupuestos">{t(lang, 'nav.presupuesto')}</a>
      <a href={`${p}/guias.html`}>{t(lang, 'nav.guias')}</a>
      <a href={`${p}/contacto.html`}>{t(lang, 'nav.contacto')}</a>
      <a href={`${p}/sobre.html`}>{t(lang, 'nav.sobre')}</a>
      <a href={`${p}/configurador.html`} class="nav-cta">
        {t(lang, 'nav.comenzar')}
        <span class="nav-cta-arrow" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </a>
      <div class="lang-switch mono" id="lang-switch">
        <button type="button" class="lang-toggle" aria-haspopup="true" aria-expanded="false">{t(lang, 'lang.label')} <span class="lang-arrow">▾</span></button>
        <div class="lang-menu" hidden>
          <a href="/">Español</a>
          <a href="/en/">English</a>
          <a href="/pt/">Português</a>
        </div>
      </div>
    </nav>
    <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menú" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
```
> El implementador debe comparar el markup final contra `index.html` líneas 39-78 y `en/index.html` / `pt/index.html` equivalentes, y ajustar cualquier diferencia de clases/atributos a favor del legacy.

- [ ] **Step 4: Crear `src/components/Footer.astro`**

```astro
---
import { t } from '../i18n';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const p = lang === 'es' ? '' : `/${lang}`;
---
<footer class="site-footer">
  <div class="container footer-inner">
    <span>{t(lang, 'footer.copyright')}</span>
    <div class="footer-links">
      <a href={`${p}/sobre.html`}>{t(lang, 'footer.sobre')}</a>
      <a href={`${p}/contacto.html`}>{t(lang, 'footer.contacto')}</a>
      <a href={`${p}/privacidad.html`}>{t(lang, 'footer.privacidad')}</a>
    </div>
  </div>
</footer>
```

- [ ] **Step 5: Crear `src/components/NavScript.astro`**

```astro
<script is:inline>
  document.querySelectorAll('.lang-switch').forEach((switcher) => {
    const toggle = switcher.querySelector('.lang-toggle');
    const menu = switcher.querySelector('.lang-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const abierto = !menu.hidden;
      menu.hidden = abierto;
      toggle.setAttribute('aria-expanded', String(!abierto));
    });
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
    });
  });
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => { mainNav.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); });
    });
  }
</script>
```

- [ ] **Step 6: Añadir rutas `en` y `pt` mínimas para que el test corra**

Create `src/pages/en/index.astro` y `src/pages/pt/index.astro` (placeholders con Header/Footer):
```astro
---
import Base from '../../layouts/Base.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import NavScript from '../../components/NavScript.astro';
import { t } from '../../i18n';
const lang = 'en';
---
<Base lang={lang} title={t(lang,'meta.homeTitle')} description={t(lang,'meta.homeDesc')} canonical="https://tupcgamer.com/en/" ogLocale="en_US">
  <Header lang={lang} current="inicio" />
  <main><p>home en — pendiente Task 5</p></main>
  <Footer lang={lang} />
  <NavScript />
</Base>
```
(el de `pt` idéntico con `lang = 'pt'`, canonical `.../pt/`, ogLocale `pt_BR`.)

Y actualizar `src/pages/index.astro` para incluir `Header`/`Footer`/`NavScript` igual, con `lang = 'es'`.

- [ ] **Step 7: Correr y ver pasar**

Run: `npm run build && node --test tests/dist/header-footer.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components src/pages
git commit -m "feat: componentes Header, Footer y NavScript con i18n"
```

---

### Task 5: Portar el contenido de la home a componentes

**Files:**
- Create: `src/components/home/Hero.astro`
- Create: `src/components/home/Accesos.astro`
- Create: `src/components/home/Presupuestos.astro`
- Create: `src/components/home/` (un `.astro` por cada `<section>` restante de `index.html`)
- Create: `src/components/home/HomePriceScript.astro` (porta `js/home.js` como `<script>` de Astro, no inline — usa `fetch('/data/components.json')` con ruta localizada)
- Modify: `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/pt/index.astro`
- Modify: `src/i18n/es.json`, `src/i18n/en.json`, `src/i18n/pt.json` (todas las keys de texto de la home)
- Test: `tests/dist/home-parity.test.js`

**Interfaces:**
- Consumes: `Base`, `Header`, `Footer`, `NavScript`, `t(lang, key)`, `rutaLocalizada(ruta, lang)`.
- Produces: `dist/index.html`, `dist/en/index.html`, `dist/pt/index.html` con el mismo contenido visible y estructura de secciones que los `index.html` legacy respectivos. Los `data-reveal`, `id` de sección (`#presupuestos`, etc.) y clases CSS se conservan idénticos (son el contrato con `css/style.css` y con `js/motion.js`, que sigue cargándose desde el layout legacy… ver Step 4).

- [ ] **Step 1: Escribir el test de paridad**

Create `tests/dist/home-parity.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel) => readFileSync(join(process.cwd(), 'dist', rel), 'utf8');

// Anclas y contratos de CSS/JS que NO pueden desaparecer.
const contratos = ['id="presupuestos"', 'data-reveal', 'data-tier-price', 'class="lp-hero', 'class="site-footer"'];

for (const rel of ['index.html', 'en/index.html', 'pt/index.html']) {
  for (const c of contratos) {
    test(`${rel} conserva ${c}`, () => {
      assert.ok(read(rel).includes(c), `${rel} perdió ${c}`);
    });
  }
}

test('home ES tiene el h1 del hero', () => {
  assert.match(read('index.html'), /<h1[^>]*class="lp-hero-title"/);
});
test('home ES suma precios de niveles vía script', () => {
  assert.match(read('index.html'), /data\/components\.json/);
});
test('home EN usa components.en.json', () => {
  assert.match(read('en/index.html'), /data\/components\.en\.json/);
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `npm run build && node --test tests/dist/home-parity.test.js`
Expected: FAIL — placeholders, sin secciones reales.

- [ ] **Step 3: Extraer cada `<section>` de `index.html` a un componente**

Método, sección por sección (líneas de referencia en `index.html`: hero ~80-325, `lp-access` ~328+, resto hasta `</main>` ~603):
1. Copiar el HTML de la sección tal cual dentro de un nuevo `src/components/home/<Nombre>.astro`.
2. Añadir `interface Props { lang: Lang }` + `const { lang } = Astro.props;` en el frontmatter.
3. Reemplazar **solo los nodos de texto visible** por `{t(lang, 'home.<seccion>.<key>')}`, y añadir esas keys a los 3 JSON de i18n tomando ES de `index.html`, EN de `en/index.html`, PT de `pt/index.html`.
4. No tocar `class`, `id`, `data-*`, `aria-*`, SVGs ni estructura.

- [ ] **Step 4: Portar `js/home.js` y `js/motion.js`**

Create `src/components/home/HomePriceScript.astro` con un `<script>` (procesado por Astro, no `is:inline`) que:
- Define `rutaLocalizada` localmente o recibe la ruta ya resuelta vía `define:vars={{ dataUrl }}` desde la página (preferido: `<script define:vars={{ dataUrl }}>`).
- Reproduce `cargarPreciosDeNiveles()` de `js/home.js` usando `dataUrl` en vez de `rutaLocalizada('/data/components.json')`.

Para el scroll-reveal: seguir usando el archivo legacy — en el layout/página añadir `<script src="/js/motion.js" is:inline></script>` (el archivo ya está en `public/js/` por Task 2 y es un IIFE idempotente). Documentarlo como deuda: se migrará a módulo en una fase posterior.

- [ ] **Step 5: Ensamblar las 3 páginas**

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import NavScript from '../components/NavScript.astro';
import Hero from '../components/home/Hero.astro';
import Accesos from '../components/home/Accesos.astro';
import Presupuestos from '../components/home/Presupuestos.astro';
/* ...resto de secciones... */
import HomePriceScript from '../components/home/HomePriceScript.astro';
import { t, rutaLocalizada } from '../i18n';
const lang = 'es';
const dataUrl = rutaLocalizada('/data/components.json', lang);
---
<Base lang={lang} title={t(lang,'meta.homeTitle')} description={t(lang,'meta.homeDesc')} canonical="https://tupcgamer.com/" ogLocale="es_PE">
  <Header lang={lang} current="inicio" />
  <main class="lp">
    <Hero lang={lang} />
    <Accesos lang={lang} />
    <Presupuestos lang={lang} />
    {/* ...resto... */}
  </main>
  <Footer lang={lang} />
  <NavScript />
  <HomePriceScript dataUrl={dataUrl} />
  <script src="/js/motion.js" is:inline></script>
</Base>
```
`en/index.astro` y `pt/index.astro` idénticos salvo `lang`, `canonical`, `ogLocale`.

- [ ] **Step 6: Correr los tests de dist completos**

Run: `npm run build && npm run check:dist && node --test tests/dist/`
Expected: PASS en todos (`legacy-assets`, `base-layout`, `header-footer`, `home-parity`).

- [ ] **Step 7: Verificación visual manual**

Run: `npm run preview`
Abrir `http://localhost:4321/`, `/en/`, `/pt/`. Comparar contra el sitio legacy (`python -m http.server 8000` en otra terminal → `http://localhost:8000/`). Checklist:
- Hero, secciones y footer se ven iguales.
- Precios de niveles cargan (`data-tier-price` se llena con `US$...`).
- Selector de idioma abre/cierra y navega.
- Menú móvil (viewport angosto) abre/cierra.
- Scroll-reveal anima las tarjetas `[data-reveal]`.

- [ ] **Step 8: Commit**

```bash
git add src tests/dist/home-parity.test.js
git commit -m "feat: portar la home (es/en/pt) a componentes Astro"
```

---

### Task 6: Instalar animejs y animar la entrada del hero

**Files:**
- Modify: `package.json` (dependencia `animejs`)
- Create: `src/components/home/HeroAnim.astro`
- Modify: `src/components/home/Hero.astro` (montar `HeroAnim`)
- Test: `tests/dist/hero-anim.test.js`

**Interfaces:**
- Consumes: `Hero.astro` de Task 5.
- Produces: bundle JS de la home que importa `animejs` y, al cargar, hace un fade/slide-in de `.lp-hero-copy` y las capas `.lp-layer` del SVG. Respeta `prefers-reduced-motion` (si está activo, no anima y deja todo visible). Sin CLS: los elementos parten visibles vía CSS; la animación solo refina.

- [ ] **Step 1: Escribir el test**

Create `tests/dist/hero-anim.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

test('el bundle de la home incluye animejs', () => {
  const astroDir = join(process.cwd(), 'dist', '_astro');
  const js = readdirSync(astroDir).filter((f) => f.endsWith('.js'));
  const algunoImportaAnime = js.some((f) => {
    const c = readFileSync(join(astroDir, f), 'utf8');
    return c.includes('anime') && (c.includes('translateX') || c.includes('easing') || c.includes('duration'));
  });
  assert.ok(algunoImportaAnime, 'ningún chunk de _astro referencia animejs');
});

test('index.html referencia un módulo de _astro', () => {
  assert.match(readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8'), /_astro\/.+\.js/);
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `npm run build && node --test tests/dist/hero-anim.test.js`
Expected: FAIL — no hay chunk con animejs.

- [ ] **Step 3: Instalar animejs**

Run: `npm install animejs@^3.2.2`
Expected: `package.json` → `"dependencies": { "animejs": "^3.2.2" }`, sin errores.

- [ ] **Step 4: Crear `src/components/home/HeroAnim.astro`**

```astro
<script>
  import anime from 'animejs';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    const copy = document.querySelector('.lp-hero-copy');
    const layers = document.querySelectorAll('.lp-hero-art .lp-layer');

    if (copy) {
      anime({
        targets: copy,
        opacity: [0, 1],
        translateY: [16, 0],
        easing: 'easeOutquad',
        duration: 600,
      });
    }
    if (layers.length) {
      anime({
        targets: layers,
        opacity: [0, 1],
        translateY: [12, 0],
        delay: anime.stagger(80, { start: 150 }),
        easing: 'easeOutquad',
        duration: 500,
      });
    }
  }
</script>
```

- [ ] **Step 5: Montar `HeroAnim` en `Hero.astro`**

Añadir `import HeroAnim from './HeroAnim.astro';` en el frontmatter y `<HeroAnim />` al final del markup del componente (una sola vez; la home lo incluye en los 3 idiomas vía `Hero`).

- [ ] **Step 6: Correr y ver pasar**

Run: `npm run build && node --test tests/dist/hero-anim.test.js`
Expected: PASS.

- [ ] **Step 7: Verificación visual**

Run: `npm run preview` → `http://localhost:4321/`
- Al cargar, el copy del hero y las capas del SVG entran con fade/slide.
- Con `prefers-reduced-motion: reduce` (DevTools → Rendering → Emulate CSS media), no hay animación y todo se ve.
- Sin parpadeo/salto de layout.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/components/home/HeroAnim.astro src/components/home/Hero.astro tests/dist/hero-anim.test.js
git commit -m "feat: animejs y animacion de entrada del hero de la home"
```

---

### Task 7: Workflow de deploy a GitHub Pages y baja de la home legacy

**Files:**
- Create: `.github/workflows/deploy.yml`
- Delete: `index.html`, `en/index.html`, `pt/index.html`
- Modify: `CLAUDE.md` (sección "Commands" y "What this is": documentar `npm run dev` / `npm run build`, y que la home ahora es Astro)
- Test: `tests/dist/no-legacy-home.test.js`

**Interfaces:**
- Consumes: build completo de Tasks 1-6.
- Produces: en push a `main`, GitHub Actions buildea y publica `dist/` a Pages. La home legacy ya no existe en la raíz del repo; la sirve Astro.

- [ ] **Step 1: Escribir el test**

Create `tests/dist/no-legacy-home.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

test('no quedó index.html legacy en la raíz del repo', () => {
  assert.ok(!existsSync(join(process.cwd(), 'en', 'index.html')), 'en/index.html sigue existiendo');
  assert.ok(!existsSync(join(process.cwd(), 'pt', 'index.html')), 'pt/index.html sigue existiendo');
});
test('la home la genera Astro', () => {
  assert.ok(existsSync(join(process.cwd(), 'src', 'pages', 'index.astro')));
});
```

- [ ] **Step 2: Correr y ver fallar**

Run: `node --test tests/dist/no-legacy-home.test.js`
Expected: FAIL — los `index.html` legacy siguen ahí.

- [ ] **Step 3: Crear `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm run check:dist
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Borrar la home legacy**

Run:
```bash
git rm index.html en/index.html pt/index.html
```

- [ ] **Step 5: Actualizar `CLAUDE.md`**

En "## Commands" añadir antes de "Run the site locally":
```
**Dev / build (Astro)** — la home ya está migrada a Astro:
```
npm install
npm run dev      # servidor de desarrollo con hot-reload
npm run build    # genera dist/ estático
npm run check:dist  # verifica el output (node --test tests/dist/)
```
El resto de páginas todavía son HTML estático servido desde public/.
```
En "### i18n: three parallel HTML trees" añadir una nota: "La home (`/`, `/en/`, `/pt/`) ya NO usa este patrón — se genera desde `src/pages/**/index.astro` + `src/i18n/*.json`. El resto de páginas sí."

- [ ] **Step 6: Correr toda la verificación**

Run: `npm run build && node --test tests/dist/`
Expected: PASS en todos los archivos, incluido `no-legacy-home`.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/deploy.yml CLAUDE.md tests/dist/no-legacy-home.test.js
git rm index.html en/index.html pt/index.html
git commit -m "feat: deploy de Astro a GitHub Pages y baja de la home legacy"
```

- [ ] **Step 8: Nota de handoff**

Tras mergear a `main`: verificar en Settings → Pages que "Source" esté en "GitHub Actions" (no "Deploy from a branch"). Es un cambio manual de una sola vez en la config del repo en GitHub — documentarlo en el PR.

---

## Self-Review

**1. Spec coverage:**
- Astro + build estático + GitHub Pages → Tasks 1, 7. ✓
- i18n nativo (es raíz, en/pt prefijo) → Tasks 1, 3, 4, 5. ✓
- `build.format: 'file'` para URLs `.html` → Task 1 (constraint global + config). ✓
- Sitio viejo convive durante la migración → Task 2 (copia a `public/`), solo la home legacy se borra (Task 7). ✓
- `CNAME`, `robots.txt`, `sitemap.xml`, verificación Google, `.nojekyll` → Tasks 1, 2 (+ test en `legacy-assets`). ✓
- `js/compatibilidad.js` intacto y tests siguen → no se toca; copiado a `public/js/`; sus tests de navegador no cambian. ✓ (la migración del motor a `src/lib/` es fase posterior, fuera de alcance — coincide con spec "Orden de migración" punto d).
- Contrato V2 sin tocar → `data/v2/` se copia verbatim; `scripts/validate-v2.js` no se modifica. ✓
- animejs instalado y usado una vez (hero) → Task 6. ✓
- gtag en layout base → Task 3. ✓
- GA/analytics, orden de migración, riesgo `.html` → todos cubiertos o explícitamente diferidos.

**2. Placeholder scan:** Los `src/pages/*.astro` "placeholder" de Tasks 1, 3, 4 son intencionales y cada uno se reemplaza en una task posterior explícita (Task 5). No hay "TODO/TBD" sin dueño. El "resto de secciones" en Task 5 Step 3 tiene método concreto y líneas de referencia. ✓

**3. Type consistency:**
- `t(lang, key)` — firma `(lang: Lang, key: string) => string`, usada igual en Tasks 3-6. ✓
- `rutaLocalizada(ruta, lang)` — definida en Task 3 `src/i18n/index.ts`, usada en Task 5. ✓
- `Base.astro` props `{ lang, title, description, canonical, ogLocale }` — mismas en Tasks 3, 4, 5. ✓
- `Header.astro` props `{ lang, current? }` — Task 4 define, Tasks 4/5 consumen con `current="inicio"`. ✓
- `HomePriceScript` prop `dataUrl` — Task 5 define y consume. ✓

Sin inconsistencias detectadas.
