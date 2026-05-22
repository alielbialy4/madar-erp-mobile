import { get, post } from './client';

export const walletAPI = {
  getBalance: (customerId: number) => get<{ wallet_balance: number; points_balance?: number }>(`/customers/${customerId}/wallet`),
  deposit: (customerId: number, data: { amount: number; description?: string }) => post(`/customers/${customerId}/wallet/deposit`, data),
  withdraw: (customerId: number, data: { amount: number; description?: string }) => post(`/customers/${customerId}/wallet/withdraw`, data),
};
