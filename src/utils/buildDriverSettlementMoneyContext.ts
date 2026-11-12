import type { DriverSettlementDepositTarget } from '@/utils/driverSettlementPayload';

export type DriverSettlementMoneyContext = {
  pos_register_id?: string;
  register_session_id?: string;
};

/** Web `requiresRegisterSessionForDrawer` — multi-register drawer deposits need a session. */
export function requiresRegisterSessionForDrawer(mode?: string | null): boolean {
  return mode === 'multi_register';
}

/**
 * Match web `buildDriverSettlementMoneyContext`:
 * only stamp register money fields for multi-register + current_drawer deposits.
 */
export function buildDriverSettlementMoneyContext(input: {
  shiftMode?: string | null;
  depositTarget: DriverSettlementDepositTarget;
  drawerSession?: {
    uuid?: string | null;
    register?: { uuid?: string | null } | null;
  } | null;
  fallbackRegisterId?: string | null;
  fallbackSessionId?: string | null;
}): DriverSettlementMoneyContext {
  if (!requiresRegisterSessionForDrawer(input.shiftMode)) {
    return {};
  }
  if (input.depositTarget !== 'current_drawer') {
    return {};
  }
  const sessionId = input.drawerSession?.uuid ?? input.fallbackSessionId ?? null;
  const registerId =
    input.drawerSession?.register?.uuid ?? input.fallbackRegisterId ?? null;
  return {
    ...(registerId ? { pos_register_id: String(registerId) } : {}),
    ...(sessionId ? { register_session_id: String(sessionId) } : {}),
  };
}

export function driverSettlementRegisterSessionRequired(input: {
  shiftMode?: string | null;
  depositTarget: DriverSettlementDepositTarget;
  moneyContext: DriverSettlementMoneyContext;
}): boolean {
  if (!requiresRegisterSessionForDrawer(input.shiftMode)) return false;
  if (input.depositTarget !== 'current_drawer') return false;
  return !input.moneyContext.register_session_id;
}
