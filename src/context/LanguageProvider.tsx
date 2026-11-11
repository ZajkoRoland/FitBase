import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { i18n, LocalizationService, SupportedLanguageCode } from '@/services/LocalizationService';

export interface LanguageContextValue {
  language: SupportedLanguageCode;
  isHungarian: boolean;
  setLanguage: (code: string) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  i18n: LocalizationService;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  isHungarian: false,
  setLanguage: async (code: string) => i18n.setLanguage(code),
  t: (key, params) => i18n.t(key, params),
  i18n,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguageCode>(() => i18n.getLanguage());

  useEffect(() => {
    i18n.init().then((loadedLang) => {
      setLanguageState(loadedLang);
    });

    const unsubscribe = i18n.subscribe((newLang) => {
      setLanguageState(newLang);
    });

    return unsubscribe;
  }, []);

  const setLanguage = useCallback(async (code: string) => {
    await i18n.setLanguage(code);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return i18n.t(key, params);
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      isHungarian: language === 'hu',
      setLanguage,
      t,
      i18n,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

