# Contrato V2 del catálogo de ArmaPC — v2.0.0 (Fase 1 completa, Fase 2 cerrada, Fase 3 en curso)

Estado (actualizado 2026-08-22): **Fase 1 completa. Fase 2 cerrada** (2026-08-21).
**Fase 3 en ejecución activa** (iniciada 2026-08-21, ver §0.4 en adelante).
Estado real de `catalog.v2.json`: **16 `family`, todas `verified`** (las 8
originales CPU/GPU — incluidas las 2 que quedaron `partial` al cierre de
Fase 2 y luego pasaron a `verified` en §0.6 — más `family-memory-ddr5`,
`family-intel-z890`, `family-psu-atx`, `family-storage-nvme-pcie4`,
`family-storage-sata`, `family-storage-nvme-pcie5`,
`family-case-atx-mid-tower` y `family-case-atx-full-tower`, agregadas
durante Fase 3), y **24 `product` reales verificados** (12 GPU, 1 RAM, 3
motherboard, 2 PSU, 4 storage, 2 case). 0 `offer`, 0 `preset`. No reemplaza
`data/catalog.json` (legacy). No se migró ningún registro legacy. La
investigación de productos AMD (CPU) permanece en pausa (ver §0.7): 0
`product` AMD creados. `node scripts/validate-v2.js` → 40 entries válidas,
46 evidencias, 0 offers, 0 presets. `node --test tests/v2/validate-v2.test.js`
→ 31/31. Existe además `data/v2/crosswalk.v2.json` (fuera del contrato
validado) con el mapeo legacy-id↔product-id para storage y case.

## 0.1 Resultado del piloto (2026-08-21)

- Datos obtenidos de fuentes oficiales reales: AMD product page (vía
  WebSearch, la página bloqueó el fetch directo por protección anti-bot) y
  NVIDIA product page (fetch directo exitoso).
- Campos sin evidencia textual explícita en la fuente oficial (ancho de banda
  de memoria GDDR7, conector de alimentación exacto de la RTX 5070) se
  dejaron en `null` + `unknownFields`, **sin inferirlos** — validación
  práctica de la regla "prohibido inventar datos" (§4).
- El validador detectó un **falso positivo real**: la regla V-04 rechazaba
  cualquier URL oficial terminada en `/` como "truncada", lo cual habría
  bloqueado la URL real y verificable de NVIDIA. Corregido en
  `scripts/validate-v2.js` (se retiró el patrón `/\/$/`; la detección de
  truncamiento ahora depende solo de marcadores literales `...`/`…`). Se
  añadió test de regresión en `tests/v2/validate-v2.test.js`.
- Con la corrección, las 2 `family` piloto pasan `validateCatalog` sin
  errores (31/31 tests, CLI `validate-v2.js` en verde).
- Conclusión: el modelo (identidad/evidencia/verification/vocabulario) es
  operable con datos reales; el validador requería un ajuste menor ya
  aplicado.

## 0.2 Escalado a los 8 chips CPU/GPU legacy (2026-08-21)

Los 8 candidatos quedaron cargados como `family` en `catalog.v2.json`:

| id | status | motivo |
|---|---|---|
| `family-amd-ryzen5-9600x` | `verified` | spec oficial AMD confirmada (piloto) |
| `family-amd-ryzen7-9700x` | `verified` | spec oficial AMD confirmada |
| `family-amd-ryzen7-9850x3d` | **`partial`** | SKU confirmado real (pagina de drivers AMD), pero sin tabla de specs oficial accesible en esta sesión (amd.com bloqueó el fetch directo; no se usaron fuentes de terceros) → todos los campos técnicos en `null` |
| `family-amd-ryzen9-9950x3d` | **`partial`** | mismo caso: SKU confirmado (soporte oficial AMD), specs sin fuente oficial accesible → `null` |
| `family-nvidia-rtx5060` | `verified` | spec oficial NVIDIA confirmada (fetch directo) |
| `family-nvidia-rtx5070` | `verified` | spec oficial NVIDIA confirmada (piloto) |
| `family-nvidia-rtx5080` | `verified` | spec oficial NVIDIA confirmada (fetch directo) |
| `family-nvidia-rtx5090` | `verified` | spec oficial NVIDIA confirmada (fetch directo) |

Ningún campo se completó por aproximación: donde la fuente oficial no
declaraba el dato textualmente (ancho de banda de memoria GDDR7 en GB/s,
conector de alimentación GPU exacto, `systemPowerRecommendationW` de la
RTX 5060), el campo quedó `null` y listado en `unknownFields`. Ningún
`product`, `offer` ni `preset` fue creado — el alcance sigue siendo
estrictamente `family`. `node scripts/validate-v2.js` → 8/8 entries válidas,
0 offers, 0 presets. `node --test tests/v2/validate-v2.test.js` → 31/31.
`data/catalog.json` y la UI permanecen sin cambios.

## 0.3 Cierre de Fase 2 — intento de re-verificación AMD (2026-08-21)

A pedido explícito, se reintentó confirmar `family-amd-ryzen7-9850x3d` y
`family-amd-ryzen9-9950x3d` contra sus páginas oficiales de especificaciones
en amd.com (incluyendo las URLs `/es/` y `/en/` provistas). Resultado:

- 6 intentos de fetch directo (`amd.com/en/products/...`,
  `amd.com/es/products/...`, `amd.com/en/support/downloads/...`,
  `shop-us-en.amd.com` para ambos SKUs) → **timeout en los 6**, consistente
  con protección anti-bot de todo el dominio, no un fallo puntual de una URL.
- WebSearch para estas 2 SKUs específicas solo devolvió síntesis de fuentes
  de terceros (cpu-monkey, TechSpot, Wikipedia, nanoreview, cpubenchmark) —
  ninguna cita verificable del texto propio de AMD. Por instrucción expresa,
  esas fuentes NO se usan como `officialSource`.
- Decisión del usuario: mantener ambas entradas como `partial` con todos los
  campos técnicos en `null` (sin Product IDs) hasta que exista acceso viable
  a la página oficial de AMD. **No se modificó ningún archivo en este paso.**
- Con esto, Fase 2 queda cerrada: 6/8 `family` `verified`, 2/8 `family`
  `partial` documentadas con motivo de bloqueo explícito. `node
  scripts/validate-v2.js` y `node --test tests/v2/validate-v2.test.js`
  (31/31) siguen en verde. `data/catalog.json` y la UI intactos.

## 0.4 Fase 3 — piloto de `product` real (2026-08-21)

Jerarquía de fuentes aplicada (condición explícita del usuario para Fase 3):
1. Fabricante oficial → obligatorio para especificaciones críticas e identidad.
2. Distribuidor/retailer oficial confiable → solo información comercial (offers, fuera de alcance aquí).
3. Terceros → únicamente descubrimiento, nunca sustituto silencioso de evidencia oficial.

Resultado:

- **`prod-nvidia-rtx5070-founders-edition`** creado: `brand=NVIDIA`,
  `commercialName="GeForce RTX 5070 Founders Edition"`,
  `partNumber="NVGFT570"`, `familyId=family-nvidia-rtx5070`,
  `selectable=true`, `verification.status=verified`. Fuente: dominio propio
  de NVIDIA (`marketplace.nvidia.com`, tier 1) — el fetch directo dio
  timeout, así que el MPN se confirmó vía WebSearch citando esa URL oficial
  explícitamente en 3 consultas independientes (mismo mecanismo documentado
  en el piloto de Fase 2). Dimensiones físicas y conector de alimentación de
  esta variante quedaron `null`/`unknownFields`: no se completaron con el
  código distinto encontrado en un retailer (Best Buy, tier 2/3) porque no
  pudo confirmarse como el mismo identificador vía fuente oficial.
- **Producto CPU AMD del mismo tier: NO creado.** El part number/OPN del
  Ryzen 5 9600X y del Ryzen 7 9700X solo aparece en revendedores terceros
  (cpu-world, PCPartPicker, gigaparts, eBay) — ninguna página propia de
  amd.com ni shop-us-en.amd.com lo mostró en los resultados de búsqueda ni
  en fetch directo (timeout, igual que en Fase 2). Por la jerarquía
  aprobada, esto NO se completa con la fuente terciaria. Pendiente hasta
  tener acceso a una fuente tier 1 de AMD.
