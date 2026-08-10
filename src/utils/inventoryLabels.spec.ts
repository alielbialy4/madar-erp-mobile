import assert from 'node:assert/strict';
import { inventoryDocumentReference, inventoryStatusLabel } from './inventoryLabels';

assert.equal(inventoryStatusLabel('draft'), 'مسودة');
assert.equal(inventoryStatusLabel('POSTED'), 'مُرحّل');
assert.equal(inventoryStatusLabel('مخصص'), 'مخصص');
assert.equal(inventoryStatusLabel(null), '—');

assert.equal(
  inventoryDocumentReference({ id: 'a1c4348f-2b9d-4f22-a100-123456789abc' }, 'جرد'),
  ['جرد #', 'a1c4348f'].join(''),
);
assert.equal(inventoryDocumentReference({ reference_no: 'TR-102' }, 'تحويل'), 'TR-102');

console.log('inventoryLabels.spec.ts: OK');
