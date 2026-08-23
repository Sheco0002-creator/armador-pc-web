# Contrato V2 del catálogo de ArmaPC — v2.0.0 (Fase 1 completa, Fase 2 cerrada, Fase 3 cerrada al 100% + trabajo post-cierre en curso)

Estado (actualizado 2026-08-22): **Fase 1 completa. Fase 2 cerrada** (2026-08-21).
**Fase 3 cerrada al 100%** (cobertura de storage/case/cooling/psu/
motherboard/ram, ver auditoría global previa a esta sección). **Trabajo
post-cierre de Fase 3 en curso**, informalmente referido en sesión como
"Fase 4 — resolver candidatos bloqueados" (no confundir con la Fase 4
formal del plan de fases en §14, que es `offers.v2.json`): ZOTAC sigue
bloqueado, GIGABYTE sigue bloqueado, **AMD CPU se resolvió** (§0.33) y
**AMD GPU (RX 9070 XT) se resolvió parcialmente** (§0.34; RX 9060 XT aún
no investigado). Estado real de `catalog.v2.json`: **20 `family`, todas
`verified`** (las 8 originales CPU/GPU — incluidas las 2 que quedaron
`partial` al cierre de Fase 2 y luego pasaron a `verified` en §0.6, y
actualizadas de nuevo en §0.33 con socket/cache L2-L3 reales — más
`family-memory-ddr5`, `family-intel-z890`, `family-psu-atx`,
`family-storage-nvme-pcie4`, `family-storage-sata`,
`family-storage-nvme-pcie5`, `family-case-atx-mid-tower`,
`family-case-atx-full-tower`, `family-cooling-air-tower`,
`family-cooling-aio-liquid`, `family-amd-am5` y **`family-amd-rx9070xt`
nueva en §0.34**), y **45 `product` reales verificados** (13 GPU +
**1 GPU AMD nuevo en §0.34** = 14 GPU, 6 RAM, 6 motherboard, 6 PSU, 4
storage, 2 case, 3 cooling, 4 CPU AMD de §0.33). 0 `offer`, 0 `preset`.
No reemplaza `data/catalog.json` (legacy). No se migró ningún registro
legacy. `node scripts/validate-v2.js` → 65 entries válidas, 71
evidencias, 0 offers, 0 presets. `node --test tests/v2/validate-v2.test.js`
→ 31/31. Existe además `data/v2/crosswalk.v2.json` (fuera del contrato
validado) con el mapeo
legacy-id↔product-id para storage, case, cooling, ram, psu, motherboard,
gpu y ahora cpu.

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

## 0.26 Categoría COOLING — air tower y AIO liquid (2026-08-22)

**Auditoría previa** (sin cambios): `data/components.json` tiene 4 legacyId
en `cooling` (`cool-torre-simple`, `cool-torre-premium`, `cool-aio-240`,
`cool-aio-360`), pero **solo 3 se usan realmente** en los tiers
(`entrada→cool-torre-simple`, `media→cool-torre-premium`,
`alta`/`extrema→cool-aio-360`; sin alternativas declaradas). `cool-aio-240`
no se usa en ningún tier — mismo patrón que `case-matx`: **no se creó
ningún registro para él**. Cobertura V2 antes de este paso: 0 entries
`category=cooling`.

**Decisión estructural**: la distinción vendor-neutral real es aire vs.
líquido (el tamaño de radiador/altura queda a nivel `product`, igual que la
capacidad en storage) — 2 families:

- **`family-cooling-air-tower`** (`technical.type="aire"`) — cubre
  `cool-torre-simple` y `cool-torre-premium`.
- **`family-cooling-aio-liquid`** (`technical.type="liquida"`) — cubre
  `cool-aio-360`.

**`prod-deepcool-ak400`** — `brand=DeepCool`, `commercialName="AK400"`,
`partNumber="R-AK400-BKNNMN-G-1"`, `familyId=family-cooling-air-tower`,
`selectable=true`, `verified`. Fuente: `deepcool.com/products/Cooling/...`
(fetch directo exitoso). Confirmado: sockets Intel LGA1851/1700/1200/1151/
1150/1155 + AMD AM5/AM4, altura de producto 155mm (coincide exactamente
con legacy `cool-torre-simple`) y heatsink 152mm (ambas cifras guardadas
por separado, tal como las declara la fuente, sin colapsarlas), disipación
"hasta 220W" (supera el mínimo legacy 95W), 4 heat pipes Ø6mm, fan 120mm
500-1850RPM 66.47 CFM ≤29dB(A), peso 661g. Sin `unknownFields`.
`compatibility.requires` solo incluye los sockets del vocabulario
controlado (AM5, AM4, LGA1700, LGA1851, LGA1200).

**`prod-deepcool-ak620-wh`** — `brand=DeepCool`, `commercialName="AK620
WH"`, `partNumber="R-AK620-WHNNMT-G-1"`, `familyId=family-cooling-air-tower`,
`selectable=true`, `verified`. Fuente: `global.deepcool.com/products/
Cooling/...` (fetch directo exitoso; se eligió deliberadamente esta
variante 2024 con "1851" explícito en la URL/nombre, en vez del AK620 base
de 2021 que no lo menciona, para no asumir compatibilidad no confirmada).
Confirmado: altura de compatibilidad 160mm (coincide exactamente con
legacy `cool-torre-premium`), heatsink 157mm, disipación "260W máximo"
(supera el mínimo legacy 180W), 6 heat pipes Ø6mm, 2 fans 120mm
500-1850RPM 68.99 CFM ≤28dB(A), peso 1456g, RAM clearance 43mm. Sin
`unknownFields`.

