import translations from '../locales/translations';

type Lang = keyof typeof translations;
type Dict = typeof translations['en'];

type TranslationProxy<T> = {
  [K in keyof T]: T[K] extends string ? string : TranslationProxy<T[K]>
};

const makeProxy = (obj: unknown): unknown => {
  if (typeof obj === 'string') return obj;
  return new Proxy({} as Record<string, unknown>, {
    get: (_, key: string) => makeProxy((obj as Record<string, unknown>)[key]),
  });
};

export const t = (locale: string | undefined): TranslationProxy<Dict> => {
  const lang = (locale?.slice(0, 2) ?? 'en') as Lang;
  const dict = lang in translations ? translations[lang] : translations.en;
  return makeProxy(dict) as TranslationProxy<Dict>;
};
