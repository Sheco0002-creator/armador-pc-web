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
 */

const fs = require('fs');
const path = require('path');

const V2_DIR = path.join(__dirname, '..', 'data', 'v2');
const VOCAB_DIR = path.join(V2_DIR, 'schema', 'vocab');
const STALE_THRESHOLD_DAYS = 30;
const FORBIDDEN_CATALOG_KEYS = ['price', 'seller', 'stock', 'currency'];
const STORE_DOMAIN_HINTS = ['amazon.', 'mercadolibre.', 'mercadolivre.', 'newegg.', 'bestbuy.', 'aliexpress.', 'ebay.', 'walmart.'];
const PLACEHOLDER_URL_PATTERNS = [
  /^https:\/\/\.\.\.$/,
  /^https:\/\/\s*$/,
  /example\.com/i,
  /fabricante\.com/i,
  /\.\.\.$/,
  /…$/,
];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function loadVocab(dir = VOCAB_DIR) {
  const vocab = {};
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const data = readJSON(path.join(dir, file));
    vocab[data.key] = data.values;
  }
  return vocab;
}

function isValidIsoUtc(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

function isPlaceholderOrInvalidUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('https://')) return true;
  if (PLACEHOLDER_URL_PATTERNS.some((re) => re.test(url))) return true;
  return false;
}

function isStoreUrl(url) {
  if (typeof url !== 'string') return false;
  return STORE_DOMAIN_HINTS.some((hint) => url.toLowerCase().includes(hint));
}

/** Aplana un objeto en pares {dotPath: leafValue}, deteniendose en primitivos o null. */
function flattenLeaves(obj, prefix = '') {
  const out = {};
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out[prefix] = obj;
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenLeaves(v, p));
    } else {
      out[p] = v;
    }
  }
  return out;
}

/** Busca recursivamente si alguna clave del objeto coincide con `forbiddenKeys`. */
function findForbiddenKeys(obj, forbiddenKeys, foundPath = []) {
  const hits = [];
  if (obj === null || typeof obj !== 'object') return hits;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => hits.push(...findForbiddenKeys(item, forbiddenKeys, [...foundPath, `[${i}]`])));
    return hits;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (forbiddenKeys.includes(k)) hits.push([...foundPath, k].join('.'));
    hits.push(...findForbiddenKeys(v, forbiddenKeys, [...foundPath, k]));
  }
  return hits;
}

function err(rule, file, id, message) {
  return { rule, file, id, message };
}

// ---------------------------------------------------------------------------
// V-04 / V-13 / V-01 / V-02 / V-03 / V-05 / V-06 / V-12 : validateCatalog
// ---------------------------------------------------------------------------