- Ningún `offer`, `price`, `stock` ni dato comercial fue creado.
- `node scripts/validate-v2.js` → 9 entries válidas (8 family + 1 product),
  0 offers, 0 presets. `node --test` → 31/31. `data/catalog.json` y la UI
  permanecen sin cambios.

## 0.5 Regla añadida — bloqueo de fuente no degrada la jerarquía

Condición explícita del usuario, ahora parte del contrato: si una fuente
oficial está bloqueada (timeout, anti-bot, etc.), se continúa con otro
producto que tenga evidencia oficial accesible **en vez de** bajar la
jerarquía para completar el bloqueado. Terceros solo sirven como pista de
descubrimiento (ej. para saber que un SKU existe o dónde buscar), nunca
para justificar `verification.status=verified` cuando falta evidencia
oficial de ese campo específico.

Aplicación inmediata (2026-08-21): se agregaron
**`prod-nvidia-rtx5080-founders-edition`** (MPN `NVGFT580`) y
**`prod-nvidia-rtx5090-founders-edition`** (MPN `NVGFT590`), ambos vía
`marketplace.nvidia.com` (mismo mecanismo que RTX 5070 FE: fetch directo
con timeout, cita confirmada por URL oficial explícita en resultados de
búsqueda). En ambos casos existían códigos alternativos en retailers
terceros (PCPartPicker mostraba `900-1G144-2545-000` para la 5080) que NO
se usaron por no poder confirmarse como el mismo identificador vía fuente
oficial — se documentan solo como referencia/descubrimiento en la
evidencia. Los productos AMD siguen bloqueados y sin crear.
`node scripts/validate-v2.js` → 11 entries válidas (8 family + 3 product).
`node --test` → 31/31.

## 0.6 Reintento acotado — datasheet/press kit AMD vía ir.amd.com (2026-08-21)

Búsqueda de `site:amd.com filetype:pdf` no encontró ningún datasheet PDF
accesible para los 4 SKUs. Sí se encontraron y **fetchearon directamente
con éxito** press releases oficiales en `ir.amd.com` (AMD Investor
Relations, dominio propio de AMD, no bloqueado a diferencia de
`www.amd.com/products` y `shop-us-en.amd.com`):

| SKU | officialSource nuevo | campos confirmados | status resultante |
|---|---|---|---|
| Ryzen 5 9600X | `ir.amd.com/.../detail/1202` | cores/threads, base/boost, cache total (corrobora dato previo), TDP, PCIe Gen5 | ya era `verified`; se añadió fuente/evidencia corroborante + `interface.pcieGen` |
| Ryzen 7 9700X | mismo press release | idem | idem |
| Ryzen 7 9850X3D | `ir.amd.com/.../detail/1270` (CES 2026) | cores/threads 8/16, base 4.7GHz, boost 5.6GHz, cache total 104MB, TDP 120W | **`partial` → `verified`** |
| Ryzen 9 9950X3D | `ir.amd.com/.../detail/1233` (CES 2025) | cores/threads 16/32, base 4.3GHz, boost 5.7GHz, cache total 144MB, TDP 170W, PCIe Gen5 | **`partial` → `verified`** |

Ningún dato se infirió: **socket permanece `null`** en los 4 (ninguno de
estos press releases lo declara explícitamente); `cache.l3MB` permanece
`null` en 9850X3D/9950X3D porque las fuentes solo dan "cache total"
combinado (L2+L3), no el desglose de L3 — se guardó como campo nuevo
`cache.totalMB` en vez de forzarlo dentro de `l3MB`. No se creó ningún
`product` en este paso (fuera de alcance de la instrucción). No se usó
ninguna fuente de terceros. `node scripts/validate-v2.js` → 11 entries
válidas, 0 offers/presets. `node --test` → 31/31. `data/catalog.json` y la
UI intactos.

## 0.7 AMD en pausa, nuevo producto GPU (2026-08-21)

Por instrucción del usuario, la búsqueda de Product ID/OPN de AMD queda en
**pausa** (0/4 encontrados en fuentes tier 1 accesibles; ver §0.6-bis en el
reporte de esa sesión — no se crea ningún `product` AMD por ahora).

Se agregó un nuevo `product` GPU de otro fabricante/tier:
**`prod-pny-rtx5060-overclocked`** — `brand=PNY`,
`commercialName="GeForce RTX 5060 8GB Overclocked Dual Fan Graphics Card"`,
`partNumber="VCG50608DFXPB1-O"`, `familyId=family-nvidia-rtx5060`,
`selectable=true`, `verified`. RTX 5060 no tiene variante Founders Edition
(confirmado: `marketplace.nvidia.com` solo lista partners AIB), así que el
producto es de un partner (PNY) en vez de NVIDIA directo — el MPN y el
boost clock factory-OC (2535 MHz) se confirmaron en `marketplace.nvidia.com`
(dominio propio de NVIDIA). Dimensiones físicas y conector de alimentación
aparecían consistentemente en varios retailers (Best Buy, Exxact, Staples,
B&H) pero **no se usaron** por no estar confirmados en fuente oficial —
quedan `null`/`unknownFields`, igual que en los productos anteriores.

No se tocó ninguna de las 4 `family` AMD ni los 3 `product` NVIDIA FE ya
existentes. `node scripts/validate-v2.js` → 12 entries válidas (8 family +
4 product), 0 offers, 0 presets. `node --test` → 31/31.

## 0.8 Segundo producto RTX 5060 — MSI, con datasheet PDF oficial (2026-08-22)

Se agregó **`prod-msi-rtx5060-8g-gaming-oc`** — `brand=MSI`,
`commercialName="GeForce RTX 5060 8G GAMING OC"`, `partNumber="G5060-8GC"`,
`familyId=family-nvidia-rtx5060`, `selectable=true`, `verified`. Primera
vez que se accede a un **datasheet PDF real del propio fabricante**
(`storage-asset.msi.com/datasheet/vga/global/GeForce-RTX-5060-8G-GAMING-OC.pdf`,
`kind: "datasheet"`) — el fetch trajo el binario, se extrajo el texto con
`pdftotext` (herramienta local, sin depender de un renderizador de páginas).
Corroborado además por `marketplace.nvidia.com` (MPN idéntico `G5060-8GC`).

A diferencia de los productos anteriores, esta vez **no quedó ningún
campo en `unknownFields`**: el datasheet declara explícitamente
dimensiones físicas (248×135×41mm), peso (649g/966g), conector de
alimentación (`8-pin`), consumo (155W) y PSU recomendada (550W) — todos
usados tal cual, sin redondeos ni conversión (p. ej. no se dedujo un
"slot count" a partir del grosor de 41mm; se guardó como `thicknessMm`
literal).

No se tocó AMD (sigue en pausa) ni los 4 productos previos.
`node scripts/validate-v2.js` → 13 entries válidas (8 family + 5 product),
0 offers, 0 presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

## 0.9 Tercer producto RTX 5060 — ASUS, y un candidato descartado (2026-08-22)

**Gigabyte descartado como candidato**: se intentó `gigabyte.com/.../GV-N5060OC-8GL`
(403 Forbidden en fetch directo) y WebSearch dirigido a esa URL, pero las
respuestas mezclaron el dominio oficial con retailers (centralcomputer,
techpowerup, pbtech) de forma ambigua, y el TDP citado varió entre
consultas (109W / "150W+" / 145W según la fuente) — señal de contaminación
de fuentes. Por la regla de no usar retailers ni datos inconsistentes, se
abandonó este candidato sin crear ningún registro.

