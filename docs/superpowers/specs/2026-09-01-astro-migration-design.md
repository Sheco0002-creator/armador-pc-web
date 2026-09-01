# Migración a Astro (frontend moderno, export estático)

**Fecha:** 2026-09-01
**Estado:** Aprobado para planificar
**Autor:** Sheco0002 + Claude

## Objetivo

Reemplazar el sitio estático hecho a mano (HTML + CSS + JS vanilla, 3 árboles
de idioma duplicados, sin build) por un proyecto **Astro** con:

- Componentes reutilizables en vez de HTML duplicado.
- i18n nativo de Astro (es / en / pt) desde una sola fuente.
- Paso de build (`npm`), lo que habilita dependencias como `animejs`.
- Export **100% estático** publicado en **GitHub Pages** (sin backend, dominio
  `tupcgamer.com` vía `CNAME` intacto).

No hay backend, base de datos ni API propia. La lógica de compatibilidad sigue
corriendo en el cliente.

## Restricciones

- El sitio viejo debe seguir funcionando durante la migración (incremental,
  una página por vez).
- URLs públicas actuales no deben romperse: `/`, `/en/`, `/pt/`, `/configurador.html`,
  `/guias.html`, `/niveles/*.html`, `/guias/*.html`, `/sobre.html`, `/contacto.html`,
  `/privacidad.html`. El sitemap y GSC dependen de ellas.
- `CNAME`, `robots.txt`, `sitemap.xml`, `favicon.svg`, verificación de Google
  (`googlec378141724be809c.html`) deben seguir sirviéndose.
- El motor `js/compatibilidad.js` se reusa tal cual (import, no reescritura);
  sus tests (`tests/compatibilidad.test.html`) deben seguir pasando.
- Contrato V2 (`data/v2/`, `scripts/validate-v2.js`) no se toca en esta migración.

## Arquitectura destino

```
armador-pc-web-git/
  package.json              (nuevo)
  astro.config.mjs          (nuevo)  site + base + i18n + build estático
  .github/workflows/deploy.yml (nuevo)  build + publish a GitHub Pages
  src/
    pages/
      index.astro           es (root)
      en/index.astro
      pt/index.astro
      configurador.astro  (+ en/ pt/)
      guias.astro, sobre.astro, contacto.astro, privacidad.astro ...
      niveles/[nivel].astro
      guias/[slug].astro
    components/
      Header.astro, Footer.astro, Hero.astro ...
      Configurador.tsx|.svelte|.js   (isla interactiva)
    layouts/
      Base.astro
    lib/
      compatibilidad.js     (movido desde js/, sin cambios de lógica)
      main.js, moneda.js ... (helpers migrados a módulos ES)
    i18n/
      es.json, en.json, pt.json  (strings extraídos de los HTML)
    styles/
      style.css             (movido desde css/, se mantiene)
  public/
    data/                   (movido desde data/, mismos nombres)
    img/, Icons/, favicon.svg, robots.txt, CNAME,
    googlec378141724be809c.html
```

Los HTML viejos y `js/`, `css/`, `data/` de la raíz permanecen hasta que su
página equivalente esté migrada y verificada; luego se borran en el mismo commit.

## Estrategia de i18n

- `astro.config.mjs` con `i18n: { defaultLocale: 'es', locales: ['es','en','pt'],
  routing: { prefixDefaultLocale: false } }` → `es` en la raíz, `en/` y `pt/`
  con prefijo, igual que hoy.
- Strings de UI en `src/i18n/*.json`, accedidos por un helper `t(locale, key)`.
- Datos por idioma: se mantiene el patrón actual de archivos
  `components.json` / `components.en.json` / `components.pt.json` en
  `public/data/`; un helper resuelve la ruta según `locale` (equivalente a
  `rutaLocalizada()` actual).

## animejs

- `npm install animejs` (v3.x).
- Se importa dentro de componentes/islas: `import anime from 'animejs'`.
- Primer uso: animación de entrada del hero de la home (se conecta con el spec
  `2026-08-26-hero-cgi-breakdown-design.md`).

## Build y publicación

- `npm run build` → `dist/` estático.
- `.github/workflows/deploy.yml`: en push a `main`, `npm ci && npm run build`,
  luego `actions/deploy-pages`. Reemplaza el "GitHub Pages sirve la raíz".
- `astro.config.mjs`: `site: 'https://tupcgamer.com'`, `base: '/'`,
  `build.format: 'file'` o `'directory'` según haga falta para preservar
  `.html` en las URLs (ver "Riesgos").
- `node_modules/` se agrega a `.gitignore`.

## Testing

- **Motor de compatibilidad**: se conserva `tests/compatibilidad.test.html`
  apuntando a `src/lib/compatibilidad.js`. Objetivo posterior: portar a
  `node --test`, fuera de alcance de esta migración.
- **Validación V2**: `node scripts/validate-v2.js` y
  `node --test tests/v2/validate-v2.test.js` deben seguir pasando sin cambios.
- **Build**: `npm run build` debe terminar sin errores y `dist/` debe contener
  todas las URLs listadas en "Restricciones".
- **Paridad visual**: comparación manual página vieja vs. migrada en los 3
  idiomas antes de borrar el HTML viejo.

## Riesgos y decisiones abiertas

1. **Extensión `.html` en las URLs.** Hoy las URLs son `/configurador.html`.
   Astro por defecto genera `/configurador/`. Para no romper GSC/sitemap hay
   que elegir `build.format: 'file'` (genera `configurador.html`) o agregar
   redirecciones. Decisión: usar `format: 'file'` para paridad exacta;
   revisar caso por caso en el plan.
2. **Orden de migración.** Propuesta: (a) scaffold + home 3 idiomas + animejs,
   (b) páginas de contenido (sobre, contacto, privacidad, guías índice),
   (c) niveles, (d) configurador (la isla más compleja), (e) guías de detalle,
   (f) borrado de archivos viejos + limpieza de `CLAUDE.md`.
3. **Google Analytics / gtag**: mover el snippet a `Base.astro`.
4. **`scripts/` y `tests/` en Node**: no se tocan; conviven con el nuevo `package.json`.

## Fuera de alcance

- Backend, cuentas de usuario, precios en vivo.
- Reescritura de la lógica de compatibilidad o del contrato V2.
- Rediseño visual (más allá del hero ya planificado).
- Migrar los tests del navegador a un runner CLI.
