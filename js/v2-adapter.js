// ===== Adaptador de solo lectura para el catálogo V2 (data/v2/) =====
// Piloto: usado hoy por las categorías "storage", "ram", "motherboard",
// "psu", "case", "gpu" y "cooling". El resto de categorías sigue
// mostrando el nombre genérico de nivel tal como estaba.
//
// Regla de fuente de verdad (ver docs/CONTRATO_V2.md):
// - V2 es la fuente de verdad de PRODUCTOS reales (marca + modelo + MPN).
// - Legacy (data/components.json) sigue siendo la fuente de precio/tier/
//   compatibilidad — este adaptador nunca calcula precio ni compatibilidad.
// - Si un legacyId no tiene mapping en el crosswalk, o V2 no carga, la
//   función devuelve null: el llamador debe usar el nombre legacy tal cual.
//   Nunca se inventa ni se sustituye un producto en silencio.

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

// Busca el producto V2 real (marca, nombre comercial, partNumber) que el
// crosswalk asocia a un legacyId de una categoría dada. Devuelve null si no
// hay mapping, si el producto no existe o no es selectable, o si V2 no cargó.
function productoV2ParaLegacyId(categoriaId, legacyId) {
  if (!V2_CATALOGO || !V2_CROSSWALK) return null;
  const mapping = V2_CROSSWALK.mappings.find(
    (m) => m.category === categoriaId && m.legacyId === legacyId
  );
  if (!mapping) return null;
  const producto = V2_CATALOGO.entries.find(
    (e) => e.id === mapping.productId && e.type === 'product' && e.selectable === true
  );
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
