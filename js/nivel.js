// ===== Lógica de la página de nivel =====
// Lee data/components.json (fuente única) y arma la página del nivel pedido.
// El precio total se calcula SIEMPRE sumando los componentes reales del
// preset — nunca es un número escrito a mano, así nunca puede desalinearse
// de lo que realmente cuesta la build.

let TASAS = {};
let MONEDA_ACTIVA = 'USD';
let CATALOGO = null;
let CATEGORIAS_ORDENADAS = []; // ordenadas UNA sola vez al cargar
let TIER_ACTUAL = null;

function obtenerIdNivel() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('nivel')) return params.get('nivel');
  const archivo = window.location.pathname.split('/').pop().replace('.html', '');
  return archivo || 'entrada';
}

function buscarPieza(categoriaId, piezaId) {
  const cat = CATALOGO.categories.find((c) => c.id === categoriaId);
  if (!cat) return null;
  return cat.items.find((i) => i.id === piezaId) || null;
}

function precioUSD(valor) {
  return `US$${valor.toLocaleString('en-US')}`;
}

function precioConvertido(valor) {
  if (MONEDA_ACTIVA === 'USD') return '';
  return convertir(valor, MONEDA_ACTIVA, TASAS);
}

function bloquePrecio(valor) {
  const usd = `<span class="comp-price mono">${precioUSD(valor)}</span>`;
  const local = precioConvertido(valor);
  const localHtml = local ? `<span class="comp-price-local mono">${local}</span>` : '';
  return `<div class="comp-price-wrap">${usd}${localHtml}</div>`;
}

// Categorías cubiertas hoy por el piloto V2 de NOMBRE (ver js/v2-adapter.js).
// Ampliar esta lista es lo único necesario para sumar una categoría más.
const CATEGORIAS_PILOTO_V2 = ['storage', 'ram', 'motherboard', 'psu', 'case', 'gpu', 'cooling', 'cpu'];

// Piloto de SPECS, más acotado que el de nombre: solo las categorías con un
// formateador dedicado en specsVisiblesProducto() de js/v2-adapter.js.
const CATEGORIAS_PILOTO_V2_SPECS = ['cpu', 'motherboard', 'ram', 'psu', 'gpu', 'storage', 'cooling', 'case'];

// Arma la fila de un componente resolviendo su id contra el catálogo real.
// Piloto V2: si existe un producto real verificado en el crosswalk para esta
// pieza, se muestra su nombre comercial real en vez del nombre genérico de
// nivel. Precio y specs siguen viniendo de Legacy sin cambios — el piloto
// solo toca el nombre mostrado.
function filaComponente(cat, piezaId, altId) {
  const pieza = buscarPieza(cat.id, piezaId);
  if (!pieza) return ''; // referencia rota — no debería pasar tras la validación, pero no rompemos el render
  const nombreMostrado = CATEGORIAS_PILOTO_V2.includes(cat.id) ? nombreVisibleProducto(cat.id, piezaId, pieza.name) : pieza.name;
  const specsTexto = CATEGORIAS_PILOTO_V2_SPECS.includes(cat.id) ? (specsVisiblesProducto(cat.id, piezaId) || pieza.specs) : pieza.specs;
  const specs = specsTexto ? `<span class="comp-specs">${escapeHtml(specsTexto)}</span>` : '';
  let alt = '';
  if (altId) {
    const piezaAlt = buscarPieza(cat.id, altId);
    const etiquetaAlt = t({ es: 'Alternativa', en: 'Alternative', pt: 'Alternativa' });
    if (piezaAlt) {
      const nombreAltMostrado = CATEGORIAS_PILOTO_V2.includes(cat.id) ? nombreVisibleProducto(cat.id, altId, piezaAlt.name) : piezaAlt.name;
      alt = `<p class="comp-alt">${etiquetaAlt}: ${escapeHtml(nombreAltMostrado)} (${precioUSD(piezaAlt.price)})</p>`;
    }
  }
  return `
    <div class="comp-row">
      <div class="comp-label mono">${escapeHtml(cat.label)}</div>
      <div class="comp-main">
        <p class="comp-name hoverable" data-preview="${cat.id}" data-preview-label="${escapeHtml(nombreMostrado)}">${escapeHtml(nombreMostrado)}</p>
        ${specs}
        ${alt}
      </div>
      ${bloquePrecio(pieza.price)}
    </div>`;
}

function navegacionNiveles(tiers, idActual) {
  return tiers.map((t) => {
    const activo = t.id === idActual ? ' active' : '';
    return `<a href="${t.id}.html" class="level-pill${activo}">${escapeHtml(t.name)}</a>`;
  }).join('');
}

// Calcula el total real sumando el precio de cada componente del preset.
function calcularTotal(tier) {
  return Object.entries(tier.components).reduce((suma, [catId, piezaId]) => {
    const pieza = buscarPieza(catId, piezaId);
    return suma + (pieza ? pieza.price : 0);
  }, 0);
}

function repintarPrecios() {
  if (!TIER_ACTUAL) return;
  document.getElementById('components').innerHTML = CATEGORIAS_ORDENADAS
    .map((cat) => filaComponente(cat, TIER_ACTUAL.components[cat.id], TIER_ACTUAL.alternatives?.[cat.id]))
    .join('');

  const total = calcularTotal(TIER_ACTUAL);
  const usdTotal = precioUSD(total);
  const localTotal = precioConvertido(total);
  const etiquetaTotal = t({ es: 'Total real de esta build', en: 'Real total for this build', pt: 'Total real desta build' });
  document.getElementById('level-total').innerHTML =
    localTotal
      ? `${etiquetaTotal}: ${usdTotal} <span class="total-local">(${localTotal})</span>`
      : `${etiquetaTotal}: ${usdTotal}`;
}

