/**
 * User and authentication types.
 */

export type UserRole = 'depositor' | 'volunteer' | 'manager' | 'administrator';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  isLocalResident: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ActivateAccountRequest {
  token: string;
  password: string;
  passwordConfirmation: string;
}
