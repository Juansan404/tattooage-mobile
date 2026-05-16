import { useLanguageStore } from '../store/language.store';
import { translations, TranslationKey } from '../i18n/translations';

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);

  const t = (key: TranslationKey, vars?: Record<string, string>): string => {
    let str: string = (translations[language] as any)[key] ?? (translations.es as any)[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, v);
      }
    }
    return str;
  };

  return { t, language };
}
