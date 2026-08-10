import assert from 'node:assert/strict';
import { parseStockCountQuantity } from './stockCountQuantity';

assert.deepEqual(parseStockCountQuantity('0'), { ok: true, value: 0 });
assert.deepEqual(parseStockCountQuantity(' 42 '), { ok: true, value: 42 });
assert.equal(parseStockCountQuantity('').ok, false);
assert.equal(parseStockCountQuantity('-1').ok, false);
assert.equal(parseStockCountQuantity('1.5').ok, false);
assert.equal(parseStockCountQuantity('2147483648').ok, false);

console.log('stockCountQuantity.spec.ts: OK');
