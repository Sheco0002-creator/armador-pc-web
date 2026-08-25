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

// ===== Integración V2 (Fase 7.3, opcional, con fallback a Legacy) =====
// Estas funciones son la única conexión de este motor con data/v2/. Son
// puramente defensivas: si js/v2-adapter.js no está cargado (por ejemplo
// tests/compatibilidad.test.html no lo carga a propósito, para mantener el
// motor Legacy 100% aislado y probable sin depender de V2), o si la pieza
// no tiene mapping/evidencia V2 completos, devuelven null y el llamador usa
// el dato Legacy tal cual — nunca se inventa ni se completa un valor V2 a
// medias. Ver docs/CONTRATO_V2.md para el contrato completo de constraints.

function _v2Disponible() {
  return typeof entradaCompatibilidadV2 === 'function';
}

// Valor de compatibility.provides para `key` (ej. 'socket', 'memoryType') de
// la `pieza` (debe traer `.id`, como ya lo hace cada item real de
// data/components.json) de la categoría dada. null si no hay mapping V2, si
// V2 no cargó, o si esa entrada no declara ese `provides`.
function _v2ProvidesValor(categoria, pieza, key) {
  if (!_v2Disponible() || !pieza || !pieza.id) return null;
  const entrada = entradaCompatibilidadV2(categoria, pieza.id);
  if (!entrada) return null;
  const campo = (entrada.compatibility.provides || []).find((f) => f.key === key);
  return campo ? campo.value : null;
}

// Valor de technical (V2, family+product ya fusionado) en la ruta con
// puntos `dotPath` para la `pieza` de la categoría dada. null si no hay
// mapping V2, si V2 no cargó, o si el campo no tiene evidencia (queda null
// en el propio dato de catalog.v2.json).
function _v2TechnicalValor(categoria, pieza, dotPath) {
  if (!_v2Disponible() || !pieza || !pieza.id) return null;
  const entrada = entradaCompatibilidadV2(categoria, pieza.id);
  if (!entrada) return null;
  const valor = dotPath.split('.').reduce((v, k) => (v == null ? undefined : v[k]), entrada.technical);
  return valor == null ? null : valor;
}

function _v2AplicarOperador(a, operador, b) {
  switch (operador) {
    case '<=': return a <= b;
    case '>=': return a >= b;
    case '<': return a < b;
    case '>': return a > b;
    case '==': return a === b;
    default: return true; // operador desconocido: nunca bloquea (defensivo)
  }
}

// Todos los valores de compatibility.requires para `key` de la `pieza` de
// la categoría dada. Array vacío si no hay mapping V2, si V2 no cargó, o si
// esa entrada no declara ningún `requires` con esa key.
function _v2RequiresValores(categoria, pieza, key) {
  if (!_v2Disponible() || !pieza || !pieza.id) return [];
  const entrada = entradaCompatibilidadV2(categoria, pieza.id);
  if (!entrada) return [];
  return (entrada.compatibility.requires || []).filter((f) => f.key === key).map((f) => f.value);
}

// Todos los valores de compatibility.provides para `key` de la `pieza` de
// la categoría dada (a diferencia de _v2ProvidesValor, que solo devuelve el
// primero — aquí puede haber varios, ej. una PSU que provee 8-pin Y
// 12V-2x6 a la vez). Array vacío si no hay mapping/evidencia.
function _v2ProvidesValores(categoria, pieza, key) {
  if (!_v2Disponible() || !pieza || !pieza.id) return [];
  const entrada = entradaCompatibilidadV2(categoria, pieza.id);
  if (!entrada) return [];
  return (entrada.compatibility.provides || []).filter((f) => f.key === key).map((f) => f.value);
}

// Equivalencia de MOTOR (no de vocabulario — vocab/gpuPowerConnector.json
// sigue teniendo los 4 valores separados) usada exclusivamente para decidir
// si un conector "provisto" satisface un conector "requerido" en el par
// PSU<->GPU. 12VHPWR (ATX 3.0) y 12V-2x6 (ATX 3.1) son revisiones del mismo
// conector de 16 pines, intercambiables en la inmensa mayoría de los cables
// reales — autorizado explícitamente para esta regla (ver docs/CONTRATO_V2.md
// §8.1/§9.2). El resto de combinaciones (6-pin/8-pin/12VHPWR/12V-2x6 entre
// sí) NO son equivalentes.
function _v2ConectorEquivalente(valorProvisto, valorRequerido) {
  if (valorProvisto === valorRequerido) return true;
  const par = ['12VHPWR', '12V-2x6'];
  return par.includes(valorProvisto) && par.includes(valorRequerido);
}

