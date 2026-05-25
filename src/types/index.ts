export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'EIA_ADMIN' | 'SUB_EIA_ADMIN' | 'OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgName?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
