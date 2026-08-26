# Fase 3 — Hero Principal ArmaPC: CGI Breakdown

**Fecha:** 2026-08-26
**Alcance:** exclusivamente la sección `<section class="hero">` de `index.html` (raíz en español). No incluye `en/`, `pt/`, ni ninguna otra sección o página.
**Checkpoint base:** commit `1614c8e` (Fases 0-2 cerradas), rama `main`.

## 1. Objetivo

Transformar el Hero de inicio en una composición CGI Breakdown: una PC mostrada como sistema cuyos componentes (GPU, RAM, CPU, placa madre, refrigeración — en ese orden de prioridad) se separan de forma controlada y técnica, con profundidad, iluminación tipo "pieza de museo" (referencia Neo Museum) y motion sutil dirigido por mouse y scroll (referencia CGI Breakdown). Sin fotos ni modelos 3D reales — no existen en el repo y está prohibido descargarlos — todo se construye con geometría (SVG/CSS).

Prioridad explícita del resultado (de mayor a menor): **resultado visual > calidad de animación > rendimiento > simplicidad tecnológica**, manteniendo rendimiento razonable y responsive funcional.

## 2. Auditoría previa (resumen)

- No existe ninguna imagen de componentes de PC en el repo (solo `favicon.svg`). Se descarta cualquier approach basado en fotografía o modelos 3D reales.
- El sitio ya tiene un lenguaje visual reutilizable para esto: `.ambient-bg` en `sobre.html` (SVG inline, no generado por JS) dibuja CPU/RAM/GPU/fan en trazo fino, paleta `--accent-mint` (#5FAE8C) / `--accent` (#D4A24C), sobre `--bg` (#0D1512). El Hero actual (`.trace-line`) usa la misma paleta de circuito.
- `js/motion.js` ya implementa el patrón de mejora progresiva requerido (sin JS o con `prefers-reduced-motion` → todo visible sin animación; con JS → `IntersectionObserver` agrega `.is-visible`). No se modifica; el Hero no lo usa (tiene su propio sistema, ver §5).
- `js/home.js` solo rellena `[data-tier-price]`; no toca el Hero.
- `.hero-inner`, `.hero-actions`, `.hero-sub`, `.trace-line`, `class="hero"` solo existen en `index.html`/`en/index.html`/`pt/index.html` — sin colisión con otras páginas.
- **Excepción:** `.eyebrow` (`css/style.css:73`) es una clase compartida (`guias.html`, `niveles/*.html` y sus árboles en/pt la usan). La regla base no se toca; cualquier ajuste visual del eyebrow del Hero va en un selector con ámbito (`.hero-inner .eyebrow`), nunca en `.eyebrow` global.
- Línea base de pruebas (antes de cualquier cambio): `node scripts/validate-v2.js` → OK (71 entries, 76 evidence). `node --test tests/v2/validate-v2.test.js` → 38/38 OK. `tests/compatibilidad.test.html` no tiene runner CLI; no depende de nada relacionado al Hero.

## 3. Archivos afectados

**Nuevos:**
- `js/hero.js` — orquesta la composición y el motion del Hero (inicializa GSAP/ScrollTrigger, gates de accesibilidad/dispositivo).
- `js/vendor/gsap.min.js`, `js/vendor/ScrollTrigger.min.js` — GSAP core + plugin ScrollTrigger, vendorizados (descargados una vez, versionados en el repo — no CDN). Licencia: términos gratuitos de Webflow/GSAP para este uso (no MIT, sin costo).

**Modificados:**
- `index.html` — únicamente dentro de `<section class="hero">`: nueva composición SVG, copy restructurado, nuevas etiquetas `<script>` para GSAP/`hero.js` al final del `<body>` (después de `main.js`/`home.js`, sin tocar su contenido).
- `css/style.css` — únicamente reglas nuevas/modificadas bajo el bloque `/* ===== Hero ===== */`, más la extensión del bloque `@media (prefers-reduced-motion: reduce)` ya existente (líneas 171-180) y nuevas media queries de responsive del Hero. `.eyebrow` base no se toca (ver §2).

**No tocados (confirmado):** `data/*`, `compatibilidad.js`, `configurador.js`, `v2-adapter.js`, `nivel.js`, `home.js`, `guias.js`, `main.js`, `moneda.js`, `previews.js`, `js/motion.js`, `en/`, `pt/`, estructura de URLs, `<title>`/meta description/OG (se conservan con el copy largo actual — ver §5).

## 4. Composición (CGI Breakdown)

Un SVG inline, `viewBox` ~`0 0 600 600`, columna derecha en desktop / detrás-y-debajo del texto en móvil. Capas (mismo lenguaje visual que `.ambient-bg`, ampliado y con más detalle porque aquí es protagonista, no decoración):

- **Placa madre (capa estructural/base):** contorno PCB grande con recorte de socket, trazas grabadas, orificios de montaje. Ancla el resto — todo se define en relación a ella, para que el breakdown lea como "un sistema", no piezas sueltas.
- **CPU:** die+pines, desplazado hacia arriba desde el socket, conectado por una línea guía punteada con nodo cobre — "levantado de su socket", no volando.
- **RAM (x2):** desplazadas vertical/lateralmente desde su slot, cada una con su línea guía de vuelta a la placa.
- **Refrigeración:** fan/heatsink, sobre el CPU, la capa con mayor elevación del stack.
- **GPU:** la forma más grande y detallada (prioridad #1) — shroud + fans + borde de backplate, desplazada hacia adelante/abajo de la placa.
- **SSD:** chip pequeño opcional cerca del borde inferior — primero en caerse si sobra espacio en viewports angostos.
- **Gabinete:** no se dibuja literalmente (prioridad más baja, y un contorno de case tiende a "enjaular" la composición visualmente). "Estar dentro de una PC" se implica con un fondo tipo viñeta/spotlight (ver abajo), no con una silueta.

**Tratamiento "Neo Museum":** a diferencia de `.ambient-bg` (solo trazo/stroke), cada forma lleva relleno con gradiente sutil (no solo contorno) para sensación de "pieza de estudio fotográfico", más un spotlight radial centrado en la composición como iluminación ambiental principal, y sombras (`drop-shadow`) proporcionales a la elevación de cada capa — esto es lo que vende profundidad y materialidad sin necesitar 3D real.

**Línea base estática (sin JS / `reduced-motion`):** la composición nace ya en un estado de separación moderada fija (`--explode: 0.6` vía CSS plano, sin JS) — se ve intencional sin ningún movimiento.

## 5. Copy y markup

- **Eyebrow:** "TU PC. A TU MANERA." (reemplaza "Guía + configurador para armar PC"), con selector con ámbito por la excepción de §2.
- **H1:** copy corto de dos líneas, segunda línea acentada en `--accent` (mismo patrón que `.accent` en el resto del sitio):
  ```html
  <h1><span class="hero-title-line">ARMA</span><span class="hero-title-line hero-title-accent">TU PC</span></h1>
  ```
  `<title>`, meta description y OG tags **no se tocan** — conservan el texto largo actual, mitigando parcialmente la pérdida de keywords del H1 (decisión aprobada explícitamente por el usuario, aceptando el tradeoff de SEO on-page).
- **Hero-sub:** texto sin cambios ("Aprende qué comprar y por qué...").
- **CTAs:** texto y `href` sin cambios ("Empezar a armar" → `configurador.html`, "Ver niveles de presupuesto" → `#presupuestos`) — solo restyling visual. El copy sugerido originalmente ("Ver guía rápida") habría cambiado el destino/intención de CTA2, lo cual las instrucciones prohíben explícitamente.
- **Markup:** `.hero-inner` conserva su rol de columna de texto (misma clase, nuevos `<span>` internos para el H1 de dos líneas). Nueva `.hero-composition` reemplaza `.trace-line` como columna derecha / capa de fondo en móvil.

## 6. Motion (GSAP core + ScrollTrigger)

Todo dentro de `js/hero.js`, cargado solo si `prefers-reduced-motion` no está activo y GSAP cargó correctamente (si `typeof gsap === 'undefined'`, se aborta sin error — queda la composición estática de §4).

- **Entrada (timeline):** al cargar, secuencia con stagger: eyebrow → H1 → sub → CTAs → capas de la composición asentándose desde una posición ligeramente más compacta hacia `--explode: 0.6`. Un solo `gsap.timeline()`, easing consistente con la identidad "editorial/industrial" (curvas suaves, sin rebote/bounce genérico).
- **Scroll-scrub (ambición "rica", aprobada):** `ScrollTrigger` sobre `.hero`, con `pin: true` mientras se scrollea dentro del rango del Hero — la composición queda fija en viewport mientras `--explode` avanza de ~0.35 a ~0.85 y `--hero-fade` reduce opacidad/escala levemente, luego se libera el pin y el scroll continúa normal hacia "Cómo funciona". `scrub` numérico (no `true` puro) para un lag suavizado, no un mapeo 1:1 brusco.
- **Parallax de mouse (desktop, `pointer: fine` únicamente):** `gsap.quickTo()` por capa, con `--depth` (1-5) definiendo la intensidad — placa apenas se mueve, GPU/refrigeración se mueven más (más "cerca de cámara").
- **Un solo punto de entrada/salida:** `ScrollTrigger` se registra una sola vez; en resize, `ScrollTrigger.refresh()` recalcula (manejado por la librería, no a mano).
- **Reducción en móvil (≤430/390px, la fila "móvil" de §7):** sin `pin` (evita saltos de layout en viewports cortos y con teclados virtuales), sin parallax de mouse, menos capas participando del scrub (SSD y, si hace falta, refrigeración se excluyen primero). El pin sí permanece activo en tablet (768px) y en todo lo que esté por encima.

## 7. Responsive

| Rango | Comportamiento |
|---|---|
| 1920 / 1440px | Dos columnas, composición a tamaño completo, parallax máximo. |
| 1366px (laptop) | Misma estructura, composición con `clamp()` para no empujar el texto. |
| 768px (tablet) | Columna única, composición detrás/debajo del texto, tamaño y separación reducidos vía multiplicador CSS. Parallax de mouse ya excluido naturalmente por `pointer: fine`. |
| 430 / 390px (móvil) | Columna única, composición reducida, SSD (y refrigeración si no cabe) se cae primero, sin parallax, sin pin de scroll, H1 con `clamp()` como el resto del sitio. |

`.hero-composition` usa `max-width: 100%`; `.hero` mantiene `overflow: hidden` — a diferencia de `.trace-line` actual (que se sale del contenedor con `right: -40px` y por eso hoy se oculta por completo en móvil), la nueva composición permanece visible en todos los anchos, sin generar scroll horizontal.

## 8. Accesibilidad

- SVG completo: `aria-hidden="true"` `focusable="false"` — decorativo, la información vive en el texto.
- Orden de tabulación sin cambios: logo → nav → selector de idioma → CTA1 → CTA2. Sin elementos enfocables nuevos.
- `:focus-visible` de los CTAs (outline mint global) se preserva; el nuevo estilo de botón usa `outline-offset`, no `overflow: hidden`, para no recortar el outline.
- Contraste: `--text` sobre `--bg` sin cambios; H1 acentado en `--accent` reutiliza un color ya usado en texto en producción (`.tier-price`, `.comp-price`).
- `prefers-reduced-motion: reduce`: se extiende el bloque `@media` ya existente (`css/style.css:171-180`) para apagar toda animación/transición de `.hero-composition`. `hero.js` no inicializa GSAP/ScrollTrigger si el media query está activo — el resultado es la composición estática de §4, comprensible sin movimiento.

## 9. Rendimiento

- Un solo timeline/ScrollTrigger para todo el Hero (no listeners manuales duplicados); GSAP internamente ya gatea con RAF y evita layout thrashing en sus tweens (`transform`/`opacity` únicamente en todas las capas animadas).
- `pin: true` activo en tablet (768px) y superiores; desactivado en móvil ≤430/390px (ver §6/§7) — evita el costo y los saltos de layout de pin en viewports cortos.
- SVG: ~6-8 grupos con formas simples; `drop-shadow` con radios pequeños en vez de `feGaussianBlur` de área grande.
- `js/motion.js` no se toca ni se ve afectado (sigue aplicando `[data-reveal]` en el resto del sitio); el Hero no usa `[data-reveal]` para evitar dos sistemas de reveal compitiendo sobre el mismo elemento.
- GSAP/ScrollTrigger vendorizados y con `defer`; ~120KB min / ~40KB gzip combinados, carga única cacheada por el navegador (mismo origen — beneficia también a cualquier página futura que los reutilice).
- Cero requests externos nuevos más allá de los dos archivos vendorizados (que son locales, no CDN).

## 10. Justificación de la dependencia (GSAP + ScrollTrigger)

Requerida explícitamente por el proceso del usuario para cualquier dependencia nueva:

1. **¿Se resuelve con APIs nativas?** Parcialmente — el parallax de mouse sí es trivial a mano; el pin-scroll robusto (comportamiento tipo `position: sticky` combinado con progreso de scroll, sin saltos, con recálculo en resize) es significativamente más frágil hecho a mano, y es la técnica central de la referencia CGI Breakdown.
2. **Impacto en rendimiento:** bajo — un timeline, RAF gestionado internamente, solo `transform`/`opacity`.
3. **Peso:** ~40KB gzip combinado, carga única cacheada.
4. **Mantenimiento:** muy bajo riesgo — librería estándar de la industria para este tipo de efecto, con soporte activo (Webflow).
5. **¿Mejora sustancialmente el resultado?** Sí, específicamente en pin-scroll robusto y en secuenciación de entrada con easing de calidad — ambos priorizados explícitamente por el usuario por encima de la simplicidad tecnológica.

Three.js/WebGL se descarta (no por simplicidad sino por resultado visual: cero assets 3D en el repo, geometría primitiva se vería genérica). Canvas 2D se descarta (pierde integración DOM/CSS y accesibilidad fácil sin ganar nada para una estética plana/line-art).

## 11. Fuera de alcance (esta fase)

- `en/index.html`, `pt/index.html` (decisión explícita del usuario: fast-follow posterior, no esta fase).
- Presupuestos, Configurador, Guías, Privacidad, Contacto, Sobre ArmaPC.
- Cualquier cambio a `data/`, lógica de compatibilidad, precios, rutas o traducciones existentes.

## 12. Plan de verificación

1. Antes de implementar (ya ejecutado): `node scripts/validate-v2.js` → OK; `node --test tests/v2/validate-v2.test.js` → 38/38 OK.
2. Después de implementar: re-correr ambos comandos (deben seguir en el mismo estado), abrir `tests/compatibilidad.test.html` vía servidor local (debe seguir PASS/PASS), probar el Hero real en los 6 anchos de §7, con y sin `prefers-reduced-motion`, navegación por teclado completa, verificar cero scroll horizontal.
3. `git status` / `git diff` completo al final — reporte exacto de archivos modificados (esperado: `index.html`, `css/style.css`, `js/hero.js`, `js/vendor/gsap.min.js`, `js/vendor/ScrollTrigger.min.js` — nada más).
