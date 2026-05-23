import type { ListParams, Vault } from '@/types/api';
import { del, get, post, put } from './client';

export type VaultTransaction = Record<string, unknown> & {
  id?: string | number;
  type?: string | null;
  amount?: string | number | null;
  description?: string | null;
  reference?: string | null;
  reference_no?: string | null;
  transaction_date?: string | null;
  created_at?: string | null;
  vault?: { name?: string | null } | null;
};

export const vaultsAPI = {
  list: (params?: ListParams) => get<Vault[]>('/vaults', params),
  get: (id: string) => get<Vault>(`/vaults/${id}`),
  create: (payload: Record<string, unknown>) => post<Vault>('/vaults', payload),
  update: (id: string, payload: Record<string, unknown>) => put<Vault>(`/vaults/${id}`, payload),
  delete: (id: string) => del(`/vaults/${id}`),
  transactions: (vaultId: string, params?: ListParams) => get<VaultTransaction[]>(`/vaults/${vaultId}/transactions`, params),
  transactionsAll: (params?: ListParams) => get<VaultTransaction[]>('/vault-transactions', params),
  transactionById: (id: string) => get<VaultTransaction>(`/vault-transactions/${id}`),
};
