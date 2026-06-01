export type Role = 'SUPER_ADMIN' | 'PRINCIPAL' | 'ACCOUNTANT' | 'TEACHER';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}
