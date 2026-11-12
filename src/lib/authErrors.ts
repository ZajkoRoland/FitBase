import { i18n } from '@/services/LocalizationService';

export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

const AUTH_ERROR_KEYS: Record<string, string> = {
  invalid_credentials: 'auth.errInvalidCredentials',
  email_not_confirmed: 'auth.errEmailNotConfirmed',
  user_already_exists: 'auth.errAccountExists',
  email_exists: 'auth.errAccountExists',
  weak_password: 'auth.errWeakPassword',
  email_address_invalid: 'auth.errInvalidEmail',
  validation_failed: 'auth.errInvalidEmail',
  over_request_rate_limit: 'auth.errRateLimit',
  over_email_send_rate_limit: 'auth.errRateLimit',
  user_banned: 'auth.errUserBanned',
  username_taken: 'auth.errUsernameTaken',
  invalid_token: 'auth.errSessionExpired',
  invalid_refresh_token: 'auth.errSessionExpired',
  invalid_reset_code: 'auth.errInvalidResetCode',
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof UserFacingError) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const { code, name, message } = error as { code?: string; name?: string; message?: string };

    if (code && AUTH_ERROR_KEYS[code]) {
      return i18n.t(AUTH_ERROR_KEYS[code]);
    }

    if (
      name === 'AbortError' ||
      name === 'TypeError' ||
      message?.includes('Network request failed') ||
      message?.includes('Failed to fetch') ||
      message?.includes('Network Error')
    ) {
      return i18n.t('auth.errNetwork');
    }
  }

  if (__DEV__) {
    console.warn('[auth] Unmapped error:', error);
  }
  return i18n.t('auth.errFallback');
}
