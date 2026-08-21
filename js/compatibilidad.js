// ===== Motor de compatibilidad =====
// Contiene las reglas que deciden si dos piezas funcionan juntas.
// Cada función recibe la build actual (objeto con las piezas elegidas por
// categoría) y devuelve una lista de problemas encontrados. Un problema tiene
// { nivel: 'incompatible' | 'aviso' | 'no_verificado', texto: '...' }.
//
// Tres estados posibles para cada verificación:
//   'incompatible'  = no funciona / no encaja físicamente (dato real que lo confirma).
//   'aviso'         = funciona pero no es lo ideal (ej: fuente algo justa).
//   'no_verificado' = no tenemos el dato necesario para confirmar ni descartar.
//                     NUNCA se trata como incompatible ni bloquea la selección —
//                     solo informa con honestidad que no lo pudimos comprobar.
//
// La ausencia de un problema para una pareja de piezas significa COMPATIBLE.
//
// Regla de diseño: si el dato no existe en components.json, este motor jamás
// lo inventa. O hay dato real para comparar (-> incompatible/aviso/compatible),
// o no lo hay (-> no_verificado). Nunca a mitad de camino.
//
// Los textos se resuelven vía t({es,en,pt}) (definido en main.js) para que el
// motor de reglas hable en el idioma activo de la página sin duplicar lógica.

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

