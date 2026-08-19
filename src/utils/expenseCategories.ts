export const SYSTEM_PAYROLL_CATEGORY_KEY = 'system_payroll';

export type ExpenseCategorySystemFields = {
  system_key?: string | null;
  is_active?: boolean;
};

export function isSystemPayrollCategory(
  category: ExpenseCategorySystemFields | null | undefined,
): boolean {
  return category?.system_key === SYSTEM_PAYROLL_CATEGORY_KEY;
}

export function isManualExpenseCategory(
  category: ExpenseCategorySystemFields | null | undefined,
): boolean {
  if (!category) return false;
  return !isSystemPayrollCategory(category);
}
