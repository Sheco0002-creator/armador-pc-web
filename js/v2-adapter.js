// ===== Adaptador de solo lectura para el catálogo V2 (data/v2/) =====
// Piloto de NOMBRE: usado hoy por las categorías "storage", "ram",
// "motherboard", "psu", "case", "gpu", "cooling" y "cpu". El resto de
// categorías sigue mostrando el nombre genérico de nivel tal como estaba.
//
// Piloto de SPECS (más acotado): solo "cpu", "motherboard", "ram", "psu",
// "gpu", "storage", "cooling" y "case" por ahora. Ver specsVisiblesProducto()
// más abajo — cualquier otra categoría devuelve null a propósito hasta que
// se audite y diseñe su propio formateador.
//
// Regla de fuente de verdad (ver docs/CONTRATO_V2.md):
// - V2 es la fuente de verdad de PRODUCTOS reales (marca + modelo + MPN) y,
//   para el piloto de specs, de especificaciones técnicas (family + product).
// - Legacy (data/components.json) sigue siendo la fuente de precio/tier/
//   compatibilidad — este adaptador nunca calcula precio ni compatibilidad.
// - Si un legacyId no tiene mapping en el crosswalk, o V2 no carga, la
//   función devuelve null: el llamador debe usar el nombre/specs legacy tal
//   cual. Nunca se inventa ni se sustituye un producto en silencio.

let V2_CATALOGO = null;
let V2_CROSSWALK = null;
let V2_CARGA_PROMESA = null;

async function cargarV2() {
  if (V2_CARGA_PROMESA) return V2_CARGA_PROMESA;
  V2_CARGA_PROMESA = (async () => {
    try {
      const [catalogo, crosswalk] = await Promise.all([
        fetch('/data/v2/catalog.v2.json').then((r) => r.json()),
        fetch('/data/v2/crosswalk.v2.json').then((r) => r.json()),
      ]);
      V2_CATALOGO = catalogo;
      V2_CROSSWALK = crosswalk;
    } catch (e) {
      // Si V2 no carga (red, 404, etc.), la UI sigue funcionando con los
      // nombres legacy — este adaptador es una mejora, nunca un bloqueo.
      V2_CATALOGO = null;
      V2_CROSSWALK = null;
    }
  })();
  return V2_CARGA_PROMESA;
}

// Busca la entrada `product` completa de catalog.v2.json que el crosswalk
// asocia a un legacyId de una categoría dada. Devuelve null si no hay
// mapping, si el producto no existe o no es selectable, o si V2 no cargó.
function _entradaProductoV2(categoriaId, legacyId) {
  if (!V2_CATALOGO || !V2_CROSSWALK) return null;
  const mapping = V2_CROSSWALK.mappings.find(
    (m) => m.category === categoriaId && m.legacyId === legacyId
  );
  if (!mapping) return null;
  const producto = V2_CATALOGO.entries.find(
    (e) => e.id === mapping.productId && e.type === 'product' && e.selectable === true
  );
  return producto || null;
}

// Busca el producto V2 real (marca, nombre comercial, partNumber) que el
// crosswalk asocia a un legacyId de una categoría dada. Devuelve null si no
// hay mapping, si el producto no existe o no es selectable, o si V2 no cargó.
function productoV2ParaLegacyId(categoriaId, legacyId) {
  const producto = _entradaProductoV2(categoriaId, legacyId);
  if (!producto || !producto.identity) return null;
  return {
    brand: producto.identity.brand,
    commercialName: producto.identity.commercialName,
    partNumber: producto.identity.partNumber,
  };
}

// Nombre a mostrar para una pieza: el nombre comercial real de V2 cuando
// existe mapping verificado, o el nombre legacy tal cual si no lo hay.
function nombreVisibleProducto(categoriaId, piezaId, nombreLegacy) {
  const v2 = productoV2ParaLegacyId(categoriaId, piezaId);
  return v2 ? v2.commercialName : nombreLegacy;
}

// ===== Piloto de SPECS (solo "cpu" por ahora) =====

// Busca la entrada `family` referenciada por producto.familyId. Null si no
// hay familyId, o si no existe una entrada type=family con ese id.
function _familyDeProducto(producto) {
  if (!V2_CATALOGO || !producto || !producto.familyId) return null;
  return V2_CATALOGO.entries.find((e) => e.id === producto.familyId && e.type === 'family') || null;
}

