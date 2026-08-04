// ===== Lógica de la página de nivel =====
// Lee el catálogo, detecta qué nivel mostrar y arma la página.
// Ahora también muestra los precios en la moneda que elija el usuario,
// sin perder nunca el valor de referencia en dólares.

let TASAS = {};
let MONEDA_ACTIVA = 'USD';
let NIVEL_ACTUAL = null;

function obtenerIdNivel() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('nivel')) return params.get('nivel');
  const archivo = window.location.pathname.split('/').pop().replace('.html', '');
  return archivo || 'entrada';
}

function precioUSD(min, max) {
  if (min === max) return `US$${min.toLocaleString('en-US')}`;
  return `US$${min.toLocaleString('en-US')} – ${max.toLocaleString('en-US')}`;
}

function precioConvertido(min, max) {
  if (MONEDA_ACTIVA === 'USD') return '';
  const a = convertir(min, MONEDA_ACTIVA, TASAS);
  if (min === max) return a;
  const b = convertir(max, MONEDA_ACTIVA, TASAS);
  return `${a} – ${b}`;
}

function bloquePrecio(min, max) {
  if (!min) return '';
  const usd = `<span class="comp-price mono">${precioUSD(min, max)}</span>`;
  const local = precioConvertido(min, max);
  const localHtml = local ? `<span class="comp-price-local mono">${local}</span>` : '';
  return `<div class="comp-price-wrap">${usd}${localHtml}</div>`;
}

function filaComponente(comp) {
  const rec = comp.recommended;
  const specs = rec.specs ? `<span class="comp-specs">${rec.specs}</span>` : '';
  const alt = comp.alternative ? `<p class="comp-alt">Alternativa: ${comp.alternative.name}</p>` : '';
  return `
    <div class="comp-row">
      <div class="comp-label mono">${comp.label}</div>
      <div class="comp-main">
        <p class="comp-name hoverable" data-preview="${comp.category}" data-preview-label="${rec.name}">${rec.name}</p>
        ${specs}
        ${alt}
      </div>
      ${bloquePrecio(rec.priceMin, rec.priceMax)}
    </div>`;
}

function navegacionNiveles(tiers, idActual) {
  return tiers.map((t) => {
    const activo = t.id === idActual ? ' active' : '';
    return `<a href="${t.id}.html" class="level-pill${activo}">${t.name}</a>`;
  }).join('');
}

function selectorMoneda() {
  const opciones = MonedaConfig.monedas.map((m) =>
    `<option value="${m.code}"${m.code === MONEDA_ACTIVA ? ' selected' : ''}>${m.code} — ${m.name}</option>`
  ).join('');
  return `
    <label class="moneda-selector">
      <span class="mono">Moneda</span>
      <select id="moneda-select">${opciones}</select>
    </label>`;
}

function repintarPrecios() {
  if (!NIVEL_ACTUAL) return;
  document.getElementById('components').innerHTML =
    NIVEL_ACTUAL.components.map(filaComponente).join('');

  const usdTotal = precioUSD(NIVEL_ACTUAL.priceMin, NIVEL_ACTUAL.priceMax);
  const localTotal = precioConvertido(NIVEL_ACTUAL.priceMin, NIVEL_ACTUAL.priceMax);
  document.getElementById('level-total').innerHTML =
    localTotal
      ? `Total estimado: ${usdTotal} <span class="total-local">(${localTotal})</span>`
      : `Total estimado: ${usdTotal}`;
}

async function cargarNivel() {
  const idNivel = obtenerIdNivel();

  let catalogo;
  try {
    catalogo = await (await fetch('../data/catalog.json')).json();
  } catch (e) {
    document.getElementById('level-name').textContent = 'No se pudo cargar el catálogo';
    return;
  }

  const nivel = catalogo.tiers.find((t) => t.id === idNivel);
  if (!nivel) {
    document.getElementById('level-name').textContent = 'Nivel no encontrado';
    return;
  }
  NIVEL_ACTUAL = nivel;

  MONEDA_ACTIVA = monedaElegida();
  const resultado = await obtenerTasas();
  TASAS = resultado.tasas;

  document.title = `${nivel.name} — ArmaPC`;
  document.getElementById('crumb-name').textContent = nivel.name;
  document.getElementById('level-price').textContent = precioUSD(nivel.priceMin, nivel.priceMax);
  document.getElementById('level-name').textContent = `Nivel ${nivel.name}`;
  document.getElementById('level-target').textContent = nivel.target;

  const cont = document.getElementById('moneda-container');
  if (cont) {
    cont.innerHTML = selectorMoneda();
    document.getElementById('moneda-select').addEventListener('change', (e) => {
      MONEDA_ACTIVA = e.target.value;
      guardarMonedaElegida(MONEDA_ACTIVA);
      repintarPrecios();
    });
    if (catalogo.updated) {
      cont.insertAdjacentHTML('beforeend',
        `<span class="precios-fecha mono">Precios de referencia · actualizados en ${fechaLegible(catalogo.updated)}</span>`);
    }
  }

  repintarPrecios();

  const notaTasa = MONEDA_ACTIVA !== 'USD'
    ? ' El valor en tu moneda es una conversión automática de referencia y puede variar según el día y la tienda.'
    : '';
  const fecha = fechaPreciosLegible(catalogo.updated);
  const sello = fecha
    ? `<p class="precio-sello mono">Precios de referencia · actualizados en ${fecha}</p>`
    : '';
  document.getElementById('level-note').innerHTML =
    `${sello}
     <p>Los precios son valores de referencia en dólares (USD), no precios de una
     tienda específica. En 2026 la RAM y el almacenamiento (SSD) están más caros de
     lo normal por la alta demanda de la industria de IA, así que conviene contrastar
     con tiendas de tu región antes de comprar.${notaTasa}</p>`;

  document.getElementById('level-nav').innerHTML = navegacionNiveles(catalogo.tiers, idNivel);
}

cargarNivel();
