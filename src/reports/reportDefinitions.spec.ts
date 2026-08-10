import assert from 'node:assert/strict';
import { getReportDefinition } from './reportDefinitions';

const deviceManifest = getReportDefinition('operations-device-sync-manifest');
assert.equal(deviceManifest?.webRoute, '/reports/operations/device-sync-manifest');
assert.equal(deviceManifest?.apiMethod, 'posDeviceSyncManifest');
assert.equal(
  deviceManifest?.sections[0]?.extractRows({ data: { devices: [{ device_id: 'd-1', pending_count: 0, failed_count: 0 }] } })[0]?.device_id,
  'd-1',
);

const drawerReconciliation = getReportDefinition('operations-drawer-reconciliation');
assert.equal(drawerReconciliation?.webRoute, '/reports/operations/drawer-reconciliation');
assert.equal(drawerReconciliation?.apiMethod, 'drawerReconciliation');
assert.equal(drawerReconciliation?.sections.length, 2);

console.log('reportDefinitions.spec.ts: OK');
