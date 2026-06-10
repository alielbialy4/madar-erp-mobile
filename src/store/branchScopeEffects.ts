import { resetAppNavigationOnScopeChange } from '@/navigation/nestedTabNavigation';
import { usePosStore } from '@/store/posStore';
import { usePrintStore } from '@/store/printStore';

/** Mirrors web `branchChanged` slice resets + full navigation reload after scope switch. */
export function onBranchScopeChanged(): void {
  usePosStore.getState().resetSession();
  usePrintStore.getState().reset();
  void usePrintStore.getState().refresh();
  resetAppNavigationOnScopeChange();
}
