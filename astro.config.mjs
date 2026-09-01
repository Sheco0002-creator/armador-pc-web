import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tupcgamer.com',
  base: '/',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'pt'],
    routing: { prefixDefaultLocale: false },
  },
});
