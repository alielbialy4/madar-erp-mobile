export type DriverSettlementDepositTarget = 'current_drawer' | 'other_vault';

export type BuildDriverSettlementPayloadInput = {
  branchId?: string | null;
  driverId: string;
  deliveryIds: string[];
  amountReceived: string;
  depositTarget: DriverSettlementDepositTarget;
  vaultId?: string | null;
  confirmPhysicalVaultDeposit?: boolean;
  hasOpenShift: boolean;
  notes?: string;
  clientUuid: string;
  posRegisterId?: string | null;
  registerSessionId?: string | null;
};

export type DriverSettlementPayloadError =
  | 'missing_driver'
  | 'missing_deliveries'
  | 'invalid_amount'
  | 'missing_vault'
  | 'confirm_vault_required'
  | 'no_open_shift';

export type DriverSettlementCreatePayload = {
  branch_id?: string;
  driver_id: string;
  delivery_ids: string[];
  amount_received: number;
  deposit_target: DriverSettlementDepositTarget;
  confirm_physical_vault_deposit?: boolean;
  vault_id?: string;
  notes?: string;
  client_uuid: string;
  pos_register_id?: string;
  register_session_id?: string;
};

/** Build POST /driver-settlements body to match web DriverSettlements submitSettlement. */
export function buildDriverSettlementPayload(
  input: BuildDriverSettlementPayloadInput,
): { ok: true; payload: DriverSettlementCreatePayload } | { ok: false; error: DriverSettlementPayloadError } {
  if (!input.driverId.trim()) return { ok: false, error: 'missing_driver' };
  if (!input.deliveryIds.length) return { ok: false, error: 'missing_deliveries' };

  const amount = Number(input.amountReceived);
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: 'invalid_amount' };

  if (input.depositTarget === 'current_drawer' && !input.hasOpenShift) {
    return { ok: false, error: 'no_open_shift' };
  }
  if (input.depositTarget === 'other_vault' && !input.vaultId?.trim()) {
    return { ok: false, error: 'missing_vault' };
  }
  if (input.depositTarget === 'other_vault' && !input.confirmPhysicalVaultDeposit) {
    return { ok: false, error: 'confirm_vault_required' };
  }

  const payload: DriverSettlementCreatePayload = {
    driver_id: input.driverId.trim(),
    delivery_ids: [...input.deliveryIds],
    amount_received: amount,
    deposit_target: input.depositTarget,
    client_uuid: input.clientUuid,
  };
  if (input.branchId) payload.branch_id = input.branchId;
  if (input.depositTarget === 'other_vault') {
    payload.vault_id = String(input.vaultId);
    payload.confirm_physical_vault_deposit = true;
  }
  const notes = input.notes?.trim();
  if (notes) payload.notes = notes;
  if (input.depositTarget === 'current_drawer' && input.posRegisterId) {
    payload.pos_register_id = input.posRegisterId;
  }
  if (input.depositTarget === 'current_drawer' && input.registerSessionId) {
    payload.register_session_id = input.registerSessionId;
  }
  return { ok: true, payload };
}