async function cargarNivel() {
  const idNivel = obtenerIdNivel();

  try {
    CATALOGO = await (await fetch(rutaLocalizada('/data/components.json'))).json();
  } catch (e) {
    document.getElementById('level-name').textContent = t({ es: 'No se pudo cargar el catálogo', en: 'Could not load the catalog', pt: 'Não foi possível carregar o catálogo' });
    return;
  }
  // Piloto V2 (storage, ram): se espera antes de pintar para que el nombre
  // real no "parpadee" después del render; si falla, cargarV2() ya resuelve
  // con V2_CATALOGO/V2_CROSSWALK en null y el nombre legacy se usa tal cual.
  await cargarV2();

  const tier = CATALOGO.tiers.find((tr) => tr.id === idNivel);
  if (!tier) {
    document.getElementById('level-name').textContent = t({ es: 'Nivel no encontrado', en: 'Tier not found', pt: 'Nível não encontrado' });
    return;
  }
  TIER_ACTUAL = tier;
  CATEGORIAS_ORDENADAS = [...CATALOGO.categories].sort((a, b) => a.order - b.order);

  MONEDA_ACTIVA = monedaElegida();
  const resultado = await obtenerTasas();
  TASAS = resultado.tasas;

  const totalInicial = calcularTotal(tier);

  const etiquetaNivel = t({ es: 'Nivel', en: 'Tier', pt: 'Nível' });
  const catalogoDe = t({ es: 'Catálogo de componentes para el nivel', en: 'Component catalog for the', pt: 'Catálogo de componentes para o nível' });
  const tituloDesde = t({ es: 'desde', en: 'starting at', pt: 'a partir de' });

  document.title = `${etiquetaNivel} ${tier.name} — ${tituloDesde} ${precioUSD(tier.priceMin)} — ArmaPC`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const desc = idiomaActual() === 'en'
      ? `${catalogoDe} ${tier.name} tier (${precioUSD(tier.priceMin)}–${tier.priceMax.toLocaleString('en-US')}): ${tier.tagline}. ${tier.target}`
      : `${catalogoDe} ${tier.name} (${precioUSD(tier.priceMin)}–${tier.priceMax.toLocaleString('en-US')}): ${tier.tagline}. ${tier.target}`;
    metaDesc.setAttribute('content', desc);
  }
  document.getElementById('crumb-name').textContent = tier.name;
  document.getElementById('level-price').textContent = precioUSD(totalInicial);
  document.getElementById('level-name').textContent = `${etiquetaNivel} ${tier.name}`;
  document.getElementById('level-target').textContent = tier.target;

  // Selector de moneda (función compartida en moneda.js) + sello de fecha
  // (un solo lugar, no duplicado)
  const cont = document.getElementById('moneda-container');
  if (cont) {
    cont.innerHTML = selectorMonedaHTML(MONEDA_ACTIVA);
    document.getElementById('moneda-select').addEventListener('change', (e) => {
      MONEDA_ACTIVA = e.target.value;
      guardarMonedaElegida(MONEDA_ACTIVA);
      const nuevoTotal = calcularTotal(TIER_ACTUAL);
      document.getElementById('level-price').textContent = precioUSD(nuevoTotal);
      repintarPrecios();
    });
    if (CATALOGO.updated) {
      const etiquetaFecha = t({ es: 'Precios de referencia · actualizados en', en: 'Reference prices · updated', pt: 'Preços de referência · atualizados em' });
      cont.insertAdjacentHTML('beforeend',
        `<span class="precios-fecha mono">${etiquetaFecha} ${escapeHtml(fechaPreciosLegible(CATALOGO.updated))}</span>`);
    }
  }

  repintarPrecios();

  const notaTasa = MONEDA_ACTIVA !== 'USD'
    ? t({
      es: ' El valor en tu moneda es una conversión automática de referencia y puede variar según el día y la tienda.',
      en: ' The value in your currency is an automatic reference conversion and may vary by day and by store.',
      pt: ' O valor na sua moeda é uma conversão automática de referência e pode variar conforme o dia e a loja.',
    })
    : '';
  const notaBase = t({
    es: `<p>Los precios son valores de referencia en dólares (USD), no precios de una
     tienda específica. El total se calcula sumando el precio real de cada componente
     de esta build — si cambias una pieza en el <a href="../configurador.html">configurador</a>,
     el total se actualiza solo. En 2026 la RAM y el almacenamiento (SSD) están más caros
     de lo normal por la alta demanda de la industria de IA, así que conviene contrastar
     con tiendas de tu región antes de comprar.`,
    en: `<p>Prices are reference values in US dollars (USD), not the price at any
     specific store. The total is calculated by adding up the real price of each
     component in this build — if you swap a part in the <a href="../configurador.html">configurator</a>,
     the total updates automatically. In 2026, RAM and storage (SSD) prices are higher
     than usual due to high demand from the AI industry, so it's worth comparing
     with stores in your region before buying.`,
    pt: `<p>Os preços são valores de referência em dólares (USD), não preços de uma
     loja específica. O total é calculado somando o preço real de cada componente
     desta build — se você trocar uma peça no <a href="../configurador.html">configurador</a>,
     o total se atualiza automaticamente. Em 2026, a RAM e o armazenamento (SSD) estão
     mais caros que o normal devido à alta demanda da indústria de IA, por isso vale a
     pena comparar com lojas da sua região antes de comprar.`,
  });
  document.getElementById('level-note').innerHTML = `${notaBase}${notaTasa}</p>`;

  document.getElementById('level-nav').innerHTML = navegacionNiveles(CATALOGO.tiers, idNivel);
}

cargarNivel();
