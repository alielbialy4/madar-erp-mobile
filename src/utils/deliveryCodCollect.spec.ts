import assert from 'node:assert/strict';
import {
  handoverPreview,
  isLikelyDriverNetMistake,
  validateDeliveryCodCollect,
} from './deliveryCodCollect';

assert.equal(isLikelyDriverNetMistake(100, 85, 15), true);
assert.equal(isLikelyDriverNetMistake(100, 100, 15), false);
assert.equal(isLikelyDriverNetMistake(100, 50, 15), false);

assert.equal(handoverPreview(100, 15), 85);

assert.equal(
  validateDeliveryCodCollect({
    expectedAmount: 100,
    collectedAmount: 85,
    driverEarning: 15,
    canPartialWaiver: true,
    partialConfirmed: true,
    collectionNote: 'customer short cash ok',
  }).ok,
  false,
);

assert.deepEqual(
  validateDeliveryCodCollect({
    expectedAmount: 100,
    collectedAmount: 100,
    driverEarning: 15,
    canPartialWaiver: true,
    partialConfirmed: false,
    collectionNote: '',
  }),
  { ok: true, isPartial: false },
);

assert.equal(
  validateDeliveryCodCollect({
    expectedAmount: 100,
    collectedAmount: 80,
    driverEarning: 0,
    canPartialWaiver: true,
    partialConfirmed: false,
    collectionNote: 'customer paid less after negotiation',
  }).ok,
  false,
);

assert.deepEqual(
  validateDeliveryCodCollect({
    expectedAmount: 100,
    collectedAmount: 80,
    driverEarning: 0,
    canPartialWaiver: true,
    partialConfirmed: true,
    collectionNote: 'customer paid less after negotiation',
  }),
  { ok: true, isPartial: true },
);

console.log('deliveryCodCollect.spec.ts: OK');