**Producto agregado**: **`prod-asus-rtx5060-dual-oc`** — `brand=ASUS`,
`commercialName="ASUS Dual GeForce RTX 5060 8GB GDDR7 OC Edition"`,
`partNumber="DUAL-RTX5060-O8G"`, `familyId=family-nvidia-rtx5060`,
`selectable=true`, `verified`. Fuente principal: `asus.com/.../techspec/`
(fetch directo exitoso, dominio propio del fabricante) — primera vez que
se obtiene un **`slotWidth` declarado explícitamente** ("Form Factor: 2.5
Slot") en vez de tener que dejarlo sin confirmar. Corroborado por
`marketplace.nvidia.com` (mismo MPN). Un campo de la extracción
("Bus Standard: OpenGL") se detectó como claramente erróneo/mezclado y
**no se usó** para `interface.pcieGen` — se dejó `null` en vez de asumir
un valor no confiable; `power.consumptionW` también null (no declarado).

No se tocó AMD, ni los 6 productos previos, ni las 8 `family`.
`node scripts/validate-v2.js` → 14 entries válidas (8 family + 6 product),
0 offers, 0 presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

## 0.10 Segundo producto para RTX 5070 — MSI datasheet PDF (2026-08-22)

Se agregó **`prod-msi-rtx5070-12g-gaming-trio-oc`** — `brand=MSI`,
`commercialName="GeForce RTX 5070 12G GAMING TRIO OC"`,
`partNumber="G5070-12GTC"`, `familyId=family-nvidia-rtx5070`,
`selectable=true`, `verified`. Fuente única y suficiente: datasheet PDF
oficial de MSI (`storage-asset.msi.com`, fetch directo + `pdftotext`,
mismo mecanismo que el datasheet de RTX 5060). Todos los campos técnicos
quedaron confirmados (sin `unknownFields`), incluyendo dimensiones, peso y
consumo.

Detalle relevante: el datasheet declara el conector como **"16-pin x 1"**,
no "12V-2x6"/"12VHPWR". Se guardó el valor literal en `technical.power.
connector` (campo libre, no sujeto a V-12), pero **no se agregó a
`compatibility.requires`** porque "16-pin" no coincide con ningún valor
del vocabulario controlado `gpuPowerConnector` y mapearlo habría sido una
inferencia no autorizada — el vocabulario no se modificó.

No se abrió ningún candidato adicional de RTX 5060. No se tocó AMD ni
ningún producto/family previos. `node scripts/validate-v2.js` → 15
entries válidas (8 family + 7 product), 0 offers, 0 presets. `node --test`
→ 31/31. `data/catalog.json`, `data/components.json` y la UI intactos.

## 0.11 Primer producto para RTX 5080 — MSI datasheet PDF (2026-08-22)

Se agregó **`prod-msi-rtx5080-16g-gaming-trio`** — `brand=MSI`,
`commercialName="GeForce RTX 5080 16G GAMING TRIO"`,
`partNumber="G5080-16GT"`, `familyId=family-nvidia-rtx5080`,
`selectable=true`, `verified`. Fuente: datasheet PDF oficial de MSI
(`storage-asset.msi.com/datasheet/vga/global/GeForce-RTX-5080-16G-GAMING-TRIO.pdf`,
`kind: "datasheet"`), verificado de forma **independiente** con fetch
directo + `pdftotext` — los valores propuestos en la instrucción del
usuario se re-confirmaron contra el PDF real antes de usarse (coincidieron
exactamente) y se obtuvieron datos adicionales no incluidos en la
instrucción (CUDA cores 10752, boost/extreme clocks, memory speed 30Gbps).
Todos los campos técnicos quedaron confirmados (sin `unknownFields`).

Mismo criterio que en RTX 5070: el conector se declara "16-pin x 1" en el
PDF y se guardó como texto literal en `technical.power.connector`, **sin
convertirlo** a `12VHPWR`/`12V-2x6` ni agregarlo a `compatibility.requires`
(no coincide con el vocabulario controlado).

No se tocó AMD, ni ningún producto/family previos. `node
scripts/validate-v2.js` → 16 entries válidas (8 family + 8 product), 0
offers, 0 presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

## 0.12 Primer producto para RTX 5090 — MSI datasheet PDF (2026-08-22)

Se agregó **`prod-msi-rtx5090-32g-gaming-trio-oc`** — `brand=MSI`,
`commercialName="GeForce RTX 5090 32G GAMING TRIO OC"`,
`partNumber="G5090-32GTC"`, `familyId=family-nvidia-rtx5090`,
`selectable=true`, `verified`. Fuente: datasheet PDF oficial de MSI
(`storage-asset.msi.com/datasheet/vga/global/GeForce-RTX-5090-32G-GAMING-TRIO-OC.pdf`,
`kind: "datasheet"`), fetch directo + `pdftotext`. Confirmado: CUDA cores
21760, boost 2482MHz / extreme 2497MHz, 32GB GDDR7 512-bit 28Gbps, PCIe
Gen 5, consumo 575W, conector "16-pin x1", PSU recomendada 1000W,
dimensiones 359×149×70mm, peso 2119g/2735g. Sin `unknownFields`. Mismo
criterio que 5070/5080: conector guardado literal, sin convertir a
`12VHPWR`/`12V-2x6` ni agregado a `compatibility.requires`.

Con esto, las 4 families GPU NVIDIA tienen ahora ≥1 producto MSI real con
datasheet oficial (5060, 5070, 5080, 5090), además de los productos
PNY/ASUS ya cargados. AMD sigue sin tocarse.

`node scripts/validate-v2.js` → 17 entries válidas (8 family + 9 product),
0 offers, 0 presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

## 0.13 Segundo producto RTX 5070 (ASUS) — GIGABYTE y ZOTAC bloqueados, mantenidos como pendientes (2026-08-22)

**GIGABYTE descartado** (segundo intento, misma URL, sin relajar reglas):
`gigabyte.com/Graphics-Card/GV-N5070GAMING-OC-12GD` y `.../sp` → 403
Forbidden en ambos intentos independientes. Sin PDF oficial accesible.
**No se creó producto.**

**ZOTAC descartado por ahora** (candidato pendiente, no cerrado): páginas
de producto → 403; PDFs oficiales reales encontrados en
`zotac.com/download/mediadrivers/.../Brochure/*.pdf` (ruta estática
distinta, confirmada como dominio propio de ZOTAC) → **468 (bloqueo)** en
3 intentos sobre 2 URLs. Además, la síntesis de búsqueda mostró un boost
clock inconsistente entre consultas (2512MHz vs 2587MHz), reforzando la
decisión de no usarla como sustituto. **No se creó producto.** Queda como
candidato a reintentar más adelante (se ubicaron URLs reales de brochures
oficiales, por si el acceso mejora).

**Producto agregado**: **`prod-asus-rtx5070-dual-oc`** — `brand=ASUS`,
`commercialName="ASUS Dual GeForce RTX 5070 12GB GDDR7 OC Edition"`,
`partNumber="DUAL-RTX5070-O12G"`, `familyId=family-nvidia-rtx5070`,
`selectable=true`, `verified`. Fuente: `asus.com/.../techspec/` (fetch
directo exitoso). Confirmado: CUDA cores 6144, boost 2542MHz (default) /
2572MHz (OC mode), 12GB GDDR7 192-bit 28Gbps, dimensiones 249×126×50.6mm,
slot width 2.53 (declarado explícitamente), PSU recomendada 750W. El
campo `power.connector` existe en la tabla de ASUS pero su valor textual
no pudo extraerse con certeza en 2 intentos (contenido dinámico
incompleto) — se dejó `null` + `unknownFields` en vez de asumir.

RTX 5070 ahora tiene 3 productos: NVIDIA FE, MSI GAMING TRIO OC, ASUS Dual
OC. AMD sigue sin tocarse. `node scripts/validate-v2.js` → 18 entries
válidas (8 family + 10 product), 0 offers, 0 presets. `node --test` →
31/31. `data/catalog.json`, `data/components.json` y la UI intactos.

## 0.14 Segundo producto RTX 5090 — ASUS techspec (2026-08-22)

Se agregó **`prod-asus-rtx5090-tuf-o32g-gaming`** — `brand=ASUS`,
`commercialName="ASUS TUF Gaming GeForce RTX 5090 32GB GDDR7 OC Edition"`,
`partNumber="TUF-RTX5090-O32G-GAMING"`, `familyId=family-nvidia-rtx5090`,
`selectable=true`, `verified`. Fuente: `asus.com/.../techspec/` (fetch
directo exitoso, mismo mecanismo fabricante→página oficial→fetch→
extracción→evidencia→producto usado con MSI). Confirmado: CUDA cores
21760, boost 2550MHz (default)/2580MHz (OC mode), 32GB GDDR7 512-bit
28Gbps, dimensiones 348×146×72mm, slot width 3.6 (declarado
explícitamente), conector "1 x 16-pin" (guardado literal, sin convertir a
12VHPWR/12V-2x6), PSU recomendada 1000W. `power.consumptionW` no estaba
en la tabla → `null` + `unknownFields`.

RTX 5090 ahora tiene 2 productos: MSI GAMING TRIO OC y ASUS TUF OC.
GIGABYTE y ZOTAC no se reintentaron (quedan pendientes por instrucción
explícita). AMD sigue sin tocarse. `node scripts/validate-v2.js` → 19
entries válidas (8 family + 11 product), 0 offers, 0 presets. `node
--test` → 31/31. `data/catalog.json`, `data/components.json` y la UI
intactos.

## 0.15 Segundo producto RTX 5080 — ASUS techspec (2026-08-22)

Se agregó **`prod-asus-rtx5080-tuf-o16g-gaming`** — `brand=ASUS`,
`commercialName="ASUS TUF Gaming GeForce RTX 5080 16GB GDDR7 OC Edition"`,
`partNumber="TUF-RTX5080-O16G-GAMING"`, `familyId=family-nvidia-rtx5080`,
`selectable=true`, `verified`. Fuente: `asus.com/.../techspec/` (fetch
directo exitoso). Confirmado: CUDA cores 10752, boost 2700MHz
(default)/2730MHz (OC mode), 16GB GDDR7 256-bit 30Gbps, dimensiones
348×146×72mm, slot width 3.6, conector "1 x 16-pin" (literal, sin
convertir), PSU recomendada 850W. `power.consumptionW` no estaba en la
tabla → `null` + `unknownFields`.

Con esto, **las 4 families GPU NVIDIA tienen ahora 2 productos cada una**
(MSI + ASUS): 5060 (PNY/MSI/ASUS = 3), 5070 (FE/MSI/ASUS = 3), 5080
(MSI/ASUS = 2), 5090 (MSI/ASUS = 2). GIGABYTE y ZOTAC siguen pendientes
(no reintentados). AMD sigue sin tocarse. `node scripts/validate-v2.js` →
20 entries válidas (8 family + 12 product), 0 offers, 0 presets. `node
--test` → 31/31. `data/catalog.json`, `data/components.json` y la UI
intactos.

## 0.16 Primera categoría nueva: RAM — Corsair Vengeance DDR5 (2026-08-22)

Primer avance fuera de CPU/GPU, con el mismo estándar de sourcing.

**Decisión estructural**: para RAM no existe un "chip/plataforma" vendor
neutral como AMD/NVIDIA en CPU/GPU (los kits no revelan el fabricante del
IC DRAM). Se optó por modelar `family-memory-ddr5` (`category: "ram"`)
como el estándar de memoria DDR5 en sí — análogo funcional al chip/socket
en CPU — con `product` = kit comercial concreto. Fuente ideal para la
family habría sido JEDEC.org (organismo oficial del estándar DDR5) pero
`jedec.org/category/...` y `jedec.org/standards-documents/docs/jesd79-5d`
dieron **403 Forbidden** en ambos intentos. Se usó en su lugar la página
oficial de Corsair (que declara explícitamente "Memory Type: DDR5 UDIMM"),
documentando la limitación en la evidencia en vez de omitirla o inferir.

**Entradas agregadas:**
- `family-memory-ddr5` — `type=family`, `selectable=false`,
  `technical.memoryType="DDR5"`, `verified`.
- `prod-corsair-vengeance-ddr5-6000-32gb` — `brand=CORSAIR`,
  `commercialName="VENGEANCE 32GB (2x16GB) DDR5 DRAM Up To 6000MT/s CL36
  Memory Kit — Black"`, `partNumber="CMK32GX5M2B6000C36"`,
  `familyId=family-memory-ddr5`, `selectable=true`, `verified`. Fuente:
  `corsair.com/us/en/p/memory/cmk32gx5m2b6000c36/...` (fetch directo
  exitoso). Confirmado: capacidad 32GB (2x16GB), velocidad 6000MT/s,
  timings tested 36-38-38-76 / SPD 40-40-40-77, voltaje tested 1.25V /
  SPD 1.1V, 288-pin, peso 0.115kg, SPD por defecto 4800MHz. Sin
  `unknownFields`.

No se tocó AMD, ni ninguno de los 12 productos GPU ni las 8 families GPU
previas. `node scripts/validate-v2.js` → 22 entries válidas (9 family + 13
product), 0 offers, 0 presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

## 0.17 Segunda categoría nueva: motherboard — Intel Z890 (2026-08-22)

Se evitó deliberadamente cualquier chipset AMD (X870/X870E) para no tocar
el frente pausado; se usó **Intel Z890** (LGA1851), sin relación con la
investigación AMD en curso.

**Fuente ideal bloqueada**: `intel.com/.../intel-z890-chipset/specifications.html`
y el PDF `cdrdv2-public.intel.com/832633/intel-z890-chipset-brief.pdf` →
403 Forbidden en ambos. Mismo patrón que JEDEC/DDR5: se usó la página
oficial de un fabricante de placas (ASUS) que declara el chipset
explícitamente, documentando la limitación.

**Entradas agregadas:**
- `family-intel-z890` — `type=family`, `category=motherboard`,
  `selectable=false`, `technical.socket="LGA1851"`, `verified`.
- `prod-asus-tuf-gaming-z890-pro-wifi` — `brand=ASUS`,
  `commercialName="TUF GAMING Z890-PRO WIFI"`,
  `familyId=family-intel-z890`, `selectable=true`, `verified`. Fuente:
  `asus.com/.../tuf-gaming-z890-pro-wifi/techspec/` (fetch directo
  exitoso). Confirmado: socket LGA1851, chipset Intel Z890, memoria (4
  DIMM DDR5, máx 256GB, hasta 9066+MT/s OC), slots de expansión (1x PCIe
  5.0 x16, 1x PCIe 4.0 x16, 1x PCIe 4.0 x4, 2x PCIe 4.0 x1), storage (4x
  M.2, 4x SATA), form factor ATX (305×244mm). Sin `unknownFields`. La
  página no distingue un código de part number separado del nombre
  comercial — se usó el mismo texto literal como `model`/`partNumber` en
  vez de inventar un código alfanumérico.

No se tocó AMD, ni ningún producto/family GPU/RAM previos. `node
scripts/validate-v2.js` → 24 entries válidas (10 family + 14 product), 0
offers, 0 presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

## 0.18 Segunda placa Z890 — MSI datasheet PDF (2026-08-22)

Se agregó **`prod-msi-mag-z890-tomahawk-wifi`** — `brand=MSI`,
`familyId=family-intel-z890`, `selectable=true`, `verified`. Fuente:
`storage-asset.msi.com/datasheet/mb/global/MAG-Z890-TOMAHAWK-WIFI.pdf`
(fetch directo + `pdftotext`). Confirmado: socket LGA1851, chipset Intel
Z890, memoria (4 DIMM DDR5 hasta 9200+MT/s OC), slots (1x PCIe 5.0 x16,
2x PCIe 4.0 x16), storage (1x M.2 Gen5, 3x M.2 Gen4, 4x SATA). El
datasheet de MSI **no** declara capacidad máxima de memoria en GB, ni
form factor, ni dimensiones físicas — a diferencia del de ASUS. Esos 4
campos quedaron `null` + `unknownFields` en vez de asumir "ATX" por
convención de mercado (esto valida que el esquema family→product tolera
bien datasheets de distinto nivel de detalle entre fabricantes, sin forzar
uniformidad).

`node scripts/validate-v2.js` → 25 entries válidas (10 family + 15
product), 0 offers, 0 presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

## 0.19 Tercera placa Z890 — ASRock manual PDF (2026-08-22)

Se agregó **`prod-asrock-z890-pro-a`** — `brand=ASRock`,
`commercialName="ASRock Z890 Pro-A"`, `familyId=family-intel-z890`,
`selectable=true`, `verified`. Fuente: `download.asrock.com/Manual/Z890
Pro-A.pdf` (dominio propio del fabricante, fetch directo + `pdftotext`).
Confirmado con la sección de especificaciones del manual: chipset Intel
Z890, memoria (4 DIMM DDR5, hasta 9066+MT/s OC, máx 256GB), slots (1x
PCIe 5.0 x16, 2x PCIe 4.0 x4, 1x PCIe 4.0 x1), storage (1x M.2 Gen5, 3x
M.2 Gen4, 4x SATA), y **"ATX Form Factor"** confirmado textualmente dos
veces en el documento. El socket aparece en el manual como "Socket
1851"/"1851-Pin" — se normalizó a `LGA1851` (mismo socket físico que ASUS
y MSI ya refieren con esa notación en sus propias fuentes). Dimensiones
exactas en mm no aparecen → `null` + `unknownFields`.