**`prod-corsair-icue-link-h150i-rgb`** — `brand=CORSAIR`,
`commercialName="iCUE LINK H150i RGB AIO Liquid CPU Cooler"`,
`partNumber="CW-9061003-WW"`, `familyId=family-cooling-aio-liquid`,
`selectable=true`, `verified`. Fuente: `corsair.com/us/en/p/cpu-coolers/...`
(fetch directo exitoso). Confirmado: sockets Intel 1851/1700/1200/1150/
1151/1155/1156 + AMD AM5/AM4, radiador 360mm (397×120×27mm, coincide con
legacy `cool-aio-360`), 3 fans QX120 RGB 120mm 480-2400RPM 16.44-63.1 CFM,
tubing 450mm, cold plate cobre 56×56mm, peso 2.654kg, garantía 6 años.
**Único campo `null`**: `thermalDissipationW` — Corsair no publica una
cifra de TDP/potencia térmica soportada para este AIO; se verificó también
NZXT Kraken 360 como referencia cruzada de la industria y tampoco publica
esa métrica, confirmando que es una ausencia estructural del segmento AIO
y no un descuido puntual de una fuente — el valor de 350W del legacy **no
se usó para completarlo**, queda documentado como limitación en
`unknownFields`.

**Crosswalk cooling**: se agregaron 3 mappings a `data/v2/crosswalk.v2.json`
(`cool-torre-simple→prod-deepcool-ak400`,
`cool-torre-premium→prod-deepcool-ak620-wh`,
`cool-aio-360→prod-corsair-icue-link-h150i-rgb`). Integridad referencial
verificada manualmente, sin huérfanos ni duplicados.

No se tocó AMD, GIGABYTE, ZOTAC, Crucial/Micron, ni ninguna family/product
de RAM/motherboard/PSU/storage/case previos. `node scripts/validate-v2.js`
→ 45 entries válidas (18 family + 27 product), 51 evidencias, 0 offers, 0
presets. `node --test` → 31/31. `data/catalog.json`, `data/components.json`
y la UI intactos.

## 0.27 Segundo producto RAM — Corsair Vengeance 64GB (2x32GB) y crosswalk completo (2026-08-22)

**Auditoría previa** (sin cambios): `data/components.json` tiene 3 legacyId
en `ram` (`ram-16`, `ram-32`, `ram-64`), pero **solo `ram-32` y `ram-64` se
usan realmente** en los tiers (`entrada→ram-32`; `media`/`alta→ram-32` con
alt `ram-64`; `extrema→ram-64`). `ram-16` no se usa en ningún tier ni
alternativa — mismo patrón que `case-matx`/`cool-aio-240`: **no se creó
ningún registro para él**. Cobertura V2 antes de este paso: `ram-32` ya
cubierto desde antes (§0.16, `prod-corsair-vengeance-ddr5-6000-32gb`);
`ram-64` sin ningún product. No se necesitó ninguna family nueva —
`family-memory-ddr5` (ya existente) representa el estándar vendor-neutral
correcto; la capacidad, igual que en storage, queda a nivel `product`.

**`prod-corsair-vengeance-ddr5-6000-64gb`** — `brand=CORSAIR`,
`commercialName="VENGEANCE 64GB (2x32GB) DDR5 DRAM 6000MHz C40 Memory Kit
— Black"`, `model="CMK64GX5M2B6000C40"`, `partNumber="CMK64GX5M2B6000C40"`,
`familyId=family-memory-ddr5`, `selectable=true`, `verified`. Fuente:
`corsair.com/us/en/p/memory/cmk64gx5m2b6000c40/...` (fetch directo
exitoso). Confirmado: Memory Type DDR5, Form Factor UDIMM 288 pines,
capacidad 64GB (2×32GB), velocidad 6000MT/s (PC5-48000), Tested Timings
40-40-40-77, SPD Timings 40-40-40-77, Tested Voltage 1.35V, SPD Voltage
1.1V, Default SPD Speed 4800MHz, peso 0.115kg. Sin `unknownFields`. Se
verificó que no existe un SKU CL36 para esta capacidad (solo CL30/CL40
disponibles oficialmente); se eligió el CL40 no-RGB negro por ser el más
directamente análogo al kit de 32GB ya cargado.

**Crosswalk RAM completado**: se agregaron 2 mappings a
`data/v2/crosswalk.v2.json` — `ram-32→prod-corsair-vengeance-ddr5-6000-32gb`
(retroactivo: el product ya existía desde §0.16 pero nunca se había
agregado al crosswalk) y `ram-64→prod-corsair-vengeance-ddr5-6000-64gb`
(nuevo). Integridad referencial verificada manualmente: sin huérfanos ni
duplicados; ambos legacyId usados en tiers quedan mapeados.

No se tocó AMD, GIGABYTE, ZOTAC, Crucial/Micron, ni ninguna family/product
de motherboard/PSU/storage/case/cooling previos. `node
scripts/validate-v2.js` → 46 entries válidas (18 family + 28 product), 52
evidencias, 0 offers, 0 presets. `node --test` → 31/31.
`data/catalog.json`, `data/components.json` y la UI intactos.

## 0.28 Cobertura completa de PSU y crosswalk (2026-08-22)

