export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  auth_provider?: 'local' | 'google' | string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Token válasz az auth végpontokról (/auth/register, /auth/login, /auth/refresh)
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: AuthUser;
}

export type SessionListener = (session: AuthSession | null) => void;
