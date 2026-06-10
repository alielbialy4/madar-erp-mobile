/**
 * Run: npx tsx src/navigation/viewModeRoutePolicy.spec.ts
 */
import assert from 'node:assert/strict';
import {
  __resetViewModePolicyCacheForTests,
  getAllowedModesForMoreScreen,
  getAllowedModesForPosScreen,
  getAllowedModesForWebRoute,
  isViewModeAllowed,
} from './viewModeRoutePolicy';

function run(): void {
  __resetViewModePolicyCacheForTests();

  assert.deepEqual(getAllowedModesForMoreScreen('BranchesList'), ['global']);
  assert.deepEqual(getAllowedModesForMoreScreen('BranchForm'), ['global']);
  assert.deepEqual(getAllowedModesForMoreScreen('BackupInfo'), ['global']);

  assert.deepEqual(getAllowedModesForPosScreen('POSHome'), ['branch']);
  assert.deepEqual(getAllowedModesForMoreScreen('Kitchen'), ['branch']);
  assert.deepEqual(getAllowedModesForMoreScreen('WaiterPos'), ['branch']);
  assert.deepEqual(getAllowedModesForMoreScreen('BarcodePrintInfo'), ['branch']);

  assert.deepEqual(getAllowedModesForMoreScreen('Inventory'), ['global', 'branch']);
  assert.deepEqual(getAllowedModesForMoreScreen('Warehouses'), ['global', 'branch']);
  assert.deepEqual(getAllowedModesForWebRoute('/inventory'), ['global', 'branch']);

  assert.deepEqual(getAllowedModesForWebRoute('/pos'), ['branch']);
  assert.deepEqual(getAllowedModesForWebRoute('/dining-halls'), ['branch']);
  assert.deepEqual(getAllowedModesForWebRoute('/branches'), ['global']);

  assert.equal(isViewModeAllowed(['global'], 'global'), true);
  assert.equal(isViewModeAllowed(['global'], 'branch'), false);

  console.log('viewModeRoutePolicy.spec.ts: all assertions passed');
}

run();
