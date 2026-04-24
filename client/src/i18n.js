import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locale JSON files directly — decoupled, scalable approach
import en from './locales/en.json';
import tr from './locales/tr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr }
    },
    fallbackLng: 'en',
    // Cache language in localStorage so user preference persists across sessions
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'careplus_lang'
    },
    interpolation: {
      escapeValue: false  // React already handles XSS
    }
  });

export default i18n;
