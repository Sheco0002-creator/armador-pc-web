// ===== Módulo de conversión de moneda =====
// Obtiene tasas de cambio en vivo (base USD) desde una API pública gratuita
// que no requiere clave ni registro. Guarda el resultado en el navegador por
// unas horas (caché) para no llamar a la API en cada carga, y tiene tasas de
// respaldo por si la API no responde — así el conversor NUNCA se rompe.

function nombresMonedas() {
  return t({
    es: {
      USD: 'Dólar estadounidense', PEN: 'Sol peruano', MXN: 'Peso mexicano',
      COP: 'Peso colombiano', ARS: 'Peso argentino', CLP: 'Peso chileno',
      BRL: 'Real brasileño', UYU: 'Peso uruguayo', BOB: 'Boliviano',
      PYG: 'Guaraní paraguayo', EUR: 'Euro',
    },
    en: {
      USD: 'US Dollar', PEN: 'Peruvian Sol', MXN: 'Mexican Peso',
      COP: 'Colombian Peso', ARS: 'Argentine Peso', CLP: 'Chilean Peso',
      BRL: 'Brazilian Real', UYU: 'Uruguayan Peso', BOB: 'Bolivian Boliviano',
      PYG: 'Paraguayan Guaraní', EUR: 'Euro',
    },
    pt: {
      USD: 'Dólar americano', PEN: 'Sol peruano', MXN: 'Peso mexicano',
      COP: 'Peso colombiano', ARS: 'Peso argentino', CLP: 'Peso chileno',
      BRL: 'Real brasileiro', UYU: 'Peso uruguaio', BOB: 'Boliviano',
      PYG: 'Guarani paraguaio', EUR: 'Euro',
    },
  });
}

const MonedaConfig = {
  // Monedas que se ofrecen en el selector. code = ISO, symbol = lo que se ve.
  // El orden aquí es el orden en que aparecen en el menú. name se resuelve
  // según el idioma activo vía nombresMonedas().
  get monedas() {
    const nombres = nombresMonedas();
    return [
      { code: 'USD', name: nombres.USD, symbol: 'US$' },
      { code: 'PEN', name: nombres.PEN, symbol: 'S/' },
      { code: 'MXN', name: nombres.MXN, symbol: 'MX$' },
      { code: 'COP', name: nombres.COP, symbol: 'COL$' },
      { code: 'ARS', name: nombres.ARS, symbol: 'AR$' },
      { code: 'CLP', name: nombres.CLP, symbol: 'CLP$' },
      { code: 'BRL', name: nombres.BRL, symbol: 'R$' },
      { code: 'UYU', name: nombres.UYU, symbol: '$U' },
      { code: 'BOB', name: nombres.BOB, symbol: 'Bs' },
      { code: 'PYG', name: nombres.PYG, symbol: '₲' },
      { code: 'EUR', name: nombres.EUR, symbol: '€' },
    ];
  },

  // Tasas de respaldo (aprox. mediados de 2026, 1 USD = X). Solo se usan si la
  // API no responde. No necesitan ser exactas: es una red de seguridad.
  respaldo: {
    USD: 1, PEN: 3.75, MXN: 18.5, COP: 4100, ARS: 1250, CLP: 950,
    BRL: 5.4, UYU: 40, BOB: 6.9, PYG: 7300, EUR: 0.92,
  },

  CACHE_KEY: 'armapc_tasas',
  CACHE_HORAS: 6, // cada cuánto se vuelve a pedir a la API
};

// Devuelve las tasas (base USD). Primero mira la caché; si está vieja o no
// existe, llama a la API; si la API falla, usa el respaldo.
async function obtenerTasas() {
  // 1. ¿Hay algo guardado y todavía fresco?
  try {
    const guardado = JSON.parse(localStorage.getItem(MonedaConfig.CACHE_KEY));
    if (guardado && guardado.tasas) {
      const horas = (Date.now() - guardado.momento) / 36e5;
      if (horas < MonedaConfig.CACHE_HORAS) {
        return { tasas: guardado.tasas, fuente: 'cache' };
      }
    }
  } catch (e) { /* caché corrupta: se ignora y se sigue */ }

  // 2. Pedir a la API en vivo (sin clave, base USD).
  const endpoints = [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
    'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json',
  ];

  for (const url of endpoints) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();
      const crudas = data.usd; // { pen: 3.7, mxn: 18.4, ... } en minúsculas

      // Quedarnos solo con las monedas que ofrecemos, en MAYÚSCULAS.
      const tasas = {};
      for (const m of MonedaConfig.monedas) {
        const val = crudas[m.code.toLowerCase()];
        if (val) tasas[m.code] = val;
      }
      tasas.USD = 1;

      // Guardar en caché para las próximas cargas.
      localStorage.setItem(MonedaConfig.CACHE_KEY, JSON.stringify({
        tasas, momento: Date.now(),
      }));

      return { tasas, fuente: 'api' };
    } catch (e) { /* probar el siguiente endpoint */ }
  }

  // 3. Todo falló: usar el respaldo local.
  return { tasas: MonedaConfig.respaldo, fuente: 'respaldo' };
}

// Convierte un monto en USD a la moneda destino y lo formatea lindo.
function convertir(montoUSD, codigoDestino, tasas) {
  const tasa = tasas[codigoDestino] || 1;
  const convertido = montoUSD * tasa;
  const info = MonedaConfig.monedas.find((m) => m.code === codigoDestino);
  const simbolo = info ? info.symbol : codigoDestino + ' ';

  // Monedas sin decimales (los centavos no aportan en pesos/guaraníes grandes).
  const sinDecimales = ['COP', 'ARS', 'CLP', 'PYG'];
  const decimales = sinDecimales.includes(codigoDestino) ? 0 : (codigoDestino === 'USD' ? 0 : 2);

  const numero = convertido.toLocaleString('en-US', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
  return `${simbolo}${numero}`;
}

// ===== Selector de moneda (HTML compartido) =====
// Antes esta función vivía duplicada, casi idéntica, en configurador.js y en
// nivel.js. Al estar en un solo lugar, un cambio futuro al selector se hace
// una sola vez y no puede desalinearse entre páginas.
function selectorMonedaHTML(monedaActiva) {
  const opciones = MonedaConfig.monedas.map((m) =>
    `<option value="${m.code}"${m.code === monedaActiva ? ' selected' : ''}>${m.code} — ${m.name}</option>`
  ).join('');
  const etiqueta = t({ es: 'Moneda', en: 'Currency', pt: 'Moeda' });
  return `<label class="moneda-selector"><span class="mono">${etiqueta}</span>
    <select id="moneda-select">${opciones}</select></label>`;
}
function guardarMonedaElegida(codigo) {
  localStorage.setItem('armapc_moneda', codigo);
}
function monedaElegida() {
  return localStorage.getItem('armapc_moneda') || 'USD';
}

// ===== Ayudante: formatear la fecha de actualización de precios =====
// Convierte "2026-07" en "julio de 2026" para mostrarla al usuario.
function fechaPreciosLegible(cadena) {
  if (!cadena) return '';
  const meses = t({
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
    pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  });
  const [anio, mes] = cadena.split('-');
  const nombreMes = meses[parseInt(mes, 10) - 1];
  if (!nombreMes) return cadena;
  return idiomaActual() === 'en' ? `${nombreMes} ${anio}` : `${nombreMes} de ${anio}`;
}
