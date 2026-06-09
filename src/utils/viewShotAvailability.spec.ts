/**
 * Run: npx tsx src/utils/viewShotAvailability.spec.ts
 */
import assert from 'node:assert/strict';
import { VIEW_SHOT_UNAVAILABLE_MESSAGE } from './viewShotMessages';

function testUnavailableMessageMentionsRebuild() {
  assert.ok(VIEW_SHOT_UNAVAILABLE_MESSAGE.includes('Dev Client'));
  assert.ok(VIEW_SHOT_UNAVAILABLE_MESSAGE.includes('view-shot'));
}

testUnavailableMessageMentionsRebuild();

console.log('viewShotAvailability.spec.ts: OK');
