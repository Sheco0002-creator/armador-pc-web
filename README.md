# ArmaPC

Sitio web para aprender a armar una PC gamer, desde el nivel más económico
hasta el más caro. No es una tienda: es una guía educativa con un
configurador interactivo que verifica la compatibilidad de las piezas en
tiempo real, páginas de presupuesto por nivel, y guías de contenido.

Sitio estático (HTML + CSS + JavaScript puro, sin frameworks ni build
step). Publicado con GitHub Pages.

## Estado del proyecto

**Completo y funcional.** Las 17 páginas existen, cargan sin errores, el
configurador y las páginas de nivel funcionan de punta a punta, y el motor
de compatibilidad está probado (ver sección Testing). Lo que queda
pendiente son decisiones de negocio del propietario del sitio (dominio
propio, integración con Amazon, solicitud de AdSense), no partes sin
construir del sitio — están detalladas al final de este documento.

## Estructura del proyecto

```
armador-pc-web/
├── index.html                  → página de inicio
├── configurador.html           → configurador interactivo (herramienta central)
├── guias.html                  → índice de guías (lee data/guides.json)
├── sobre.html                  → página institucional "Sobre nosotros"
├── contacto.html                → página de contacto
├── privacidad.html              → política de privacidad
├── favicon.svg                  → ícono del sitio
├── robots.txt                   → permite el rastreo, apunta al sitemap
├── sitemap.xml                  → mapa de las 17 páginas para buscadores
│
├── niveles/                     → páginas de presupuesto por nivel
│   ├── entrada.html             → nivel Entrada (US$850–1,050)
│   ├── media.html               → nivel Media (US$1,350–1,700)
│   ├── alta.html                → nivel Alta (US$2,200–2,800)
│   └── extrema.html             → nivel Extrema (US$3,800–5,500)
│
├── guias/                       → contenido educativo (7 guías)
│   ├── glosario.html            → glosario para principiantes
│   ├── compatibilidad.html      → compatibilidad de componentes
│   ├── elegir-gpu.html          → cómo elegir tu tarjeta gráfica
│   ├── elegir-cpu.html          → cómo elegir tu procesador
│   ├── cuanta-ram.html          → cuánta RAM necesitas
│   ├── fuente-de-poder.html     → guía de fuentes de poder
│   └── errores-comunes.html     → errores comunes al armar tu primera PC
│
├── css/
│   └── style.css                → todo el diseño visual del sitio (una sola hoja)
│
├── js/
│   ├── main.js                  → menú móvil + escapeHtml() (usado en todo el sitio)
│   ├── moneda.js                → conversor de moneda (tasas en vivo + caché + respaldo)
│   ├── compatibilidad.js        → motor de compatibilidad (ver sección dedicada)
│   ├── configurador.js          → lógica del configurador
│   ├── nivel.js                 → arma las páginas de nivel y calcula su total real
│   ├── home.js                  → calcula los precios reales mostrados en la portada
│   ├── guias.js                 → arma el índice de guías
│   └── previews.js              → ilustraciones flotantes al pasar el mouse sobre una pieza
│
├── data/
│   ├── components.json          → fuente única de datos (ver sección dedicada)
│   └── guides.json               → metadatos de las guías (para el índice)
│
├── tests/
│   └── compatibilidad.test.html → pruebas automatizadas del motor de compatibilidad
│
└── README.md                    → este archivo
```

## Instalación

No hay instalación. Es HTML/CSS/JS plano — no hay `npm install`, no hay
dependencias, no hay paso de build. Basta con tener los archivos en una
carpeta.

## Ejecución (ver el sitio en tu computadora)

La página de inicio (`index.html`) se puede abrir con doble clic. Pero la
**mayoría de las páginas** (configurador, niveles, guías) usan `fetch()`
para leer los archivos de `data/`, y eso no funciona abriendo el archivo
directo (`file://`) por una restricción de seguridad del navegador —
necesitan un servidor local.

La forma más simple, con Python instalado:

1. Abre una terminal dentro de la carpeta `armador-pc-web`.
2. Ejecuta: `python3 -m http.server 8000`
3. Abre en tu navegador: `http://localhost:8000`

Si usas VS Code, la extensión **Live Server** hace lo mismo con un clic
("Go Live" abajo a la derecha).

