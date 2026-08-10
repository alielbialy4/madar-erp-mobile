import type { BudgetLine, BudgetLinePayload, BudgetSection } from '@/api/budgets';

export const BUDGET_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

export type BudgetGridRow = {
  key: string;
  section: BudgetSection;
  expense_category_id: number | null;
  label: string;
  sort_order: number;
  amounts: Record<number, number>;
};

const sectionOrder: Record<BudgetSection, number> = { revenue: 0, cogs: 1, labor: 2, opex: 3 };

export function linesToBudgetGrid(lines: BudgetLine[]): BudgetGridRow[] {
  const rows = new Map<string, BudgetGridRow>();
  for (const line of lines) {
    const categoryId = line.expense_category_id ?? null;
    const key = `${line.section}:${categoryId ?? 'none'}`;
    const current = rows.get(key) ?? {
      key,
      section: line.section,
      expense_category_id: categoryId,
      label: line.section === 'revenue' ? 'صافي المبيعات' : line.section === 'cogs' ? 'تكلفة المبيعات' : line.expense_category?.name || `فئة #${categoryId ?? '—'}`,
      sort_order: line.sort_order ?? 0,
      amounts: Object.fromEntries(BUDGET_MONTHS.map((month) => [month, 0])),
    };
    current.amounts[line.month] = Number(line.amount) || 0;
    current.sort_order = Math.min(current.sort_order, line.sort_order ?? 0);
    rows.set(key, current);
  }
  return [...rows.values()].sort((a, b) => sectionOrder[a.section] - sectionOrder[b.section] || a.sort_order - b.sort_order || a.label.localeCompare(b.label, 'ar'));
}

export function budgetGridToLines(rows: BudgetGridRow[]): BudgetLinePayload[] {
  return rows.flatMap((row, index) => BUDGET_MONTHS.map((month) => ({
    section: row.section,
    expense_category_id: row.expense_category_id,
    sort_order: row.sort_order || index * 10,
    month,
    amount: Number(row.amounts[month]) || 0,
  })));
}

export function budgetGridTotal(rows: BudgetGridRow[], section?: BudgetSection): number {
  return rows.filter((row) => !section || row.section === section).reduce(
    (sum, row) => sum + BUDGET_MONTHS.reduce((lineTotal, month) => lineTotal + (Number(row.amounts[month]) || 0), 0),
    0,
  );
}
