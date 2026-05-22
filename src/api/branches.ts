import type { Branch, User } from '@/types/api';
import { get, put } from './client';

export const branchesAPI = {
  listAccessible: () => get<{ branches: Branch[] }>('/auth/branches'),
  switchCurrent: (branchId: string | null) => put<{ user: User }>('/auth/current-branch', { branch_id: branchId }, branchId ? { 'X-Branch-Id': branchId } : undefined),
  listManage: () => get<Branch[]>('/branches'),
  get: (id: string) => get<Branch>(`/branches/${id}`),
  summary: (id: string) => get(`/branches/${id}/summary`),
};
