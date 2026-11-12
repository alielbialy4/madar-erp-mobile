import assert from 'node:assert/strict';
import {
  buildSupplierPaymentCreatePayload,
  buildSupplierPaymentReversePayload,
  isReversibleSupplierPayment,
} from './supplierPaymentPayload';

function run() {
  const ok = buildSupplierPaymentCreatePayload({
    supplierId: '12',
    amount: '150.5',
    paymentDate: '2026-11-10',
    financialAccountId: 'fa-1',
    paymentMethod: 'cash',
    linkedVaultId: 'vault-9',
    purchaseId: '44',
    referenceNo: ' REF ',
    notes: ' note ',
    clientUuid: 'uuid-1',
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.deepEqual(ok.payload, {
      client_uuid: 'uuid-1',
      supplier_id: 12,
      purchase_id: 44,
      financial_account_id: 'fa-1',
      vault_id: 'vault-9',
      amount: 150.5,
      payment_date: '2026-11-10',
      payment_method: 'cash',
      reference_no: 'REF',
      notes: 'note',
    });
  }

  const bad = buildSupplierPaymentCreatePayload({
    supplierId: '',
    amount: '0',
    paymentDate: '',
    financialAccountId: '',
    clientUuid: 'x',
  });
  assert.equal(bad.ok, false);

  const reverse = buildSupplierPaymentReversePayload({ reason: 'خطأ إدخال', clientUuid: 'uuid-2' });
  assert.equal(reverse.ok, true);
  if (reverse.ok) {
    assert.deepEqual(reverse.payload, { reason: 'خطأ إدخال', client_uuid: 'uuid-2' });
  }
  assert.equal(buildSupplierPaymentReversePayload({ reason: 'ab', clientUuid: 'u' }).ok, false);

  assert.equal(isReversibleSupplierPayment({ status: 'posted' }), true);
  assert.equal(isReversibleSupplierPayment({ status: 'reversed' }), false);
  assert.equal(isReversibleSupplierPayment({ is_reversed: true }), false);

  console.log('supplierPaymentPayload.spec.ts: ok');
}

run();
