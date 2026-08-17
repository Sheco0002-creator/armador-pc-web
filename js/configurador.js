// ===== Lógica del configurador =====

let CATALOGO = null;        // data/components.json completo
let CATEGORIAS_ORDENADAS = []; // categorías ordenadas UNA sola vez al cargar
                                // (antes se re-ordenaban en cada render)
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

// --- Precio total de la build actual (una sola función; antes se sumaba por
// separado en dibujarResumen y en copiarBuild) ---
function totalBuild() {
  return Object.values(BUILD).reduce((suma, pieza) => suma + pieza.price, 0);
}

// --- Dibujar una categoría (tarjeta que se abre para elegir) ---
// 'antesIncompatibles' viene precalculado desde dibujarCategorias para no
// recomputar el estado "antes" de la build en cada una de las N piezas de
// la categoría (antes se recalculaba una vez por pieza, siempre con el
// mismo resultado dentro del mismo render).
function dibujarCategoria(cat, antesIncompatibles) {
  const elegida = BUILD[cat.id];
  const abierta = CATEGORIA_ABIERTA === cat.id;

  // Cabecera de la categoría
  let html = `<div class="cat-card${abierta ? ' open' : ''}" data-cat="${cat.id}">`;
  html += `<button class="cat-head" data-toggle="${cat.id}" aria-expanded="${abierta}" aria-controls="opciones-${cat.id}">
    <span class="cat-order mono">${String(cat.order).padStart(2, '0')}</span>
    <span class="cat-label">${escapeHtml(cat.label)}</span>
    <span class="cat-chosen">${elegida ? escapeHtml(elegida.name) : '<em>Sin elegir</em>'}</span>
    <span class="cat-arrow">${abierta ? '▲' : '▼'}</span>
  </button>`;

  // Lista de opciones (solo si está abierta)
  if (abierta) {
    html += `<div class="cat-options" id="opciones-${cat.id}">`;
    for (const pieza of cat.items) {
      const seleccionada = elegida && elegida.id === pieza.id;
      const compat = piezaCompatible(BUILD, cat.id, pieza, antesIncompatibles);
      const clases = ['option'];
      if (seleccionada) clases.push('selected');
      if (!compat.ok) clases.push('incompatible');

      html += `<button class="${clases.join(' ')}" data-pick="${cat.id}:${pieza.id}"${!compat.ok ? ' disabled' : ''}>
        <span class="option-main" data-preview="${cat.id}" data-preview-label="${escapeHtml(pieza.name)}">
          <span class="option-name">${escapeHtml(pieza.name)}</span>
          ${pieza.specs ? `<span class="option-specs">${escapeHtml(pieza.specs)}</span>` : ''}
          ${!compat.ok ? `<span class="option-reason">⚠ ${escapeHtml(compat.razon)}</span>` : ''}
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
// 'categoriaAEnfocar' es la categoría a la que se le debe devolver el foco de
// teclado después del re-render (el innerHTML de abajo destruye y recrea
// todos los botones, así que sin esto quien navega con teclado perdería su
// lugar y volvería a <body> después de cada elección).
function dibujarCategorias(categoriaAEnfocar) {
  const cont = document.getElementById('config-categories');
  // El estado "antes" de la build es el mismo para las N piezas de cada
  // categoría — se calcula una sola vez aquí, no dentro de cada pieza.
  const antesIncompatibles = revisarCompatibilidad(BUILD).filter((p) => p.nivel === 'incompatible');
  cont.innerHTML = CATEGORIAS_ORDENADAS.map((cat) => dibujarCategoria(cat, antesIncompatibles)).join('');

  // Preferimos devolver el foco a la categoría que quedó abierta (para poder
  // seguir eligiendo de inmediato); si ninguna quedó abierta, lo devolvemos
  // a la categoría con la que se acaba de interactuar, para no perder el lugar.
  const idAEnfocar = CATEGORIA_ABIERTA || categoriaAEnfocar;
  if (idAEnfocar) {
    const boton = cont.querySelector(`[data-toggle="${idAEnfocar}"]`);
    if (boton) boton.focus();
  }

  // Conectar clicks de abrir/cerrar categoría
  cont.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-toggle');
      CATEGORIA_ABIERTA = (CATEGORIA_ABIERTA === id) ? null : id;
      dibujarCategorias(id);
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
      dibujarTodo(catId);
    });
  });
}

// --- Abrir automáticamente la siguiente categoría que falte ---
function abrirSiguientePendiente() {
  const pendiente = CATEGORIAS_ORDENADAS.find((c) => !BUILD[c.id]);
  CATEGORIA_ABIERTA = pendiente ? pendiente.id : null;
}

// --- Dibujar el panel de resumen ---
function dibujarResumen() {
  const lista = document.getElementById('summary-list');

  const total = totalBuild();
  lista.innerHTML = CATEGORIAS_ORDENADAS.map((cat) => {
    const pieza = BUILD[cat.id];
    return `<li class="${pieza ? 'filled' : 'empty'}">
      <span class="sum-cat mono">${escapeHtml(cat.label)}</span>
      <span class="sum-piece">${pieza ? escapeHtml(pieza.name) : '—'}</span>
      <span class="sum-price mono">${pieza ? precioTexto(pieza.price) : ''}</span>
    </li>`;
  }).join('');

  // Total
  document.getElementById('summary-total-value').textContent = precioTexto(total);

  // Estado de compatibilidad
  const problemas = revisarCompatibilidad(BUILD);
  const incompatibles = problemas.filter((p) => p.nivel === 'incompatible');
  const avisos = problemas.filter((p) => p.nivel === 'aviso');
  const noVerificados = problemas.filter((p) => p.nivel === 'no_verificado');
  const elegidas = Object.keys(BUILD).length;
  const totalCats = CATEGORIAS_ORDENADAS.length;

  const estado = document.getElementById('summary-status');
  if (incompatibles.length > 0) {
    estado.className = 'summary-status status-error';
    estado.innerHTML = `<strong>⚠ ${incompatibles.length} incompatibilidad(es)</strong>` +
      incompatibles.map((e) => `<span>${escapeHtml(e.texto)}</span>`).join('');
  } else if (avisos.length > 0) {
    estado.className = 'summary-status status-warn';
    estado.innerHTML = `<strong>Compatible, con ${avisos.length} recomendación(es)</strong>` +
      avisos.map((a) => `<span>${escapeHtml(a.texto)}</span>`).join('');
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

  // "No verificado": nunca bloquea ni se mezcla con el estado principal, pero
  // se muestra siempre que exista, para ser honestos sobre lo que no pudimos
  // comprobar por falta de datos (nunca lo tratamos como incompatible).
  const bloqueNoVerif = document.getElementById('summary-unverified');
  if (bloqueNoVerif) {
    if (noVerificados.length > 0) {
      bloqueNoVerif.innerHTML = `<strong>ℹ No verificado (${noVerificados.length})</strong>` +
        noVerificados.map((n) => `<span>${escapeHtml(n.texto)}</span>`).join('');
      bloqueNoVerif.hidden = false;
    } else {
      bloqueNoVerif.hidden = true;
      bloqueNoVerif.innerHTML = '';
    }
  }

  // Botón exportar: activo solo si la build está completa y sin incompatibilidades
  const btn = document.getElementById('export-btn');
  btn.disabled = !(elegidas === totalCats && incompatibles.length === 0);
}

// --- Consumo estimado y margen de la fuente (usa las mismas funciones que
// ya usa el motor de compatibilidad — no se recalcula por separado) ---
function dibujarConsumo() {
  const cont = document.getElementById('summary-power');
  if (!cont) return;
  const { cpu, gpu, psu } = BUILD;

  if (!cpu && !gpu) {
    cont.innerHTML = `<p class="power-empty">Elige el procesador y la tarjeta gráfica para estimar el consumo.</p>`;
    return;
  }

  const consumo = consumoEstimado(BUILD);
  let html = `<div class="power-row"><span>Consumo estimado</span><span class="mono">~${consumo}W</span></div>`;

  if (!psu) {
    html += `<p class="power-empty">Elige una fuente de poder para ver su margen.</p>`;
  } else {
    const recomendada = fuenteRecomendada(BUILD);
    const margen = psu.wattage - consumo;
    let clase = 'power-ok';
    let etiqueta = `Buen margen (+${margen}W)`;
    if (psu.wattage < consumo) {
      clase = 'power-bad';
      etiqueta = `Insuficiente (faltan ${consumo - psu.wattage}W)`;
    } else if (psu.wattage < recomendada) {
      clase = 'power-warn';
      etiqueta = `Margen ajustado (+${margen}W, se recomienda ${recomendada}W)`;
    }
    html += `<div class="power-row"><span>Fuente elegida</span><span class="mono">${psu.wattage}W</span></div>`;
    html += `<div class="power-row ${clase}"><span>Margen</span><span class="mono">${etiqueta}</span></div>`;
  }

  cont.innerHTML = html;
}

function dibujarTodo(categoriaAEnfocar) {
  dibujarCategorias(categoriaAEnfocar);
  dibujarResumen();
  dibujarConsumo();
}

// --- Cargar un preset (nivel recomendado) ---
function cargarPreset(nombre) {
  BUILD = {};
  const tier = nombre ? CATALOGO.tiers.find((t) => t.id === nombre) : null;
  if (tier) {
    for (const [catId, piezaId] of Object.entries(tier.components)) {
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
  let texto = 'Mi PC gamer (armado en ArmaPC)\n\n';
  for (const cat of CATEGORIAS_ORDENADAS) {
    const p = BUILD[cat.id];
    if (p) texto += `- ${cat.label}: ${p.name} (US$${p.price})\n`;
  }
  const total = totalBuild();
  texto += `\nTotal aproximado: US$${total.toLocaleString('en-US')}`;
  if (MONEDA_ACTIVA !== 'USD') texto += ` (${convertir(total, MONEDA_ACTIVA, TASAS)})`;

  const btn = document.getElementById('export-btn');
  const original = btn.textContent;

  navigator.clipboard.writeText(texto).then(() => {
    btn.textContent = '¡Copiado!';
    setTimeout(() => { btn.textContent = original; }, 1800);
  }).catch(() => {
    // El navegador puede negar el permiso de portapapeles (ej. contexto no
    // seguro o restricción del usuario) — avisamos en vez de fallar en silencio.
    btn.textContent = 'No se pudo copiar';
    setTimeout(() => { btn.textContent = original; }, 1800);
  });
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

  // Ordenar las categorías UNA sola vez (antes se reordenaba en cada render).
  CATEGORIAS_ORDENADAS = [...CATALOGO.categories].sort((a, b) => a.order - b.order);

  MONEDA_ACTIVA = monedaElegida();
  TASAS = (await obtenerTasas()).tasas;

  // Selector de moneda (función compartida en moneda.js)
  const cont = document.getElementById('moneda-container');
  cont.innerHTML = selectorMonedaHTML(MONEDA_ACTIVA);
  document.getElementById('moneda-select').addEventListener('change', (e) => {
    MONEDA_ACTIVA = e.target.value;
    guardarMonedaElegida(MONEDA_ACTIVA);
    dibujarTodo();
  });

  // Badge de fecha de precios (transparencia)
  const badge = document.getElementById('precios-fecha');
  if (badge && CATALOGO.updated) {
    badge.innerHTML = `<span class="mono">Precios de referencia · actualizados en ${escapeHtml(fechaPreciosLegible(CATALOGO.updated))}</span>`;
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
  if (presetUrl && CATALOGO.tiers.some((t) => t.id === presetUrl)) {
    cargarPreset(presetUrl);
  } else {
    CATEGORIA_ABIERTA = 'cpu'; // abrir la primera categoría por defecto
    dibujarTodo();
  }
}

iniciar();
