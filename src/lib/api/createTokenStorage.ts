import * as SecureStore from 'expo-secure-store';

import { TokenStorage } from './TokenStorage';

// Natív biztonságos tároló (SecureStore)
class SecureTokenStorage extends TokenStorage {
  protected read() {
    return SecureStore.getItemAsync(TokenStorage.KEY);
  }

  protected write(value: string) {
    return SecureStore.setItemAsync(TokenStorage.KEY, value);
  }

  protected remove() {
    return SecureStore.deleteItemAsync(TokenStorage.KEY);
  }
}

export function createTokenStorage(): TokenStorage {
  return new SecureTokenStorage();
}
