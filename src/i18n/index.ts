import es from './es.json';
import en from './en.json';
import pt from './pt.json';

export type Lang = 'es' | 'en' | 'pt';
const dict: Record<Lang, unknown> = { es, en, pt };

function pick(obj: unknown, path: string): string | undefined {
  return path.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object' && k in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj) as string | undefined;
}

export function t(lang: Lang, key: string): string {
  return pick(dict[lang], key) ?? pick(dict.es, key) ?? key;
}

export const locales: Lang[] = ['es', 'en', 'pt'];

/** Reescribe una ruta de dato en español a su equivalente localizado. */
export function rutaLocalizada(ruta: string, lang: Lang): string {
  return lang === 'es' ? ruta : ruta.replace(/\.json$/, `.${lang}.json`);
}
