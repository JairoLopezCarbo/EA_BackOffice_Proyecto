export type AuthRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  enabled: boolean;
  role: AuthRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: {
    _id: string;
    name: string;
    surname: string;
    username: string;
    email: string;
    enabled: boolean;
    role: AuthRole;
  };
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}