import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tupcgamer.com',
  base: '/',
  build: { format: 'preserve' },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'pt'],
    routing: { prefixDefaultLocale: false },
  },
});
