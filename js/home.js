// ===== Precios de las tarjetas de nivel en la home =====
// El precio de cada nivel se calcula sumando sus componentes reales desde
// data/components.json — nunca se escribe a mano, para que no pueda
// desalinearse del configurador ni de las páginas de nivel.

async function cargarPreciosDeNiveles() {
  const spans = document.querySelectorAll('[data-tier-price]');
  if (spans.length === 0) return;

  let catalogo;
  try {
    catalogo = await (await fetch('data/components.json')).json();
  } catch (e) {
    spans.forEach((s) => { s.textContent = 'Ver catálogo'; });
    return;
  }

  const porId = {};
  for (const c of catalogo.categories) {
    porId[c.id] = {};
    for (const i of c.items) porId[c.id][i.id] = i;
  }

  spans.forEach((span) => {
    const tierId = span.getAttribute('data-tier-price');
    const tier = catalogo.tiers.find((t) => t.id === tierId);
    if (!tier) { span.textContent = 'Ver catálogo'; return; }
    const total = Object.entries(tier.components).reduce((suma, [catId, piezaId]) => {
      const pieza = porId[catId] && porId[catId][piezaId];
      return suma + (pieza ? pieza.price : 0);
    }, 0);
    span.textContent = `US$${total.toLocaleString('en-US')}`;
  });
}

cargarPreciosDeNiveles();