**Auditoría previa** (sin cambios): `data/components.json` tiene 6
legacyId en `psu` (`psu-550`, `psu-650`, `psu-750`, `psu-850`, `psu-1000`,
`psu-1200`), pero **solo 5 se usan realmente** en los tiers
(`entrada→psu-550`; `media→psu-650` con alt `psu-750`; `alta→psu-850`;
`extrema→psu-1200`). `psu-1000` no se usa en ningún tier ni alternativa —
mismo patrón que `case-matx`/`cool-aio-240`/`ram-16`: **no se creó ningún
registro para él**. `psu-850` ya estaba cubierto desde antes (§0.20,
`prod-msi-mag-a850gl-pcie5`); los otros 4 no tenían ningún product.
`family-psu-atx` (ya existente) fue suficiente — no se creó ninguna family
nueva, siguiendo el mismo criterio que en RAM.

**`prod-thermaltake-smart-bx3-550w`** — `brand=Thermaltake`,
`commercialName="Smart BX3 Bronze 550W"`, `model="SPD-0550AH2NLB-3"`,
`partNumber="PS-SPD-0550NNFABU-3"`, `familyId=family-psu-atx`,
`selectable=true`, `verified`. Fuente: `thermaltakeusa.com/products/...`
(fetch directo exitoso). Confirmado: 550W, 80 PLUS Bronze, "built to ATX
3.1 specifications" (coincide exactamente con `psu-550`), no modular, fan
120mm FDB, dimensiones 150×86×140mm, conectores ATX24×1/EPS4+4×1/PCIe
6+2×2/SATA×4/Peripheral×4, protecciones OCP/OVP/UVP/OPP/OTP/SCP, garantía
5 años. Sin `unknownFields`. **Candidatos descartados**: MSI MAG A550BN y
MAG A550BNL (datasheets oficiales de `storage-asset.msi.com` verificados
por fetch directo) — ninguno de los dos declara ATX 3.0/3.1 en absoluto,
pese a coincidir en wattage/certificación Bronze.

**`prod-corsair-rm650e`** — `brand=CORSAIR`, `model="RM650e"`,
`partNumber="CP-9020302-NA"`, `familyId=family-psu-atx`, `selectable=true`,
`verified`. Fuente: `corsair.com/us/en/p/psu/cp-9020302-na/...` (fetch
directo exitoso). Confirmado: 650W, Cybenetics Gold, ATX Version "3.1"
(coincide con `psu-650`), PCIe 5.1 compatible, fully modular, dimensiones
140×150×86mm, peso 2.728kg, conectores incluyendo 12V-2x6×1 nativo. Sin
`unknownFields`. El conector "12V-2x6" coincide con el vocabulario
controlado `gpuPowerConnector` → se agregó a `compatibility.provides`.

**`prod-corsair-rm750e`** — `brand=CORSAIR`, `model="RM750e"`,
`partNumber="CP-9020295-NA"`, `familyId=family-psu-atx`, `selectable=true`,
`verified`. Fuente: `corsair.com/us/en/p/psu/cp-9020295-na/...` (fetch
directo exitoso). Confirmado: 750W, "Intel ATX 3.1 Certified" (coincide
con `psu-750`), Cybenetics Gold (~89%), PCIe 5.1 compatible, fully
modular, dimensiones 140×150×86mm, peso 2.901kg, garantía 7 años. Sin
`unknownFields`.

