import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');

const rutasQueDebenExistir = [
  'css/style.css',
  'js/compatibilidad.js',
  'js/main.js',
  'data/components.json',
  'data/components.en.json',
  'data/components.pt.json',
  'configurador.html',
  'guias.html',
  'sobre.html',
  'contacto.html',
  'privacidad.html',
  'robots.txt',
  'sitemap.xml',
  'favicon.svg',
  'CNAME',
  'googlec378141724be809c.html',
  '.nojekyll',
  'en/configurador.html',
  'pt/configurador.html',
];

for (const rel of rutasQueDebenExistir) {
  test(`dist contiene ${rel}`, () => {
    assert.ok(existsSync(join(dist, rel)), `falta dist/${rel}`);
  });
}

test('CNAME apunta a tupcgamer.com', () => {
  assert.equal(readFileSync(join(dist, 'CNAME'), 'utf8').trim(), 'tupcgamer.com');
});
