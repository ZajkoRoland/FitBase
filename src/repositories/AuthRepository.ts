import type { TokenResponse } from '@/lib/api/types';
import { googleAuthService } from '@/services/GoogleAuthService';
import { NotificationService } from '@/services/NotificationService';

import { BaseRepository } from './BaseRepository';

export class AuthRepository extends BaseRepository {
  private static instance: AuthRepository;

  public static getInstance(): AuthRepository {
    if (!AuthRepository.instance) {
      AuthRepository.instance = new AuthRepository();
    }
    return AuthRepository.instance;
  }

  /** Creates the account and signs the user in straight away. */
  public async register(email: string, password: string, username: string): Promise<void> {
    const tokens = await this.api.post<TokenResponse>(
      '/auth/register',
      { email: email.trim(), password, username: username.trim() },
      { auth: false },
    );
    if (tokens.user && !tokens.user.auth_provider) {
      tokens.user.auth_provider = 'local';
    }
    await this.api.startSession(tokens);
  }

  public async login(email: string, password: string): Promise<void> {
    const tokens = await this.api.post<TokenResponse>(
      '/auth/login',
      { email: email.trim(), password },
      { auth: false },
    );
    if (tokens.user && !tokens.user.auth_provider) {
      tokens.user.auth_provider = 'local';
    }
    await this.api.startSession(tokens);
  }

  public async loginWithGoogle(idToken: string): Promise<void> {
    const tokens = await this.api.post<TokenResponse>(
      '/auth/google',
      { id_token: idToken },
      { auth: false },
    );
    if (tokens.user) {
      tokens.user.auth_provider = 'google';
    }
    await this.api.startSession(tokens);
  }

  public async logout(): Promise<void> {
    const refreshToken = this.api.getSession()?.refreshToken;
    try {
      if (refreshToken) {
        await this.api.post<void>('/auth/logout', { refresh_token: refreshToken }, { auth: false });
      }
    } catch (error) {
      // Server-side revoke is best effort; the local session is cleared regardless.
      console.warn('[AuthRepository] Logout request failed.', error);
    } finally {
      await this.api.endSession();
    }
  }

  public async isUsernameAvailable(username: string): Promise<boolean> {
    const { available } = await this.api.get<{ available: boolean }>('/auth/username-available', {
      query: { username: username.trim() },
      auth: false,
    });
    return available;
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.post<void>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  /**
   * Initiates password recovery by sending a 6-digit numeric verification code to the registered email.
   */
  public async requestPasswordReset(email: string): Promise<void> {
    await this.api.post<{ message: string }>(
      '/auth/forgot-password',
      { email: email.trim().toLowerCase() },
      { auth: false },
    );
  }

  /**
   * Completes password recovery using the 6-digit code and applies the new password.
   */
  public async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
    await this.api.post<void>(
      '/auth/reset-password',
      {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        new_password: newPassword,
      },
      { auth: false },
    );
  }

  public async deleteAccount(): Promise<void> {
    const currentUserId = this.api.getSession()?.user?.id;

    // 1. Permanently remove the user from the database
    await this.api.delete<void>('/auth/me');

    // 2. Clean up account-scoped notification caches on device
    if (currentUserId) {
      await NotificationService.getInstance().clearAccountData(currentUserId).catch(() => {});
    }

    // 3. Disconnect any active third-party provider sessions (Google)
    try {
      await googleAuthService.revokeAccess();
    } catch (e) {
      console.warn('[AuthRepository] Failed to revoke Google access on account deletion:', e);
    }

    // 4. Clear local tokens and end the session
    await this.logout();
  }
}

export const authRepository = AuthRepository.getInstance();