**Cierre del bloque motherboard (3 fabricantes, mismo `family-intel-z890`):**
ASUS TUF Z890-Pro WiFi, MSI MAG Z890 Tomahawk WiFi, ASRock Z890 Pro-A. El
esquema family→product se comportó consistentemente entre fabricantes con
distinto nivel de detalle documental (ASUS y ASRock dieron capacidad
máxima/form factor; MSI no) — cada gap se dejó `null`/`unknownFields` sin
forzar uniformidad entre fuentes.

`node scripts/validate-v2.js` → 26 entries válidas (10 family + 16
product), 0 offers, 0 presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

## 0.20 Tercera categoría nueva: PSU — ATX genérico + MSI MAG A850GL PCIE5 (2026-08-22)

Regla explícita del usuario aplicada: la `family` de PSU representa **solo
la plataforma/tipo técnico** (ATX), nunca fabricante ni certificación.
80 PLUS, ATX 3.x y modularidad quedan exclusivamente a nivel `product`,
cuando la fuente los declare explícitamente.

**`family-psu-atx`** — `category=psu`, `selectable=false`,
`technical.formFactor="ATX"` únicamente (sin versión, sin certificación).
Fuente: portal oficial de diseño de Intel (`edc.intel.com`, dominio
propio de Intel — fetch directo exitoso), documento "ATX Version 3.0
Multi Rail Desktop Platform Power Supply" design guide, usado solo para
confirmar "ATX" como plataforma genérica — deliberadamente **no** se
codificó la versión 3.0 del documento en la family.

