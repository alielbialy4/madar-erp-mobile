import type { AuthSession, User } from '@/types/api';
import { get, post, put } from './client';

type LoginCredentials = {
  email?: string;
  phone?: string;
  password: string;
};

export const authAPI = {
  login: (credentials: LoginCredentials, headers?: Record<string, string>) =>
    post<AuthSession>('/auth/login', credentials, headers),
  mobileLogin: (credentials: LoginCredentials) => post<AuthSession>('/auth/mobile-login', credentials),
  logout: () => post('/auth/logout'),
  me: () => get<{ user: User }>('/auth/me'),
  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) => post('/auth/change-password', data),
  updateProfile: (data: { name: string; email: string; phone?: string }) => put<{ user: User }>('/auth/profile', data),
};
