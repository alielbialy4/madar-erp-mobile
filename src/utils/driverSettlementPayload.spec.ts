import assert from 'node:assert/strict';
import { buildDriverSettlementPayload } from './driverSettlementPayload';

function run() {
  const drawer = buildDriverSettlementPayload({
    branchId: 'b1',
    driverId: 'd1',
    deliveryIds: ['del-1', 'del-2'],
    amountReceived: '120.5',
    depositTarget: 'current_drawer',
    hasOpenShift: true,
    clientUuid: 'uuid-1',
    notes: ' ok ',
  });
  assert.equal(drawer.ok, true);
  if (drawer.ok) {
    assert.deepEqual(drawer.payload, {
      branch_id: 'b1',
      driver_id: 'd1',
      delivery_ids: ['del-1', 'del-2'],
      amount_received: 120.5,
      deposit_target: 'current_drawer',
      client_uuid: 'uuid-1',
      notes: 'ok',
    });
  }

  const vaultMissingConfirm = buildDriverSettlementPayload({
    driverId: 'd1',
    deliveryIds: ['del-1'],
    amountReceived: '10',
    depositTarget: 'other_vault',
    vaultId: 'v1',
    confirmPhysicalVaultDeposit: false,
    hasOpenShift: false,
    clientUuid: 'u',
  });
  assert.equal(vaultMissingConfirm.ok, false);
  if (!vaultMissingConfirm.ok) assert.equal(vaultMissingConfirm.error, 'confirm_vault_required');

  const vaultOk = buildDriverSettlementPayload({
    driverId: 'd1',
    deliveryIds: ['del-1'],
    amountReceived: '10',
    depositTarget: 'other_vault',
    vaultId: 'v1',
    confirmPhysicalVaultDeposit: true,
    hasOpenShift: false,
    clientUuid: 'u2',
  });
  assert.equal(vaultOk.ok, true);
  if (vaultOk.ok) {
    assert.equal(vaultOk.payload.vault_id, 'v1');
    assert.equal(vaultOk.payload.confirm_physical_vault_deposit, true);
  }

  const noShift = buildDriverSettlementPayload({
    driverId: 'd1',
    deliveryIds: ['del-1'],
    amountReceived: '10',
    depositTarget: 'current_drawer',
    hasOpenShift: false,
    clientUuid: 'u3',
  });
  assert.equal(noShift.ok, false);
  if (!noShift.ok) assert.equal(noShift.error, 'no_open_shift');

  const withRegister = buildDriverSettlementPayload({
    driverId: 'd1',
    deliveryIds: ['del-1'],
    amountReceived: '10',
    depositTarget: 'current_drawer',
    hasOpenShift: true,
    clientUuid: 'u4',
    posRegisterId: 'reg-9',
    registerSessionId: 'sess-9',
  });
  assert.equal(withRegister.ok, true);
  if (withRegister.ok) {
    assert.equal(withRegister.payload.pos_register_id, 'reg-9');
    assert.equal(withRegister.payload.register_session_id, 'sess-9');
  }

  console.log('driverSettlementPayload.spec.ts: ok');
}

run();
