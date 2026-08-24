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

// Categorías cubiertas hoy por el piloto V2 (ver js/v2-adapter.js). Ampliar
// esta lista es lo único necesario para sumar una categoría más al piloto.
const CATEGORIAS_PILOTO_V2 = ['storage', 'ram', 'motherboard', 'psu', 'case', 'gpu', 'cooling', 'cpu'];

// Piloto de SPECS, más acotado que el de nombre: solo las categorías con un
// formateador dedicado en specsVisiblesProducto() de js/v2-adapter.js.
const CATEGORIAS_PILOTO_V2_SPECS = ['cpu'];

// --- Dibujar una categoría (tarjeta que se abre para elegir) ---
// 'antesIncompatibles' viene precalculado desde dibujarCategorias para no
// recomputar el estado "antes" de la build en cada una de las N piezas de
// la categoría (antes se recalculaba una vez por pieza, siempre con el
// mismo resultado dentro del mismo render).
function dibujarCategoria(cat, antesIncompatibles) {
  const elegida = BUILD[cat.id];
  const abierta = CATEGORIA_ABIERTA === cat.id;

  // Cabecera de la categoría
  const nombreElegidaMostrado = elegida && CATEGORIAS_PILOTO_V2.includes(cat.id) ? nombreVisibleProducto(cat.id, elegida.id, elegida.name) : elegida && elegida.name;
  let html = `<div class="cat-card${abierta ? ' open' : ''}" data-cat="${cat.id}">`;
  html += `<button class="cat-head" data-toggle="${cat.id}" aria-expanded="${abierta}" aria-controls="opciones-${cat.id}">
    <span class="cat-order mono">${String(cat.order).padStart(2, '0')}</span>
    <span class="cat-label">${escapeHtml(cat.label)}</span>
    <span class="cat-chosen">${elegida ? escapeHtml(nombreElegidaMostrado) : `<em>${t({ es: 'Sin elegir', en: 'Not chosen', pt: 'Não escolhido' })}</em>`}</span>
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
      // Piloto V2 (storage, ram): nombre comercial real cuando hay mapping
      // verificado en el crosswalk; si no, el nombre legacy tal cual.
      const nombreMostrado = CATEGORIAS_PILOTO_V2.includes(cat.id) ? nombreVisibleProducto(cat.id, pieza.id, pieza.name) : pieza.name;
      const specsTexto = CATEGORIAS_PILOTO_V2_SPECS.includes(cat.id) ? (specsVisiblesProducto(cat.id, pieza.id) || pieza.specs) : pieza.specs;

      html += `<button class="${clases.join(' ')}" data-pick="${cat.id}:${pieza.id}"${!compat.ok ? ' disabled' : ''}>
        <span class="option-main" data-preview="${cat.id}" data-preview-label="${escapeHtml(nombreMostrado)}">
          <span class="option-name">${escapeHtml(nombreMostrado)}</span>
          ${specsTexto ? `<span class="option-specs">${escapeHtml(specsTexto)}</span>` : ''}
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
    const nombreMostrado = pieza && CATEGORIAS_PILOTO_V2.includes(cat.id) ? nombreVisibleProducto(cat.id, pieza.id, pieza.name) : pieza && pieza.name;
    return `<li class="${pieza ? 'filled' : 'empty'}">
      <span class="sum-cat mono">${escapeHtml(cat.label)}</span>
      <span class="sum-piece">${pieza ? escapeHtml(nombreMostrado) : '—'}</span>
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
    const etiqueta = t({ es: `${incompatibles.length} incompatibilidad(es)`, en: `${incompatibles.length} incompatibility(ies)`, pt: `${incompatibles.length} incompatibilidade(s)` });
    estado.innerHTML = `<strong>⚠ ${etiqueta}</strong>` +
      incompatibles.map((e) => `<span>${escapeHtml(e.texto)}</span>`).join('');
  } else if (avisos.length > 0) {
    estado.className = 'summary-status status-warn';
    const etiqueta = t({ es: `Compatible, con ${avisos.length} recomendación(es)`, en: `Compatible, with ${avisos.length} recommendation(s)`, pt: `Compatível, com ${avisos.length} recomendação(ões)` });
    estado.innerHTML = `<strong>${etiqueta}</strong>` +
      avisos.map((a) => `<span>${escapeHtml(a.texto)}</span>`).join('');
  } else if (elegidas === 0) {
    estado.className = 'summary-status status-neutral';
    const msg = t({ es: 'Aún no has elegido piezas. Empieza por el procesador o carga un nivel recomendado.', en: "You haven't chosen any parts yet. Start with the processor or load a recommended tier.", pt: 'Você ainda não escolheu peças. Comece pelo processador ou carregue um nível recomendado.' });
    estado.innerHTML = `<span>${msg}</span>`;
  } else if (elegidas < totalCats) {
    estado.className = 'summary-status status-ok';
    const okMsg = t({ es: 'Todo compatible hasta ahora', en: 'Everything compatible so far', pt: 'Tudo compatível até agora' });
    const faltan = t({ es: `Te faltan ${totalCats - elegidas} categoría(s).`, en: `${totalCats - elegidas} categor${totalCats - elegidas === 1 ? 'y' : 'ies'} left.`, pt: `Faltam ${totalCats - elegidas} categoria(s).` });
    estado.innerHTML = `<strong>✓ ${okMsg}</strong><span>${faltan}</span>`;
  } else {
    estado.className = 'summary-status status-ok';
    const completa = t({ es: 'Build completa y compatible', en: 'Build complete and compatible', pt: 'Build completa e compatível' });
    estado.innerHTML = `<strong>✓ ${completa}</strong>`;
  }

  // "No verificado": nunca bloquea ni se mezcla con el estado principal, pero
  // se muestra siempre que exista, para ser honestos sobre lo que no pudimos
  // comprobar por falta de datos (nunca lo tratamos como incompatible).
  const bloqueNoVerif = document.getElementById('summary-unverified');
  if (bloqueNoVerif) {
    if (noVerificados.length > 0) {
      const etiquetaNoVerif = t({ es: 'No verificado', en: 'Not verified', pt: 'Não verificado' });
      bloqueNoVerif.innerHTML = `<strong>ℹ ${etiquetaNoVerif} (${noVerificados.length})</strong>` +
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
    const vacio = t({ es: 'Elige el procesador y la tarjeta gráfica para estimar el consumo.', en: 'Choose the processor and graphics card to estimate power draw.', pt: 'Escolha o processador e a placa de vídeo para estimar o consumo.' });
    cont.innerHTML = `<p class="power-empty">${vacio}</p>`;
    return;
  }

  const consumo = consumoEstimado(BUILD);
  const etiquetaConsumo = t({ es: 'Consumo estimado', en: 'Estimated power draw', pt: 'Consumo estimado' });
  let html = `<div class="power-row"><span>${etiquetaConsumo}</span><span class="mono">~${consumo}W</span></div>`;

  if (!psu) {
    const elegirFuente = t({ es: 'Elige una fuente de poder para ver su margen.', en: 'Choose a power supply to see its headroom.', pt: 'Escolha uma fonte de alimentação para ver sua margem.' });
    html += `<p class="power-empty">${elegirFuente}</p>`;
  } else {
    const recomendada = fuenteRecomendada(BUILD);
    const margen = psu.wattage - consumo;
    let clase = 'power-ok';
    let etiqueta = t({ es: `Buen margen (+${margen}W)`, en: `Good headroom (+${margen}W)`, pt: `Boa margem (+${margen}W)` });
    if (psu.wattage < consumo) {
      clase = 'power-bad';
      etiqueta = t({ es: `Insuficiente (faltan ${consumo - psu.wattage}W)`, en: `Insufficient (${consumo - psu.wattage}W short)`, pt: `Insuficiente (faltam ${consumo - psu.wattage}W)` });
    } else if (psu.wattage < recomendada) {
      clase = 'power-warn';
      etiqueta = t({ es: `Margen ajustado (+${margen}W, se recomienda ${recomendada}W)`, en: `Tight headroom (+${margen}W, ${recomendada}W recommended)`, pt: `Margem apertada (+${margen}W, recomenda-se ${recomendada}W)` });
    }
    const fuenteElegida = t({ es: 'Fuente elegida', en: 'Power supply chosen', pt: 'Fonte escolhida' });
    const margenLabel = t({ es: 'Margen', en: 'Headroom', pt: 'Margem' });
    html += `<div class="power-row"><span>${fuenteElegida}</span><span class="mono">${psu.wattage}W</span></div>`;
    html += `<div class="power-row ${clase}"><span>${margenLabel}</span><span class="mono">${etiqueta}</span></div>`;
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
  let texto = t({ es: 'Mi PC gamer (armado en ArmaPC)', en: 'My gaming PC (built with ArmaPC)', pt: 'Meu PC gamer (montado no ArmaPC)' }) + '\n\n';
  for (const cat of CATEGORIAS_ORDENADAS) {
    const p = BUILD[cat.id];
    if (p) {
      const nombreMostrado = CATEGORIAS_PILOTO_V2.includes(cat.id) ? nombreVisibleProducto(cat.id, p.id, p.name) : p.name;
      texto += `- ${cat.label}: ${nombreMostrado} (US$${p.price})\n`;
    }
  }
  const total = totalBuild();
  const totalLabel = t({ es: 'Total aproximado', en: 'Approximate total', pt: 'Total aproximado' });
  texto += `\n${totalLabel}: US$${total.toLocaleString('en-US')}`;
  if (MONEDA_ACTIVA !== 'USD') texto += ` (${convertir(total, MONEDA_ACTIVA, TASAS)})`;

  const btn = document.getElementById('export-btn');
  const original = btn.textContent;

  navigator.clipboard.writeText(texto).then(() => {
    btn.textContent = t({ es: '¡Copiado!', en: 'Copied!', pt: 'Copiado!' });
    setTimeout(() => { btn.textContent = original; }, 1800);
  }).catch(() => {
    // El navegador puede negar el permiso de portapapeles (ej. contexto no
    // seguro o restricción del usuario) — avisamos en vez de fallar en silencio.
    btn.textContent = t({ es: 'No se pudo copiar', en: 'Could not copy', pt: 'Não foi possível copiar' });
    setTimeout(() => { btn.textContent = original; }, 1800);
  });
}

// --- Arranque ---
async function iniciar() {
  try {
    CATALOGO = await (await fetch(rutaLocalizada('/data/components.json'))).json();
  } catch (e) {
    const errorMsg = t({ es: 'No se pudieron cargar los componentes.', en: 'Could not load the components.', pt: 'Não foi possível carregar os componentes.' });
    document.getElementById('config-categories').innerHTML = `<p class="loading">${errorMsg}</p>`;
    return;
  }

  // Ordenar las categorías UNA sola vez (antes se reordenaba en cada render).
  CATEGORIAS_ORDENADAS = [...CATALOGO.categories].sort((a, b) => a.order - b.order);

  // Piloto V2 (storage, ram; ver js/v2-adapter.js): se espera antes del
  // primer render para que el nombre real no cambie después de pintado; si
  // falla, cargarV2() resuelve con V2_CATALOGO/V2_CROSSWALK en null y el
  // nombre legacy se usa tal cual, sin bloquear el resto del configurador.
  await cargarV2();

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
    const etiquetaFecha = t({ es: 'Precios de referencia · actualizados en', en: 'Reference prices · updated', pt: 'Preços de referência · atualizados em' });
    badge.innerHTML = `<span class="mono">${etiquetaFecha} ${escapeHtml(fechaPreciosLegible(CATALOGO.updated))}</span>`;
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
