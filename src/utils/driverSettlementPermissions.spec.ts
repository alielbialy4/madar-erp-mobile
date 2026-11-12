import assert from 'node:assert/strict';
import type { User } from '@/types/api';
import { canCreateDriverSettlement } from './driverSettlementPermissions';

const userWith = (...permissions: string[]) => ({ permissions } as User);

assert.equal(canCreateDriverSettlement(userWith('delivery_settle')), true);
assert.equal(canCreateDriverSettlement(userWith('delivery_view_settlements')), false);
assert.equal(canCreateDriverSettlement(userWith('manage_deliveries')), false);
assert.equal(canCreateDriverSettlement(userWith('manage_drivers')), false);
assert.equal(canCreateDriverSettlement(userWith('manage_driver_settlements')), false);
assert.equal(canCreateDriverSettlement({ roles: ['owner'] } as User), true);

console.log('driverSettlementPermissions.spec.ts: OK');
