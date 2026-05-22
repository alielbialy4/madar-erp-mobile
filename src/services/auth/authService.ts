import { authAPI } from '@/api/auth';

export const authService = {
  login: authAPI.login,
  logout: authAPI.logout,
  me: authAPI.me,
};
