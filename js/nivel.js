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

// Arma la fila de un componente resolviendo su id contra el catálogo real.
function filaComponente(cat, piezaId, altId) {
  const pieza = buscarPieza(cat.id, piezaId);
  if (!pieza) return ''; // referencia rota — no debería pasar tras la validación, pero no rompemos el render
  const specs = pieza.specs ? `<span class="comp-specs">${escapeHtml(pieza.specs)}</span>` : '';
  let alt = '';
  if (altId) {
    const piezaAlt = buscarPieza(cat.id, altId);
    if (piezaAlt) alt = `<p class="comp-alt">Alternativa: ${escapeHtml(piezaAlt.name)} (${precioUSD(piezaAlt.price)})</p>`;
  }
  return `
    <div class="comp-row">
      <div class="comp-label mono">${escapeHtml(cat.label)}</div>
      <div class="comp-main">
        <p class="comp-name hoverable" data-preview="${cat.id}" data-preview-label="${escapeHtml(pieza.name)}">${escapeHtml(pieza.name)}</p>
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
  document.getElementById('level-total').innerHTML =
    localTotal
      ? `Total real de esta build: ${usdTotal} <span class="total-local">(${localTotal})</span>`
      : `Total real de esta build: ${usdTotal}`;
}

async function cargarNivel() {
  const idNivel = obtenerIdNivel();

  try {
    CATALOGO = await (await fetch('../data/components.json')).json();
  } catch (e) {
    document.getElementById('level-name').textContent = 'No se pudo cargar el catálogo';
    return;
  }

  const tier = CATALOGO.tiers.find((t) => t.id === idNivel);
  if (!tier) {
    document.getElementById('level-name').textContent = 'Nivel no encontrado';
    return;
  }
  TIER_ACTUAL = tier;
  CATEGORIAS_ORDENADAS = [...CATALOGO.categories].sort((a, b) => a.order - b.order);

  MONEDA_ACTIVA = monedaElegida();
  const resultado = await obtenerTasas();
  TASAS = resultado.tasas;

  const totalInicial = calcularTotal(tier);

  document.title = `Nivel ${tier.name} — desde ${precioUSD(tier.priceMin)} — ArmaPC`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content',
      `Catálogo de componentes para el nivel ${tier.name} (${precioUSD(tier.priceMin)}–${tier.priceMax.toLocaleString('en-US')}): ${tier.tagline}. ${tier.target}`);
  }
  document.getElementById('crumb-name').textContent = tier.name;
  document.getElementById('level-price').textContent = precioUSD(totalInicial);
  document.getElementById('level-name').textContent = `Nivel ${tier.name}`;
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
      cont.insertAdjacentHTML('beforeend',
        `<span class="precios-fecha mono">Precios de referencia · actualizados en ${escapeHtml(fechaPreciosLegible(CATALOGO.updated))}</span>`);
    }
  }

  repintarPrecios();

  const notaTasa = MONEDA_ACTIVA !== 'USD'
    ? ' El valor en tu moneda es una conversión automática de referencia y puede variar según el día y la tienda.'
    : '';
  document.getElementById('level-note').innerHTML =
    `<p>Los precios son valores de referencia en dólares (USD), no precios de una
     tienda específica. El total se calcula sumando el precio real de cada componente
     de esta build — si cambias una pieza en el <a href="../configurador.html">configurador</a>,
     el total se actualiza solo. En 2026 la RAM y el almacenamiento (SSD) están más caros
     de lo normal por la alta demanda de la industria de IA, así que conviene contrastar
     con tiendas de tu región antes de comprar.${notaTasa}</p>`;

  document.getElementById('level-nav').innerHTML = navegacionNiveles(CATALOGO.tiers, idNivel);
}

cargarNivel();
