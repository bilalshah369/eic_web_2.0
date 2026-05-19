import { useState, useEffect } from 'react';
import { authApi, RegisterPayload } from '../services/auth.service';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then(({ data }) => setUser(data.data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data;
  };

  const register = async (payload: RegisterPayload) => {
    const { data } = await authApi.register(payload);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data;
  };

  const logout = async () => {
    await authApi.logout().catch(() => null);
    localStorage.clear();
    setUser(null);
  };

  return { user, loading, login, register, logout, isAuthenticated: !!user };
};
