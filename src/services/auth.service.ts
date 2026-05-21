import { api } from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  mobile: string;
  pan: string;
  iec: string;
  gstin?: string;
  otp: string;
}

export const authApi = {
  sendOtp: (email: string, mobile: string) =>
    api.post('/auth/send-otp', { email, mobile }),

  register: (data: RegisterPayload) =>
    api.post('/auth/register', data),

  login: (data: LoginPayload) =>
    api.post('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};
