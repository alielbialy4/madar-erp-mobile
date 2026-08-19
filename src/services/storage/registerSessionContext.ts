import { storageDelete, storageGet, storageSet } from './async';
import { storageKeys } from './keys';

export type SessionDrawerFaCache = {
  branchId: string;
  registerId: string;
  sessionId: string;
  drawerFaId: string;
};

export async function getSelectedPosRegisterId(): Promise<string | null> {
  return (await storageGet<string>(storageKeys.posSelectedRegisterId)) || null;
}

export async function setSelectedPosRegisterId(id: string | null): Promise<void> {
  if (id) await storageSet(storageKeys.posSelectedRegisterId, id);
  else {
    await storageDelete(storageKeys.posSelectedRegisterId);
    await clearCachedSessionDrawerFa();
  }
}

export async function getActiveRegisterSessionId(): Promise<string | null> {
  return (await storageGet<string>(storageKeys.posActiveRegisterSessionId)) || null;
}

export async function setActiveRegisterSessionId(id: string | null): Promise<void> {
  if (id) await storageSet(storageKeys.posActiveRegisterSessionId, id);
  else {
    await storageDelete(storageKeys.posActiveRegisterSessionId);
    await clearCachedSessionDrawerFa();
  }
}

export async function setCachedSessionDrawerFa(input: SessionDrawerFaCache): Promise<void> {
  await storageSet(storageKeys.posActiveSessionDrawerFa, input);
}

export async function clearCachedSessionDrawerFa(): Promise<void> {
  await storageDelete(storageKeys.posActiveSessionDrawerFa);
}

export async function getCachedSessionDrawerFaId(input: {
  branchId?: string | null;
  registerId?: string | null;
  sessionId?: string | null;
} = {}): Promise<string | null> {
  const cached = await storageGet<SessionDrawerFaCache>(storageKeys.posActiveSessionDrawerFa);
  if (!cached?.branchId || !cached.registerId || !cached.sessionId || !cached.drawerFaId) {
    return null;
  }

  const branchId = input.branchId ?? null;
  const registerId = input.registerId ?? (await getSelectedPosRegisterId());
  const sessionId = input.sessionId ?? (await getActiveRegisterSessionId());

  if (!branchId || !registerId || !sessionId) return null;
  if (
    cached.branchId !== String(branchId)
    || cached.registerId !== String(registerId)
    || cached.sessionId !== String(sessionId)
  ) {
    return null;
  }

  return cached.drawerFaId;
}

export function resolveSessionDrawerFinancialAccountId(input: {
  drawerFinancialAccountId?: string | null;
  cashDrawerFinancialAccountId?: string | null;
  registerCashDrawerFinancialAccountId?: string | null;
}): string | null {
  const candidates = [
    input.drawerFinancialAccountId,
    input.cashDrawerFinancialAccountId,
    input.registerCashDrawerFinancialAccountId,
  ];
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim() !== '') {
      return String(candidate);
    }
  }
  return null;
}

export async function getOrCreateMobilePosDeviceId(): Promise<string> {
  const existing = await storageGet<string>(storageKeys.posDeviceUuid);
  if (existing) return existing;
  const created = `mob-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  await storageSet(storageKeys.posDeviceUuid, created);
  return created;
}

export type RegisterMoneyContextOverride = {
  pos_register_id?: string | null;
  register_session_id?: string | null;
};

export async function registerMoneyContextFields(override?: RegisterMoneyContextOverride): Promise<{
  pos_register_id?: string;
  register_session_id?: string;
}> {
  const registerId = override && 'pos_register_id' in override
    ? override.pos_register_id
    : await getSelectedPosRegisterId();
  const sessionId = override && 'register_session_id' in override
    ? override.register_session_id
    : await getActiveRegisterSessionId();
  return {
    ...(registerId ? { pos_register_id: registerId } : {}),
    ...(sessionId ? { register_session_id: sessionId } : {}),
  };
}

export async function registerMoneyContextFromSession(session?: {
  uuid?: string | null;
  register?: { uuid?: string | null } | null;
} | null): Promise<{
  pos_register_id?: string;
  register_session_id?: string;
}> {
  if (session?.uuid) {
    return registerMoneyContextFields({
      register_session_id: session.uuid,
      pos_register_id: session.register?.uuid ?? (await getSelectedPosRegisterId()),
    });
  }
  return registerMoneyContextFields();
}

export function canActAsRegisterSupervisor(
  hasPermission: (name: string) => boolean,
  isSuperAdmin = false,
): boolean {
  return isSuperAdmin
    || hasPermission('manage_shifts')
    || hasPermission('access_admin_routes')
    || hasPermission('force_close_register_session');
}

export function canSelectAnyRegisterDrawer(
  hasPermission: (name: string) => boolean,
  isSuperAdmin = false,
): boolean {
  return canActAsRegisterSupervisor(hasPermission, isSuperAdmin);
}

export function isCashDrawerPaymentSource(source?: {
  simple_type?: string | null;
  account_type?: string | null;
} | null): boolean {
  return source?.simple_type === 'cash_drawer' || source?.account_type === 'cash_drawer';
}

export async function assertActiveRegisterSessionForSale(branchRegisterMode?: string | null): Promise<void> {
  if (branchRegisterMode !== 'multi_register') return;
  const registerId = await getSelectedPosRegisterId();
  const sessionId = await getActiveRegisterSessionId();
  if (!registerId || !sessionId) {
    throw new Error('register_session_required');
  }
}

export async function assertActiveRegisterSessionForCash(branchRegisterMode?: string | null): Promise<void> {
  return assertActiveRegisterSessionForSale(branchRegisterMode);
}
