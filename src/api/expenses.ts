import type {
  Expense,
  ExpenseCategory,
  ExpenseCreateInput,
  ExpenseListPayload,
  ExpensePaymentInput,
  ExpensePaymentLine,
  RecurringExpense,
  RecurringExpensePage,
} from '@/types/expenses';
import type { ListParams } from '@/types/api';
import { del, get, post, put } from './client';

export const expensesAPI = {
  getAll: (params?: ListParams) => get<ExpenseListPayload>('/expenses', params),
  getById: (id: number) => get<Expense>(`/expenses/${id}`),
  create: (data: ExpenseCreateInput) => post<Expense>('/expenses', data),
  cancel: (id: number) => post(`/expenses/${id}/cancel`),
  pay: (id: number, data: ExpensePaymentInput) => post<ExpensePaymentLine>(`/expenses/${id}/payments`, data),
  reversePayment: (expenseId: number, paymentId: string, reason: string) =>
    post<ExpensePaymentLine>(`/expenses/${expenseId}/payments/${paymentId}/reverse`, { reason }),
  getCategories: (params?: ListParams) => get<ExpenseCategory[]>('/expense-categories', params),
  createCategory: (data: Record<string, unknown>) => post('/expense-categories', data),
  updateCategory: (id: number, data: Record<string, unknown>) => put(`/expense-categories/${id}`, data),
  deleteCategory: (id: number) => del(`/expense-categories/${id}`),
  getRecurring: (params?: ListParams) => get<RecurringExpensePage>('/recurring-expenses', params),
  createRecurring: (data: Record<string, unknown>) => post<RecurringExpense>('/recurring-expenses', data),
  updateRecurring: (id: string, data: Record<string, unknown>) => put<RecurringExpense>(`/recurring-expenses/${id}`, data),
  deleteRecurring: (id: string) => del(`/recurring-expenses/${id}`),
};
