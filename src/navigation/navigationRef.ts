import { createNavigationContainerRef, type ParamListBase } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<ParamListBase>();

type ScopeResetListener = () => void;

const scopeResetListeners = new Set<ScopeResetListener>();

/** Register a callback fired after branch/global scope navigation reset. Returns unsubscribe. */
export function registerScopeResetListener(listener: ScopeResetListener): () => void {
  scopeResetListeners.add(listener);
  return () => {
    scopeResetListeners.delete(listener);
  };
}

export function notifyScopeResetListeners(): void {
  for (const listener of scopeResetListeners) {
    listener();
  }
}