// Revisa TODA la build y devuelve la lista de problemas (incompatibilidades,
// avisos y verificaciones que no se pudieron hacer por falta de datos).
function revisarCompatibilidad(build) {
  const problemas = [];
  const { cpu, motherboard: mb, ram, gpu, psu, case: gab, cooling, storage } = build;

  // ===== CPU ↔ Placa madre =====

  // Socket + chipset + "compatibilidad conocida": en este catálogo el socket
  // determina la familia de chipset (AM5 -> B650/X870/X870E, LGA1851 -> Z890),
  // así que revisar el socket cubre las tres cosas a la vez con dato real.
  if (cpu && mb && cpu.socket !== mb.socket) {
    problemas.push({
      nivel: 'incompatible',
      texto: t({
        es: `Incompatible: el procesador usa socket ${cpu.socket} y la placa madre (chipset ${mb.chipset}, socket ${mb.socket}) no lo acepta.`,
        en: `Incompatible: the processor uses socket ${cpu.socket} and the motherboard (chipset ${mb.chipset}, socket ${mb.socket}) doesn't support it.`,
        pt: `Incompatível: o processador usa o soquete ${cpu.socket} e a placa-mãe (chipset ${mb.chipset}, soquete ${mb.socket}) não o aceita.`,
      }),
    });
  }

  // TDP "cuando sea relevante": no tenemos el dato de cuánta potencia soporta
  // el VRM de cada placa, así que para procesadores de consumo alto lo decimos
  // en vez de asumir que sí (o que no) aguanta.
  if (cpu && mb && cpu.socket === mb.socket && cpu.tdp >= 120) {
    problemas.push({
      nivel: 'no_verificado',
      texto: t({
        es: `No verificado: el procesador consume ${cpu.tdp}W y no tenemos datos de la capacidad de entrega de energía (VRM) de esta placa madre para confirmar que lo soporta sin límites.`,
        en: `Not verified: the processor draws ${cpu.tdp}W and we don't have data on this motherboard's power delivery (VRM) capacity to confirm it can handle it without limits.`,
        pt: `Não verificado: o processador consome ${cpu.tdp}W e não temos dados sobre a capacidade de entrega de energia (VRM) desta placa-mãe para confirmar que ela suporta sem limites.`,
      }),
    });
  }

  // Nota: la compatibilidad de BIOS no se revisa porque no existe ningún dato
  // de versiones de BIOS en el catálogo — no se muestra un aviso genérico
  // repetido en cada par CPU+placa porque no aportaría información específica.

  // ===== RAM ↔ Placa madre =====

  if (ram && mb && ram.ramType !== mb.ramType) {
    problemas.push({
      nivel: 'incompatible',
      texto: t({
        es: `Incompatible: esta placa madre utiliza ${mb.ramType} y la memoria seleccionada es ${ram.ramType}.`,
        en: `Incompatible: this motherboard uses ${mb.ramType} and the selected RAM is ${ram.ramType}.`,
        pt: `Incompatível: esta placa-mãe usa ${mb.ramType} e a memória selecionada é ${ram.ramType}.`,
      }),
    });
  }

  // Capacidad máxima, frecuencia soportada y cantidad de slots: ninguna placa
  // madre del catálogo tiene estos datos todavía, así que no podemos
  // confirmarlo — lo decimos en vez de asumir que encaja.
  if (ram && mb && ram.ramType === mb.ramType) {
    problemas.push({
      nivel: 'no_verificado',
      texto: t({
        es: 'No verificado: no tenemos la cantidad de slots, la capacidad máxima ni la frecuencia máxima soportada de esta placa madre para confirmar que acepta esta memoria más allá del tipo (DDR5).',
        en: "Not verified: we don't have the number of slots, maximum capacity, or maximum supported frequency for this motherboard to confirm it accepts this RAM beyond the type (DDR5).",
        pt: 'Não verificado: não temos a quantidade de slots, a capacidade máxima nem a frequência máxima suportada desta placa-mãe para confirmar que ela aceita esta memória além do tipo (DDR5).',
      }),
    });
  }

  // ===== Placa madre ↔ Gabinete =====

  if (mb && gab && !(gab.supports || []).includes(mb.formFactor)) {
    const soportados = (gab.supports || []).join(', ') || t({ es: 'ningún formato conocido', en: 'no known form factor', pt: 'nenhum formato conhecido' });
    problemas.push({
      nivel: 'incompatible',
      texto: t({
        es: `Incompatible: la placa madre es formato ${mb.formFactor} y el gabinete ${gab.name} solo admite ${soportados}.`,
        en: `Incompatible: the motherboard is ${mb.formFactor} form factor and the ${gab.name} case only supports ${soportados}.`,
        pt: `Incompatível: a placa-mãe é formato ${mb.formFactor} e o gabinete ${gab.name} só admite ${soportados}.`,
      }),
    });
  }

  // ===== GPU ↔ Gabinete =====

  if (gpu && gab && gpu.length > gab.maxGpuLength) {
    problemas.push({
      nivel: 'incompatible',
      texto: t({
        es: `GPU incompatible: ${gpu.length} mm. El gabinete admite hasta ${gab.maxGpuLength} mm.`,
        en: `Incompatible GPU: ${gpu.length} mm. The case supports up to ${gab.maxGpuLength} mm.`,
        pt: `GPU incompatível: ${gpu.length} mm. O gabinete admite até ${gab.maxGpuLength} mm.`,
      }),
    });
  }

  // Altura de la GPU (clearance vertical contra el gabinete): no tenemos la
  // altura de ninguna tarjeta ni el espacio vertical disponible del gabinete.
  if (gpu && gab && gpu.length <= gab.maxGpuLength) {
    problemas.push({
      nivel: 'no_verificado',
      texto: t({
        es: 'No verificado: no tenemos la altura de la tarjeta gráfica ni el espacio vertical del gabinete para confirmar que no choca con otras piezas.',
        en: "Not verified: we don't have the graphics card's height or the case's vertical clearance to confirm it doesn't clash with other parts.",
        pt: 'Não verificado: não temos a altura da placa de vídeo nem o espaço vertical do gabinete para confirmar que não colide com outras peças.',
      }),
    });
  }

  // ===== Refrigeración ↔ CPU =====

  if (cooling && cpu && !(cooling.socketSupport || []).includes(cpu.socket)) {
    problemas.push({
      nivel: 'incompatible',
      texto: t({
        es: `Incompatible: esta refrigeración no tiene kit de montaje para el socket ${cpu.socket} del procesador.`,
        en: `Incompatible: this cooler doesn't have a mounting kit for the processor's ${cpu.socket} socket.`,
        pt: `Incompatível: este cooler não tem kit de montagem para o soquete ${cpu.socket} do processador.`,
      }),
    });
  }

  if (cooling && cpu && (cooling.socketSupport || []).includes(cpu.socket) && cooling.tdpCapacity < cpu.tdp) {
    problemas.push({
      nivel: 'aviso',
      texto: t({
        es: `La refrigeración está pensada para hasta ${cooling.tdpCapacity}W y el procesador genera ${cpu.tdp}W. Puede quedar corta bajo carga.`,
        en: `This cooler is rated for up to ${cooling.tdpCapacity}W and the processor generates ${cpu.tdp}W. It may fall short under load.`,
        pt: `Este cooler é indicado para até ${cooling.tdpCapacity}W e o processador gera ${cpu.tdp}W. Pode não ser suficiente sob carga.`,
      }),
    });
  }

  // ===== Refrigeración ↔ Gabinete =====

  if (cooling && cooling.type === 'aire' && gab && cooling.height > gab.maxCoolerHeight) {
    problemas.push({
      nivel: 'incompatible',
      texto: t({
        es: `Incompatible: el disipador mide ${cooling.height} mm de alto y el gabinete admite hasta ${gab.maxCoolerHeight} mm.`,
        en: `Incompatible: the cooler is ${cooling.height} mm tall and the case supports up to ${gab.maxCoolerHeight} mm.`,
        pt: `Incompatível: o dissipador mede ${cooling.height} mm de altura e o gabinete admite até ${gab.maxCoolerHeight} mm.`,
      }),
    });
  }

  // Radiador de refrigeración líquida: no tenemos el tamaño del radiador ni
  // las posiciones de montaje que admite cada gabinete, así que no podemos
  // confirmar que entre (antes esto se pasaba por alto en silencio).
  if (cooling && cooling.type === 'liquida' && gab) {
    problemas.push({
      nivel: 'no_verificado',
      texto: t({
        es: 'No verificado: no tenemos el tamaño del radiador ni las posiciones de montaje que admite este gabinete para confirmar que la refrigeración líquida entra.',
        en: "Not verified: we don't have the radiator size or the mounting positions this case supports to confirm the liquid cooler fits.",
        pt: 'Não verificado: não temos o tamanho do radiador nem as posições de montagem que este gabinete admite para confirmar que a refrigeração líquida cabe.',
      }),
    });
  }

  // ===== Almacenamiento ↔ Placa madre =====

  // M.2 / NVMe / SATA / PCIe / cantidad de slots: ninguna placa madre del
  // catálogo tiene todavía el detalle de sus ranuras de almacenamiento.
  if (storage && mb) {
    problemas.push({
      nivel: 'no_verificado',
      texto: t({
        es: `No verificado: no tenemos la cantidad ni el tipo de ranuras de almacenamiento (M.2/NVMe/SATA) de esta placa madre para confirmar que admite un SSD ${storage.interface}.`,
        en: `Not verified: we don't have the number or type of storage slots (M.2/NVMe/SATA) on this motherboard to confirm it supports a ${storage.interface} SSD.`,
        pt: `Não verificado: não temos a quantidade nem o tipo de conectores de armazenamento (M.2/NVMe/SATA) desta placa-mãe para confirmar que ela admite um SSD ${storage.interface}.`,
      }),
    });
  }

  // ===== Fuente de poder ↔ sistema =====

  if (psu && (cpu || gpu)) {
    const recomendada = fuenteRecomendada(build);
    const consumo = consumoEstimado(build);
    if (psu.wattage < consumo) {
      problemas.push({
        nivel: 'incompatible',
        texto: t({
          es: `Incompatible: la fuente de ${psu.wattage}W no alcanza. El sistema consume alrededor de ${consumo}W.`,
          en: `Incompatible: the ${psu.wattage}W power supply isn't enough. The system draws about ${consumo}W.`,
          pt: `Incompatível: a fonte de ${psu.wattage}W não é suficiente. O sistema consome cerca de ${consumo}W.`,
        }),
      });
    } else if (psu.wattage < recomendada) {
      problemas.push({
        nivel: 'aviso',
        texto: t({
          es: `La fuente de ${psu.wattage}W funciona, pero para este equipo se recomienda al menos ${recomendada}W para tener margen.`,
          en: `The ${psu.wattage}W power supply works, but at least ${recomendada}W is recommended for this build to have headroom.`,
          pt: `A fonte de ${psu.wattage}W funciona, mas para este equipamento recomenda-se pelo menos ${recomendada}W para ter margem.`,
        }),
      });
    }
  }

  // Conectores de la fuente hacia la GPU: no tenemos el detalle de qué
  // conectores trae cada fuente ni cuáles necesita cada tarjeta.
  if (psu && gpu) {
    problemas.push({
      nivel: 'no_verificado',
      texto: t({
        es: 'No verificado: no tenemos el detalle de los conectores de esta fuente ni los que requiere la tarjeta gráfica (por ejemplo PCIe de 12 pines) para confirmar que incluye el correcto.',
        en: "Not verified: we don't have the connector details for this power supply or the ones the graphics card requires (e.g. 12-pin PCIe) to confirm it includes the right one.",
        pt: 'Não verificado: não temos o detalhe dos conectores desta fonte nem os que a placa de vídeo requer (por exemplo, PCIe de 12 pinos) para confirmar que inclui o correto.',
      }),
    });
  }

  return problemas;
}

