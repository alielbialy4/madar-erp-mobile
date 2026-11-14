/** Mirrors front/src/utils/registerSessionIdentity.ts for mobile register gate isolation. */

type SessionLike = {
  cashier?: { id?: number | null; name?: string | null } | null;
} | null | undefined;

export function canResumeRegisterSession(
  session: SessionLike,
  currentUserId?: number | null,
): boolean {
  if (!session) return false;
  const ownerId = session.cashier?.id;
  return typeof ownerId === 'number' && ownerId === currentUserId;
}

export function isRegisterOccupiedByAnotherCashier(
  session: SessionLike,
  currentUserId?: number | null,
): boolean {
  if (!session) return false;
  return !canResumeRegisterSession(session, currentUserId);
}
