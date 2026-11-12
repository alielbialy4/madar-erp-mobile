import assert from 'node:assert/strict';
import type { User } from '@/types/api';
import { canCreateSupplierPayment, canReverseSupplierPayment } from './supplierPaymentPermissions';

const userWith = (...permissions: string[]) => ({ permissions } as User);

assert.equal(canCreateSupplierPayment(userWith('manage_supplier_payments')), true);
assert.equal(canCreateSupplierPayment(userWith('pay_supplier')), true);
assert.equal(canCreateSupplierPayment(userWith('manage_suppliers')), false);
assert.equal(canCreateSupplierPayment(userWith('manage_purchases')), false);
assert.equal(canReverseSupplierPayment(userWith('reverse_supplier_payment')), true);
assert.equal(canReverseSupplierPayment(userWith('manage_supplier_payments')), false);
assert.equal(canReverseSupplierPayment(userWith('pay_supplier')), false);

console.log('supplierPaymentPermissions.spec.ts: OK');