// Comprueba si una pieza candidata sería compatible con lo ya elegido.
// Sirve para marcar/deshabilitar opciones incompatibles ANTES de elegirlas.
// Solo el nivel 'incompatible' bloquea — un 'aviso' o un 'no_verificado'
// nunca deshabilitan una opción, porque no son un "no" confirmado.
// Devuelve { ok: true } o { ok: false, razon: '...' } con TODAS las razones
// nuevas concatenadas (no solo la última), para que la explicación sea completa.
//
// 'antesPrecalculado' es opcional: si quien llama ya calculó los incompatibles
// de la build actual (por ejemplo, para revisar varias piezas de la misma
// categoría seguidas), lo puede pasar para no recalcularlo cada vez — el
// resultado es idéntico porque 'build' no cambia entre esas llamadas.
function piezaCompatible(build, categoria, pieza, antesPrecalculado) {
  const simulada = { ...build };
  simulada[categoria] = pieza;

  const antes = antesPrecalculado || revisarCompatibilidad(build).filter((p) => p.nivel === 'incompatible');
  const antesTextos = new Set(antes.map((p) => p.texto));
  const despues = revisarCompatibilidad(simulada).filter((p) => p.nivel === 'incompatible');
  const nuevas = despues.filter((p) => !antesTextos.has(p.texto));

  if (nuevas.length > 0) {
    return { ok: false, razon: nuevas.map((p) => p.texto).join(' ') };
  }
  return { ok: true };
}
