'use strict';
/**
 * Validador de presets.v2.json (reglas V-07, V-10, V-12-PRESET, V-ID-UNIQUE,
 * V-SCHEMA). Ver scripts/validate-v2.js.
 */

const { err } = require('./utils');

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

module.exports = {
  validatePresets,
};