**`prod-msi-mag-a850gl-pcie5`** — `brand=MSI`, `familyId=family-psu-atx`,
`selectable=true`, `verified`. Fuente: datasheet PDF oficial de MSI
(`storage-asset.msi.com/datasheet/power-supply/global/MAG-A850GL-PCIE5.pdf`,
fetch directo + `pdftotext`). Confirmado: 850W, 80 PLUS Gold, **ATX 3.1**
(declarado a nivel producto, no family), full modular, PFC activo, rango
de voltaje/frecuencia de entrada, excursión de potencia 1700W,
protecciones (OCP/OVP/OPP/OTP/SCP/UVP), dimensiones 140×150×86mm,
conectores completos (ATX 24-pin, EPS 4+4, PCIe 5.0 16-pin, PCIe 6+2 x4,
SATA x8, periférico x4, FDD). Sin `unknownFields`. El conector PCIe 5.0
de 16 pines no se agregó a `compatibility.*` (mismo criterio "16-pin" no
coincide con el vocabulario controlado ya aplicado en GPU).

No se tocó AMD, ni ninguna family/product GPU/RAM/motherboard previos.
`node scripts/validate-v2.js` → 28 entries válidas (11 family + 17
product), 0 offers, 0 presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

## 0.21 Segunda PSU — Corsair RM1000e (2026-08-22)

Se agregó **`prod-corsair-rm1000e-atx31`** — `brand=CORSAIR`,
`partNumber="CP-9020294-NA"`, `familyId=family-psu-atx`,
`selectable=true`, `verified`. Fuente: `corsair.com/us/en/p/psu/...`
(fetch directo exitoso). Confirmado: 1000W, Cybenetics Gold (~89%), ATX
3.1, full modular, ventilador 120mm, dimensiones 140×150×86mm, voltaje/
frecuencia de entrada, peso 3.23kg, MTBF 100,000h, garantía 7 años,
conectores completos. Sin `unknownFields`.

**Hallazgo relevante**: esta fuente declara el conector como **"12V-2x6
(12+4) Pin"** — a diferencia del "16-pin" genérico usado por las fuentes
de GPU (MSI/ASUS), este término coincide EXACTAMENTE con el vocabulario
controlado `gpuPowerConnector`. Por eso, a diferencia de todos los casos
anteriores, aquí sí se agregó `{key:"gpuPowerConnector", value:"12V-2x6"}`
a `compatibility.provides` — no es una conversión ni inferencia, es el
término literal de esta fuente oficial.

`family-psu-atx` ahora tiene 2 productos de fabricantes distintos (MSI +
Corsair), validando el mismo patrón ya probado en motherboard. No se tocó
AMD ni ninguna family/product previos. `node scripts/validate-v2.js` → 29
entries válidas (11 family + 18 product), 0 offers, 0 presets. `node
--test` → 31/31. `data/catalog.json`, `data/components.json` y la UI
intactos.

## 0.22 Cuarta categoría nueva: storage — NVMe PCIe Gen4, Samsung 990 PRO y WD_BLACK SN850X (2026-08-22)

Decisión estructural (evaluada antes de crear ningún producto): el análogo
vendor-neutral para `storage` no es una marca ni un modelo, sino el par
interfaz/protocolo eléctrico-lógico del bus, siguiendo el mismo principio ya
usado en `family-memory-ddr5` (estándar de memoria) y `family-psu-atx`
(plataforma de fuente de poder) — nunca certificación ni fabricante a nivel
family. Se descartó modelar la family por factor de forma (M.2-2280 etc.)
porque el mismo estándar eléctrico/lógico se implementa en varios factores de
forma físicos distintos; factor de forma queda a nivel `product`, igual que
la versión ATX 3.1 quedó a nivel `product` en PSU.

**`family-storage-nvme-pcie4`** — `category=storage`, `selectable=false`,
`technical.interface="PCIe"`, `technical.protocol="NVMe"`,
`technical.pcieGen="4.0"`. Fuente ideal bloqueada: NVM Express, Inc.
(`nvmexpress.org/specifications/`, organismo oficial del estándar NVMe) →
403 Forbidden. Se usó en su lugar el datasheet oficial de Samsung que
declara explícitamente "PCIe Gen 4.0 x4, NVMe 2.0", documentando la
limitación (mismo patrón que JEDEC/DDR5 e Intel/Z890).

**`prod-samsung-990pro-2tb`** — `brand=Samsung`, `commercialName="Samsung
SSD 990 PRO 2TB"`, `model="MZ-V9P2T0"`, `partNumber="MZ-V9P2T0B/AM"`,
`familyId=family-storage-nvme-pcie4`, `selectable=true`, `verified`. Fuente:
datasheet PDF oficial de Samsung
(`download.semiconductor.samsung.com/resources/data-sheet/Samsung_NVMe_SSD_990_PRO_Datasheet_Rev.1.0.pdf`,
fetch directo + `pdftotext`). Confirmado (columna 2TB): controller Samsung
in-house, NAND Samsung V-NAND TLC, DRAM cache 2GB LPDDR4, dimensiones
80×22×2.3mm, form factor M.2 (2280), lecturas/escrituras secuenciales
7450/6900 MB/s, IOPS aleatorios 1400K/1550K, potencia idle 55mW, activa
lectura/escritura 5.8W/5.1W, TBW 1200TB, MTBF 1.5 millones de horas,
garantía 5 años. Único campo `null`: `physical.weightG` (el datasheet no
declara peso).

