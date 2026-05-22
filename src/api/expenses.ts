import { del, get, post, put } from './client';

export const expensesAPI = {
  getAll: (params?: Record<string, unknown>) => get<Record<string, unknown>[]>('/expenses', params),
  getById: (id: number) => get<Record<string, unknown>>(`/expenses/${id}`),
  create: (data: Record<string, unknown>) => post('/expenses', data),
  update: (id: number, data: Record<string, unknown>) => put(`/expenses/${id}`, data),
  cancel: (id: number) => post(`/expenses/${id}/cancel`),
  getCategories: (params?: Record<string, unknown>) => get('/expense-categories', params),
  createCategory: (data: Record<string, unknown>) => post('/expense-categories', data),
  updateCategory: (id: number, data: Record<string, unknown>) => put(`/expense-categories/${id}`, data),
  deleteCategory: (id: number) => del(`/expense-categories/${id}`),
  getRecurring: (params?: Record<string, unknown>) => get('/recurring-expenses', params),
};
