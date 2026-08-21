// ===== Precios de las tarjetas de nivel en la home =====
// El precio de cada nivel se calcula sumando sus componentes reales desde
// data/components.json — nunca se escribe a mano, para que no pueda
// desalinearse del configurador ni de las páginas de nivel.

async function cargarPreciosDeNiveles() {
  const spans = document.querySelectorAll('[data-tier-price]');
  if (spans.length === 0) return;

  const verCatalogo = t({ es: 'Ver catálogo', en: 'View catalog', pt: 'Ver catálogo' });
  let catalogo;
  try {
    catalogo = await (await fetch(rutaLocalizada('data/components.json'))).json();
  } catch (e) {
    spans.forEach((s) => { s.textContent = verCatalogo; });
    return;
  }

  const porId = {};
  for (const c of catalogo.categories) {
    porId[c.id] = {};
    for (const i of c.items) porId[c.id][i.id] = i;
  }

  spans.forEach((span) => {
    const tierId = span.getAttribute('data-tier-price');
    const tier = catalogo.tiers.find((tr) => tr.id === tierId);
    if (!tier) { span.textContent = verCatalogo; return; }
    const total = Object.entries(tier.components).reduce((suma, [catId, piezaId]) => {
      const pieza = porId[catId] && porId[catId][piezaId];
      return suma + (pieza ? pieza.price : 0);
    }, 0);
    span.textContent = `US$${total.toLocaleString('en-US')}`;
  });
}

cargarPreciosDeNiveles();
