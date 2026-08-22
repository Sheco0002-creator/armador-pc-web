'use strict';
/**
 * Pruebas del validador del contrato V2 (scripts/validate-v2.js).
 * Ejecutar: node --test tests/v2/validate-v2.test.js
 * Usa solo node:test / node:assert (sin dependencias externas).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  loadVocab,
  validateCatalog,
  validateEvidence,
  validateOffers,
  validatePresets,
  validateAll,
} = require('../../scripts/validate-v2.js');

const vocab = loadVocab(path.join(__dirname, '..', '..', 'data', 'v2', 'schema', 'vocab'));

function baseFamily(overrides = {}) {
  return {
    id: 'family-amd-9600x',
    type: 'family',
    category: 'cpu',
    selectable: false,
    technical: { socket: 'AM5' },
    technicalFieldEvidence: { socket: ['ev-1'] },
    unknownFields: [],
    verification: { status: 'verified', verifiedAt: '2026-08-10T00:00:00Z' },
    officialSources: [
      { sourceId: 'src-1', url: 'https://www.amd.com/en/products/ryzen-5-9600x', kind: 'manufacturer-page' },
    ],
    ...overrides,
  };
}

function baseProduct(overrides = {}) {
  return {
    id: 'prod-msi-rtx5070-trio',
    type: 'product',
    category: 'gpu',
    familyId: 'family-nvidia-rtx5070',
    identity: { brand: 'MSI', commercialName: 'GeForce RTX 5070 Gaming Trio OC 12G', model: 'RTX 5070 GAMING TRIO OC 12G', partNumber: '912-V515-006' },
    selectable: true,
    technical: { physical: { lengthMm: 336 } },
    technicalFieldEvidence: { 'physical.lengthMm': ['ev-2'] },
    unknownFields: [],
    verification: { status: 'verified', verifiedAt: '2026-08-05T00:00:00Z' },
    officialSources: [
      { sourceId: 'src-2', url: 'https://www.msi.com/Graphics-Card/GeForce-RTX-5070-GAMING-TRIO-OC-12G/Specification', kind: 'manufacturer-spec' },
    ],
    ...overrides,
  };
}

function baseEvidence() {
  return {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    evidence: [
      { evidenceId: 'ev-1', sourceId: 'src-1', claim: 'Socket AM5', accessedAt: '2026-08-10T00:00:00Z', verifiedAt: '2026-08-10T01:00:00Z' },
      { evidenceId: 'ev-2', sourceId: 'src-2', claim: 'Longitud 336mm', accessedAt: '2026-08-05T00:00:00Z', verifiedAt: '2026-08-05T01:00:00Z' },
    ],
  };
}

function catalogWith(entries) {
  return { schemaVersion: '2.0.0', generatedAt: '2026-08-21T00:00:00Z', entries };
}

// ---------------------------------------------------------------------------
// V-01: selectable=true requiere verified + product + identidad completa
// ---------------------------------------------------------------------------

test('V-01: rechaza selectable=true con verification.status=partial', () => {
  const catalog = catalogWith([
    baseFamily({ id: 'family-nvidia-rtx5070', selectable: false }),
    baseProduct({ verification: { status: 'partial', verifiedAt: '2026-08-05T00:00:00Z' } }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-01'));
});

test('V-01: acepta selectable=true con verified + product + identidad completa', () => {
  const catalog = catalogWith([
    baseFamily({ id: 'family-nvidia-rtx5070', selectable: false }),
    baseProduct(),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.equal(errors.filter((e) => e.rule === 'V-01').length, 0);
});

test('V-01: rechaza selectable=true en type=family', () => {
  const catalog = catalogWith([baseFamily({ selectable: true })]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-02' || e.rule === 'V-01'));
});

// ---------------------------------------------------------------------------
// V-02 / V-03
// ---------------------------------------------------------------------------

test('V-02: family con selectable=true es error', () => {
  const catalog = catalogWith([baseFamily({ selectable: true })]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-02'));
});

test('V-03: product selectable=true sin partNumber es error', () => {
  const catalog = catalogWith([
    baseFamily({ id: 'family-nvidia-rtx5070' }),
    baseProduct({ identity: { brand: 'MSI', commercialName: 'X', model: 'Y', partNumber: null } }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-03'));
});

test('V-03: product con familyId inexistente es error V-07', () => {
  const catalog = catalogWith([baseProduct({ familyId: 'family-no-existe' })]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-07'));
});

// ---------------------------------------------------------------------------
// V-04: URLs oficiales
// ---------------------------------------------------------------------------

test('V-04: rechaza officialSource placeholder https://...', () => {
  const catalog = catalogWith([
    baseFamily({ officialSources: [{ sourceId: 'src-1', url: 'https://...', kind: 'manufacturer-page' }] }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-04'));
});

test('V-04: rechaza officialSource de tienda', () => {
  const catalog = catalogWith([
    baseFamily({ officialSources: [{ sourceId: 'src-1', url: 'https://www.amazon.com/dp/XYZ', kind: 'manufacturer-page' }] }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-04'));
});

test('V-04: acepta URL oficial real https', () => {
  const catalog = catalogWith([baseFamily()]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.equal(errors.filter((e) => e.rule === 'V-04').length, 0);
});

test('V-04: una URL real terminada en "/" no se marca como truncada (regresion: falso positivo detectado en piloto Fase 2 con la URL real de NVIDIA)', () => {
  const catalog = catalogWith([
    baseFamily({ officialSources: [{ sourceId: 'src-1', url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/', kind: 'manufacturer-page' }] }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.equal(errors.filter((e) => e.rule === 'V-04').length, 0);
});

test('V-04: sigue rechazando URLs con marcador literal de truncamiento (... o …)', () => {
  const catalog = catalogWith([
    baseFamily({ officialSources: [{ sourceId: 'src-1', url: 'https://www.amd.com/en/products/processors/...', kind: 'manufacturer-page' }] }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-04'));
});

// ---------------------------------------------------------------------------
// V-05 / V-06: evidencia y unknownFields
// ---------------------------------------------------------------------------

test('V-05: campo tecnico con valor sin evidencia es error', () => {
  const catalog = catalogWith([
    baseFamily({ technical: { socket: 'AM5', tdpW: 65 }, technicalFieldEvidence: { socket: ['ev-1'] }, unknownFields: [] }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-05'));
});

test('V-06: campo tecnico null sin listar en unknownFields es error', () => {
  const catalog = catalogWith([
    baseFamily({ technical: { socket: 'AM5', tdpW: null }, technicalFieldEvidence: { socket: ['ev-1'] }, unknownFields: [] }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-06'));
});

test('V-06: campo tecnico null listado en unknownFields no es error', () => {
  const catalog = catalogWith([
    baseFamily({ technical: { socket: 'AM5', tdpW: null }, technicalFieldEvidence: { socket: ['ev-1'] }, unknownFields: ['tdpW'] }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.equal(errors.filter((e) => e.rule === 'V-06').length, 0);
});

test('V-07: technicalFieldEvidence referenciando evidenceId inexistente es error', () => {
  const catalog = catalogWith([
    baseFamily({ technicalFieldEvidence: { socket: ['ev-no-existe'] } }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-07'));
});

// ---------------------------------------------------------------------------
// V-11: fechas en evidence
// ---------------------------------------------------------------------------

test('V-11: verifiedAt anterior a accessedAt en evidence es error', () => {
  const evidence = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    evidence: [
      { evidenceId: 'ev-1', sourceId: 'src-1', claim: 'x', accessedAt: '2026-08-10T00:00:00Z', verifiedAt: '2026-08-01T00:00:00Z' },
    ],
  };
  const errors = validateEvidence(evidence);
  assert.ok(errors.some((e) => e.rule === 'V-11'));
});

test('V-11: verifiedAt igual o posterior a accessedAt es valido', () => {
  const errors = validateEvidence(baseEvidence());
  assert.equal(errors.filter((e) => e.rule === 'V-11').length, 0);
});

// ---------------------------------------------------------------------------
// V-08 / V-09: offers
// ---------------------------------------------------------------------------

function catalogWithSelectableProduct() {
  return catalogWith([
    baseFamily({ id: 'family-nvidia-rtx5070' }),
    baseProduct(),
  ]);
}

test('V-08: oferta sin price.amount > 0 es error', () => {
  const offers = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    offers: [{
      id: 'offer-1', productId: 'prod-msi-rtx5070-trio', region: 'MX', currency: 'MXN',
      price: { amount: 0 }, seller: { name: 'Tienda' }, url: 'https://tienda.example/producto',
      observedAt: '2026-08-20T00:00:00Z', verificationStatus: 'verified',
    }],
  };
  const errors = validateOffers(offers, catalogWithSelectableProduct(), vocab, new Date('2026-08-21T00:00:00Z'));
  assert.ok(errors.some((e) => e.rule === 'V-08'));
});

test('V-09: oferta con productId inexistente es error', () => {
  const offers = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    offers: [{
      id: 'offer-1', productId: 'prod-no-existe', region: 'MX', currency: 'MXN',
      price: { amount: 100 }, seller: { name: 'Tienda' }, url: 'https://tienda.example/producto',
      observedAt: '2026-08-20T00:00:00Z', verificationStatus: 'verified',
    }],
  };
  const errors = validateOffers(offers, catalogWithSelectableProduct(), vocab, new Date('2026-08-21T00:00:00Z'));
  assert.ok(errors.some((e) => e.rule === 'V-09'));
});

// ---------------------------------------------------------------------------
// V-14: stale determinista a 30 dias
// ---------------------------------------------------------------------------

test('V-14: oferta con observedAt >30 dias marcada verified es error', () => {
  const offers = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    offers: [{
      id: 'offer-1', productId: 'prod-msi-rtx5070-trio', region: 'MX', currency: 'MXN',
      price: { amount: 100 }, seller: { name: 'Tienda' }, url: 'https://tienda.example/producto',
      observedAt: '2026-07-01T00:00:00Z', verificationStatus: 'verified',
    }],
  };
  const errors = validateOffers(offers, catalogWithSelectableProduct(), vocab, new Date('2026-08-21T00:00:00Z'));
  assert.ok(errors.some((e) => e.rule === 'V-14'));
});

test('V-14: oferta con observedAt >30 dias marcada stale no es error', () => {
  const offers = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    offers: [{
      id: 'offer-1', productId: 'prod-msi-rtx5070-trio', region: 'MX', currency: 'MXN',
      price: { amount: 100 }, seller: { name: 'Tienda' }, url: 'https://tienda.example/producto',
      observedAt: '2026-07-01T00:00:00Z', verificationStatus: 'stale',
    }],
  };
  const errors = validateOffers(offers, catalogWithSelectableProduct(), vocab, new Date('2026-08-21T00:00:00Z'));
  assert.equal(errors.filter((e) => e.rule === 'V-14').length, 0);
});

test('V-14: oferta reciente marcada stale prematuramente es error', () => {
  const offers = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    offers: [{
      id: 'offer-1', productId: 'prod-msi-rtx5070-trio', region: 'MX', currency: 'MXN',
      price: { amount: 100 }, seller: { name: 'Tienda' }, url: 'https://tienda.example/producto',
      observedAt: '2026-08-20T00:00:00Z', verificationStatus: 'stale',
    }],
  };
  const errors = validateOffers(offers, catalogWithSelectableProduct(), vocab, new Date('2026-08-21T00:00:00Z'));
  assert.ok(errors.some((e) => e.rule === 'V-14'));
});

// ---------------------------------------------------------------------------
// V-10: presets
// ---------------------------------------------------------------------------

test('V-10: preset publishable=true con producto no selectable es error', () => {
  const catalog = catalogWith([
    baseFamily({ id: 'family-nvidia-rtx5070' }),
    baseProduct({ id: 'prod-no-selectable', selectable: false, verification: { status: 'partial' } }),
  ]);
  const presets = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    presets: [{
      id: 'preset-1', tier: 'media', publishable: true,
      selections: [{ category: 'gpu', productId: 'prod-no-selectable' }],
      compatibilityResult: 'compatible',
    }],
  };
  const errors = validatePresets(presets, catalog);
  assert.ok(errors.some((e) => e.rule === 'V-10'));
});

test('V-10: preset con compatibilityResult=unknown no puede ser publishable=true', () => {
  const presets = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    presets: [{
      id: 'preset-1', tier: 'media', publishable: true,
      selections: [{ category: 'gpu', productId: 'prod-msi-rtx5070-trio' }],
      compatibilityResult: 'unknown',
    }],
  };
  const errors = validatePresets(presets, catalogWithSelectableProduct());
  assert.ok(errors.some((e) => e.rule === 'V-10'));
});

test('V-10: preset valido y completo no genera error', () => {
  const presets = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    presets: [{
      id: 'preset-1', tier: 'media', publishable: true,
      selections: [{ category: 'gpu', productId: 'prod-msi-rtx5070-trio' }],
      compatibilityResult: 'compatible',
    }],
  };
  const errors = validatePresets(presets, catalogWithSelectableProduct());
  assert.equal(errors.filter((e) => e.rule === 'V-10').length, 0);
});

test('preset con offerId en una selection es rechazado (identidad de build = productId, nunca offerId)', () => {
  const presets = {
    schemaVersion: '2.0.0',
    generatedAt: '2026-08-21T00:00:00Z',
    presets: [{
      id: 'preset-1', tier: 'media', publishable: false,
      selections: [{ category: 'gpu', productId: 'prod-msi-rtx5070-trio', offerId: 'offer-1' }],
      compatibilityResult: 'unknown',
    }],
  };
  const errors = validatePresets(presets, catalogWithSelectableProduct());
  assert.ok(errors.some((e) => e.rule === 'V-12-PRESET'));
});

// ---------------------------------------------------------------------------
// V-12: vocabulario controlado en compatibility
// ---------------------------------------------------------------------------

test('V-12: compatibility.provides con valor fuera del vocabulario es error', () => {
  const catalog = catalogWith([
    baseFamily({ compatibility: { provides: [{ key: 'socket', value: 'SOCKET-INVENTADO' }] } }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-12'));
});

test('V-12: compatibility.provides con valor real del vocabulario no es error', () => {
  const catalog = catalogWith([
    baseFamily({ compatibility: { provides: [{ key: 'socket', value: 'AM5' }] } }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.equal(errors.filter((e) => e.rule === 'V-12').length, 0);
});

// ---------------------------------------------------------------------------
// V-13: legacy nunca en catalog v2
// ---------------------------------------------------------------------------

test('V-13: entrada con sourceType legacy-generic-description es rechazada en catalog.v2', () => {
  const catalog = catalogWith([
    baseFamily({ sourceType: 'legacy-generic-description' }),
  ]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-13'));
});

// ---------------------------------------------------------------------------
// Prohibicion de campos comerciales en catalog.v2
// ---------------------------------------------------------------------------

test('catalog.v2 rechaza entrada con campo price/seller/stock', () => {
  const catalog = catalogWith([baseFamily({ price: { amount: 100 } })]);
  const errors = validateCatalog(catalog, baseEvidence(), vocab);
  assert.ok(errors.some((e) => e.rule === 'V-NO-COMMERCIAL'));
});

// ---------------------------------------------------------------------------
// Sanity: el esqueleto vacio de Fase 1 (data/v2/*.json reales) es valido
// ---------------------------------------------------------------------------

test('sanity: los archivos reales data/v2/*.json vacios pasan validateAll sin errores', () => {
  const v2Dir = path.join(__dirname, '..', '..', 'data', 'v2');
  const { readJSON } = require('../../scripts/validate-v2.js');
  const catalog = readJSON(path.join(v2Dir, 'catalog.v2.json'));
  const offers = readJSON(path.join(v2Dir, 'offers.v2.json'));
  const presets = readJSON(path.join(v2Dir, 'presets.v2.json'));
  const evidence = readJSON(path.join(v2Dir, 'evidence.v2.json'));
  const result = validateAll({ catalog, offers, presets, evidence, vocab });
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});