// Merge recursivo a nivel de hoja: para cada ruta, el valor de `product`
// gana si no es null; si no, se usa el de `family`; si ninguno tiene un
// valor no-null, la ruta no aparece en el resultado. Nunca inventa un valor.
function _mergeTechnical(productTechnical, familyTechnical) {
  const out = {};
  const keys = new Set([
    ...Object.keys(productTechnical || {}),
    ...Object.keys(familyTechnical || {}),
  ]);
  for (const key of keys) {
    const pv = productTechnical ? productTechnical[key] : undefined;
    const fv = familyTechnical ? familyTechnical[key] : undefined;
    const esObjetoPlano = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
    if (esObjetoPlano(pv) || esObjetoPlano(fv)) {
      const merged = _mergeTechnical(esObjetoPlano(pv) ? pv : {}, esObjetoPlano(fv) ? fv : {});
      if (Object.keys(merged).length > 0) out[key] = merged;
    } else if (pv !== null && pv !== undefined) {
      out[key] = pv;
    } else if (fv !== null && fv !== undefined) {
      out[key] = fv;
    }
    // si ambos son null/undefined, se omite la ruta (no se muestra)
  }
  return out;
}

// Specs técnicas combinadas (family + product, product gana) para un
// legacyId de una categoría dada. Devuelve el objeto `technical` fusionado,
// o null si no hay mapping/producto/V2 no cargó.
function technicalVisibleProducto(categoriaId, legacyId) {
  const producto = _entradaProductoV2(categoriaId, legacyId);
  if (!producto) return null;
  const family = _familyDeProducto(producto);
  return _mergeTechnical(producto.technical || {}, family ? family.technical || {} : {});
}

// Formateador de specs de CPU: usa solo los campos con la misma forma en
// AMD e Intel (coresPhysical, threads son números planos en ambos). No
// incluye desglose P-core/E-core ni packaging — mantenido simple a
// propósito (ver docs/CONTRATO_V2.md y el plan de la sesión que lo agregó).
// `model` (identity.model, ya verificado por evidencia Tier-1/2, nunca
// inferido aquí) se usa solo para detectar el sufijo "3D V-Cache": si el
// modelo real termina en X3D, se agrega tal cual lo hacía Legacy. No se
// infiere 3D V-Cache de ningún otro campo (ej. cache.l3MB alto).
function _textoSpecsCpu(technical, model) {
  if (!technical || technical.coresPhysical == null || technical.threads == null) return null;
  const es3DVCache = typeof model === 'string' && /X3D$/i.test(model.trim());
  const sufijo = es3DVCache ? ', 3D V-Cache' : '';
  return `${technical.coresPhysical} núcleos / ${technical.threads} hilos${sufijo}`;
}

// Formateador de specs de Motherboard: reproduce el concepto ya usado por
// Legacy ("mATX, AM5") con formFactor + socket, ambos strings planos ya
// presentes a nivel product en los 4 productos mapeados actualmente. Si
// falta cualquiera de los dos tras el merge, devuelve null (fallback a
// Legacy) en vez de mostrar una specs a medias.
function _textoSpecsMotherboard(technical) {
  if (!technical || technical.formFactor == null || technical.socket == null) return null;
  return `${technical.formFactor}, ${technical.socket}`;
}

// Formateador de specs de RAM: reproduce el concepto ya usado por Legacy
// ("2x16 GB") con memory.modules + memory.moduleCapacityGB, ambos presentes
// en los 2 productos mapeados actualmente. Si falta cualquiera de los dos,
// devuelve null (fallback a Legacy) en vez de mostrar una specs a medias.
function _textoSpecsRam(technical) {
  const memoria = technical ? technical.memory : null;
  if (!memoria || memoria.modules == null || memoria.moduleCapacityGB == null) return null;
  return `${memoria.modules}x${memoria.moduleCapacityGB} GB`;
}

// Formateador de specs de PSU: reproduce el concepto ya usado por Legacy
// ("ATX 3.1" / "ATX 3.1 / PCIe 5.x") con atxVersion + pcieCompliance,
// ambos presentes tal cual en los 5 productos mapeados actualmente
// (pcieCompliance solo existe en el de 1200W; el resto no lo declara, no
// es un null a rellenar). Si falta atxVersion, devuelve null (fallback a
// Legacy) en vez de mostrar una specs a medias.
function _textoSpecsPsu(technical) {
  if (!technical || technical.atxVersion == null) return null;
  const pcie = technical.pcieCompliance != null ? ` / PCIe ${technical.pcieCompliance}` : '';
  return `ATX ${technical.atxVersion}${pcie}`;
}

// Formateador de specs de GPU: a diferencia de las categorías anteriores,
// el texto Legacy ("1080p", "4K extremo") es un juicio editorial de "para
// qué resolución sirve" que NO existe como campo en catalog.v2.json — no
// se reproduce (no hay dato que lo respalde). En su lugar se muestra VRAM
// (memory.sizeGB + memory.type), el único dato técnico presente y con el
// mismo nombre de campo en los productos NVIDIA y AMD mapeados. compute.*
// (cudaCores en NVIDIA vs streamProcessors en AMD) y power.consumptionW
// (null en los 2 productos AMD) se dejan fuera a propósito: no son
// comparables 1:1 entre fabricantes o no están completos en todos.
function _textoSpecsGpu(technical) {
  const memoria = technical ? technical.memory : null;
  if (!memoria || memoria.sizeGB == null || memoria.type == null) return null;
  return `${memoria.sizeGB}GB ${memoria.type}`;
}

