import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

test('el bundle de la home incluye animejs', () => {
  const astroDir = join(process.cwd(), 'dist', '_astro');
  const js = readdirSync(astroDir).filter((f) => f.endsWith('.js'));
  const algunoImportaAnime = js.some((f) => {
    const c = readFileSync(join(astroDir, f), 'utf8');
    return c.includes('anime') && (c.includes('translateX') || c.includes('easing') || c.includes('duration'));
  });
  assert.ok(algunoImportaAnime, 'ningún chunk de _astro referencia animejs');
});

test('index.html referencia un módulo de _astro', () => {
  assert.match(readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8'), /_astro\/.+\.js/);
});
