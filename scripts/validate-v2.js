'use strict';
/**
 * Validador del contrato V2 de ArmaPC (catalog/offers/presets/evidence).
 * Implementa las reglas V-01..V-14 definidas en docs/CONTRATO_V2.json (ver docs/CONTRATO_V2.md).
 * Sin dependencias externas (repo sin package.json): usa solo el runtime de Node.
 *
 * Uso CLI:
 *   node scripts/validate-v2.js
 * Exit code 0 si no hay errores, 1 si hay al menos un error.
 *
 * Uso programatico (tests): ver exports al final del archivo.
 *
 * Las reglas por documento viven en scripts/v2-validators/*.js
 * (catalog.js, evidence.js, offers.js, presets.js, utils.js). Este archivo
 * solo orquesta (validateAll), hace el cross-check entre catalog y evidence,
 * y expone la CLI.
 */

const path = require('path');

const { readJSON, loadVocab, isValidIsoUtc, err } = require('./v2-validators/utils');
const {
  validateCatalog,
  findForbiddenKeys,
  flattenLeaves,
  isPlaceholderOrInvalidUrl,
  isStoreUrl,
  isValidTier3Exception,
  TIER3_MPN_EXCEPTIONS,
} = require('./v2-validators/catalog');
const { validateEvidence } = require('./v2-validators/evidence');
const { validateOffers, STALE_THRESHOLD_DAYS } = require('./v2-validators/offers');
const { validatePresets } = require('./v2-validators/presets');

const V2_DIR = path.join(__dirname, '..', 'data', 'v2');
const VOCAB_DIR = path.join(V2_DIR, 'schema', 'vocab');

// ---------------------------------------------------------------------------
// validateAll: orquesta todo + cross-reference
// ---------------------------------------------------------------------------

function validateAll({ catalog, offers, presets, evidence, vocab, now = new Date() }) {
  const errors = [
    ...validateCatalog(catalog, evidence, vocab),
    ...validateEvidence(evidence),
    ...validateOffers(offers, catalog, vocab, now),
    ...validatePresets(presets, catalog),
  ];

  // V-07 adicional: officialSources[].sourceId referenciado por evidence.sourceId debe existir
  const sourceIds = new Set();
  for (const e of catalog.entries || []) {
    for (const s of e.officialSources || []) sourceIds.add(s.sourceId);
  }
  for (const ev of evidence.evidence || []) {
    if (!sourceIds.has(ev.sourceId)) {
      errors.push(err('V-07', 'evidence.v2.json', ev.evidenceId, `sourceId '${ev.sourceId}' no existe en ningun officialSources de catalog.v2.json`));
    }
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function runCli() {
  const catalog = readJSON(path.join(V2_DIR, 'catalog.v2.json'));
  const offers = readJSON(path.join(V2_DIR, 'offers.v2.json'));
  const presets = readJSON(path.join(V2_DIR, 'presets.v2.json'));
  const evidence = readJSON(path.join(V2_DIR, 'evidence.v2.json'));
  const vocab = loadVocab(VOCAB_DIR);

  const result = validateAll({ catalog, offers, presets, evidence, vocab, now: new Date() });

  if (result.ok) {
    console.log(`OK: contrato V2 valido. entries=${catalog.entries.length} offers=${offers.offers.length} presets=${presets.presets.length} evidence=${evidence.evidence.length}`);
  } else {
    console.log(`FALLO: ${result.errors.length} error(es) encontrados.\n`);
    for (const e of result.errors) {
      console.log(`[${e.rule}] ${e.file} ${e.id ? `(${e.id})` : ''}: ${e.message}`);
    }
  }

  process.exit(result.ok ? 0 : 1);
}

if (require.main === module) {
  runCli();
}

module.exports = {
  loadVocab,
  readJSON,
  isValidIsoUtc,
  isPlaceholderOrInvalidUrl,
  isStoreUrl,
  flattenLeaves,
  validateCatalog,
  validateEvidence,
  validateOffers,
  validatePresets,
  validateAll,
  STALE_THRESHOLD_DAYS,
  TIER3_MPN_EXCEPTIONS,
  isValidTier3Exception,
};
