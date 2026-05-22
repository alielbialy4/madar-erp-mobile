import type { ListParams, Vault } from '@/types/api';
import { del, get, post, put } from './client';

export const vaultsAPI = {
  list: (params?: ListParams) => get<Vault[]>('/vaults', params),
  get: (id: string) => get<Vault>(`/vaults/${id}`),
  create: (payload: Record<string, unknown>) => post<Vault>('/vaults', payload),
  update: (id: string, payload: Record<string, unknown>) => put<Vault>(`/vaults/${id}`, payload),
  delete: (id: string) => del(`/vaults/${id}`),
  transactions: (vaultId: string, params?: ListParams) => get(`/vaults/${vaultId}/transactions`, params),
  transactionsAll: (params?: ListParams) => get('/vault-transactions', params),
  transactionById: (id: string) => get(`/vault-transactions/${id}`),
};
