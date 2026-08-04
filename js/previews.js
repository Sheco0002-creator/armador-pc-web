// ===== Vista previa flotante de componentes =====
// Al pasar el mouse por el nombre de un componente, aparece una tarjeta
// flotante que sigue al cursor con una ilustración de esa pieza.
// Las ilustraciones son vectoriales propias (sin problemas de derechos).
// Más adelante, la integración con Amazon reemplazará/complementará esto
// con fotos reales de producto + precio + enlace de compra.

const ARTE_COMPONENTES = {
  cpu: {
    label: 'Procesador (CPU)',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="26" y="26" width="48" height="48" rx="4" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="38" y="38" width="24" height="24" rx="2" stroke="#D4A24C" stroke-width="2"/>
      <circle cx="33" cy="33" r="2" fill="#D4A24C"/>
      <g stroke="#5FAE8C" stroke-width="2">
        <line x1="34" y1="20" x2="34" y2="26"/><line x1="42" y1="20" x2="42" y2="26"/><line x1="50" y1="20" x2="50" y2="26"/><line x1="58" y1="20" x2="58" y2="26"/><line x1="66" y1="20" x2="66" y2="26"/>
        <line x1="34" y1="74" x2="34" y2="80"/><line x1="42" y1="74" x2="42" y2="80"/><line x1="50" y1="74" x2="50" y2="80"/><line x1="58" y1="74" x2="58" y2="80"/><line x1="66" y1="74" x2="66" y2="80"/>
        <line x1="20" y1="34" x2="26" y2="34"/><line x1="20" y1="42" x2="26" y2="42"/><line x1="20" y1="50" x2="26" y2="50"/><line x1="20" y1="58" x2="26" y2="58"/><line x1="20" y1="66" x2="26" y2="66"/>
        <line x1="74" y1="34" x2="80" y2="34"/><line x1="74" y1="42" x2="80" y2="42"/><line x1="74" y1="50" x2="80" y2="50"/><line x1="74" y1="58" x2="80" y2="58"/><line x1="74" y1="66" x2="80" y2="66"/>
      </g>
    </svg>`,
  },
  gpu: {
    label: 'Tarjeta gráfica (GPU)',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="32" width="72" height="40" rx="4" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="11" y="30" width="4" height="46" rx="1" fill="#D4A24C"/>
      <circle cx="37" cy="52" r="11" stroke="#5FAE8C" stroke-width="2"/>
      <circle cx="63" cy="52" r="11" stroke="#5FAE8C" stroke-width="2"/>
      <circle cx="37" cy="52" r="2" fill="#D4A24C"/>
      <circle cx="63" cy="52" r="2" fill="#D4A24C"/>
      <g stroke="#5FAE8C" stroke-width="1.5">
        <line x1="37" y1="43" x2="37" y2="61"/><line x1="28" y1="52" x2="46" y2="52"/>
        <line x1="63" y1="43" x2="63" y2="61"/><line x1="54" y1="52" x2="72" y2="52"/>
      </g>
      <line x1="30" y1="72" x2="30" y2="78" stroke="#5FAE8C" stroke-width="2"/>
      <line x1="45" y1="72" x2="45" y2="78" stroke="#5FAE8C" stroke-width="2"/>
    </svg>`,
  },
  ram: {
    label: 'Memoria RAM',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="34" width="68" height="24" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <g stroke="#D4A24C" stroke-width="2">
        <line x1="24" y1="42" x2="24" y2="50"/><line x1="34" y1="42" x2="34" y2="50"/><line x1="44" y1="42" x2="44" y2="50"/><line x1="56" y1="42" x2="56" y2="50"/><line x1="66" y1="42" x2="66" y2="50"/><line x1="76" y1="42" x2="76" y2="50"/>
      </g>
      <g stroke="#5FAE8C" stroke-width="2">
        <line x1="20" y1="62" x2="20" y2="66"/><line x1="26" y1="62" x2="26" y2="66"/><line x1="32" y1="62" x2="32" y2="66"/><line x1="38" y1="62" x2="38" y2="66"/><line x1="56" y1="62" x2="56" y2="66"/><line x1="62" y1="62" x2="62" y2="66"/><line x1="68" y1="62" x2="68" y2="66"/><line x1="74" y1="62" x2="74" y2="66"/><line x1="80" y1="62" x2="80" y2="66"/>
      </g>
      <rect x="46" y="58" width="8" height="4" fill="#0D1512" stroke="#5FAE8C" stroke-width="1.5"/>
    </svg>`,
  },
  motherboard: {
    label: 'Placa madre',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="16" width="64" height="68" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="28" y="26" width="20" height="20" rx="2" stroke="#D4A24C" stroke-width="2"/>
      <g stroke="#5FAE8C" stroke-width="2">
        <line x1="58" y1="24" x2="58" y2="46"/><line x1="64" y1="24" x2="64" y2="46"/><line x1="70" y1="24" x2="70" y2="46"/>
      </g>
      <rect x="26" y="66" width="44" height="6" rx="1" stroke="#5FAE8C" stroke-width="2"/>
      <circle cx="30" cy="54" r="2.5" stroke="#5FAE8C" stroke-width="1.5"/>
      <circle cx="40" cy="54" r="2.5" stroke="#5FAE8C" stroke-width="1.5"/>
      <rect x="62" y="52" width="10" height="8" rx="1" stroke="#D4A24C" stroke-width="1.5"/>
    </svg>`,
  },
  storage: {
    label: 'Almacenamiento (SSD)',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="42" width="64" height="16" rx="2" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="30" y="46" width="34" height="8" rx="1" stroke="#D4A24C" stroke-width="2"/>
      <g stroke="#D4A24C" stroke-width="2">
        <line x1="20" y1="46" x2="20" y2="54"/><line x1="24" y1="46" x2="24" y2="54"/>
      </g>
      <circle cx="76" cy="50" r="2" stroke="#5FAE8C" stroke-width="1.5"/>
    </svg>`,
  },
  psu: {
    label: 'Fuente de poder (PSU)',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="26" width="60" height="48" rx="4" stroke="#5FAE8C" stroke-width="2.5"/>
      <circle cx="48" cy="50" r="16" stroke="#5FAE8C" stroke-width="2"/>
      <circle cx="48" cy="50" r="2.5" fill="#D4A24C"/>
      <g stroke="#5FAE8C" stroke-width="1.5">
        <line x1="48" y1="34" x2="48" y2="66"/><line x1="32" y1="50" x2="64" y2="50"/>
        <line x1="37" y1="39" x2="59" y2="61"/><line x1="59" y1="39" x2="37" y2="61"/>
      </g>
      <rect x="68" y="32" width="8" height="6" rx="1" stroke="#D4A24C" stroke-width="1.5"/>
    </svg>`,
  },
  case: {
    label: 'Gabinete',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="12" width="40" height="76" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="37" y="22" width="26" height="40" rx="2" stroke="#5FAE8C" stroke-width="1.5" opacity="0.6"/>
      <circle cx="43" cy="72" r="2.5" fill="#D4A24C"/>
      <line x1="50" y1="70" x2="62" y2="70" stroke="#5FAE8C" stroke-width="1.5"/>
      <line x1="50" y1="76" x2="62" y2="76" stroke="#5FAE8C" stroke-width="1.5"/>
    </svg>`,
  },
  cooling: {
    label: 'Refrigeración',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="34" y="68" width="32" height="12" rx="2" stroke="#5FAE8C" stroke-width="2.5"/>
      <g stroke="#5FAE8C" stroke-width="2">
        <line x1="38" y1="30" x2="38" y2="68"/><line x1="44" y1="30" x2="44" y2="68"/><line x1="50" y1="30" x2="50" y2="68"/><line x1="56" y1="30" x2="56" y2="68"/><line x1="62" y1="30" x2="62" y2="68"/>
      </g>
      <circle cx="50" cy="45" r="15" stroke="#D4A24C" stroke-width="2" fill="#0D1512"/>
      <circle cx="50" cy="45" r="2.5" fill="#D4A24C"/>
      <g stroke="#D4A24C" stroke-width="1.5">
        <line x1="50" y1="32" x2="50" y2="58"/><line x1="37" y1="45" x2="63" y2="45"/>
      </g>
    </svg>`,
  },
  socket: {
    label: 'Socket',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="46" width="52" height="36" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <g fill="#D4A24C">
        <circle cx="34" cy="56" r="1.6"/><circle cx="42" cy="56" r="1.6"/><circle cx="50" cy="56" r="1.6"/><circle cx="58" cy="56" r="1.6"/><circle cx="66" cy="56" r="1.6"/>
        <circle cx="34" cy="64" r="1.6"/><circle cx="42" cy="64" r="1.6"/><circle cx="50" cy="64" r="1.6"/><circle cx="58" cy="64" r="1.6"/><circle cx="66" cy="64" r="1.6"/>
        <circle cx="34" cy="72" r="1.6"/><circle cx="42" cy="72" r="1.6"/><circle cx="50" cy="72" r="1.6"/><circle cx="58" cy="72" r="1.6"/><circle cx="66" cy="72" r="1.6"/>
      </g>
      <rect x="36" y="14" width="28" height="20" rx="2" stroke="#5FAE8C" stroke-width="2"/>
      <path d="M50 36 L50 44 M46 40 L50 44 L54 40" stroke="#D4A24C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  tdp: {
    label: 'TDP (calor)',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="32" y="54" width="36" height="28" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="42" y="62" width="16" height="12" rx="1" stroke="#5FAE8C" stroke-width="1.5"/>
      <g stroke="#D4A24C" stroke-width="2.5" stroke-linecap="round" fill="none">
        <path d="M40 50 q-5 -6 0 -12 q5 -6 0 -12"/>
        <path d="M50 50 q-5 -6 0 -12 q5 -6 0 -12"/>
        <path d="M60 50 q-5 -6 0 -12 q5 -6 0 -12"/>
      </g>
    </svg>`,
  },
  'factor-forma': {
    label: 'Factor de forma',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="22" width="52" height="56" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="20" y="22" width="36" height="42" rx="3" stroke="#5FAE8C" stroke-width="2" opacity="0.75"/>
      <rect x="20" y="22" width="22" height="26" rx="3" stroke="#D4A24C" stroke-width="2"/>
    </svg>`,
  },
  resolucion: {
    label: 'Resolución',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="26" width="56" height="42" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="30" y="34" width="40" height="26" rx="2" stroke="#5FAE8C" stroke-width="1.5" opacity="0.6"/>
      <rect x="38" y="40" width="24" height="14" rx="1" stroke="#D4A24C" stroke-width="2"/>
      <line x1="42" y1="68" x2="58" y2="68" stroke="#5FAE8C" stroke-width="2"/>
      <line x1="50" y1="68" x2="50" y2="74" stroke="#5FAE8C" stroke-width="2"/>
      <line x1="40" y1="74" x2="60" y2="74" stroke="#5FAE8C" stroke-width="2"/>
    </svg>`,
  },
  fps: {
    label: 'FPS (cuadros por segundo)',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="36" width="52" height="28" rx="2" stroke="#5FAE8C" stroke-width="2.5"/>
      <g fill="#D4A24C">
        <rect x="22" y="38" width="3" height="3"/><rect x="30" y="38" width="3" height="3"/><rect x="38" y="38" width="3" height="3"/><rect x="46" y="38" width="3" height="3"/><rect x="54" y="38" width="3" height="3"/><rect x="62" y="38" width="3" height="3"/>
        <rect x="22" y="59" width="3" height="3"/><rect x="30" y="59" width="3" height="3"/><rect x="38" y="59" width="3" height="3"/><rect x="46" y="59" width="3" height="3"/><rect x="54" y="59" width="3" height="3"/><rect x="62" y="59" width="3" height="3"/>
      </g>
      <g stroke="#5FAE8C" stroke-width="1.5">
        <line x1="35" y1="44" x2="35" y2="56"/><line x1="53" y1="44" x2="53" y2="56"/>
      </g>
      <g stroke="#D4A24C" stroke-width="2.5" stroke-linecap="round">
        <path d="M74 44 L80 50 L74 56"/><path d="M82 44 L88 50 L82 56"/>
      </g>
    </svg>`,
  },
  'cuello-botella': {
    label: 'Cuello de botella',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 28 L46 44 L46 56 L14 72 Z" stroke="#5FAE8C" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="46" y="44" width="16" height="12" stroke="#5FAE8C" stroke-width="2.5"/>
      <path d="M62 44 L86 32 L86 68 L62 56 Z" stroke="#5FAE8C" stroke-width="2.5" stroke-linejoin="round" opacity="0.7"/>
      <g fill="#D4A24C">
        <circle cx="30" cy="46" r="2.2"/><circle cx="34" cy="54" r="2.2"/><circle cx="40" cy="50" r="2.2"/>
      </g>
    </svg>`,
  },
  'socket-match': {
    label: 'Socket: CPU va con placa',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="38" width="26" height="26" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="21" y="45" width="12" height="12" rx="1" stroke="#D4A24C" stroke-width="1.5"/>
      <rect x="60" y="38" width="26" height="26" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <g fill="#D4A24C"><circle cx="67" cy="45" r="1.3"/><circle cx="73" cy="45" r="1.3"/><circle cx="79" cy="45" r="1.3"/><circle cx="67" cy="51" r="1.3"/><circle cx="73" cy="51" r="1.3"/><circle cx="79" cy="51" r="1.3"/><circle cx="67" cy="57" r="1.3"/><circle cx="73" cy="57" r="1.3"/><circle cx="79" cy="57" r="1.3"/></g>
      <path d="M44 51 L56 51 M52 47 L56 51 L52 55 M48 47 L44 51 L48 55" stroke="#5FAE8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M44 26 l4 5 l7 -9" stroke="#5FAE8C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  'ram-slot': {
    label: 'RAM va en su ranura',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="26" y="18" width="48" height="16" rx="2" stroke="#5FAE8C" stroke-width="2.5"/>
      <g stroke="#D4A24C" stroke-width="2"><line x1="34" y1="34" x2="34" y2="40"/><line x1="44" y1="34" x2="44" y2="40"/><line x1="56" y1="34" x2="56" y2="40"/><line x1="66" y1="34" x2="66" y2="40"/></g>
      <path d="M50 44 L50 52 M46 48 L50 52 L54 48" stroke="#5FAE8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="24" y="60" width="52" height="22" rx="2" stroke="#5FAE8C" stroke-width="2.5"/>
      <line x1="30" y1="60" x2="30" y2="82" stroke="#5FAE8C" stroke-width="1.5"/>
      <line x1="70" y1="60" x2="70" y2="82" stroke="#5FAE8C" stroke-width="1.5"/>
    </svg>`,
  },
  'board-fit': {
    label: 'Placa cabe en gabinete',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="16" width="60" height="68" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="30" y="30" width="40" height="40" rx="2" stroke="#D4A24C" stroke-width="2"/>
      <rect x="37" y="37" width="14" height="14" rx="1" stroke="#D4A24C" stroke-width="1.5" opacity="0.7"/>
      <path d="M60 64 l4 5 l9 -11" stroke="#5FAE8C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  'gpu-fit': {
    label: 'GPU cabe en gabinete',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="22" width="64" height="56" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="24" y="42" width="44" height="16" rx="2" stroke="#D4A24C" stroke-width="2"/>
      <circle cx="34" cy="50" r="5" stroke="#D4A24C" stroke-width="1.5"/>
      <circle cx="52" cy="50" r="5" stroke="#D4A24C" stroke-width="1.5"/>
      <g stroke="#5FAE8C" stroke-width="1.5"><line x1="24" y1="66" x2="68" y2="66"/><line x1="24" y1="64" x2="24" y2="68"/><line x1="68" y1="64" x2="68" y2="68"/></g>
    </svg>`,
  },
  'power-fit': {
    label: 'Fuente alimenta todo',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="36" width="34" height="28" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <circle cx="33" cy="50" r="9" stroke="#5FAE8C" stroke-width="1.5"/>
      <path d="M56 40 L50 52 L55 52 L52 62 L62 48 L57 48 Z" fill="#D4A24C"/>
      <rect x="66" y="34" width="18" height="14" rx="2" stroke="#5FAE8C" stroke-width="2"/>
      <rect x="66" y="54" width="18" height="14" rx="2" stroke="#5FAE8C" stroke-width="2"/>
    </svg>`,
  },
  'cooler-fit': {
    label: 'Cooler sobre el CPU',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#5FAE8C" stroke-width="2"><line x1="38" y1="20" x2="38" y2="46"/><line x1="44" y1="20" x2="44" y2="46"/><line x1="50" y1="20" x2="50" y2="46"/><line x1="56" y1="20" x2="56" y2="46"/><line x1="62" y1="20" x2="62" y2="46"/></g>
      <circle cx="50" cy="33" r="11" stroke="#D4A24C" stroke-width="2" fill="#0D1512"/>
      <circle cx="50" cy="33" r="2" fill="#D4A24C"/>
      <rect x="34" y="52" width="32" height="10" rx="2" stroke="#5FAE8C" stroke-width="2"/>
      <rect x="30" y="66" width="40" height="18" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="42" y="72" width="16" height="8" rx="1" stroke="#D4A24C" stroke-width="1.5"/>
    </svg>`,
  },
  vram: {
    label: 'VRAM (memoria de la GPU)',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="30" width="56" height="40" rx="3" stroke="#5FAE8C" stroke-width="2.5"/>
      <rect x="40" y="42" width="20" height="16" rx="2" stroke="#5FAE8C" stroke-width="2"/>
      <text x="50" y="54" text-anchor="middle" font-family="monospace" font-size="8" fill="#5FAE8C">GPU</text>
      <g stroke="#D4A24C" stroke-width="1.8">
        <rect x="28" y="36" width="8" height="7" rx="1"/><rect x="28" y="47" width="8" height="7" rx="1"/><rect x="28" y="58" width="8" height="7" rx="1"/>
        <rect x="64" y="36" width="8" height="7" rx="1"/><rect x="64" y="47" width="8" height="7" rx="1"/><rect x="64" y="58" width="8" height="7" rx="1"/>
      </g>
    </svg>`,
  },
};

