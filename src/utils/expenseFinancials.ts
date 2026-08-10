import type { Expense, ExpensePaymentLine } from '@/types/expenses';

const MONEY_EPSILON = 0.00005;

export type ExpenseSplitDraft = {
  financial_account_id: string;
  amount: string | number;
};

export function activeExpensePaymentLines(expense: Pick<Expense, 'payment_lines' | 'paymentLines'>): ExpensePaymentLine[] {
  const rows = expense.payment_lines ?? expense.paymentLines ?? [];
  return rows.filter((line) => line.status !== 'reversed');
}

export function expensePaymentTotals(expense: Pick<Expense, 'amount' | 'payment_lines' | 'paymentLines'>): {
  total: number;
  paid: number;
  remaining: number;
} {
  const total = Math.max(0, Number(expense.amount) || 0);
  const paid = activeExpensePaymentLines(expense).reduce((sum, line) => sum + Math.max(0, Number(line.amount) || 0), 0);
  return {
    total,
    paid,
    remaining: Math.max(0, total - paid),
  };
}

export function validateExpenseSplit(
  totalInput: number | string,
  primaryAccountId: string | null,
  additionalLines: ExpenseSplitDraft[],
): { ok: true; primaryAmount: number; total: number } | { ok: false; error: string } {
  const total = Number(totalInput);
  if (!Number.isFinite(total) || total <= 0) return { ok: false, error: 'أدخل مبلغاً صحيحاً أكبر من صفر.' };
  if (!primaryAccountId) return { ok: false, error: 'اختر حساب الدفع الأساسي.' };

  const accountIds = [primaryAccountId, ...additionalLines.map((line) => line.financial_account_id.trim())];
  if (accountIds.some((id) => !id)) return { ok: false, error: 'اختر حساباً لكل دفعة.' };
  if (new Set(accountIds).size !== accountIds.length) return { ok: false, error: 'لا يمكن تكرار حساب الدفع في أكثر من سطر.' };

  const parsed = additionalLines.map((line) => Number(line.amount));
  if (parsed.some((amount) => !Number.isFinite(amount) || amount <= 0)) {
    return { ok: false, error: 'كل دفعة إضافية يجب أن تكون أكبر من صفر.' };
  }

  const allocated = parsed.reduce((sum, amount) => sum + amount, 0);
  const primaryAmount = total - allocated;
  if (primaryAmount <= MONEY_EPSILON) {
    return { ok: false, error: 'إجمالي الدفعات الإضافية يجب أن يكون أقل من مبلغ المصروف.' };
  }

  return { ok: true, primaryAmount, total };
}

