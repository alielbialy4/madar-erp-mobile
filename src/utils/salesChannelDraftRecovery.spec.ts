import assert from 'node:assert/strict';
import { restoreSalesChannelDraft } from './salesChannelDraftRecovery';
import type { CartLine } from '@/utils/cartLine';
import type { Product } from '@/types/api';

const lines: CartLine[] = [
  {
    product_id: 1,
    product_name: 'Burger',
    quantity: 1,
    unit_price: 20,
    discount: 0,
  },
];

const products: Product[] = [
  {
    id: 1,
    name: 'Burger',
    selling_price: 18,
    sales_channel_pricing: {
      talabat: { price: 24, pricing_version: 4, token: 'signed-token', markup_percent: 0, rounding_increment: 0 },
    },
  },
];

const withChannel = restoreSalesChannelDraft({
  requestedChannelId: 'talabat',
  externalOrderReference: 'EXT-1',
  lines,
  products,
});
assert.equal(withChannel.salesChannelId, 'talabat');
assert.equal(withChannel.externalOrderReference, 'EXT-1');
assert.equal(withChannel.lines[0]?.unit_price, 20);

const withoutChannel = restoreSalesChannelDraft({
  requestedChannelId: null,
  externalOrderReference: 'ignored',
  lines,
  products,
});
assert.equal(withoutChannel.salesChannelId, null);
assert.equal(withoutChannel.externalOrderReference, '');
assert.equal(withoutChannel.lines[0]?.unit_price, 18);

console.log('salesChannelDraftRecovery.spec.ts: OK');
