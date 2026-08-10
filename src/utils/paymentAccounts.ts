import type { FinancialAccount, SalePaymentLine } from '@/types/api';

export type CanonicalSplitLine = {
  financial_account_id?: string | null;
  vault_id?: string | null;
  amount: string | number;
  payment_method: string;
};

const CUSTOMER_WALLET = 'wallet';
const NO_ACCOUNT_METHODS = new Set(['wallet', 'credit', 'layaway']);

export function availablePaymentAccounts(
  accounts: FinancialAccount[],
  paymentMethod: string,
  shiftVaultId?: string | null,
): FinancialAccount[] {
  return accounts.filter(
    (account) => account.payment_method === paymentMethod
      && account.is_active !== false
      && account.allow_sales !== false
      && (paymentMethod !== 'cash' || !shiftVaultId || account.legacy_vault_id === shiftVaultId),
  );
}

export function defaultPaymentAccount(
  accounts: FinancialAccount[],
  paymentMethod: string,
  shiftVaultId?: string | null,
): FinancialAccount | undefined {
  return availablePaymentAccounts(accounts, paymentMethod, shiftVaultId).find((account) => account.is_default)
    ?? availablePaymentAccounts(accounts, paymentMethod, shiftVaultId)[0];
}

export function buildCanonicalPaymentLine(input: {
  accounts: FinancialAccount[];
  paymentMethod: string;
  accountId?: string | null;
  amount: number;
  shiftVaultId?: string | null;
}): SalePaymentLine | null {
  if (input.amount <= 0 || NO_ACCOUNT_METHODS.has(input.paymentMethod)) return null;
  const account = availablePaymentAccounts(input.accounts, input.paymentMethod, input.shiftVaultId)
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
  shiftVaultId?: string | null,
): SalePaymentLine[] {
  return splitLines
    .filter((line) => Number(line.amount) > 0)
    .map((line) => {
      const account = line.payment_method === CUSTOMER_WALLET
        ? undefined
        : availablePaymentAccounts(accounts, line.payment_method, shiftVaultId)
          .find((row) => row.id === line.financial_account_id);
      return {
        ...(account ? { financial_account_id: account.id } : { financial_account_id: null }),
        ...(line.payment_method === 'cash' && account?.legacy_vault_id ? { vault_id: account.legacy_vault_id } : {}),
        amount: Number(line.amount),
        payment_method: line.payment_method,
      };
    });
}
