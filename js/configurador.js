// ===== Lógica del configurador =====

let CATALOGO = null;        // data/components.json completo
let BUILD = {};             // piezas elegidas: { cpu: {..}, gpu: {..}, ... }
let CATEGORIA_ABIERTA = null;
let TASAS = {};
let MONEDA_ACTIVA = 'USD';

// --- Utilidades de precio (reusa moneda.js) ---
function precioTexto(usd) {
  const base = `US$${usd.toLocaleString('en-US')}`;
  if (MONEDA_ACTIVA === 'USD') return base;
  return `${base} · ${convertir(usd, MONEDA_ACTIVA, TASAS)}`;
}

// --- Buscar una pieza por id dentro de una categoría ---
function buscarPieza(categoriaId, piezaId) {
  const cat = CATALOGO.categories.find((c) => c.id === categoriaId);
  if (!cat) return null;
  return cat.items.find((i) => i.id === piezaId) || null;
}

// --- Dibujar una categoría (tarjeta que se abre para elegir) ---
function dibujarCategoria(cat) {
  const elegida = BUILD[cat.id];
  const abierta = CATEGORIA_ABIERTA === cat.id;

  // Cabecera de la categoría
  let html = `<div class="cat-card${abierta ? ' open' : ''}" data-cat="${cat.id}">`;
  html += `<button class="cat-head" data-toggle="${cat.id}">
    <span class="cat-order mono">${String(cat.order).padStart(2, '0')}</span>
    <span class="cat-label">${cat.label}</span>
    <span class="cat-chosen">${elegida ? elegida.name : '<em>Sin elegir</em>'}</span>
    <span class="cat-arrow">${abierta ? '▲' : '▼'}</span>
  </button>`;

  // Lista de opciones (solo si está abierta)
  if (abierta) {
    html += '<div class="cat-options">';
    for (const pieza of cat.items) {
      const seleccionada = elegida && elegida.id === pieza.id;
      const compat = piezaCompatible(BUILD, cat.id, pieza);
      const clases = ['option'];
      if (seleccionada) clases.push('selected');
      if (!compat.ok) clases.push('incompatible');

      html += `<button class="${clases.join(' ')}" data-pick="${cat.id}:${pieza.id}"${!compat.ok ? ' disabled' : ''}>
        <span class="option-main" data-preview="${cat.id}" data-preview-label="${pieza.name}">
          <span class="option-name">${pieza.name}</span>
          ${pieza.specs ? `<span class="option-specs">${pieza.specs}</span>` : ''}
          ${!compat.ok ? `<span class="option-reason">⚠ ${compat.razon}</span>` : ''}
        </span>
        <span class="option-price mono">${precioTexto(pieza.price)}</span>
      </button>`;
    }
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// --- Dibujar todas las categorías ---
function dibujarCategorias() {
  const cont = document.getElementById('config-categories');
  const ordenadas = [...CATALOGO.categories].sort((a, b) => a.order - b.order);
  cont.innerHTML = ordenadas.map(dibujarCategoria).join('');

  // Conectar clicks de abrir/cerrar categoría
  cont.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-toggle');
      CATEGORIA_ABIERTA = (CATEGORIA_ABIERTA === id) ? null : id;
      dibujarCategorias();
    });
  });

  // Conectar clicks de elegir pieza
  cont.querySelectorAll('[data-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [catId, piezaId] = btn.getAttribute('data-pick').split(':');
      const pieza = buscarPieza(catId, piezaId);
      // Si ya estaba elegida, se quita (toggle). Si no, se elige.
      if (BUILD[catId] && BUILD[catId].id === piezaId) {
        delete BUILD[catId];
      } else {
        BUILD[catId] = pieza;
      }
      // Avanzar: abrir la siguiente categoría sin elegir, para guiar al usuario
      abrirSiguientePendiente();
      dibujarTodo();
    });
  });
}

// --- Abrir automáticamente la siguiente categoría que falte ---
function abrirSiguientePendiente() {
  const ordenadas = [...CATALOGO.categories].sort((a, b) => a.order - b.order);
  const pendiente = ordenadas.find((c) => !BUILD[c.id]);
  CATEGORIA_ABIERTA = pendiente ? pendiente.id : null;
}

