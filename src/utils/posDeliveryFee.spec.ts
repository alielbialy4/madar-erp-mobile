import assert from 'node:assert/strict';
import {
  DEFAULT_DELIVERY_COLLECTION_METHOD,
  isDeliveryFeeOverridden,
  isDeliveryZoneRequirementMet,
  isPlatformManagedDelivery,
  resolveDeliveryCollectionPayment,
  resolvePosDeliveryFee,
} from './posDeliveryFee';

assert.equal(
  resolvePosDeliveryFee({ orderTypeIsDelivery: false, zoneFee: 40, manualFee: 10 }),
  0,
);
assert.equal(
  resolvePosDeliveryFee({ orderTypeIsDelivery: true, zoneFee: 40, manualFee: null }),
  40,
);
assert.equal(
  resolvePosDeliveryFee({ orderTypeIsDelivery: true, zoneFee: 40, manualFee: 0 }),
  0,
);
assert.equal(
  resolvePosDeliveryFee({ orderTypeIsDelivery: true, zoneFee: 70, manualFee: 80 }),
  80,
);
assert.equal(
  resolvePosDeliveryFee({ orderTypeIsDelivery: true, zoneFee: 40, manualFee: -5 }),
  0,
);

assert.equal(isDeliveryFeeOverridden(70, 80), true);
assert.equal(isDeliveryFeeOverridden(70, 70), false);
assert.equal(isDeliveryFeeOverridden(70, 0), true);

assert.equal(DEFAULT_DELIVERY_COLLECTION_METHOD, 'driver');
assert.deepEqual(resolveDeliveryCollectionPayment('card', 125, false), {
  paymentType: 'card',
  paid: 125,
});
assert.deepEqual(resolveDeliveryCollectionPayment('cash', 125, true), {
  paymentType: 'credit',
  paid: 0,
});

assert.equal(
  isPlatformManagedDelivery({
    orderTypeIsDelivery: true,
    salesChannel: { delivery_responsibility: 'platform' },
  }),
  true,
);
assert.equal(
  isPlatformManagedDelivery({
    orderTypeIsDelivery: true,
    salesChannel: { delivery_responsibility: 'restaurant' },
  }),
  false,
);
assert.equal(
  isPlatformManagedDelivery({ orderTypeIsDelivery: true, salesChannel: null }),
  false,
);
assert.equal(
  isPlatformManagedDelivery({
    orderTypeIsDelivery: false,
    salesChannel: { delivery_responsibility: 'platform' },
  }),
  false,
);

assert.equal(isDeliveryZoneRequirementMet({ zoneId: '', zonesConfigured: false }), true);
assert.equal(isDeliveryZoneRequirementMet({ zoneId: '', zonesConfigured: true }), false);
assert.equal(isDeliveryZoneRequirementMet({ zoneId: 'z1', zonesConfigured: true }), true);
assert.equal(isDeliveryZoneRequirementMet({ zoneId: null, zonesConfigured: null }), false);

console.log('posDeliveryFee.spec.ts: OK');
