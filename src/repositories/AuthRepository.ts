import type { TokenResponse } from '@/lib/api/types';
import { googleAuthService } from '@/services/GoogleAuthService';
import { NotificationService } from '@/services/NotificationService';

import { BaseRepository } from './BaseRepository';

export class AuthRepository extends BaseRepository {
  public static getInstance(): AuthRepository {
    return authRepository;
  }

  // Új felhasználó regisztrációja és automatikus bejelentkeztetése
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
      // A szerveroldali érvénytelenítés másodlagos; a helyi munkamenet mindenképpen törlődik
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

  // Jelszó-visszaállító 6 jegyű kód kérése emailben
  public async requestPasswordReset(email: string): Promise<void> {
    await this.api.post<{ message: string }>(
      '/auth/forgot-password',
      { email: email.trim().toLowerCase() },
      { auth: false },
    );
  }

  // Új jelszó beállítása az ellenőrző kód segítségével
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

    // 1. Felhasználó törlése az adatbázisból
    await this.api.delete<void>('/auth/me');

    // 2. Értesítési gyorsítótár ürítése az eszközön
    if (currentUserId) {
      await NotificationService.getInstance().clearAccountData(currentUserId).catch(() => {});
    }

    // 3. Külső bejelentkezési kapcsolatok (Google) bontása
    try {
      await googleAuthService.revokeAccess();
    } catch (e) {
      console.warn('[AuthRepository] Failed to revoke Google access on account deletion:', e);
    }

    // 4. Helyi tokenek törlése és kijelentkezés
    await this.logout();
  }
}

export const authRepository = new AuthRepository();