// Formateador de specs de Storage: el texto Legacy ("rápido", "máximo
// rendimiento") es un juicio editorial de desempeño relativo que NO existe
// como campo en catalog.v2.json — no se reproduce. En su lugar se muestra
// interface (+ protocol/pcieGen cuando existen, ausentes en SATA a
// propósito, no null) + la velocidad de lectura secuencial real
// (performance.sequentialReadMBs), presente y no-null en los 4 productos
// mapeados: el dato verificable más cercano a lo que "rápido" insinuaba,
// sin inventar el juicio de valor.
function _textoSpecsStorage(technical) {
  if (!technical || technical.interface == null) return null;
  const performance = technical.performance;
  if (!performance || performance.sequentialReadMBs == null) return null;
  const protocolo = technical.protocol != null ? ` ${technical.protocol}` : '';
  const gen = technical.pcieGen != null ? ` ${technical.pcieGen}` : '';
  return `${technical.interface}${protocolo}${gen}, ${performance.sequentialReadMBs} MB/s`;
}

// Formateador de specs de Cooling: el texto Legacy ("económico", "silencioso",
// "líquida premium") es en su mayoría juicio editorial que NO existe como
// campo en catalog.v2.json — no se reproduce, ni siquiera indirectamente
// (ej. no se infiere "silencioso" desde fan.noiseDbMax). `type` ("aire"/
// "liquida") solo existe a nivel family, requiere el merge family+product
// ya existente. `thermalDissipationW` esta presente y no-null solo en los
// coolers de aire (null en el AIO liquido mapeado, ver docs/CONTRATO_V2.md);
// se usa unicamente cuando existe, sin inventar el valor faltante. No se
// llama "TDP": la fuente citada usa literalmente "disipacion", no TDP.
function _textoSpecsCooling(technical) {
  if (!technical || technical.type == null) return null;
  const disipacion = technical.thermalDissipationW != null ? `, ${technical.thermalDissipationW}W disipación` : '';
  return `${technical.type}${disipacion}`;
}

// Formateador de specs de Case: el texto Legacy ("buen flujo de aire",
// "premium, máximo espacio", "compacto") es juicio editorial que NO existe
// como campo en catalog.v2.json — no se reproduce, ni siquiera indirectamente
// (ej. no se infiere "máximo espacio" desde maxGpuLengthMm/dimensionsMm).
// `class` ("mid-tower"/"full-tower") solo existe a nivel family, requiere
// el merge family+product ya existente. `maxGpuLengthMm` esta presente y
// no-null en los 2 productos mapeados; se agrega solo cuando existe, sin
// inventar el valor si faltara en un futuro case sin ese dato.
function _textoSpecsCase(technical) {
  if (!technical || technical.class == null) return null;
  const gpu = technical.maxGpuLengthMm != null ? `, hasta ${technical.maxGpuLengthMm}mm GPU` : '';
  return `${technical.class}${gpu}`;
}

// Texto de specs a mostrar para una pieza: el resultado formateado de V2
// cuando la categoría está en el piloto de specs y hay datos suficientes,
// o null si no aplica (el llamador debe usar el texto legacy tal cual).
// Dispatcher explícito por categoría: agregar una categoría nueva requiere
// su propio formateador, nunca se reutiliza el de otra categoría a ciegas.
function specsVisiblesProducto(categoriaId, legacyId) {
  const technical = technicalVisibleProducto(categoriaId, legacyId);
  if (!technical) return null;
  if (categoriaId === 'cpu') {
    const producto = _entradaProductoV2(categoriaId, legacyId);
    const model = producto && producto.identity ? producto.identity.model : null;
    return _textoSpecsCpu(technical, model);
  }
  if (categoriaId === 'motherboard') {
    return _textoSpecsMotherboard(technical);
  }
  if (categoriaId === 'ram') {
    return _textoSpecsRam(technical);
  }
  if (categoriaId === 'psu') {
    return _textoSpecsPsu(technical);
  }
  if (categoriaId === 'gpu') {
    return _textoSpecsGpu(technical);
  }
  if (categoriaId === 'storage') {
    return _textoSpecsStorage(technical);
  }
  if (categoriaId === 'cooling') {
    return _textoSpecsCooling(technical);
  }
  if (categoriaId === 'case') {
    return _textoSpecsCase(technical);
  }
  return null;
}
