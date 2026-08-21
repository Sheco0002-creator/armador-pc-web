// ===== Idioma =====
// El idioma activo se lee del <html lang="..."> de cada página (es/en/pt).
// t() devuelve el string en el idioma activo desde un diccionario {es,en,pt},
// con fallback a español si falta la traducción. rutaLocalizada() convierte
// una ruta a un JSON en español (data/algo.json) a su equivalente localizado
// (data/algo.en.json) sin tocar el resto de la ruta.
function idiomaActual() {
  return document.documentElement.lang || 'es';
}
function t(dict) {
  return dict[idiomaActual()] || dict.es || '';
}
function rutaLocalizada(ruta) {
  const idi = idiomaActual();
  if (idi === 'es') return ruta;
  return ruta.replace(/\.json$/, `.${idi}.json`);
}

// ===== Escapar HTML =====
// Convierte texto a HTML seguro antes de insertarlo con innerHTML — evita que
// un nombre o texto con caracteres especiales (<, >, ", ', &) rompa el layout
// o inyecte HTML/atributos no deseados. Hoy todos los datos son propios
// (components.json, guides.json), pero esto protege de raíz cuando en el
// futuro se conecten datos externos (ej. Amazon).
function escapeHtml(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Abre y cierra el menú de navegación en pantallas chicas (celular)
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Cierra el menú al tocar un link (para que no se quede abierto al navegar)
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}
