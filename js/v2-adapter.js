// ===== Adaptador de solo lectura para el catálogo V2 (data/v2/) =====
// Piloto de NOMBRE: usado hoy por las categorías "storage", "ram",
// "motherboard", "psu", "case", "gpu", "cooling" y "cpu". El resto de
// categorías sigue mostrando el nombre genérico de nivel tal como estaba.
//
// Piloto de SPECS (más acotado): solo "cpu" por ahora. Ver
// specsVisiblesProducto() más abajo — cualquier otra categoría devuelve
// null a propósito hasta que se audite y diseñe su propio formateador.
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
  return null;
}
