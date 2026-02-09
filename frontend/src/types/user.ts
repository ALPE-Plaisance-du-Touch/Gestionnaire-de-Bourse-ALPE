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
  address: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  isLocalResident: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  address?: string | null;
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
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
}
