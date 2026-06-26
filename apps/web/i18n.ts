import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './src/locales/en.json';
import vi from './src/locales/vi.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    // QUAN TRỌNG: Luôn init bằng 'vi' để server và client render giống nhau
    // Client sẽ tự apply ngôn ngữ từ localStorage sau khi mount (xem I18nProvider)
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: { escapeValue: false },
    debug: false,
  });

export default i18n;
