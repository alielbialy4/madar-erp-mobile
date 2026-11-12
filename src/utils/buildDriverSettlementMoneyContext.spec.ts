import assert from 'node:assert/strict';
import {
  buildDriverSettlementMoneyContext,
  driverSettlementRegisterSessionRequired,
  requiresRegisterSessionForDrawer,
} from './buildDriverSettlementMoneyContext';

assert.equal(requiresRegisterSessionForDrawer('multi_register'), true);
assert.equal(requiresRegisterSessionForDrawer('legacy_shared_drawer'), false);

const stamped = buildDriverSettlementMoneyContext({
  shiftMode: 'multi_register',
  depositTarget: 'current_drawer',
  drawerSession: {
    uuid: 'sess-1',
    register: { uuid: 'reg-1' },
  },
});
assert.deepEqual(stamped, {
  pos_register_id: 'reg-1',
  register_session_id: 'sess-1',
});

assert.deepEqual(
  buildDriverSettlementMoneyContext({
    shiftMode: 'multi_register',
    depositTarget: 'other_vault',
    drawerSession: { uuid: 'sess-1', register: { uuid: 'reg-1' } },
  }),
  {},
);

assert.deepEqual(
  buildDriverSettlementMoneyContext({
    shiftMode: 'legacy_shared_drawer',
    depositTarget: 'current_drawer',
    drawerSession: { uuid: 'sess-1', register: { uuid: 'reg-1' } },
  }),
  {},
);

assert.equal(
  driverSettlementRegisterSessionRequired({
    shiftMode: 'multi_register',
    depositTarget: 'current_drawer',
    moneyContext: {},
  }),
  true,
);

assert.equal(
  driverSettlementRegisterSessionRequired({
    shiftMode: 'multi_register',
    depositTarget: 'current_drawer',
    moneyContext: stamped,
  }),
  false,
);

console.log('buildDriverSettlementMoneyContext.spec.ts: OK');
