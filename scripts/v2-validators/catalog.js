'use strict';
/**
 * Validador de catalog.v2.json (reglas V-01, V-02, V-03, V-04, V-05, V-06,
 * V-07, V-11, V-12, V-13, V-ID-UNIQUE, V-NO-COMMERCIAL, V-SCHEMA, V-TIER3-EXC).
 * Ver scripts/validate-v2.js.
 */

const { isValidIsoUtc, err } = require('./utils');

/**
 * Allowlist cerrada de la excepcion Tier-3 documentada en docs/CONTRATO_V2.md
 * (seccion "Excepciones aprobadas" / CPU Intel). NO agregar ids aqui sin una
 * enmienda formal del contrato: esto NO convierte retailer en un sourceKind
 * valido de forma general, solo bypassa el chequeo V-04 de tienda/vocabulario
 * para el officialSource marcado `tier3: true` de estos dos productos, y solo
 * cuando ademas traen verification.tier3Exception valido (ver isValidTier3Exception).
 */
const TIER3_MPN_EXCEPTIONS = Object.freeze(['cpu-ultra7-265k', 'cpu-ultra9-285k']);

function isValidTier3Exception(exc) {
  return !!exc
    && typeof exc.approvedBy === 'string' && exc.approvedBy.trim().length > 0
    && isValidIsoUtc(exc.approvedAt)
    && typeof exc.reason === 'string' && exc.reason.trim().length > 0
    && typeof exc.contractRef === 'string' && exc.contractRef.trim().length > 0;
}

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

    // V-TIER3-EXC: excepcion cerrada allowlist(codigo) + flag(dato) para MPN Tier-3
    const tier3Allowed = TIER3_MPN_EXCEPTIONS.includes(entry.id);
    const tier3Exception = entry.verification && entry.verification.tier3Exception;
    const tier3Valid = tier3Allowed && isValidTier3Exception(tier3Exception);
    if (tier3Allowed && !tier3Valid) {
      errors.push(err('V-TIER3-EXC', file, id, 'Producto en TIER3_MPN_EXCEPTIONS requiere verification.tier3Exception valido (approvedBy, approvedAt ISO8601, reason, contractRef)'));
    }
    if (!tier3Allowed && tier3Exception) {
      errors.push(err('V-TIER3-EXC', file, id, 'verification.tier3Exception solo esta permitido para productId incluido en la allowlist TIER3_MPN_EXCEPTIONS'));
    }

    // V-04: officialSources
    for (const src of entry.officialSources || []) {
      // Bypass exclusivo: solo si la entrada tiene una excepcion Tier-3 valida
      // Y este officialSource individual esta marcado explicitamente `tier3: true`.
      // Cualquier otra combinacion cae en el chequeo normal (tienda prohibida).
      const isTier3Source = tier3Valid === true && src.tier3 === true;

      if (isPlaceholderOrInvalidUrl(src.url)) {
        errors.push(err('V-04', file, id, `officialSources url invalida o placeholder: ${src.url}`));
      }
      if (!isTier3Source) {
        if (isStoreUrl(src.url)) {
          errors.push(err('V-04', file, id, `officialSources no puede apuntar a una tienda: ${src.url}`));
        }
        if (!vocab.sourceKind || !vocab.sourceKind.includes(src.kind)) {
          errors.push(err('V-VOCAB', file, id, `officialSources.kind '${src.kind}' no pertenece al vocabulario sourceKind`));
        }
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

module.exports = {
  validateCatalog,
  findForbiddenKeys,
  flattenLeaves,
  isPlaceholderOrInvalidUrl,
  isStoreUrl,
  isValidTier3Exception,
  TIER3_MPN_EXCEPTIONS,
  FORBIDDEN_CATALOG_KEYS,
  STORE_DOMAIN_HINTS,
  PLACEHOLDER_URL_PATTERNS,
};