// Crear el elemento flotante una sola vez.
const preview = document.createElement('div');
preview.className = 'hover-preview';
preview.setAttribute('hidden', '');
preview.innerHTML = '<div class="hp-art"></div><div class="hp-label mono"></div>';
document.body.appendChild(preview);
const hpArt = preview.querySelector('.hp-art');
const hpLabel = preview.querySelector('.hp-label');

let previewVisible = false;

function mostrarPreview(clave, etiquetaOverride) {
  const arte = ARTE_COMPONENTES[clave];
  if (!arte) return;
  hpArt.innerHTML = arte.svg;
  hpLabel.textContent = etiquetaOverride || arte.label;
  preview.removeAttribute('hidden');
  // pequeño retraso para activar la transición de aparición
  requestAnimationFrame(() => preview.classList.add('visible'));
  previewVisible = true;
}

function ocultarPreview() {
  preview.classList.remove('visible');
  previewVisible = false;
  setTimeout(() => { if (!previewVisible) preview.setAttribute('hidden', ''); }, 200);
}

function moverPreview(x, y) {
  const offset = 24;
  const ancho = preview.offsetWidth || 200;
  const alto = preview.offsetHeight || 220;
  // Mantener la tarjeta dentro de la pantalla.
  let px = x + offset;
  let py = y + offset;
  if (px + ancho > window.innerWidth - 12) px = x - ancho - offset;
  if (py + alto > window.innerHeight - 12) py = window.innerHeight - alto - 12;
  if (py < 12) py = 12;
  preview.style.left = px + 'px';
  preview.style.top = py + 'px';
}