// Evalúa si el conector que requiere la GPU está satisfecho por alguno de
// los que provee la PSU (con la equivalencia 12VHPWR<->12V-2x6 de arriba).
// Devuelve { match: boolean, gpuRequires, psuProvides } SOLO si ambos lados
// tienen mapping V2 y la GPU declara al menos un `requires` de
// gpuPowerConnector; si no, devuelve null y el llamador debe usar Legacy
// (ej. las GPU sin evidencia de conector, o el caso pendiente "3x8-pin").
function _v2ConectorGpuPsuMatch(gpu, psu) {
  if (!_v2Disponible() || !gpu || !gpu.id || !psu || !psu.id) return null;
  const gpuRequires = _v2RequiresValores('gpu', gpu, 'gpuPowerConnector');
  if (gpuRequires.length === 0) return null;
  const psuProvides = _v2ProvidesValores('psu', psu, 'gpuPowerConnector');
  if (psuProvides.length === 0) return null;
  const match = gpuRequires.some((req) => psuProvides.some((prov) => _v2ConectorEquivalente(prov, req)));
  return { match, gpuRequires, psuProvides };
}

// Evalúa los compatibility.constraints declarados en V2 (a nivel family,
// ver Fase 7.2) para `pieza` de `categoria` contra `piezaContra` de
// `categoriaContra`, resolviendo `against: "categoria:dotPath"`. Devuelve
// una lista de { key, operator, selfValue, contraValue, cumple } SOLO para
// los constraints evaluables con datos V2 reales (mapping completo en
// ambos lados + ambos valores no-null). Si no hay ninguno evaluable,
// devuelve null: el llamador debe usar Legacy para ese chequeo.
function _v2EvaluarConstraints(categoria, pieza, categoriaContra, piezaContra) {
  if (!_v2Disponible() || !pieza || !pieza.id || !piezaContra || !piezaContra.id) return null;
  const entrada = entradaCompatibilidadV2(categoria, pieza.id);
  if (!entrada) return null;
  const resultados = [];
  for (const c of entrada.compatibility.constraints || []) {
    const separador = (c.against || '').indexOf(':');
    if (separador === -1) continue;
    const contraCategoria = c.against.slice(0, separador);
    const contraPath = c.against.slice(separador + 1);
    if (contraCategoria !== categoriaContra) continue;
    const selfValue = _v2TechnicalValor(categoria, pieza, c.key);
    const contraValue = _v2TechnicalValor(categoriaContra, piezaContra, contraPath);
    if (selfValue == null || contraValue == null) continue;
    resultados.push({ key: c.key, operator: c.operator, selfValue, contraValue, cumple: _v2AplicarOperador(selfValue, c.operator, contraValue) });
  }
  return resultados.length > 0 ? resultados : null;
}

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
  //
  // El socket "efectivo" viene de V2 (compatibility.provides, ver Fase 7.3)
  // cuando hay mapping+evidencia completos; si no (ej. CPU Intel, cuyo
  // socket sigue sin evidencia Tier-1/2 propia — ver docs/CONTRATO_V2.md
  // §0.37), se usa el dato Legacy tal cual, que siempre está presente en
  // data/components.json. Nunca se inventa un valor.
  if (cpu && mb) {
    const cpuSocket = _v2ProvidesValor('cpu', cpu, 'socket') ?? cpu.socket;
    const mbSocket = _v2ProvidesValor('motherboard', mb, 'socket') ?? mb.socket;

    if (cpuSocket !== mbSocket) {
      problemas.push({
        nivel: 'incompatible',
        texto: t({
          es: `Incompatible: el procesador usa socket ${cpuSocket} y la placa madre (chipset ${mb.chipset}, socket ${mbSocket}) no lo acepta.`,
          en: `Incompatible: the processor uses socket ${cpuSocket} and the motherboard (chipset ${mb.chipset}, socket ${mbSocket}) doesn't support it.`,
          pt: `Incompatível: o processador usa o soquete ${cpuSocket} e a placa-mãe (chipset ${mb.chipset}, soquete ${mbSocket}) não o aceita.`,
        }),
      });
    }

    // TDP "cuando sea relevante": no tenemos el dato de cuánta potencia
    // soporta el VRM de cada placa (tampoco existe en V2, ver Fase 7.2), así
    // que para procesadores de consumo alto lo decimos en vez de asumir que
    // sí (o que no) aguanta.
    if (cpuSocket === mbSocket && cpu.tdp >= 120) {
      problemas.push({
        nivel: 'no_verificado',
        texto: t({
          es: `No verificado: el procesador consume ${cpu.tdp}W y no tenemos datos de la capacidad de entrega de energía (VRM) de esta placa madre para confirmar que lo soporta sin límites.`,
          en: `Not verified: the processor draws ${cpu.tdp}W and we don't have data on this motherboard's power delivery (VRM) capacity to confirm it can handle it without limits.`,
          pt: `Não verificado: o processador consome ${cpu.tdp}W e não temos dados sobre a capacidade de entrega de energia (VRM) desta placa-mãe para confirmar que ela suporta sem limites.`,
        }),
      });
    }
  }

  // Nota: la compatibilidad de BIOS no se revisa porque no existe ningún dato
  // de versiones de BIOS en el catálogo — no se muestra un aviso genérico
  // repetido en cada par CPU+placa porque no aportaría información específica.

  // ===== RAM ↔ Placa madre =====

  // El tipo de memoria "efectivo" viene de V2 (compatibility.provides
  // key=memoryType, ver Fase 7.3) cuando hay mapping+evidencia completos;
  // si no, se usa el dato Legacy tal cual.
  if (ram && mb) {
    const ramTipo = _v2ProvidesValor('ram', ram, 'memoryType') ?? ram.ramType;
    const mbTipo = _v2ProvidesValor('motherboard', mb, 'memoryType') ?? mb.ramType;

    if (ramTipo !== mbTipo) {
      problemas.push({
        nivel: 'incompatible',
        texto: t({
          es: `Incompatible: esta placa madre utiliza ${mbTipo} y la memoria seleccionada es ${ramTipo}.`,
          en: `Incompatible: this motherboard uses ${mbTipo} and the selected RAM is ${ramTipo}.`,
          pt: `Incompatível: esta placa-mãe usa ${mbTipo} e a memória selecionada é ${ramTipo}.`,
        }),
      });
    }

    // Capacidad máxima, frecuencia soportada y cantidad de slots: ninguna
    // placa madre (Legacy ni V2) tiene estos datos todavía, así que no
    // podemos confirmarlo — lo decimos en vez de asumir que encaja.
    if (ramTipo === mbTipo) {
      problemas.push({
        nivel: 'no_verificado',
        texto: t({
          es: 'No verificado: no tenemos la cantidad de slots, la capacidad máxima ni la frecuencia máxima soportada de esta placa madre para confirmar que acepta esta memoria más allá del tipo (DDR5).',
          en: "Not verified: we don't have the number of slots, maximum capacity, or maximum supported frequency for this motherboard to confirm it accepts this RAM beyond the type (DDR5).",
          pt: 'Não verificado: não temos a quantidade de slots, a capacidade máxima nem a frequência máxima suportada desta placa-mãe para confirmar que ela aceita esta memória além do tipo (DDR5).',
        }),
      });
    }
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

  // Longitud "efectiva": si V2 tiene mapping+evidencia completos para GPU y
  // gabinete, y la family de la GPU declara el constraint physical.lengthMm
  // contra case:maxGpuLengthMm (ver Fase 7.2), se usa ese par de valores;
  // si no, se usa el dato Legacy tal cual.
  if (gpu && gab) {
    const constraintsLargo = _v2EvaluarConstraints('gpu', gpu, 'case', gab);
    const largoV2 = constraintsLargo && constraintsLargo.find((r) => r.key === 'physical.lengthMm');
    const largoGpu = largoV2 ? largoV2.selfValue : gpu.length;
    const largoMaxCase = largoV2 ? largoV2.contraValue : gab.maxGpuLength;
    const cabeEnLargo = largoV2 ? largoV2.cumple : largoGpu <= largoMaxCase;

    if (!cabeEnLargo) {
      problemas.push({
        nivel: 'incompatible',
        texto: t({
          es: `GPU incompatible: ${largoGpu} mm. El gabinete admite hasta ${largoMaxCase} mm.`,
          en: `Incompatible GPU: ${largoGpu} mm. The case supports up to ${largoMaxCase} mm.`,
          pt: `GPU incompatível: ${largoGpu} mm. O gabinete admite até ${largoMaxCase} mm.`,
        }),
      });
    }

    // Altura de la GPU (clearance vertical contra el gabinete): no tenemos la
    // altura de ninguna tarjeta ni el espacio vertical disponible del
    // gabinete (tampoco en V2), así que este chequeo sigue siempre
    // "no verificado" sin importar el largo.
    if (cabeEnLargo) {
      problemas.push({
        nivel: 'no_verificado',
        texto: t({
          es: 'No verificado: no tenemos la altura de la tarjeta gráfica ni el espacio vertical del gabinete para confirmar que no choca con otras piezas.',
          en: "Not verified: we don't have the graphics card's height or the case's vertical clearance to confirm it doesn't clash with other parts.",
          pt: 'Não verificado: não temos a altura da placa de vídeo nem o espaço vertical do gabinete para confirmar que não colide com outras peças.',
        }),
      });
    }
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

  // Altura "efectiva" del cooler de aire: si V2 tiene mapping+evidencia
  // completos y la family del cooler declara el constraint
  // physical.productHeightMm contra case:maxCoolerHeightMm (ver Fase 7.2),
  // se usa ese par; si no, Legacy tal cual. Solo aplica a coolers de aire —
  // family-cooling-aio-liquid no declara este constraint a propósito (no
  // tiene ese campo, ver docs/CONTRATO_V2.md).
  if (cooling && cooling.type === 'aire' && gab) {
    const constraintsAltura = _v2EvaluarConstraints('cooling', cooling, 'case', gab);
    const alturaV2 = constraintsAltura && constraintsAltura.find((r) => r.key === 'physical.productHeightMm');
    const alturaCooler = alturaV2 ? alturaV2.selfValue : cooling.height;
    const alturaMaxCase = alturaV2 ? alturaV2.contraValue : gab.maxCoolerHeight;
    const cabeEnAltura = alturaV2 ? alturaV2.cumple : alturaCooler <= alturaMaxCase;

    if (!cabeEnAltura) {
      problemas.push({
        nivel: 'incompatible',
        texto: t({
          es: `Incompatible: el disipador mide ${alturaCooler} mm de alto y el gabinete admite hasta ${alturaMaxCase} mm.`,
          en: `Incompatible: the cooler is ${alturaCooler} mm tall and the case supports up to ${alturaMaxCase} mm.`,
          pt: `Incompatível: o dissipador mede ${alturaCooler} mm de altura e o gabinete admite até ${alturaMaxCase} mm.`,
        }),
      });
    }
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

  // Conectores de la fuente hacia la GPU: si V2 tiene mapping+evidencia
  // completos para ambas piezas y la GPU declara qué conector requiere (ver
  // Fase 7.5), se compara contra los que provee la PSU (12VHPWR/12V-2x6
  // tratados como equivalentes solo para este matching, ver
  // _v2ConectorEquivalente); si no, se usa el Legacy tal cual: no tenemos
  // el detalle de qué conectores trae cada fuente ni cuáles necesita cada
  // tarjeta.
  if (psu && gpu) {
    const conectorV2 = _v2ConectorGpuPsuMatch(gpu, psu);
    if (conectorV2) {
      if (!conectorV2.match) {
        problemas.push({
          nivel: 'incompatible',
          texto: t({
            es: `Incompatible: la tarjeta gráfica requiere un conector ${conectorV2.gpuRequires.join('/')} y esta fuente no lo incluye (provee ${conectorV2.psuProvides.join('/')}).`,
            en: `Incompatible: the graphics card requires a ${conectorV2.gpuRequires.join('/')} connector and this power supply doesn't include one (it provides ${conectorV2.psuProvides.join('/')}).`,
            pt: `Incompatível: a placa de vídeo requer um conector ${conectorV2.gpuRequires.join('/')} e esta fonte não o inclui (fornece ${conectorV2.psuProvides.join('/')}).`,
          }),
        });
      }
    } else {
      problemas.push({
        nivel: 'no_verificado',
        texto: t({
          es: 'No verificado: no tenemos el detalle de los conectores de esta fuente ni los que requiere la tarjeta gráfica (por ejemplo PCIe de 12 pines) para confirmar que incluye el correcto.',
          en: "Not verified: we don't have the connector details for this power supply or the ones the graphics card requires (e.g. 12-pin PCIe) to confirm it includes the right one.",
          pt: 'Não verificado: não temos o detalhe dos conectores desta fonte nem os que a placa de vídeo requer (por exemplo, PCIe de 12 pinos) para confirmar que inclui o correto.',
        }),
      });
    }
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
