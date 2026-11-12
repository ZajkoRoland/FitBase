import { GOOGLE_WEB_CLIENT_ID } from '@/constants/Config';
import { i18n } from '@/services/LocalizationService';

let NativeGoogleSignin: any = null;
try {
  const module = require('@react-native-google-signin/google-signin');
  NativeGoogleSignin = module?.GoogleSignin ?? null;
} catch {
  NativeGoogleSignin = null;
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isConfigured = false;

  private constructor() { }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  public isNativeAvailable(): boolean {
    return NativeGoogleSignin !== null;
  }

  public configure(): void {
    if (this.isConfigured || !NativeGoogleSignin) return;

    try {
      NativeGoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
      });
      this.isConfigured = true;
    } catch (e) {
      console.warn('[GoogleAuthService] configure failed:', e);
    }
  }

  // Megnyitja a natív Google fiókválasztó ablakot Androidon,
  // Expo Go alatt pedig figyelmezteti a felhasználót, hogy a natív Google belépéshez dev-client build kell
  public async promptSignIn(): Promise<string | null> {
    if (!NativeGoogleSignin) {
      throw new Error(i18n.t('auth.errExpoGoGoogle'));
    }

    this.configure();

    await NativeGoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await NativeGoogleSignin.signIn();

    if (response?.type === 'success') {
      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error(i18n.t('auth.errGoogleNoToken'));
      }
      return idToken;
    }

    return null;
  }

  // Ellenőrzi, hogy van-e korábbi Google bejelentkezés
  public async hasPreviousSignIn(): Promise<boolean> {
    try {
      if (NativeGoogleSignin) {
        this.configure();
        return await NativeGoogleSignin.hasPreviousSignIn();
      }
      return false;
    } catch {
      return false;
    }
  }

  public async signOut(): Promise<void> {
    try {
      if (NativeGoogleSignin) {
        this.configure();
        await NativeGoogleSignin.signOut();
      }
    } catch (error) {
      console.warn('[GoogleAuthService] signOut warning:', error);
    }
  }

  // Google hozzáférés visszavonása fióktörléskor
  public async revokeAccess(): Promise<void> {
    try {
      if (NativeGoogleSignin) {
        this.configure();
        try {
          await NativeGoogleSignin.revokeAccess();
        } catch {
          // revokeAccess may fail if already revoked or unauthorized
        }
        await NativeGoogleSignin.signOut();
      }
    } catch (error) {
      console.warn('[GoogleAuthService] revokeAccess warning:', error);
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance();
