// ===== Índice de guías =====
// Lee data/guides.json y dibuja la lista de guías disponibles.

async function cargarGuias() {
  const cont = document.getElementById('guides-list');
  let datos;
  try {
    datos = await (await fetch(rutaLocalizada('/data/guides.json'))).json();
  } catch (e) {
    cont.innerHTML = `<p class="loading">${escapeHtml(t({ es: 'No se pudieron cargar las guías.', en: 'Could not load the guides.', pt: 'Não foi possível carregar os guias.' }))}</p>`;
    return;
  }

  const minLectura = t({ es: 'min de lectura', en: 'min read', pt: 'min de leitura' });
  cont.innerHTML = datos.guides.map((g) => `
    <a href="${escapeHtml(g.file)}" class="guide-list-card">
      <span class="guide-tag mono">${escapeHtml(g.tag)}</span>
      <h2>${escapeHtml(g.title)}</h2>
      <p>${escapeHtml(g.summary)}</p>
      <span class="guide-meta mono">${escapeHtml(g.readMinutes)} ${minLectura}</span>
    </a>
  `).join('');
}

cargarGuias();
