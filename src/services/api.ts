/// <reference types="vite/client" />
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const signupApi = {
  verifyPan: (data: unknown) => api.post('/signup/verify-pan', data),
  saveContact: (data: unknown) => api.post('/signup/save-contact', data),
  verifyOtp: (sessionId: string, otp: string) => api.post('/signup/verify-otp', { sessionId, otp }),
  resendOtp: (sessionId: string) => api.post('/signup/resend-otp', { sessionId }),
};

export const lgdApi = {
  states: () => api.get('/lgd/states'),
  districts: (stateId: number) => api.get(`/lgd/districts/${stateId}`),
  subDistricts: (districtId: number) => api.get(`/lgd/sub-districts/${districtId}`),
};

export const registrationTypesApi = {
  list: () => api.get('/registration-types'),
};