## Fuente de datos

Todo el catálogo de componentes y los niveles de presupuesto viven en
**un solo archivo**: `data/components.json`. No hay una segunda fuente de
precios en ningún otro lado del sitio — las páginas de nivel, el
configurador y la portada leen todas de este mismo archivo, por eso sus
precios nunca pueden desalinearse entre sí.

`data/guides.json` es aparte: solo contiene los metadatos de cada guía
(título, resumen, etiqueta, minutos de lectura) para armar el índice en
`guias.html`. El contenido real de cada guía vive en su propio archivo
HTML dentro de `guias/`.

### Estructura de `components.json`

```json
{
  "updated": "2026-08",
  "currency": "USD",
  "categories": [
    {
      "id": "cpu",
      "label": "Procesador",
      "order": 1,
      "items": [
        { "id": "cpu-r5-9600x", "name": "AMD Ryzen 5 9600X", "price": 190,
          "socket": "AM5", "tdp": 65, "specs": "6 núcleos / 12 hilos" }
      ]
    }
  ],
  "tiers": [
    {
      "id": "entrada",
      "name": "Entrada",
      "tagline": "Tu primer PC gamer serio",
      "target": "1080p alto/ultra...",
      "priceMin": 850,
      "priceMax": 1050,
      "components": { "cpu": "cpu-r5-9600x", "motherboard": "mb-b650", "...": "..." },
      "alternatives": { "gpu": "gpu-9060xt" }
    }
  ]
}
```

- **`categories`**: 8 categorías (cpu, motherboard, ram, gpu, storage, psu,
  case, cooling), cada una con sus piezas reales y las specs necesarias
  para el motor de compatibilidad (socket, ramType, formFactor, length,
  powerDraw, wattage, supports, socketSupport, tdpCapacity, etc. — cada
  categoría solo tiene los campos que le aplican a ella).
- **`tiers`**: los 4 niveles de presupuesto. Cada uno tiene un preset real
  (`components`, una pieza por categoría) y alternativas opcionales
  (`alternatives`) — ambos son **referencias por id** a piezas reales de
  `categories`, nunca texto ni precios sueltos escritos aparte.
- El precio total de un nivel **nunca está escrito a mano**: se calcula
  siempre sumando el precio de cada pieza de su preset (`js/nivel.js`,
  `js/home.js`, `js/configurador.js` lo hacen así, cada uno de forma
  independiente pero contra el mismo dato).

### Integridad verificada

- 0 IDs duplicados entre las 37 piezas del catálogo.
- 0 referencias rotas: todo `tiers.components` y `tiers.alternatives`
  apunta a una pieza que existe de verdad.
- Los 4 presets caben dentro de la banda de presupuesto que anuncian.
- Todo gabinete tiene al menos una placa madre real compatible, y
  viceversa (no hay callejones sin salida en el catálogo).

## Motor de compatibilidad (`js/compatibilidad.js`)

El corazón del configurador. Revisa una build y distingue **tres estados**
para cada verificación — nunca solo "sí/no":

- **`incompatible`**: no funciona o no encaja físicamente (hay un dato
  real que lo confirma). Bloquea la selección de esa pieza.
- **`aviso`**: funciona, pero no es lo ideal (ej. una fuente algo justa).
  No bloquea.
- **`no_verificado`**: no tenemos el dato necesario para confirmar ni
  descartar (ej. no sabemos cuántos slots M.2 tiene cada placa todavía).
  **Nunca se trata como incompatible** — el motor jamás bloquea una pieza
  solo por falta de información.

Verificaciones implementadas: socket CPU↔placa, tipo de RAM↔placa,
formato de placa↔gabinete, largo de GPU↔gabinete, socket y capacidad
térmica de la refrigeración↔CPU, altura del disipador↔gabinete, potencia
de la fuente↔consumo del sistema — más los `no_verificado` honestos donde
falta dato (VRM de la placa, slots de RAM, altura de GPU, radiador de
refrigeración líquida, ranuras de almacenamiento, conectores de la
fuente).

Cuando una pieza queda bloqueada, la razón mostrada es siempre específica
(ej. *"GPU incompatible: 360 mm. El gabinete admite hasta 320 mm."*), no
un genérico "incompatible". Si una sola pieza rompe varias reglas a la
vez, se explican todas, no solo la primera.

