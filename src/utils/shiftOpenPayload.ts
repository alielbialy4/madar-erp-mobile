export type OpeningCashSourceUi = 'retained_in_drawer' | 'internal_transfer' | 'zero';

export type ShiftOpenPayload = {
  vault_id?: string;
  starting_cash: number;
  opening_cash_source: OpeningCashSourceUi | 'manual' | 'vault' | 'zero';
  opening_source_financial_account_id?: string;
  opening_reference?: string;
  for_user_id?: number;
  print_sequence_start?: number;
};

export type BuildShiftOpenPayloadInput = {
  isMultiRegister: boolean;
  vaultId?: string | null;
  startingCash: string;
  openingCashSource: OpeningCashSourceUi;
  sourceAccountId?: string | null;
  openingReference?: string;
  forUserId?: number;
  printSequenceStart?: string | null;
  includePrintSequenceStart?: boolean;
};

export type ShiftOpenPayloadError =
  | 'invalid_starting_cash'
  | 'missing_source_account'
  | 'transfer_requires_positive_cash'
  | 'missing_vault';

/** Build POST /shifts/open body to match web OpenShiftModal / CloseShiftModal open-next. */
export function buildShiftOpenPayload(
  input: BuildShiftOpenPayloadInput,
): { ok: true; payload: ShiftOpenPayload } | { ok: false; error: ShiftOpenPayloadError } {
  const {
    isMultiRegister,
    vaultId,
    startingCash,
    openingCashSource,
    sourceAccountId,
    openingReference,
    forUserId,
    printSequenceStart,
    includePrintSequenceStart,
  } = input;

  if (isMultiRegister) {
    return {
      ok: true,
      payload: {
        ...(vaultId ? { vault_id: vaultId } : {}),
        starting_cash: 0,
        opening_cash_source: 'zero',
        ...(forUserId != null ? { for_user_id: forUserId } : {}),
      },
    };
  }

  if (!vaultId) {
    return { ok: false, error: 'missing_vault' };
  }

  const amount =
    openingCashSource === 'zero' ? 0 : Number(String(startingCash).trim() === '' ? 'NaN' : startingCash);
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'invalid_starting_cash' };
  }

  if (openingCashSource === 'internal_transfer' && !sourceAccountId) {
    return { ok: false, error: 'missing_source_account' };
  }
  if (openingCashSource === 'internal_transfer' && amount <= 0) {
    return { ok: false, error: 'transfer_requires_positive_cash' };
  }

  const payload: ShiftOpenPayload = {
    vault_id: vaultId,
    starting_cash: amount,
    opening_cash_source: openingCashSource,
  };

  if (openingCashSource === 'internal_transfer' && sourceAccountId) {
    payload.opening_source_financial_account_id = sourceAccountId;
  }
  const ref = openingReference?.trim();
  if (ref) payload.opening_reference = ref;
  if (forUserId != null) payload.for_user_id = forUserId;
  if (includePrintSequenceStart && printSequenceStart != null && String(printSequenceStart).trim() !== '') {
    const n = Number(printSequenceStart);
    if (Number.isFinite(n) && n >= 1) payload.print_sequence_start = n;
  }

  return { ok: true, payload };
}

/** Open-next after close: web always uses opening_cash_source: 'manual'. */
export function buildOpenNextShiftPayload(input: {
  vaultId: string;
  startingCash: number;
}): ShiftOpenPayload {
  return {
    vault_id: input.vaultId,
    starting_cash: input.startingCash,
    opening_cash_source: 'manual',
  };
}

export function isCashSourceAccount(account: {
  payment_method?: string | null;
  account_type?: string | null;
}): boolean {
  return (
    account.payment_method === 'cash' ||
    account.account_type === 'cash_vault' ||
    account.account_type === 'cash_drawer'
  );
}