**`prod-corsair-hx1200i-cp9020307-na`** — `brand=CORSAIR`, `model="HX1200i"`,
`partNumber="CP-9020307-NA"`, `familyId=family-psu-atx`, `selectable=true`,
`verified`. Fuente: `corsair.com/us/en/p/psu/cp-9020307-na/...` (fetch
directo exitoso). Confirmado: 1200W, 80 PLUS Platinum, "ATX 3.1 certified,
PCIe 5.1 compatible" (coincide exactamente con `psu-1200`, "ATX 3.1 / PCIe
5.x"), fully modular, fan 140mm FDB, conectores incluyendo "Dual 12V-2x6
cables"×2, garantía 10 años. **Único campo `null`**: `dimensions` — esta
página específica no declara medidas físicas (a diferencia de RM650e/
RM750e/BX3, que sí las declaran), por lo que queda `null`+`unknownFields`
en vez de asumirse igual a otros modelos de la misma línea. **Candidatos
descartados**: dos SKU distintas del mismo nombre comercial "HX1200i" —
`CP-9020070-NA` (fetch directo confirmó "ATX12V v2.4 and EPS12V 2.92
standards", **no** ATX3.1) y `CP-9020281-NA` (no verificado, mismo riesgo)
— se usó exclusivamente `CP-9020307-NA`, la única confirmada con ATX3.1/
PCIe5.1 explícito.

**Crosswalk PSU completado**: se agregaron 5 mappings a
`data/v2/crosswalk.v2.json` — `psu-550→prod-thermaltake-smart-bx3-550w`,
`psu-650→prod-corsair-rm650e`, `psu-750→prod-corsair-rm750e`,
`psu-850→prod-msi-mag-a850gl-pcie5` (retroactivo: el product ya existía
desde §0.20 pero nunca se había agregado al crosswalk) y
`psu-1200→prod-corsair-hx1200i-cp9020307-na`. Integridad referencial
verificada manualmente: sin huérfanos ni duplicados; los 5 legacyId de PSU
usados en tiers quedan mapeados. `psu-1000` queda fuera, correctamente.

No se tocó AMD, GIGABYTE, ZOTAC, Crucial/Micron, ni ninguna family/product
de RAM/motherboard/storage/case/cooling previos. `node
scripts/validate-v2.js` → 50 entries válidas (18 family + 32 product), 56
evidencias, 0 offers, 0 presets. `node --test` → 31/31.
`data/catalog.json`, `data/components.json` y la UI intactos.

## 0.29 Cobertura AMD AM5 en motherboard y crosswalk completo (2026-08-22)

**Auditoría previa** (sin cambios): `data/components.json` tiene 5
legacyId en `motherboard` (`mb-b650m`, `mb-b650`, `mb-x870`, `mb-x870e`,
`mb-z890`), pero **solo 4 se usan realmente** en los tiers
(`entrada→mb-b650`; `media→mb-x870` con alt `mb-z890`; `alta→mb-x870`;
`extrema→mb-x870e`). `mb-b650m` no se usa en ningún tier ni alternativa —
mismo patrón que `case-matx`/`cool-aio-240`/`ram-16`/`psu-1000`: **no se
creó ningún registro para él**. `mb-z890` ya estaba cubierto desde antes
(§0.17-0.19, 3 products ASUS/MSI/ASRock), pero sin mapping en el
crosswalk; los otros 3 (`mb-b650`, `mb-x870`, `mb-x870e`) no tenían ningún
product.

**Decisión estructural**: se aplicó estrictamente el criterio de no crear
family por chipset. Revisando `family-intel-z890`, su único campo técnico
es `socket="LGA1851"` (el chipset "Z890" nunca fue parte de la family,
solo del `id`/`displayName`; vive en `technical.chipset` a nivel
`product`). Para AMD AM5, donde coexisten 3 chipsets sobre el mismo socket
(B650/X870/X870E), se aplicó la misma regla: **una sola family nueva**,
`family-amd-am5` (`technical.socket="AM5"`), con el chipset como atributo
de `product`, no de `family`.

**`family-amd-am5`** — fuente: página oficial de ASUS (`asus.com/.../
tuf-gaming-b650-plus/techspec/`, fetch directo exitoso), que declara
"Socket AM5". Se intentó la fuente ideal (`amd.com/en/products/
processors/chipsets/am5.html`, página oficial de chipsets AMD) →
**timeout**, mismo bloqueo histórico de amd.com ya documentado
repetidamente en este proyecto (§0.2, §0.3, §0.6, §0.7). No se usó ninguna
fuente de terceros para completar el dato — se usó la página del
fabricante de la placa (mismo patrón que `family-intel-z890` con Intel).

**`prod-asus-tuf-gaming-b650-plus`** — `brand=ASUS`, `familyId=family-amd-am5`,
`selectable=true`, `verified`. Fuente: `asus.com/.../tuf-gaming-b650-plus/
techspec/` (fetch directo exitoso; se verificó deliberadamente que la URL
correspondiera a la variante SIN WiFi, no confundir con
"tuf-gaming-b650-plus-wifi"). Confirmado: socket AM5, chipset AMD B650,
memoria (4 DIMM, máx 256GB, DDR5, 4800-7600+MT/s), expansión (1× PCIe
4.0/3.0 x16, 1× PCIe 4.0/3.0 x16 x4-mode, 2× PCIe 4.0/3.0 x1), storage (3×
M.2, 4× SATA), form factor ATX. Sin `unknownFields`. La página no distingue
un part number separado del nombre comercial — mismo criterio ya usado en
Z890.

**`prod-asus-tuf-gaming-x870-plus-wifi`** — análogo, fuente:
`asus.com/us/.../tuf-gaming-x870-plus-wifi/techspec/` (fetch directo
exitoso). Confirmado: socket AM5, chipset AMD X870, memoria (4 DIMM, máx
256GB, DDR5, hasta 8000+MT/s), expansión (1× PCIe 5.0 x16, 2× PCIe 4.0
x16), storage (4× M.2, 2× SATA), form factor ATX. Sin `unknownFields`.

**`prod-asus-rog-strix-x870e-e-gaming-wifi`** — análogo, fuente:
`rog.asus.com/motherboards/rog-strix/rog-strix-x870e-e-gaming-wifi/spec/`
(fetch directo exitoso). Confirmado: socket AM5, chipset AMD X870E,
memoria (4 DIMM, máx 256GB, DDR5, hasta 8000-8400+MT/s según CPU, soporte
EXPO), expansión (1× PCIe 5.0 x16, 2× PCIe 4.0 x16), storage (5× M.2, 4×
SATA), form factor ATX. Sin `unknownFields`.

**Crosswalk motherboard completado**: se agregaron 4 mappings a
`data/v2/crosswalk.v2.json` — `mb-b650→prod-asus-tuf-gaming-b650-plus`,
`mb-x870→prod-asus-tuf-gaming-x870-plus-wifi`,
`mb-x870e→prod-asus-rog-strix-x870e-e-gaming-wifi` (los 3 nuevos) y
`mb-z890→prod-asus-tuf-gaming-z890-pro-wifi` (retroactivo: el product ya
existía desde §0.17 pero nunca se había agregado al crosswalk; MSI
Tomahawk y ASRock Pro-A también serían válidos, se eligió ASUS por
consistencia con el resto de la categoría). Integridad referencial
verificada manualmente: sin huérfanos ni duplicados; los 4 legacyId de
motherboard usados en tiers quedan mapeados. `mb-b650m` queda fuera,
correctamente.

No se tocó AMD (CPU), GIGABYTE, ZOTAC, Crucial/Micron, ni ninguna family/
product de RAM/PSU/storage/case/cooling previos. `node
scripts/validate-v2.js` → 54 entries válidas (19 family + 35 product), 60
evidencias, 0 offers, 0 presets. `node --test` → 31/31.
`data/catalog.json`, `data/components.json` y la UI intactos.

## 0.30 Ampliación de fabricantes RAM (2026-08-22)

Fase 3.4: se amplía la diversidad de marcas dentro de `family-memory-ddr5`
(sin crear ninguna family nueva), agregando 4 `product` de 3 fabricantes
nuevos que no aportan un escenario legacy distinto a los ya cubiertos
(`ram-32`, `ram-64`) — por eso **no se modificó `data/v2/crosswalk.v2.json`**:
los mappings existentes (`ram-32→prod-corsair-vengeance-ddr5-6000-32gb`,
`ram-64→prod-corsair-vengeance-ddr5-6000-64gb`) siguen siendo los
canónicos; los 4 productos nuevos son alternativas seleccionables
adicionales, mismo patrón que ya existe en GPU/motherboard con múltiples
marcas por family sin que cada una tenga su propio mapping.

**`prod-gskill-tridentz5-neo-rgb-ddr5-6000-32gb`** — `brand=G.SKILL`,
`partNumber="F5-6000J3038F16GX2-TZ5NR"`, `familyId=family-memory-ddr5`,
`selectable=true`, `verified`. Fuente: `gskill.com/product/165/390/...`
(fetch directo exitoso). Confirmado: 32GB (2×16GB), DDR5, "Up to
DDR5-6000", timings "CL30-38-38-96", voltaje 1.35V, U-DIMM. **Único campo
`null`**: `physical.pinCount` — la página no declara la cifra "288-pin"
explícitamente; no se asumió por ser el estándar típico de DDR5 UDIMM.

**`prod-kingston-fury-beast-ddr5-6000-32gb`** — `brand=Kingston`,
`partNumber="KF560C30BBEAK2-32"`, `familyId=family-memory-ddr5`,
`selectable=true`, `verified`. Fuente: **datasheet PDF oficial**
`kingston.com/datasheets/KF560C30BBEAK2-32.pdf` (fetch directo +
`pdftotext`) — la página HTML de producto en kingston.com rechazó el fetch
directo con 403 Forbidden (misma protección anti-bot ya vista en otros
fabricantes), por lo que se usó el datasheet PDF oficial en su lugar,
mismo mecanismo ya usado con MSI/Samsung. Confirmado: "kit of two 2G x
64-bit (16GB) DDR5-6000 CL30 SDRAM", 32GB total, EXPO/XMP "DDR5-6000
CL30-36-36 @1.4V", JEDEC default "DDR5-4800 CL40-39-39 @1.1V", 288-pin
("288-Pin DIMM Kit" en el título), altura con heatsink 42.23mm, largo del
módulo 133.35mm. Sin `unknownFields`.

**`prod-teamgroup-tforce-delta-rgb-ddr5-6000-32gb`** — `brand=TEAMGROUP`,
`partNumber="FF3D532G6000HC30DC01"`, `familyId=family-memory-ddr5`,
`selectable=true`, `verified`. Fuente: `teamgroupinc.com/en/product-detail/
memory/...` (fetch directo exitoso). Confirmado: 32GB (2×16GB), DDR5,
6000MHz, timings "CL30" (la fuente no desglosa tRCD/tRP/tRAS, se guardó
tal cual sin completar el resto de la cadena), voltaje 1.35V, U-DIMM,
dimensiones "46.1(H) x 144.2(L) x 7(W)mm". Sin `unknownFields`.

**`prod-gskill-tridentz5-neo-rgb-ddr5-6000-64gb`** — `brand=G.SKILL`,
`partNumber="F5-6000J3040G32GX2-TZ5NR"`, `familyId=family-memory-ddr5`,
`selectable=true`, `verified`. Fuente: `gskill.com/product/165/390/...`
(fetch directo exitoso). Confirmado: 64GB (2×32GB), DDR5, "Up to
DDR5-6000", timings "CL30-40-40-96", voltaje 1.40V, U-DIMM. Mismo campo
`null` que su hermano de 32GB: `physical.pinCount`.

**Candidato no reinvestigado**: Crucial/Micron — ya documentado en §0.22
como bloqueado (`crucial.com`/`assets.micron.com` rechazan el fetch directo
con "Request Rejected"); no se repitió el intento en este paso.

No se tocó AMD, GIGABYTE, ZOTAC, ni ninguna family/product de motherboard/
PSU/storage/case/cooling previos, ni los 2 products RAM Corsair ya
existentes. `node scripts/validate-v2.js` → 58 entries válidas (19 family
+ 39 product), 64 evidencias, 0 offers, 0 presets. `node --test` → 31/31.
`data/v2/crosswalk.v2.json` sin cambios (20 mappings, verificado sin
huérfanos ni duplicados). `data/catalog.json`, `data/components.json` y la
UI intactos.

## 0.31 Retomar GPU — ZOTAC sigue bloqueado, cuarto bloqueo consecutivo de GIGABYTE, nuevo producto PNY para RTX 5070 (2026-08-22)

A pedido explícito, se retomó la investigación de ZOTAC RTX 5070 (pendiente
desde §0.13). Resultado: **sigue bloqueado**. Se intentó fetch directo a 2
páginas de producto oficiales (`zotac.com/us/product/graphics_card/
zotac-gaming-geforce-rtx-5070-solid` y `.../twin-edge-oc`) → **403
Forbidden** en ambas (confirmado también con `curl`, header `CF-RAY`
indica Cloudflare). Se intentó también fetch directo a 4 brochures PDF
oficiales distintos (`zotac.com/download/mediadrivers/External/
GraphicsCard/5070/Brochure/ZT-B50700D-10A/-10P`, `ZT-B50700J-10A`,
`ZT-B50700E-10P`) → **HTTP 468** en los 4, con tamaño de respuesta
idéntico (14838 bytes), confirmando que es la página de bloqueo del
dominio y no el PDF real. Se descartó un PDF alojado en `gzhls.at`
(dominio de un distribuidor, no de ZOTAC) por no ser fuente tier-1. **No
se creó ningún registro ZOTAC** — el bloqueo del dominio completo persiste
sin cambios desde §0.13.

Se evaluó GIGABYTE como alternativa para RTX 5080 (candidato no intentado
antes para ese chip): `gigabyte.com/Graphics-Card/GV-N5080GAMING-OC-16GD/sp`
→ **403 Forbidden** — **cuarto bloqueo consecutivo confirmado** de ese
fabricante (tras RTX5070 en §0.13, RTX5060 descartado dos veces en §0.9,
y ahora RTX5080). Con esta acumulación de evidencia se decidió no seguir
reintentando GIGABYTE en este paso y usar un fabricante nuevo no probado
aún para GPU.

**`prod-pny-rtx5070-oc-triple-fan`** — `brand=PNY`, `commercialName=
"GeForce RTX 5070 12GB Overclocked Triple Fan DLSS 4"`,
`partNumber="VCG507012TFXPB1-O"`, `gtin="751492794464"`,
`familyId=family-nvidia-rtx5070`, `selectable=true`, `verified`. Fuente:
brochure PDF oficial de PNY (`pny.com/file library/company/support/
product brochures/geforce graphics/english/rtx-5070-12gb-triple-fan-oc-
brochure.pdf`, fetch directo + `pdftotext`, enero 2025). Confirmado: 6144
CUDA cores, clock base 2325MHz, boost 2587MHz, 12GB GDDR7, bus 192-bit,
velocidad de memoria 28Gbps, **ancho de banda 672GB/s** (primera vez que
un brochure PNY declara esta cifra explícitamente, a diferencia del
producto PNY RTX 5060 previo donde quedó null), TDP 250W, PCIe 5.0,
conector "16-pin" (literal, sin convertir a 12V-2x6, mismo criterio ya
aplicado en el resto de GPU), PSU recomendada 650W, dimensiones
299.5×120.0×48.0mm, slot width 2.4. Sin `unknownFields`: el brochure no
incluye ninguna cifra de peso (solo dimensiones de la caja), por lo que
simplemente no se agregó ningún campo `physical.weightCardG/weightPackageG`
(sección ausente de la fuente, no un dato omitido).

Con esto, RTX 5070 tiene ahora 4 productos (NVIDIA FE, MSI, ASUS, PNY).
No se tocó AMD, ni ningún product/family previo de otras categorías.
`node scripts/validate-v2.js` → 59 entries válidas (19 family + 40
product), 65 evidencias, 0 offers, 0 presets. `node --test` → 31/31.
`data/catalog.json`, `data/components.json` y la UI intactos.

## 0.32 Crosswalk GPU retroactivo (2026-08-22)

Verificación solicitada explícitamente antes de autorizar el commit
anterior: `data/v2/crosswalk.v2.json` tenía **0 mappings de `category=gpu`**,
a diferencia de storage/case/cooling/psu/motherboard/ram (las 6 categorías
de Fase 3, todas con crosswalk completo). Los products de GPU existen
desde Fase 2/Fase 3 temprana, pero nunca se les había agregado mapping.

Se agregaron 4 mappings retroactivos, uno por cada escenario NVIDIA
realmente usado en los tiers:

- `gpu-5060 → prod-msi-rtx5060-8g-gaming-oc`
- `gpu-5070 → prod-msi-rtx5070-12g-gaming-trio-oc`
- `gpu-5080 → prod-msi-rtx5080-16g-gaming-trio`
- `gpu-5090 → prod-msi-rtx5090-32g-gaming-trio-oc`

Se eligió **MSI como marca canónica en los 4 casos** (entre 3-4 products
válidos por family) por ser en cada family el único producto sin ningún
`unknownFields`, criterio objetivo y consistente en las 4 elecciones.

**`gpu-9060xt`** (AMD RX 9060 XT, alternativa en tier "entrada") y
**`gpu-9070xt`** (AMD RX 9070 XT, alternativa en tier "media") **quedan sin
mapping intencionalmente**: no existe ninguna family/product AMD GPU en
V2 — AMD sigue en pausa por el mismo bloqueo histórico de amd.com ya
documentado para AMD CPU. Esto es la primera vez que se señala
explícitamente que la pausa de AMD también deja sin cobertura 2
escenarios GPU reales del legacy, no solo CPU.

Integridad referencial verificada manualmente: sin huérfanos ni
duplicados; los 4 legacyId NVIDIA usados en tiers quedan mapeados.
`node scripts/validate-v2.js` → 59 entries válidas, 65 evidencias, 0
offers, 0 presets (sin cambios respecto a §0.31, el crosswalk no forma
parte del contrato validado). `node --test` → 31/31.
`data/catalog.json`, `data/components.json` y la UI intactos.

## 0.33 AMD CPU resuelto — bloqueo era del mecanismo WebFetch, no del dominio (2026-08-22)

**Hallazgo central de Fase 4**: el bloqueo histórico de `amd.com`
documentado repetidamente desde §0.1 (timeouts) resultó ser específico
del mecanismo `WebFetch` usado en sesiones anteriores. Al probar `curl`
con user-agent de navegador estándar contra las 4 páginas oficiales de
producto de AMD (`amd.com/en/products/processors/desktops/ryzen/
9000-series/amd-ryzen-{5-9600x,7-9700x,7-9850x3d,9-9950x3d}.html`), las
4 respondieron **HTTP 200** con la tabla de especificaciones completa,
incluyendo por primera vez la sección **"Product IDs"** (Boxed/Tray) —
el dato que bloqueaba la creación de cualquier `product` AMD CPU desde
Fase 2. Se probaron también otras 7 rutas de amd.com (home, `shop-us-en`,
`ir.amd.com`, `adaptivesupport.amd.com`, locale `/es/`, etc.), todas 200.

**Families actualizadas** (2, con evidencia nueva que corrobora y amplía
la ya existente, sin contradicción):

- `family-amd-ryzen7-9850x3d`: `socket` `null→"AM5"`,
  `cache.l3MB` `null→96`, se agregó `interface.pcieGen="5.0"` (antes
  ausente por completo). El valor L2(8MB)+L3(96MB)=104MB coincide
  exactamente con el "cache total" de 104MB ya cargado desde el press
  release de `ir.amd.com` (§0.6) — confirma consistencia entre dos
  fuentes oficiales independientes, no una corrección de error. Sin
  `unknownFields` restantes.
- `family-amd-ryzen9-9950x3d`: mismo tratamiento — `socket`
  `null→"AM5"`, `cache.l3MB` `null→128` (L2 16MB + L3 128MB = 144MB,
  coincide con el total ya cargado). Sin `unknownFields` restantes.

**4 `product` AMD CPU creados** (primeros de la categoría en todo el
proyecto), todos `selectable=true`, `verified`, `familyId` a su family
correspondiente, `identity.partNumber` = Product ID Boxed (WOF) tomado
directamente de la página oficial:

| Product | partNumber (Boxed) | Cores/Threads | Cache L1/L2/L3 | TDP |
|---|---|---|---|---|
| `prod-amd-ryzen5-9600x` | `100-100001405WOF` | 6/12 | 480KB/6MB/32MB | 65W |
| `prod-amd-ryzen7-9700x` | `100-100001404WOF` | 8/16 | 640KB/8MB/32MB | 65W |
| `prod-amd-ryzen7-9850x3d` | `100-100001973WOF` | 8/16 | 640KB/8MB/96MB | 120W |
| `prod-amd-ryzen9-9950x3d` | `100-100000719WOF` | 16/32 | 1280KB/16MB/128MB | 170W |

Ninguno tiene `unknownFields`. El "Product ID Tray" (variante sin
ventilador) de cada SKU quedó documentado solo en la evidencia, no como
campo del contrato (que no tiene un slot para SKU alternativo).

**Crosswalk CPU completado**: se agregaron 4 mappings —
`cpu-r5-9600x→prod-amd-ryzen5-9600x`, `cpu-r7-9700x→prod-amd-ryzen7-9700x`,
`cpu-r7-9850x3d→prod-amd-ryzen7-9850x3d`,
`cpu-r9-9950x3d→prod-amd-ryzen9-9950x3d`. Los 4 legacyId son escenarios
reales (uno por tier, todos default), confirmados antes de implementar
sin inventar ningún mapping. `cpu-ultra7-265k` y `cpu-ultra9-285k`
(Intel, alternativas en media/extrema) quedan intencionalmente sin
mapping — no existe ninguna family/product Intel CPU en V2, fuera de
alcance de esta Fase 4.

**Nota de alcance**: este hallazgo (curl con user-agent de navegador
funciona en amd.com donde WebFetch fallaba) es específico de esta sesión
y de este dominio — no se generaliza automáticamente a ZOTAC ni GIGABYTE,
donde tanto `curl` como `WebFetch` fallaron por igual (403/468) en la
misma sesión (ver hallazgos previos de Fase 4). GPU AMD (RX 9060 XT, RX
9070 XT) tampoco se investigó en este paso — sigue sin ninguna family/
product en V2.

No se tocó GPU, motherboard, PSU, storage, case, cooling, ni RAM
previos. `node scripts/validate-v2.js` → 63 entries válidas (19 family +
44 product), 69 evidencias, 0 offers, 0 presets. `node --test` → 31/31.
`data/catalog.json`, `data/components.json` y la UI intactos.

## 0.34 AMD GPU — primera family/product real (RX 9070 XT) (2026-08-22)

Se investigó si el mismo mecanismo que resolvió AMD CPU (`curl` con
user-agent de navegador contra `amd.com`, donde `WebFetch` seguía
fallando) también funcionaba para GPU AMD. Resultado: **sí**. La URL
real del chip usa un slug distinto al patrón de CPU (`amd-radeon-
rx-9070xt.html`, sin guion antes de "xt", encontrada vía búsqueda
dirigida tras que las URLs "obvias" dieran 404) — fetch directo dio
**200 OK**.

**`family-amd-rx9070xt`** — `category=gpu`, `selectable=false`, fuente:
`amd.com/en/products/graphics/desktops/radeon/9000-series/
amd-radeon-rx-9070xt.html` (fetch directo exitoso). Confirmado: Compute
Units 64, Boost "Up to 2970 MHz", Game Frequency 2400MHz, Ray
Accelerators 64, AI Accelerators 128, Stream Processors 4096, Infinity
Cache 64MB, Memory Speed "Up to 20 Gbps", 16GB GDDR6, bus 256-bit,
bandwidth "Up to 640 GB/s", Typical Board Power 304W, PSU mínima
recomendada 750W. **Único campo `null`**: `interface.pcieGen` — la
página oficial de AMD no menciona la generación de PCIe en ningún lugar
del documento (se buscó explícitamente "PCIe"/"PCI Express"/"Bus
Standard" sin resultado); no se infirió del valor que sí declara el
producto AIB, por ser información de la placa, no del chip.

**`prod-asus-prime-rx9070xt-o16g`** — `brand=ASUS`, `commercialName=
"ASUS Prime Radeon RX 9070 XT OC Edition"`, `partNumber=
"PRIME-RX9070XT-O16G"`, `familyId=family-amd-rx9070xt`,
`selectable=true`, `verified`. Fuente: `asus.com/us/motherboards-
components/graphics-cards/prime/prime-rx9070xt-o16g/techspec/` (fetch
directo exitoso). Confirmado: 4096 stream processors, boost "up to
3010MHz (default)" / "3030MHz (OC mode)", 16GB GDDR6 256-bit 20Gbps,
PCIe 5.0 (a nivel de la placa, sí declarado), dimensiones
312×130×50mm, conectores "3×8-pin", PSU recomendada 750W, 2.5 slot.
**Único campo `null`**: `power.consumptionW` — no aparece en la tabla de
especificaciones de ASUS; no se asumió a partir del TGP del chip (304W),
por corresponder al chip de referencia y no necesariamente a esta placa
AIB específica.

**Crosswalk**: se agregó `gpu-9070xt→prod-asus-prime-rx9070xt-o16g`.
Coincide con el legacy "AMD RX 9070 XT 16GB": PSU recomendada exacta
(750W), powerDraw legacy (300W) cercano al TGP oficial del chip (304W).
`gpu-9060xt` (RX 9060 XT, alternativa en tier entrada) **queda sin
mapping** — no investigado en este paso, fuera de alcance.

No se tocó CPU, motherboard, PSU, storage, case, cooling, RAM, ni las
families/products GPU NVIDIA previos. `node scripts/validate-v2.js` →
65 entries válidas (20 family + 45 product), 71 evidencias, 0 offers, 0
presets. `node --test` → 31/31. `data/catalog.json`,
`data/components.json` y la UI intactos.

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
  8 chips CPU/GPU legacy como `family`. Resultado original: 6/8 `verified`,
  2/8 `partial` (Ryzen 7 9850X3D, Ryzen 9 9950X3D — bloqueados por acceso a
  amd.com; ver §0.3), luego los 8/8 pasaron a `verified` en §0.6 (press
  releases de ir.amd.com) y se completaron aún más en §0.33 (socket +
  desglose L2/L3 vía amd.com directo).
- **Fase 3 (cerrada al 100%, iniciada 2026-08-21)**: ingreso de `product`
  reales verificados para storage/case/cooling/psu/motherboard/ram —
  cobertura 100% de los 20 escenarios legacy reales usados en esos 6
  rubros (ver auditoría global). GIGABYTE descartado repetidamente
  (RTX5070/RTX5060×2/RTX5080/RTX5090, 6 bloqueos 403 confirmados). ZOTAC
  (RTX 5070) sigue bloqueado, no descartado definitivamente (ver §0.13,
  reconfirmado en Fase 4). Crucial/Micron (storage) descartado por bloqueo
  anti-bot (ver §0.22). GPU también recibió 1 product nuevo (PNY RTX 5070,
  §0.31) y su crosswalk se completó (§0.31). AMD CPU, bloqueado desde
  Fase 2, se resolvió fuera de Fase 3 en el trabajo post-cierre (§0.33): 4
  `product` reales creados, crosswalk CPU completado.
- **Trabajo post-cierre de Fase 3 ("Fase 4" informal — resolver candidatos
  bloqueados)**: ZOTAC y GIGABYTE siguen bloqueados (confirmado
  exhaustivamente en esta ronda, ver hallazgos de sesión). AMD CPU
  resuelto (§0.33). GPU AMD (RX 9060 XT, RX 9070 XT) e Intel CPU
  (Ultra 7 265K, Ultra 9 285K) no investigados todavía — quedan sin
  ninguna family/product en V2.
- **Fase 4 formal (no iniciada)**: `offers.v2.json` piloto con resolución por región.
- **Fase 5 (no iniciada)**: `presets.v2.json` piloto + motor de compatibilidad real.
- **Fase 6 (no iniciada)**: evaluar reemplazo gradual de `data/catalog.json` en la UI.

Ninguna fase ≥4 (formal) se implementa hasta aprobación explícita.
