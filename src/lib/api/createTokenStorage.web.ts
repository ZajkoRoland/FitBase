import { TokenStorage } from './TokenStorage';

// Webes felületen a localStorage-t használjuk tárolásra
class WebTokenStorage extends TokenStorage {
  private get store(): Storage | null {
    // `typeof window` guard: app.json uses static web output, which renders without a DOM.
    return typeof window === 'undefined' ? null : window.localStorage;
  }

  protected async read() {
    return this.store?.getItem(TokenStorage.KEY) ?? null;
  }

  protected async write(value: string) {
    this.store?.setItem(TokenStorage.KEY, value);
  }

  protected async remove() {
    this.store?.removeItem(TokenStorage.KEY);
  }
}

export function createTokenStorage(): TokenStorage {
  return new WebTokenStorage();
}
