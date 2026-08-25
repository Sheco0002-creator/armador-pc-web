'use strict';
/**
 * Utilidades genericas compartidas por los validadores del contrato V2.
 * Ver scripts/validate-v2.js.
 */

const fs = require('fs');
const path = require('path');

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function loadVocab(dir) {
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

function err(rule, file, id, message) {
  return { rule, file, id, message };
}

module.exports = {
  readJSON,
  loadVocab,
  isValidIsoUtc,
  err,
};
