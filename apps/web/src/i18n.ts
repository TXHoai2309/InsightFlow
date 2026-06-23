import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: typeof window !== 'undefined' ? localStorage.getItem('insightflow_language') || 'vi' : 'vi',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    debug: false,
  });

export default i18n;
