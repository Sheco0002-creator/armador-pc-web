'use strict';
/**
 * Validador de evidence.v2.json (regla V-11, V-ID-UNIQUE, V-SCHEMA).
 * Ver scripts/validate-v2.js.
 */

const { isValidIsoUtc, err } = require('./utils');

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

module.exports = {
  validateEvidence,
};
