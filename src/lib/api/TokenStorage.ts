import type { AuthSession } from './types';

// Session perzisztencia az alkalmazás indításai között
export abstract class TokenStorage {
  protected static readonly KEY = 'fitbase.session';

  protected abstract read(): Promise<string | null>;
  protected abstract write(value: string): Promise<void>;
  protected abstract remove(): Promise<void>;

  async load(): Promise<AuthSession | null> {
    try {
      const raw = await this.read();
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch (error) {
      // Corrupt or undecryptable entry (restored backup): start logged out.
      console.warn('[TokenStorage] Could not read session, clearing it.', error);
      await this.clear();
      return null;
    }
  }

  async save(session: AuthSession): Promise<void> {
    await this.write(JSON.stringify(session));
  }

  async clear(): Promise<void> {
    try {
      await this.remove();
    } catch (error) {
      console.warn('[TokenStorage] Could not clear session.', error);
    }
  }
}
