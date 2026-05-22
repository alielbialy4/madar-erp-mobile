import { del, get, post, put } from './client';

const p = '/mcp';

export const settingsAPI = {
  getUsers: (params?: Record<string, unknown>) => get(`${p}/users`, params),
  createUser: (data: Record<string, unknown>) => post(`${p}/users`, data),
  updateUser: (id: number, data: Record<string, unknown>) => put(`${p}/users/${id}`, data),
  deleteUser: (id: number) => del(`${p}/users/${id}`),
  getRoles: () => get(`${p}/roles`),
  syncUserRoles: (id: number, roles: string[]) => put(`${p}/users/${id}/roles`, { roles }),
};
