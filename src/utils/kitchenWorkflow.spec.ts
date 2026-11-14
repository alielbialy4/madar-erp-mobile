import assert from 'node:assert/strict';
import { kitchenWorkflowStatus } from './kitchenWorkflow';

assert.equal(kitchenWorkflowStatus({ kitchen_status: 'preparing' }), 'preparing');
assert.equal(kitchenWorkflowStatus({ status: 'completed' }), 'served');
assert.equal(kitchenWorkflowStatus({}), 'pending');
assert.equal(kitchenWorkflowStatus({ kitchen_status: 'READY' }), 'ready');

console.log('kitchenWorkflow.spec.ts: OK');