**`prod-wd-black-sn850x-1tb`** — `brand=Western Digital`,
`commercialName="WD_BLACK SN850X NVMe SSD 1TB"`, `model="WDS100T2X0E"`,
`partNumber="WDS100T2X0E"`, `familyId=family-storage-nvme-pcie4`,
`selectable=true`, `verified`. Fuente: datasheet PDF oficial de SanDisk
Corporation / Western Digital (`documents.sandisk.com`, dominio propio del
fabricante — SanDisk Corporation es la entidad que opera la marca WD_BLACK
tras la escisión 2025 de Western Digital; el propio PDF declara "WD_BLACK
... trademarks of Western Digital Corporation"), fetch directo + `pdftotext`.
Confirmado (columna 1TB sin heatsink, modelo WDS100T2X0E): interfaz PCIe
Gen4 16GT/s x4, NAND SanDisk TLC 3D NAND, lecturas/escrituras secuenciales
7300/6300 MB/s, IOPS aleatorios 800K/1100K, TBW 600, dimensiones
80×22×2.38mm, peso 7.5g, seguridad TCG OPAL 2.01, garantía 5 años. El
datasheet no incluye ninguna sección de consumo de energía para este
modelo — por eso no se creó ningún campo `power` (a diferencia de un valor
tabulado pero ausente, aquí la sección misma no existe en la fuente).

**Candidato descartado — Crucial/Micron T500**: se intentó `crucial.com`
(páginas de producto CT1000T500SSD8) y `assets.micron.com` (product flyer
oficial) como segundo fabricante. Ambos dominios devolvieron "Request
Rejected" (protección anti-bot) en fetch directo. No se usó ningún
retailer/agregador (simms.co.uk apareció en la búsqueda pero es un
distribuidor, no fuente oficial) para completar el dato. **No se creó
ningún producto Crucial.**

No se tocó AMD, GIGABYTE, ni ZOTAC (todos permanecen en el mismo estado
documentado en §0.7/§0.13). No se tocaron las categorías case ni cooling
(siguen sin iniciar). `node scripts/validate-v2.js` → 32 entries válidas (12
family + 20 product), 38 evidencias, 0 offers, 0 presets. `node --test` →
31/31. `data/catalog.json`, `data/components.json` y la UI intactos.

## 0.23 Auditoría de Storage y primera family SATA (2026-08-22)

Auditoría previa a este paso (sin cambios) detectó que la cobertura V2 de
`storage` era insuficiente frente a los 4 tiers/alternativas reales de
`data/components.json`: solo existía NVMe Gen4 (cubre tiers "media"/"alta"
default), pero **SATA** (tier "entrada", el más usado) y **NVMe Gen5**
(tier "alta" alternativa / "extrema") no tenían ninguna representación en
V2. Este paso cierra la brecha de SATA; NVMe Gen5 queda pendiente.

**`family-storage-sata`** — `category=storage`, `selectable=false`,
`technical.interface="SATA"`, análoga a `family-storage-nvme-pcie4` pero
para el bus SATA. Fuente: datasheet oficial de Samsung ("Interface: SATA 6
Gb/s Interface, compatible with SATA 3 Gb/s & 1.5 interfaces"). El
protocolo lógico (AHCI) no se declara textualmente en este datasheet, por
lo que el campo `protocol` se omitió en vez de asumirse por convención de
mercado (mismo criterio que "no inferir" ya aplicado en toda la Fase 3).

**`prod-samsung-870evo-1tb`** — `brand=Samsung`, `commercialName="Samsung
SSD 870 EVO 1TB"`, `model="MZ-77E1T0"`, `partNumber="MZ-77E1T0B/AM"`,
`familyId=family-storage-sata`, `selectable=true`, `verified`. Fuente:
datasheet PDF oficial de Samsung
(`download.semiconductor.samsung.com/resources/data-sheet/Samsung_SSD_870_EVO_Data_Sheet_Rev1.1.pdf`,
fetch directo + `pdftotext`). Confirmado (columna 1TB): controller Samsung
MKX, NAND Samsung V-NAND 3bit MLC, DRAM cache 1GB LPDDR4, dimensiones
100×69.85×6.8mm, form factor 2.5 inch, secuencial lectura/escritura 560/530
MB/s, MTBF 1.5 millones de horas, TBW 600TB, garantía 5 años, seguridad
AES-256/TCG Opal V2.0. **Nota de integridad de extracción**: las filas de
IOPS aleatorios (4KB QD1/QD32) y de consumo de energía del PDF se
extrajeron con columnas visualmente desalineadas entre capacidades — para
no atribuir un número a la capacidad equivocada, esos campos se omitieron
por completo (ni valor ni `null`/`unknownFields`, porque la ambigüedad está
en la extracción, no en la ausencia del dato en la fuente real).

Con esto, Storage cubre ahora NVMe Gen4 (tiers "media"/"alta") y SATA (tier
"entrada"). Pendiente explícito: NVMe Gen5 (tier "alta" alternativa /
"extrema" default) sigue sin `family`/`product`. No se creó ningún
crosswalk legacy-id↔V2-id (fuera de alcance de este paso). No se tocó AMD,
GIGABYTE, ZOTAC, Crucial/Micron (ya descartado en §0.22), ni case/cooling.
`node scripts/validate-v2.js` → 34 entries válidas (13 family + 21
product), 40 evidencias, 0 offers, 0 presets. `node --test` → 31/31.
`data/catalog.json`, `data/components.json` y la UI intactos.

## 0.24 NVMe PCIe Gen5 — Samsung 9100 PRO 4TB (2026-08-22)

Cierra el pendiente explícito de §0.23. **`family-storage-nvme-pcie5`** —
`category=storage`, `selectable=false`, `technical.interface="PCIe"`,
`technical.protocol="NVMe"`, `technical.pcieGen="5.0"`, análoga a
`family-storage-nvme-pcie4` pero para PCIe Gen5. Misma fuente ideal
bloqueada (NVM Express, Inc., ya documentada en §0.22); se usó el datasheet
oficial de Samsung 9100 PRO.

**`prod-samsung-9100pro-4tb`** — `brand=Samsung`, `commercialName="Samsung
SSD 9100 PRO 4TB"`, `model="MZ-VAP4T0"`, `partNumber="MZ-VAP4T0B/AM"`,
`familyId=family-storage-nvme-pcie5`, `selectable=true`, `verified`.
Fuente: datasheet PDF oficial de Samsung
(`download.semiconductor.samsung.com/resources/data-sheet/Samsung_NVMe_SSD_9100_PRO_Datasheet_Rev.1.0.pdf`,
fetch directo + `pdftotext`). Capacidad elegida: 4TB, para representar el
tier "extrema"/alternativa de "alta" del legacy. Confirmado (columna 4TB):
controller Samsung in-house, NAND Samsung V-NAND TLC, DRAM cache 4GB
LPDDR4X, secuencial lectura/escritura 14800/13400 MB/s, IOPS aleatorios
2200K/2600K, potencia activa lectura/escritura 9.0W/8.2W, idle PS3/PS4
6.5mW/5.7mW, dimensiones 80.15×22.15×2.38mm, TBW 2400TB, MTBF 1.5 millones
de horas, garantía 5 años, seguridad AES-256/TCG Opal V2.0. Único campo
`null`: `physical.weightG` (no declarado). **Nota de integridad**: el
datasheet marca explícitamente con `(TBD)` los valores de rendimiento y
potencia de la columna 8TB (no finalizados al momento de publicación); se
verificó el orden lineal de las 4 columnas antes de asignar cada valor a
4TB para evitar el mismo tipo de desalineación visual detectada en el
datasheet SATA 870 EVO (§0.23).

Con esto, `storage` cubre los 4 escenarios reales de `data/components.json`:
SATA (entrada), NVMe Gen4 1TB/2TB (media/alta) y NVMe Gen5 4TB (alta-alt/
extrema). No se tocó AMD, GIGABYTE, ZOTAC, Crucial/Micron, ni case/cooling.
`node scripts/validate-v2.js` → 36 entries válidas (14 family + 22
product), 42 evidencias, 0 offers, 0 presets. `node --test` → 31/31.
`data/catalog.json`, `data/components.json` y la UI intactos.

*(Nota: el crosswalk legacy-id↔V2-id para storage se agregó en un paso
posterior — ver §0.25 — en `data/v2/crosswalk.v2.json`.)*

## 0.25 Crosswalk legacy↔V2 y categoría CASE (2026-08-22)

**Crosswalk storage** (auditoría posterior a §0.24): se creó
`data/v2/crosswalk.v2.json`, un archivo de solo lectura fuera del contrato
validado por `scripts/validate-v2.js`, con el mapeo explícito
`legacyId → productId` para los 4 escenarios de storage
(`ssd-sata-1tb→prod-samsung-870evo-1tb`,
`ssd-nvme-1tb→prod-wd-black-sn850x-1tb`,
`ssd-nvme-2tb→prod-samsung-990pro-2tb`,
`ssd-nvme-4tb→prod-samsung-9100pro-4tb`). Integridad referencial verificada
manualmente (sin ids huérfanos ni duplicados); Storage V2 quedó cerrado.

**Auditoría de CASE** (previa a implementar, sin cambios): `data/components.json`
tiene 3 legacyId en la categoría `case` (`case-matx`, `case-mid`,
`case-full`), pero **solo `case-mid` y `case-full` se usan realmente** en
los 4 tiers (`entrada`/`media`/`alta`→`case-mid`; `extrema`→`case-full`;
ninguna alternativa declarada). `case-matx` no se usa en ningún tier ni
alternativa — por el mismo criterio de "no rellenar por cantidad" ya
aplicado en storage, **no se creó ningún registro para `case-matx`**.
Cobertura V2 antes de este paso: 0 entries `category=case`.

**`family-case-atx-mid-tower`** — `category=case`, `selectable=false`,
`technical.class="mid-tower"`, `formFactorsSupported=["MiniITX","MicroATX","ATX","EATX"]`.
Fuente: página oficial de producto Corsair (el nombre comercial del
producto declara textualmente "Mid-Tower ATX Case", usado como evidencia
de `class`).

**`prod-corsair-4000d-airflow`** — `brand=CORSAIR`, `commercialName="4000D
AIRFLOW Tempered Glass Mid-Tower ATX Case — White"`, `model="4000D
AIRFLOW"`, `partNumber="CC-9011201-WW"`, `familyId=family-case-atx-mid-tower`,
`selectable=true`, `verified`. Fuente: `corsair.com/us/en/p/pc-cases/...`
(fetch directo exitoso). Confirmado: motherboard support Mini-ITX/Micro-ATX/
ATX/E-ATX, `maxGpuLengthMm=360` y `maxCoolerHeightMm=170` (coinciden
**exactamente** con los límites del legacy `case-mid`), PSU ATX máx 220mm,
bahías 4×2.5"/2×3.5", radiador front 360/280/240mm + rear 120mm (bottom y
side declarados explícitamente como "None" → arrays vacíos, no `null`, por
ser un hecho confirmado y no una ausencia de dato), dimensiones "453 x 230
x 466mm" (la fuente no etiqueta qué eje es cuál — se guardó como texto
literal sin decodificar, en vez de asumir un orden), peso 9.15kg, front
panel I/O. Único campo `null`: `radiatorSupport.topMm` (no declarado en
absoluto en la fuente, a diferencia de bottom/side que sí se declaran como
"None").

**`family-case-atx-full-tower`** — análoga, `technical.class="full-tower"`.
Fuente: página oficial Corsair del 7000D AIRFLOW (nombre comercial declara
"Full-Tower ATX").

**`prod-corsair-7000d-airflow`** — `brand=CORSAIR`, `commercialName="7000D
AIRFLOW Full-Tower ATX PC Case — Black"`, `model="7000D AIRFLOW"`,
`partNumber="CC-9011218-WW"`, `familyId=family-case-atx-full-tower`,
`selectable=true`, `verified`. Fuente: `corsair.com/us/en/p/pc-cases/...`
(fetch directo exitoso). Confirmado: `maxGpuLengthMm=450` y
`maxCoolerHeightMm=190` (superan los mínimos del legacy `case-full`,
400mm/180mm, sin quedar por debajo), PSU ATX máx 225mm, bahías
4×2.5"/6×3.5", radiador soporta 120/140/240/280/360/420/480mm (lista única,
la fuente no desglosa por ubicación como el 4000D — no se inventó esa
distribución), dimensiones con ejes explícitamente etiquetados
(alto 600mm, largo 550mm, ancho 248mm), peso 20.7kg. Sin `unknownFields`.

**Candidatos descartados para `case-full`** (documentados en evidencia, sin
crear registro): CORSAIR 5000D AIRFLOW (GPU 420mm pero cooler solo 170mm,
por debajo del mínimo legacy de 180mm); Fractal Design Define 7 XL (cooler
185mm válido, pero GPU length ambiguo/dependiente de layout según
WebSearch, sin fetch directo que lo desambiguara).

**Crosswalk case**: se agregaron 2 mappings a `data/v2/crosswalk.v2.json`
(`case-mid→prod-corsair-4000d-airflow`, `case-full→prod-corsair-7000d-airflow`).
Integridad referencial verificada manualmente, sin huérfanos ni duplicados.

No se tocó AMD, GIGABYTE, ZOTAC, Crucial/Micron, RAM/motherboard/PSU/storage
previos, ni cooling. `node scripts/validate-v2.js` → 40 entries válidas (16
family + 24 product), 46 evidencias, 0 offers, 0 presets. `node --test` →
31/31. `data/catalog.json`, `data/components.json` y la UI intactos.

## 0. Principio rector

Cada archivo tiene una única responsabilidad. Ningún campo puede tomar prestada
autoridad de otro dominio:

- **Identidad y especificación técnica** → `catalog.v2.json`
- **Evidencia que respalda cada campo técnico** → `evidence.v2.json`
- **Precio, vendedor, stock, región** → `offers.v2.json`
- **Composición de una build por productId** → `presets.v2.json`
- **Vocabulario controlado para compatibilidad** → `schema/vocab/*.json`

## 1. `verification.status` y `selectable`

```
verification.status ∈ { "verified", "partial", "unknown", "rejected" }
```

| status | selectable permitido |
|---|---|
| `verified` | `true` solo si además `type="product"` e `identity` completa |
| `partial` | siempre `false` |
| `unknown` | siempre `false` |
| `rejected` | siempre `false` |

**Invariante dura (V-01)**:
`selectable=true ⟹ verification.status=="verified" ∧ type=="product" ∧ identity.{brand,commercialName,model,partNumber} todos no-null`.

Family nunca es `selectable=true` (V-02).

## 2. `officialSources`

Vive solo en `catalog.v2.json`. Cada fuente: `{ sourceId, url, kind }`.

- `url` debe ser `https://` real; se rechazan placeholders (`https://...`,
  `https://www.fabricante.com/...`, URLs truncadas) y dominios de tienda
  (amazon., mercadolibre., newegg., bestbuy., aliexpress., ebay., walmart.).
- `kind` ∈ vocabulario `sourceKind`: `manufacturer-page`, `manufacturer-spec`,
  `datasheet`, `manual`, `official-support`, `certification-db`.
- `verification.status="verified"` requiere ≥1 `officialSource` válido.

## 3. Evidencia (`evidence.v2.json`, archivo separado — decisión aprobada)

Todo campo no-null de `technical.*` debe estar cubierto en
`technicalFieldEvidence[dotPath] = [evidenceId, ...]`, y cada `evidenceId`
debe existir en `evidence.v2.json`. Todo campo `null` debe listarse en
`unknownFields`. No se rellenan datos por inferencia.

```
evidence.v2.json: { evidenceId, sourceId, claim, accessedAt, verifiedAt }
```

`sourceId` debe existir en algún `officialSources` de `catalog.v2.json`.
`verifiedAt >= accessedAt` (V-11).

## 4. `family` vs `product`

- `family`: chip/plataforma/familia técnica. Nunca seleccionable.
- `product`: pieza física concreta. Requiere `identity.{brand,commercialName,
  model,partNumber}` completos + `familyId` existente para poder ser
  `selectable=true`.

Un chip/familia no se convierte automáticamente en producto.

## 5. Integridad de referencias (V-07)

Toda referencia cruzada debe existir en el archivo destino, o es error
reportado (nunca autocorregido creando entidades falsas):
`productId`, `familyId`, `sourceId`, `evidenceId`, `replacementProductId`,
`supersedesOfferId`.

## 6. `offers.v2.json`

Producto ≠ oferta. `catalog.v2.json` **nunca** contiene `price`, `seller`,
`stock` ni `currency` (chequeo automático V-NO-COMMERCIAL). Una oferta:

```
{ id, productId, region, currency, price:{amount>0}, seller:{name}, url, observedAt, verificationStatus }
```

Si no hay `price.amount > 0` verificado, el registro **no se crea** (V-08).
La UI muestra "sin oferta verificada en esta región" por ausencia, no por
un campo fabricado.

### Regla de stale (V-14, determinista)

```
ageDays = (fechaEvaluación - observedAt) en días
ageDays > 30  ⟹ verificationStatus DEBE ser "stale" (no "verified")
ageDays <= 30 ⟹ verificationStatus NO puede ser "stale"
```

Una oferta `stale` nunca se presenta como precio actual/verificado.

## 7. Fechas

ISO 8601 UTC estricto (`YYYY-MM-DDTHH:mm:ssZ`). `verifiedAt` de una
evidencia no puede ser anterior a su `accessedAt`. Las fechas de producto
(`verification.verifiedAt`) y de oferta (`observedAt`) nunca se mezclan en
el mismo objeto.

## 8. Vocabulario controlado (compatibilidad)

Todo campo usado en `compatibility.provides` / `requires` / `constraints`
debe tomar su `value` de un enum versionado en `data/v2/schema/vocab/`.
Nunca comparación de texto libre. Vocabularios definidos en Fase 1:

`category`, `entryType`, `verificationStatus`, `offerVerificationStatus`,
`sourceKind`, `socket`, `formFactor`, `memoryType`, `pcieGen`,
`storageInterface`, `storageFormFactor`, `storageProtocol`,
`gpuPowerConnector`.

## 9. Motor de compatibilidad — resultado por par

Precedencia total: `incompatible > unknown > warning > compatible`.

1. Campo requerido faltante/sin evidencia en A o B ⇒ `unknown`.
2. Constraint verificado que falla ⇒ `incompatible` (máxima precedencia).
3. `requires` de A sin match en `provides` de B ⇒ `incompatible`.
4. Match con advertencia verificada no bloqueante ⇒ `warning`.
5. Todo evaluable matchea, sin pendientes ⇒ `compatible`.

`UNKNOWN` nunca se convierte en `COMPATIBLE` por aproximación. Reglas
específicas por par (CPU+MB: socket/BIOS/chipset; GPU+case: longitud/altura/
slot width; GPU+PSU: conectores/potencia; SSD+MB: formato/interfaz/
protocolo; RAM+MB: generación DDR/formato/capacidad) se implementan en
Fase ≥2 sobre datos verificados reales — no implementadas en Fase 1.

## 10. `presets.v2.json`

Referencian solo `productId`, nunca `offerId`. Un preset es `publishable=true`
solo si todas sus `selections` resuelven a `productId` existente con
`selectable=true` **y** `compatibilityResult=="compatible"`. El validador
recalcula esta condición; no confía en el valor declarado en el archivo (V-10).

## 11. Legacy

`data/catalog.json` (32 registros: 4 tiers × 8 categorías) no se migra en
Fase 1. Ninguno de los 8 candidatos CPU/GPU (Ryzen 5 9600X, Ryzen 7 9700X,
Ryzen 7 9850X3D, Ryzen 9 9950X3D, RTX 5060/5070/5080/5090) se convierte en
`family` hasta investigación y evidencia real en Fase 2. Las 24 entradas
restantes (motherboard/ram/storage/psu/case/cooling) son descripciones de
nivel, no productos ni families identificables: quedan clasificadas como
`legacyProfile` (`sourceType: "legacy-generic-description"`), y el
validador rechaza cualquier entrada con ese `sourceType` dentro de
`catalog.v2.json` (V-13).

## 12. Estructura de carpetas (Fase 1, ya creada)

```
data/v2/
  catalog.v2.json      { schemaVersion:"2.0.0", generatedAt, entries: [] }
  offers.v2.json        { schemaVersion:"2.0.0", generatedAt, offers: [] }
  presets.v2.json        { schemaVersion:"2.0.0", generatedAt, presets: [] }
  evidence.v2.json      { schemaVersion:"2.0.0", generatedAt, evidence: [] }
  schema/
    catalog.schema.json
    offers.schema.json
    presets.schema.json
    evidence.schema.json
    vocab/*.json        (13 vocabularios controlados)
scripts/
  validate-v2.js         reglas V-01..V-14 ejecutables, CLI + exports
tests/v2/
  validate-v2.test.js    31 pruebas (node --test), sin dependencias
```

## 13. Reglas de validación implementadas (V-01..V-14)

| ID | Regla |
|---|---|
| V-01 | `selectable=true ⟹ verified ∧ product ∧ identidad completa` |
| V-02 | `type=family ⟹ selectable=false` |
| V-03 | `type=product ⟹ identidad completa + familyId existente y de type=family` |
| V-04 | `officialSources[].url` https real, no placeholder, no tienda |
| V-05 | todo `technical.*` no-null tiene evidencia en `technicalFieldEvidence`; sin paths huérfanos |
| V-06 | todo `technical.*` null está en `unknownFields` |
| V-07 | integridad referencial: `productId/familyId/sourceId/evidenceId/replacementProductId/supersedesOfferId` deben existir |
| V-08 | oferta sin `price.amount>0` no debe existir |
| V-09 | `offers[].productId` existe en catalog como `product` |
| V-10 | `presets` publishable recalculado; solo `productId` selectable + compatibilidad `compatible` |
| V-11 | fechas ISO8601 UTC; `verifiedAt >= accessedAt` en evidencia |
| V-12 | valores de `compatibility.*` deben pertenecer al vocabulario controlado |
| V-13 | `legacyProfile` nunca puede aparecer en `catalog.v2.json` |
| V-14 | oferta `stale` determinista a >30 días de `observedAt` |

Adicionales estructurales: `V-SCHEMA` (schemaVersion), `V-ID-UNIQUE` (ids
duplicados), `V-NO-COMMERCIAL` (precio/vendedor/stock fuera de catalog),
`V-VOCAB` (enum inválido), `V-12-PRESET` (preset con `offerId`).

## 14. Plan de fases

- **Fase 0**: aprobar contrato (hecho).
- **Fase 1 (esta entrega)**: estructura `data/v2/`, esquemas, vocabularios,
  validador, tests. Sin datos reales.
- **Fase 2 (cerrada 2026-08-21)**: investigación y verificación real de los
  8 chips CPU/GPU legacy como `family`. Resultado: 6/8 `verified`, 2/8
  `partial` (Ryzen 7 9850X3D, Ryzen 9 9950X3D — bloqueados por acceso a
  amd.com; ver §0.3). Pendiente para reabrir cuando haya acceso: confirmar
  specs oficiales y Product IDs de esos 2 SKUs.
- **Fase 3 (en curso, iniciada 2026-08-21)**: ingreso de `product` reales
  (marca+modelo) verificados. Estado actual: 20 `product` cargados (12 GPU
  sobre las 4 families NVIDIA — NVIDIA FE/MSI/ASUS/PNY según disponibilidad
  por SKU —, 1 RAM sobre `family-memory-ddr5`, 3 motherboard sobre
  `family-intel-z890`, 2 PSU sobre `family-psu-atx`, 2 storage sobre
  `family-storage-nvme-pcie4`). AMD (CPU) permanece pausado sin ningún
  `product` creado (ver §0.7). GIGABYTE (RTX 5070 y Z890) descartado por
  bloqueo 403 en fetch directo. ZOTAC (RTX 5070) pendiente, no descartado
  definitivamente (ver §0.13). Crucial/Micron (storage) descartado por
  bloqueo anti-bot (ver §0.22). case y cooling no iniciados. No cerrada
  todavía — no se ha definido un criterio de cierre explícito para esta
  fase.
- **Fase 4 (no iniciada)**: `offers.v2.json` piloto con resolución por región.
- **Fase 5 (no iniciada)**: `presets.v2.json` piloto + motor de compatibilidad real.
- **Fase 6 (no iniciada)**: evaluar reemplazo gradual de `data/catalog.json` en la UI.

Ninguna fase ≥4 se implementa hasta aprobación explícita.