// Conectar los disparadores por DELEGACIÓN: escuchamos a nivel de documento,
// así funciona con elementos que ya existen Y con los que se crean después
// dinámicamente (páginas de nivel y configurador), sin volver a conectar nada.
let disparadorActual = null;

document.addEventListener('mouseover', (e) => {
  const el = e.target.closest('[data-preview]');
  if (!el || el === disparadorActual) return;
  disparadorActual = el;
  const clave = el.getAttribute('data-preview');
  const etiqueta = el.getAttribute('data-preview-label') || '';
  mostrarPreview(clave, etiqueta);
  moverPreview(e.clientX, e.clientY);
});

document.addEventListener('mousemove', (e) => {
  if (previewVisible) moverPreview(e.clientX, e.clientY);
});

document.addEventListener('mouseout', (e) => {
  const el = e.target.closest('[data-preview]');
  if (!el) return;
  // Si el mouse se movió a un hijo del mismo disparador, no ocultar.
  const hacia = e.relatedTarget ? e.relatedTarget.closest('[data-preview]') : null;
  if (hacia === el) return;
  disparadorActual = null;
  ocultarPreview();
});

// Soporte táctil: al tocar, muestra la tarjeta centrada un momento.
document.addEventListener('click', (e) => {
  if (!window.matchMedia('(hover: none)').matches) return;
  const el = e.target.closest('[data-preview]');
  if (!el) return;
  const clave = el.getAttribute('data-preview');
  const etiqueta = el.getAttribute('data-preview-label') || '';
  mostrarPreview(clave, etiqueta);
  preview.style.left = '50%';
  preview.style.top = '50%';
  preview.style.transform = 'translate(-50%, -50%)';
  setTimeout(() => { ocultarPreview(); preview.style.transform = ''; }, 2000);
});