## Configurador (`configurador.html` + `js/configurador.js`)

Flujo: elegir un nivel de presupuesto (o empezar desde cero) → elegir
cada componente → el sistema corre el motor de compatibilidad al
instante → las piezas incompatibles se deshabilitan solas, con su razón
visible → precio individual y total (calculado, nunca escrito a mano) →
estado general de compatibilidad → consumo estimado del sistema → fuente
elegida y su margen real → resumen final exportable (copiar al
portapapeles).

Los precios se pueden ver en 11 monedas distintas (conversor con tasas en
vivo, caché de 6 horas, y respaldo local si la API externa falla).

## Testing

`tests/compatibilidad.test.html` — carga el archivo real
`js/compatibilidad.js` (no una copia) y corre 12 pruebas automatizadas en
el navegador: CPU compatible/incompatible, RAM compatible/incompatible,
GPU que no cabe/que sí cabe, cooler que no cabe/que sí cabe, fuente
insuficiente/suficiente, una build completa válida, y una build con
varias incompatibilidades simultáneas. Se abre directo en el navegador
(sirviendo el sitio con un servidor local) y muestra PASS/FAIL en
pantalla — no requiere ninguna herramienta externa.

Además del motor, se validó manualmente con navegador real (Playwright):
los 4 presets reales pasan el motor sin errores ni avisos; el precio
coincide exactamente entre la portada, las páginas de nivel y el
configurador; no hay desbordamiento horizontal en móvil/tablet/desktop;
las 17 páginas cargan sin errores de consola; y la navegación por teclado
(tabular, Enter, foco visible) funciona en el configurador.

## SEO

Las 17 páginas tienen `<title>` y meta description únicos (no
genéricos ni duplicados), un `<h1>` cada una, `canonical` y etiquetas
Open Graph/Twitter Card. `sitemap.xml` lista las 17 páginas reales y
`robots.txt` apunta a él. No hay páginas huérfanas: cada guía enlaza a
otras dos en su sección "Sigue aprendiendo", formando una red donde las 7
son alcanzables.

## Despliegue

El sitio está publicado con **GitHub Pages**:

1. El contenido de esta carpeta vive en un repositorio de GitHub.
2. En el repositorio: **Settings → Pages → Branch: `main`, carpeta `/ (root)`**.
3. El sitio queda disponible en `https://<usuario>.github.io/<repo>/`.

Para publicar un cambio: se sube el archivo modificado a GitHub (arrastrando
en la web, o `git push`), y GitHub Pages lo actualiza solo en un par de
minutos. No hay paso de build intermedio.

Cuando se conecte un dominio propio, esa misma pantalla de **Settings →
Pages** tiene la opción de agregar un "Custom domain".

## Seguridad

Todo el texto que viene de los archivos de datos (`components.json`,
`guides.json`) pasa por `escapeHtml()` (definida en `js/main.js`, cargada
en todo el sitio) antes de insertarse en la página — protección contra
inyección de HTML si esos datos llegaran a incluir caracteres especiales,
verificado con una prueba real (payload de XSS inyectado en memoria,
confirmado neutralizado).

## Pendiente (decisiones de negocio, no partes del sitio sin construir)

- **Dominio propio y correo real**: hoy el sitio usa la URL de GitHub
  Pages y un correo de ejemplo (`hola@armapc.com`) marcado como
  placeholder en `contacto.html` y `privacidad.html`.
- **Integración con Amazon (afiliados)**: fotos reales de producto,
  precios de tienda y enlaces de compra. Planeado para el final, una vez
  que el sitio tenga tráfico — Amazon suele exigir el sitio ya publicado
  para aprobar la cuenta de afiliado.
- **Política de privacidad definitiva**: la actual es una base honesta
  (marcada como plantilla a revisar) que cubre los requisitos de Google
  AdSense; se recomienda generarla de nuevo con una herramienta gratuita
  (Termly o PrivacyPolicies.com) una vez agregado Amazon, para declarar
  todo de una sola vez.
- **Solicitar Google AdSense**: el sitio ya cumple los requisitos
  (contenido original, páginas institucionales, política de privacidad),
  pero la solicitud en sí no se ha hecho.