function validateCatalog(catalog, evidence, vocab) {
  const errors = [];
  const file = 'catalog.v2.json';

  if (catalog.schemaVersion !== '2.0.0') {
    errors.push(err('V-SCHEMA', file, null, `schemaVersion invalido: ${catalog.schemaVersion}`));
  }

  const entries = Array.isArray(catalog.entries) ? catalog.entries : [];
  const idsSeen = new Set();
  const entryById = new Map();
  for (const e of entries) entryById.set(e.id, e);

  const evidenceIds = new Set((evidence.evidence || []).map((ev) => ev.evidenceId));

  for (const entry of entries) {
    const id = entry.id || '(sin id)';

    if (idsSeen.has(entry.id)) {
      errors.push(err('V-ID-UNIQUE', file, id, `id duplicado en catalog.v2.json: ${entry.id}`));
    }
    idsSeen.add(entry.id);

    // V-13: legacy nunca puede aparecer en catalog.v2
    if (entry.sourceType === 'legacy-generic-description') {
      errors.push(err('V-13', file, id, 'Entrada legacy (sourceType=legacy-generic-description) no puede existir en catalog.v2.json'));
    }

    // Forbidden commercial keys (precio/vendedor/stock/currency nunca en catalog)
    const forbiddenHits = findForbiddenKeys(entry, FORBIDDEN_CATALOG_KEYS);
    if (forbiddenHits.length > 0) {
      errors.push(err('V-NO-COMMERCIAL', file, id, `catalog.v2.json no puede contener campos comerciales: ${forbiddenHits.join(', ')}`));
    }

    // entryType vocab
    if (!vocab.entryType || !vocab.entryType.includes(entry.type)) {
      errors.push(err('V-VOCAB', file, id, `type '${entry.type}' no pertenece al vocabulario entryType`));
    }

    // V-02: family nunca selectable
    if (entry.type === 'family' && entry.selectable === true) {
      errors.push(err('V-02', file, id, "Entrada type=family no puede tener selectable=true"));
    }

    // V-03: product requiere identidad completa + familyId existente
    if (entry.type === 'product') {
      const identity = entry.identity || {};
      const identityFields = ['brand', 'commercialName', 'model', 'partNumber'];
      const missingIdentity = identityFields.filter((f) => identity[f] === null || identity[f] === undefined);
      if (missingIdentity.length > 0 && entry.selectable === true) {
        errors.push(err('V-03', file, id, `Product selectable=true con identidad incompleta: falta ${missingIdentity.join(', ')}`));
      }
      if (!entry.familyId || !entryById.has(entry.familyId)) {
        errors.push(err('V-07', file, id, `familyId '${entry.familyId}' no existe en catalog.v2.json`));
      } else if (entryById.get(entry.familyId).type !== 'family') {
        errors.push(err('V-03', file, id, `familyId '${entry.familyId}' no referencia una entrada type=family`));
      }
    }

    // verification.status vocab
    const status = entry.verification && entry.verification.status;
    if (!vocab.verificationStatus || !vocab.verificationStatus.includes(status)) {
      errors.push(err('V-VOCAB', file, id, `verification.status '${status}' no pertenece al vocabulario verificationStatus`));
    }

    // V-01: invariante dura selectable=true
    if (entry.selectable === true) {
      const identity = entry.identity || {};
      const identityComplete = ['brand', 'commercialName', 'model', 'partNumber'].every((f) => identity[f] !== null && identity[f] !== undefined);
      if (status !== 'verified' || entry.type !== 'product' || !identityComplete) {
        errors.push(err('V-01', file, id, `selectable=true requiere verification.status=verified, type=product e identidad completa (status=${status}, type=${entry.type}, identityComplete=${identityComplete})`));
      }
    }

    // verification.verifiedAt formato
    if (entry.verification && entry.verification.verifiedAt != null && !isValidIsoUtc(entry.verification.verifiedAt)) {
      errors.push(err('V-11', file, id, `verification.verifiedAt no es ISO8601 UTC valido: ${entry.verification.verifiedAt}`));
    }

    // V-04: officialSources
    for (const src of entry.officialSources || []) {
      if (isPlaceholderOrInvalidUrl(src.url)) {
        errors.push(err('V-04', file, id, `officialSources url invalida o placeholder: ${src.url}`));
      }
      if (isStoreUrl(src.url)) {
        errors.push(err('V-04', file, id, `officialSources no puede apuntar a una tienda: ${src.url}`));
      }
      if (!vocab.sourceKind || !vocab.sourceKind.includes(src.kind)) {
        errors.push(err('V-VOCAB', file, id, `officialSources.kind '${src.kind}' no pertenece al vocabulario sourceKind`));
      }
    }
    if (status === 'verified' && (!entry.officialSources || entry.officialSources.length === 0)) {
      errors.push(err('V-04', file, id, 'verification.status=verified requiere al menos un officialSource'));
    }

    // V-05 / V-06: technical <-> technicalFieldEvidence / unknownFields
    const technical = entry.technical || {};
    const leaves = flattenLeaves(technical);
    const techFieldEvidence = entry.technicalFieldEvidence || {};
    const unknownFields = new Set(entry.unknownFields || []);

    for (const [leafPath, value] of Object.entries(leaves)) {
      if (value === null) {
        if (!unknownFields.has(leafPath)) {
          errors.push(err('V-06', file, id, `technical.${leafPath} es null pero no aparece en unknownFields`));
        }
      } else {
        const evIds = techFieldEvidence[leafPath];
        if (!Array.isArray(evIds) || evIds.length === 0) {
          errors.push(err('V-05', file, id, `technical.${leafPath} tiene valor pero no tiene evidencia en technicalFieldEvidence`));
        } else {
          for (const evId of evIds) {
            if (!evidenceIds.has(evId)) {
              errors.push(err('V-07', file, id, `technicalFieldEvidence.${leafPath} referencia evidenceId inexistente: ${evId}`));
            }
          }
        }
      }
    }
    // Evidencia huerfana: technicalFieldEvidence referencia un path que no existe en technical
    for (const p of Object.keys(techFieldEvidence)) {
      if (!(p in leaves)) {
        errors.push(err('V-05', file, id, `technicalFieldEvidence declara path '${p}' que no existe en technical`));
      }
    }

    // V-12: compatibility.provides/requires/constraints deben usar vocabulario controlado
    const compat = entry.compatibility || {};
    for (const field of [...(compat.provides || []), ...(compat.requires || [])]) {
      const allowed = vocab[field.key];
      if (!allowed) {
        errors.push(err('V-12', file, id, `compatibility usa key '${field.key}' sin vocabulario controlado definido`));
      } else if (!allowed.includes(field.value)) {
        errors.push(err('V-12', file, id, `compatibility.${field.key}='${field.value}' no pertenece al vocabulario controlado`));
      }
    }
    for (const c of compat.constraints || []) {
      if (!['<=', '>=', '<', '>', '=='].includes(c.operator)) {
        errors.push(err('V-12', file, id, `compatibility constraint con operador invalido: ${c.operator}`));
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// V-11: validateEvidence
// ---------------------------------------------------------------------------

function validateEvidence(evidence) {
  const errors = [];
  const file = 'evidence.v2.json';

  if (evidence.schemaVersion !== '2.0.0') {
    errors.push(err('V-SCHEMA', file, null, `schemaVersion invalido: ${evidence.schemaVersion}`));
  }

  const seen = new Set();
  for (const ev of evidence.evidence || []) {
    const id = ev.evidenceId || '(sin id)';
    if (seen.has(ev.evidenceId)) {
      errors.push(err('V-ID-UNIQUE', file, id, `evidenceId duplicado: ${ev.evidenceId}`));
    }
    seen.add(ev.evidenceId);

    if (!isValidIsoUtc(ev.accessedAt)) {
      errors.push(err('V-11', file, id, `accessedAt no es ISO8601 UTC valido: ${ev.accessedAt}`));
    }
    if (!isValidIsoUtc(ev.verifiedAt)) {
      errors.push(err('V-11', file, id, `verifiedAt no es ISO8601 UTC valido: ${ev.verifiedAt}`));
    }
    if (isValidIsoUtc(ev.accessedAt) && isValidIsoUtc(ev.verifiedAt)) {
      if (Date.parse(ev.verifiedAt) < Date.parse(ev.accessedAt)) {
        errors.push(err('V-11', file, id, `verifiedAt (${ev.verifiedAt}) es anterior a accessedAt (${ev.accessedAt})`));
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// V-07 / V-08 / V-09 / V-14: validateOffers
// ---------------------------------------------------------------------------

function validateOffers(offers, catalog, vocab, now = new Date()) {
  const errors = [];
  const file = 'offers.v2.json';

  if (offers.schemaVersion !== '2.0.0') {
    errors.push(err('V-SCHEMA', file, null, `schemaVersion invalido: ${offers.schemaVersion}`));
  }

  const productIds = new Set((catalog.entries || []).filter((e) => e.type === 'product').map((e) => e.id));
  const allOfferIds = new Set((offers.offers || []).map((o) => o.id));
  const seen = new Set();

  for (const offer of offers.offers || []) {
    const id = offer.id || '(sin id)';
    if (seen.has(offer.id)) errors.push(err('V-ID-UNIQUE', file, id, `id duplicado: ${offer.id}`));
    seen.add(offer.id);

    // V-09/V-07
    if (!productIds.has(offer.productId)) {
      errors.push(err('V-09', file, id, `productId '${offer.productId}' no existe en catalog.v2.json como product`));
    }

    // V-08
    if (!offer.price || !(offer.price.amount > 0)) {
      errors.push(err('V-08', file, id, 'oferta sin price.amount > 0 verificado no debe existir'));
    }

    // URL comercial valida
    if (typeof offer.url !== 'string' || !offer.url.startsWith('https://')) {
      errors.push(err('V-04', file, id, `offer.url invalida: ${offer.url}`));
    }

    // verificationStatus vocab
    if (!vocab.offerVerificationStatus || !vocab.offerVerificationStatus.includes(offer.verificationStatus)) {
      errors.push(err('V-VOCAB', file, id, `verificationStatus '${offer.verificationStatus}' no pertenece al vocabulario offerVerificationStatus`));
    }

    // V-14: stale determinista por antiguedad de observedAt
    if (isValidIsoUtc(offer.observedAt)) {
      const ageDays = (now.getTime() - Date.parse(offer.observedAt)) / (1000 * 60 * 60 * 24);
      if (ageDays > STALE_THRESHOLD_DAYS && offer.verificationStatus === 'verified') {
        errors.push(err('V-14', file, id, `observedAt tiene ${ageDays.toFixed(1)} dias (>${STALE_THRESHOLD_DAYS}); verificationStatus debe ser 'stale', no 'verified'`));
      }
      if (ageDays <= STALE_THRESHOLD_DAYS && offer.verificationStatus === 'stale') {
        errors.push(err('V-14', file, id, `observedAt tiene ${ageDays.toFixed(1)} dias (<=${STALE_THRESHOLD_DAYS}); no debe marcarse 'stale' prematuramente`));
      }
    } else {
      errors.push(err('V-11', file, id, `observedAt no es ISO8601 UTC valido: ${offer.observedAt}`));
    }

    // V-07: supersedesOfferId
    if (offer.supersedesOfferId != null && !allOfferIds.has(offer.supersedesOfferId)) {
      errors.push(err('V-07', file, id, `supersedesOfferId '${offer.supersedesOfferId}' no existe en offers.v2.json`));
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// V-07 / V-10: validatePresets
// ---------------------------------------------------------------------------

function validatePresets(presets, catalog) {
  const errors = [];
  const file = 'presets.v2.json';

  if (presets.schemaVersion !== '2.0.0') {
    errors.push(err('V-SCHEMA', file, null, `schemaVersion invalido: ${presets.schemaVersion}`));
  }

  const productById = new Map((catalog.entries || []).filter((e) => e.type === 'product').map((e) => [e.id, e]));
  const seen = new Set();

  for (const preset of presets.presets || []) {
    const id = preset.id || '(sin id)';
    if (seen.has(preset.id)) errors.push(err('V-ID-UNIQUE', file, id, `id duplicado: ${preset.id}`));
    seen.add(preset.id);

    if ('offerId' in (preset || {})) {
      errors.push(err('V-12-PRESET', file, id, 'preset no puede referenciar offerId como identidad'));
    }

    let allSelectionsResolvable = (preset.selections || []).length > 0;
    for (const sel of preset.selections || []) {
      if ('offerId' in sel) {
        errors.push(err('V-12-PRESET', file, id, `selection de categoria '${sel.category}' no puede referenciar offerId, solo productId`));
      }
      if (sel.productId == null) {
        allSelectionsResolvable = false;
        continue;
      }
      const product = productById.get(sel.productId);
      if (!product) {
        errors.push(err('V-07', file, id, `selection.productId '${sel.productId}' no existe en catalog.v2.json`));
        allSelectionsResolvable = false;
      } else if (product.selectable !== true) {
        errors.push(err('V-10', file, id, `selection.productId '${sel.productId}' no es selectable=true`));
        allSelectionsResolvable = false;
      }
    }

    const shouldBePublishable = allSelectionsResolvable && preset.compatibilityResult === 'compatible';
    if (preset.publishable === true && !shouldBePublishable) {
      errors.push(err('V-10', file, id, `publishable=true pero no todas las condiciones se cumplen (selecciones resolubles=${allSelectionsResolvable}, compatibilityResult=${preset.compatibilityResult})`));
    }
  }

  return errors;
}

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
  const vocab = loadVocab();

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
};
