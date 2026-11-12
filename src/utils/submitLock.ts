export type SubmitLock = { current: boolean };

/** Acquire synchronously so two presses in one render cannot start duplicate requests. */
export function tryAcquireSubmitLock(lock: SubmitLock): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}
