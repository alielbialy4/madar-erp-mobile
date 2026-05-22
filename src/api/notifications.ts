import { del, get, post } from './client';

export const notificationsAPI = {
  getAll: (params?: Record<string, unknown>) => get<Record<string, unknown>[]>('/notifications', params),
  getSummary: () => get('/notifications/summary'),
  getUnreadCount: () => get('/notifications/unread-count'),
  markAsRead: (id: number) => post(`/notifications/${id}/read`),
  markAllAsRead: () => post('/notifications/read-all'),
  delete: (id: number) => del(`/notifications/${id}`),
  clearAll: () => del('/notifications'),
};
