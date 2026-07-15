import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.js';
import hi from './locales/hi.js';
import gu from './locales/gu.js';

// Get language from localStorage, or use 'en' as default
const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      hi,
      gu
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already protects from xss
    }
  });

export default i18n;