// --- Dibujar el panel de resumen ---
function dibujarResumen() {
  const lista = document.getElementById('summary-list');
  const ordenadas = [...CATALOGO.categories].sort((a, b) => a.order - b.order);

  let total = 0;
  lista.innerHTML = ordenadas.map((cat) => {
    const pieza = BUILD[cat.id];
    if (pieza) total += pieza.price;
    return `<li class="${pieza ? 'filled' : 'empty'}">
      <span class="sum-cat mono">${cat.label}</span>
      <span class="sum-piece">${pieza ? pieza.name : '—'}</span>
      <span class="sum-price mono">${pieza ? precioTexto(pieza.price) : ''}</span>
    </li>`;
  }).join('');

  // Total
  document.getElementById('summary-total-value').textContent = precioTexto(total);

  // Estado de compatibilidad
  const problemas = revisarCompatibilidad(BUILD);
  const errores = problemas.filter((p) => p.nivel === 'error');
  const avisos = problemas.filter((p) => p.nivel === 'aviso');
  const elegidas = Object.keys(BUILD).length;
  const totalCats = CATALOGO.categories.length;

  const estado = document.getElementById('summary-status');
  if (errores.length > 0) {
    estado.className = 'summary-status status-error';
    estado.innerHTML = `<strong>⚠ ${errores.length} problema(s) de compatibilidad</strong>` +
      errores.map((e) => `<span>${e.texto}</span>`).join('');
  } else if (avisos.length > 0) {
    estado.className = 'summary-status status-warn';
    estado.innerHTML = `<strong>Compatible, con ${avisos.length} recomendación(es)</strong>` +
      avisos.map((a) => `<span>${a.texto}</span>`).join('');
  } else if (elegidas === 0) {
    estado.className = 'summary-status status-neutral';
    estado.innerHTML = `<span>Aún no has elegido piezas. Empieza por el procesador o carga un nivel recomendado.</span>`;
  } else if (elegidas < totalCats) {
    estado.className = 'summary-status status-ok';
    estado.innerHTML = `<strong>✓ Todo compatible hasta ahora</strong><span>Te faltan ${totalCats - elegidas} categoría(s).</span>`;
  } else {
    estado.className = 'summary-status status-ok';
    estado.innerHTML = `<strong>✓ Build completa y compatible</strong>`;
  }

  // Botón exportar: activo solo si la build está completa y sin errores
  const btn = document.getElementById('export-btn');
  btn.disabled = !(elegidas === totalCats && errores.length === 0);
}

function dibujarTodo() {
  dibujarCategorias();
  dibujarResumen();
}

// --- Cargar un preset (nivel recomendado) ---
function cargarPreset(nombre) {
  BUILD = {};
  if (nombre && CATALOGO.presets[nombre]) {
    const preset = CATALOGO.presets[nombre];
    for (const [catId, piezaId] of Object.entries(preset)) {
      const pieza = buscarPieza(catId, piezaId);
      if (pieza) BUILD[catId] = pieza;
    }
  }
  CATEGORIA_ABIERTA = null;
  dibujarTodo();
  window.scrollTo({ top: document.querySelector('.config-body').offsetTop - 80, behavior: 'smooth' });
}

// --- Copiar la build al portapapeles ---
function copiarBuild() {
  const ordenadas = [...CATALOGO.categories].sort((a, b) => a.order - b.order);
  let texto = 'Mi PC gamer (armado en ArmaPC)\n\n';
  let total = 0;
  for (const cat of ordenadas) {
    const p = BUILD[cat.id];
    if (p) {
      texto += `- ${cat.label}: ${p.name} (US$${p.price})\n`;
      total += p.price;
    }
  }
  texto += `\nTotal aproximado: US$${total.toLocaleString('en-US')}`;
  if (MONEDA_ACTIVA !== 'USD') texto += ` (${convertir(total, MONEDA_ACTIVA, TASAS)})`;

  navigator.clipboard.writeText(texto).then(() => {
    const btn = document.getElementById('export-btn');
    const original = btn.textContent;
    btn.textContent = '¡Copiado!';
    setTimeout(() => { btn.textContent = original; }, 1800);
  });
}

// --- Selector de moneda ---
function selectorMoneda() {
  const opciones = MonedaConfig.monedas.map((m) =>
    `<option value="${m.code}"${m.code === MONEDA_ACTIVA ? ' selected' : ''}>${m.code} — ${m.name}</option>`
  ).join('');
  return `<label class="moneda-selector"><span class="mono">Moneda</span>
    <select id="moneda-select">${opciones}</select></label>`;
}

// --- Arranque ---
async function iniciar() {
  try {
    CATALOGO = await (await fetch('data/components.json')).json();
  } catch (e) {
    document.getElementById('config-categories').innerHTML =
      '<p class="loading">No se pudieron cargar los componentes.</p>';
    return;
  }

  MONEDA_ACTIVA = monedaElegida();
  TASAS = (await obtenerTasas()).tasas;

  // Selector de moneda
  const cont = document.getElementById('moneda-container');
  cont.innerHTML = selectorMoneda();
  document.getElementById('moneda-select').addEventListener('change', (e) => {
    MONEDA_ACTIVA = e.target.value;
    guardarMonedaElegida(MONEDA_ACTIVA);
    dibujarTodo();
  });

  // Badge de fecha de precios (transparencia)
  const badge = document.getElementById('precios-fecha');
  if (badge && CATALOGO.updated) {
    badge.innerHTML = `<span class="mono">Precios de referencia · actualizados en ${fechaPreciosLegible(CATALOGO.updated)}</span>`;
  }

  // Botones de preset
  document.querySelectorAll('#preset-buttons button').forEach((btn) => {
    btn.addEventListener('click', () => cargarPreset(btn.getAttribute('data-preset')));
  });

  // Botón exportar
  document.getElementById('export-btn').addEventListener('click', copiarBuild);

  // Si venimos con ?preset=alta en la URL, cargarlo
  const params = new URLSearchParams(window.location.search);
  const presetUrl = params.get('preset');
  if (presetUrl && CATALOGO.presets[presetUrl]) {
    cargarPreset(presetUrl);
  } else {
    CATEGORIA_ABIERTA = 'cpu'; // abrir la primera categoría por defecto
    dibujarTodo();
  }
}

iniciar();
