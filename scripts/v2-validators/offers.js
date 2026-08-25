'use strict';
/**
 * Validador de offers.v2.json (reglas V-04, V-07, V-08, V-09, V-11, V-14,
 * V-ID-UNIQUE, V-SCHEMA, V-VOCAB). Ver scripts/validate-v2.js.
 */

const { isValidIsoUtc, err } = require('./utils');

const STALE_THRESHOLD_DAYS = 30;

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

module.exports = {
  validateOffers,
  STALE_THRESHOLD_DAYS,
};
