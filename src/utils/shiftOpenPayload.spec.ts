import assert from 'node:assert/strict';
import {
  buildOpenNextShiftPayload,
  buildShiftOpenPayload,
  isCashSourceAccount,
} from './shiftOpenPayload';

function run() {
  const retained = buildShiftOpenPayload({
    isMultiRegister: false,
    vaultId: 'v1',
    startingCash: '150.5',
    openingCashSource: 'retained_in_drawer',
  });
  assert.equal(retained.ok, true);
  if (retained.ok) {
    assert.deepEqual(retained.payload, {
      vault_id: 'v1',
      starting_cash: 150.5,
      opening_cash_source: 'retained_in_drawer',
    });
  }

  const transfer = buildShiftOpenPayload({
    isMultiRegister: false,
    vaultId: 'v1',
    startingCash: '200',
    openingCashSource: 'internal_transfer',
    sourceAccountId: 'fa-9',
    openingReference: ' float ',
    forUserId: 42,
    includePrintSequenceStart: true,
    printSequenceStart: '7',
  });
  assert.equal(transfer.ok, true);
  if (transfer.ok) {
    assert.deepEqual(transfer.payload, {
      vault_id: 'v1',
      starting_cash: 200,
      opening_cash_source: 'internal_transfer',
      opening_source_financial_account_id: 'fa-9',
      opening_reference: 'float',
      for_user_id: 42,
      print_sequence_start: 7,
    });
  }

  const missingSource = buildShiftOpenPayload({
    isMultiRegister: false,
    vaultId: 'v1',
    startingCash: '10',
    openingCashSource: 'internal_transfer',
  });
  assert.equal(missingSource.ok, false);
  if (!missingSource.ok) assert.equal(missingSource.error, 'missing_source_account');

  const zero = buildShiftOpenPayload({
    isMultiRegister: false,
    vaultId: 'v1',
    startingCash: '999',
    openingCashSource: 'zero',
  });
  assert.equal(zero.ok, true);
  if (zero.ok) {
    assert.equal(zero.payload.starting_cash, 0);
    assert.equal(zero.payload.opening_cash_source, 'zero');
  }

  const multi = buildShiftOpenPayload({
    isMultiRegister: true,
    vaultId: null,
    startingCash: '50',
    openingCashSource: 'retained_in_drawer',
  });
  assert.equal(multi.ok, true);
  if (multi.ok) {
    assert.deepEqual(multi.payload, {
      starting_cash: 0,
      opening_cash_source: 'zero',
    });
  }

  const next = buildOpenNextShiftPayload({ vaultId: 'v2', startingCash: 80 });
  assert.deepEqual(next, {
    vault_id: 'v2',
    starting_cash: 80,
    opening_cash_source: 'manual',
  });

  assert.equal(isCashSourceAccount({ payment_method: 'cash' }), true);
  assert.equal(isCashSourceAccount({ account_type: 'cash_vault' }), true);
  assert.equal(isCashSourceAccount({ payment_method: 'card', account_type: 'bank' }), false);

  console.log('shiftOpenPayload.spec.ts: ok');
}

run();
