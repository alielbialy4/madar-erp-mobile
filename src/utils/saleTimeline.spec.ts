import assert from 'node:assert/strict';
import { saleTimelineEvents } from './saleTimeline';

assert.deepEqual(saleTimelineEvents({ sale_id: 10, events: [{ id: 1, event_type: 'sale_completed' }] }), [{ id: 1, event_type: 'sale_completed' }]);
assert.deepEqual(saleTimelineEvents([]), []);
assert.deepEqual(saleTimelineEvents({ events: null }), []);

console.log('saleTimeline.spec.ts: OK');
