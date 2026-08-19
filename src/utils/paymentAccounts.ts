import type { FinancialAccount, SalePaymentLine } from '@/types/api';

export type CanonicalSplitLine = {
  financial_account_id?: string | null;
  vault_id?: string | null;
  amount: string | number;
  payment_method: string;
};

export type PosCashTargetMode = 'legacy_shift_vault' | 'register_session_drawer';

export type PosCashTargetContext = {
  mode: PosCashTargetMode;
  shiftVaultId: string;
  sessionDrawerAccountId: string | null;
};

const CUSTOMER_WALLET = 'wallet';
const NO_ACCOUNT_METHODS = new Set(['wallet', 'credit', 'layaway']);

export function resolvePosCashTarget(input: {
  registerMode?: string | null;
  shiftVaultId?: string | null;
  sessionDrawerAccountId?: string | null;
  hasActiveRegisterSession?: boolean;
} = {}): PosCashTargetContext {
  const shiftVaultId = String(input.shiftVaultId ?? '');
  const sessionDrawerAccountId = input.sessionDrawerAccountId
    ? String(input.sessionDrawerAccountId)
    : null;
  const isMultiRegister = input.registerMode === 'multi_register';
  const hasSession = Boolean(input.hasActiveRegisterSession) && Boolean(sessionDrawerAccountId);

  if (isMultiRegister && hasSession && sessionDrawerAccountId) {
    return {
      mode: 'register_session_drawer',
      shiftVaultId,
      sessionDrawerAccountId,
    };
  }

  return {
    mode: 'legacy_shift_vault',
    shiftVaultId,
    sessionDrawerAccountId: null,
  };
}

function normalizeCashTarget(cashTarget?: string | PosCashTargetContext | null): PosCashTargetContext {
  if (typeof cashTarget === 'object' && cashTarget !== null) {
    return cashTarget;
  }
  return resolvePosCashTarget({ shiftVaultId: cashTarget ?? '' });
}

function matchesCashAccount(
  account: FinancialAccount,
  cashTarget: PosCashTargetContext,
): boolean {
  if (account.payment_method !== 'cash') return false;
  if (cashTarget.mode === 'register_session_drawer') {
    return account.id === cashTarget.sessionDrawerAccountId;
  }
  return !cashTarget.shiftVaultId || account.legacy_vault_id === cashTarget.shiftVaultId;
}

export function availablePaymentAccounts(
  accounts: FinancialAccount[],
  paymentMethod: string,
  cashTarget?: string | PosCashTargetContext | null,
): FinancialAccount[] {
  const resolvedCashTarget = normalizeCashTarget(cashTarget);
  return accounts.filter(
    (account) => account.payment_method === paymentMethod
      && account.is_active !== false
      && account.allow_sales !== false
      && (paymentMethod !== 'cash' || matchesCashAccount(account, resolvedCashTarget)),
  );
}

export function defaultPaymentAccount(
  accounts: FinancialAccount[],
  paymentMethod: string,
  cashTarget?: string | PosCashTargetContext | null,
): FinancialAccount | undefined {
  const eligible = availablePaymentAccounts(accounts, paymentMethod, cashTarget);
  if (paymentMethod === 'cash' && normalizeCashTarget(cashTarget).mode === 'register_session_drawer') {
    return eligible[0];
  }
  return eligible.find((account) => account.is_default) ?? eligible[0];
}

export function buildCanonicalPaymentLine(input: {
  accounts: FinancialAccount[];
  paymentMethod: string;
  accountId?: string | null;
  amount: number;
  shiftVaultId?: string | null;
  cashTarget?: PosCashTargetContext;
}): SalePaymentLine | null {
  if (input.amount <= 0 || NO_ACCOUNT_METHODS.has(input.paymentMethod)) return null;
  const cashTarget = input.cashTarget
    ?? resolvePosCashTarget({ shiftVaultId: input.shiftVaultId });
  const account = availablePaymentAccounts(input.accounts, input.paymentMethod, cashTarget)
    .find((row) => row.id === input.accountId);
  if (!account) return null;
  return {
    financial_account_id: account.id,
    vault_id: input.paymentMethod === 'cash' ? account.legacy_vault_id ?? null : null,
    amount: input.amount,
    payment_method: input.paymentMethod,
  };
}

export function buildCanonicalSplitPaymentLines(
  splitLines: CanonicalSplitLine[],
  accounts: FinancialAccount[],
  cashTarget?: string | PosCashTargetContext | null,
): SalePaymentLine[] {
  const resolvedCashTarget = normalizeCashTarget(cashTarget);
  return splitLines
    .filter((line) => Number(line.amount) > 0)
    .map((line) => {
      const account = line.payment_method === CUSTOMER_WALLET
        ? undefined
        : availablePaymentAccounts(accounts, line.payment_method, resolvedCashTarget)
          .find((row) => row.id === line.financial_account_id);
      return {
        ...(account ? { financial_account_id: account.id } : { financial_account_id: null }),
        ...(line.payment_method === 'cash' && account?.legacy_vault_id ? { vault_id: account.legacy_vault_id } : {}),
        amount: Number(line.amount),
        payment_method: line.payment_method,
      };
    });
}
