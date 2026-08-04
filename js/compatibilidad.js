// ===== Motor de compatibilidad =====
// Contiene las reglas que deciden si dos piezas funcionan juntas.
// Cada función recibe la build actual (objeto con las piezas elegidas por
// categoría) y devuelve una lista de problemas encontrados. Un problema tiene
// { nivel: 'error'|'aviso', texto: '...' }.
//
// 'error' = no funciona / no encaja físicamente. 'aviso' = funciona pero no es
// lo ideal (ej: fuente algo justa). Esto es lo que hace educativo al sitio:
// no solo dice "no", explica el porqué.

// Consumo estimado del sistema: CPU + GPU + ~100W del resto (placa, discos,
// ventiladores, etc.). Es una estimación de referencia, no un cálculo exacto.
function consumoEstimado(build) {
  const cpu = build.cpu;
  const gpu = build.gpu;
  const base = 100;
  const cpuW = cpu ? cpu.tdp : 0;
  const gpuW = gpu ? gpu.powerDraw : 0;
  return base + cpuW + gpuW;
}

// Fuente recomendada: el consumo estimado con un margen de seguridad del 40%
// (las fuentes rinden mejor y duran más si no van al límite).
function fuenteRecomendada(build) {
  const gpu = build.gpu;
  const porConsumo = Math.ceil((consumoEstimado(build) * 1.4) / 50) * 50;
  const porGpu = gpu ? gpu.recommendedPsu : 0;
  return Math.max(porConsumo, porGpu);
}

// Revisa TODA la build y devuelve la lista de problemas.
function revisarCompatibilidad(build) {
  const problemas = [];
  const { cpu, motherboard, ram, gpu, psu, case: gab, cooling } = build;

  // 1. Socket CPU ↔ placa madre
  if (cpu && motherboard && cpu.socket !== motherboard.socket) {
    problemas.push({
      nivel: 'error',
      texto: `El procesador usa socket ${cpu.socket} pero la placa madre es ${motherboard.socket}. No encajan.`,
    });
  }

  // 2. Tipo de RAM ↔ placa madre
  if (ram && motherboard && ram.ramType !== motherboard.ramType) {
    problemas.push({
      nivel: 'error',
      texto: `La RAM es ${ram.ramType} pero la placa madre usa ${motherboard.ramType}.`,
    });
  }

  // 3. Factor de forma de la placa ↔ gabinete
  if (motherboard && gab && !gab.supports.includes(motherboard.formFactor)) {
    problemas.push({
      nivel: 'error',
      texto: `La placa ${motherboard.formFactor} no entra en el gabinete ${gab.name} (soporta ${gab.supports.join(', ')}).`,
    });
  }

  // 4. Largo de la GPU ↔ espacio del gabinete
  if (gpu && gab && gpu.length > gab.maxGpuLength) {
    problemas.push({
      nivel: 'error',
      texto: `La tarjeta gráfica mide ${gpu.length}mm y el gabinete admite hasta ${gab.maxGpuLength}mm. No cabe.`,
    });
  }

  // 5. Socket soportado por la refrigeración ↔ CPU
  if (cooling && cpu && !cooling.socketSupport.includes(cpu.socket)) {
    problemas.push({
      nivel: 'error',
      texto: `La refrigeración no es compatible con el socket ${cpu.socket} del procesador.`,
    });
  }

  // 6. Capacidad térmica de la refrigeración ↔ calor del CPU
  if (cooling && cpu && cooling.tdpCapacity < cpu.tdp) {
    problemas.push({
      nivel: 'aviso',
      texto: `La refrigeración está pensada para hasta ${cooling.tdpCapacity}W y el procesador genera ${cpu.tdp}W. Puede quedar corta bajo carga.`,
    });
  }

  // 7. Altura del disipador de aire ↔ gabinete
  if (cooling && cooling.type === 'aire' && gab && cooling.height > gab.maxCoolerHeight) {
    problemas.push({
      nivel: 'error',
      texto: `El disipador mide ${cooling.height}mm de alto y el gabinete admite hasta ${gab.maxCoolerHeight}mm.`,
    });
  }

  // 8. Potencia de la fuente ↔ consumo del sistema
  if (psu && (cpu || gpu)) {
    const recomendada = fuenteRecomendada(build);
    const consumo = consumoEstimado(build);
    if (psu.wattage < consumo) {
      problemas.push({
        nivel: 'error',
        texto: `La fuente de ${psu.wattage}W no alcanza: el sistema consume alrededor de ${consumo}W.`,
      });
    } else if (psu.wattage < recomendada) {
      problemas.push({
        nivel: 'aviso',
        texto: `La fuente de ${psu.wattage}W funciona, pero para este equipo se recomienda al menos ${recomendada}W para tener margen.`,
      });
    }
  }

  return problemas;
}

// Comprueba si una pieza candidata sería compatible con lo ya elegido.
// Sirve para marcar/deshabilitar opciones incompatibles ANTES de elegirlas.
// Devuelve { ok: true } o { ok: false, razon: '...' } (solo mira ERRORES,
// no avisos — un aviso no impide elegir).
function piezaCompatible(build, categoria, pieza) {
  // Simulamos la build con esta pieza puesta y vemos si aparece un error nuevo
  // que involucre a esta categoría.
  const simulada = { ...build };
  simulada[categoria] = pieza;

  const problemasAntes = revisarCompatibilidad(build).filter((p) => p.nivel === 'error').length;
  const problemasDespues = revisarCompatibilidad(simulada).filter((p) => p.nivel === 'error');

  if (problemasDespues.length > problemasAntes) {
    // Devolvemos el primer error como razón.
    return { ok: false, razon: problemasDespues[problemasDespues.length - 1].texto };
  }
  return { ok: true };
}
