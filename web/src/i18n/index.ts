import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../shared/storage';

import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';

const LANGUAGE_KEY = '@battleship_language';

export async function getLanguage(): Promise<string | null> {
  return storage.getItem(LANGUAGE_KEY);
}

export async function saveLanguage(lang: string): Promise<void> {
  await storage.setItem(LANGUAGE_KEY, lang);
}

function detectDeviceLanguage(): string {
  const lang = navigator.language || 'en';
  const code = lang.split('-')[0];
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
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

getLanguage().then((saved) => {
  if (saved && ['en', 'pt-BR', 'es'].includes(saved)) {
    i18n.changeLanguage(saved);
  }
});

export default i18n;
