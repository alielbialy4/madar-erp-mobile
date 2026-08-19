import { get, post } from './client';

export type WalletTransaction = {
  id: number | string;
  type?: string | null;
  amount?: number | string | null;
  balance_after?: number | string | null;
  description?: string | null;
  created_at?: string | null;
  shift_id?: string | null;
  shift?: Record<string, unknown> | null;
  branch?: { name?: string | null } | null;
};

export const walletAPI = {
  getBalance: (customerId: number) => get<{ wallet_balance: number; points_balance?: number }>(`/customers/${customerId}/wallet`),
  deposit: (customerId: number, data: { amount: number; description?: string; pos_register_id?: string; register_session_id?: string }) =>
    post(`/customers/${customerId}/wallet/deposit`, data),
  withdraw: (customerId: number, data: { amount: number; description?: string; pos_register_id?: string; register_session_id?: string }) =>
    post(`/customers/${customerId}/wallet/withdraw`, data),
  transactions: (customerId: number, params?: Record<string, unknown>) => get<WalletTransaction[]>(`/customers/${customerId}/wallet/transactions`, params),
};
