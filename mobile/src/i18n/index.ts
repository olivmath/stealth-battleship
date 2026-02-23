import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';

const LANGUAGE_KEY = '@stealth_language';

export async function getLanguage(): Promise<string | null> {
  return AsyncStorage.getItem(LANGUAGE_KEY);
}

export async function saveLanguage(lang: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

function detectDeviceLanguage(): string {
  const locales = getLocales();
  if (locales.length === 0) return 'en';
  const code = locales[0].languageCode ?? 'en';
  if (code === 'pt') return 'pt-BR';
  if (code === 'es') return 'es';
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
    es: { translation: es },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Override with saved language (async)
getLanguage().then((saved) => {
  if (saved && ['en', 'pt-BR', 'es'].includes(saved)) {
    i18n.changeLanguage(saved);
  }
});

export default i18n;
