import { get, put } from './client';

export const tenantAPI = {
  info: () => get('/tenant/info'),
  getTheme: () => get('/tenant/theme'),
  updateTheme: (primary_hex: string) => put('/tenant/theme', { primary_hex }),
};
