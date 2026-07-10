import { ui, defaultLocale } from 'virtual:i18n';

type UIKeys = keyof (typeof ui)[typeof defaultLocale];
type SupportedLocales = keyof typeof ui;

export function useTranslations(locale: string | undefined) {
  const lang = (locale && locale in ui ? locale : defaultLocale) as SupportedLocales;

  return function t(key: UIKeys): string {
    return ui[lang][key] || ui[defaultLocale][key];
  };
}
