import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel) => readFileSync(join(process.cwd(), 'dist', rel), 'utf8');

// Anclas y contratos de CSS/JS que NO pueden desaparecer.
const contratos = ['id="presupuestos"', 'data-reveal', 'data-tier-price', 'class="lp-hero', 'class="site-footer"'];

for (const rel of ['index.html', 'en/index.html', 'pt/index.html']) {
  for (const c of contratos) {
    test(`${rel} conserva ${c}`, () => {
      assert.ok(read(rel).includes(c), `${rel} perdió ${c}`);
    });
  }
}

test('home ES tiene el h1 del hero', () => {
  assert.match(read('index.html'), /<h1[^>]*class="lp-hero-title"/);
});
test('home ES suma precios de niveles vía script', () => {
  assert.match(read('index.html'), /data\/components\.json/);
});
test('home EN usa components.en.json', () => {
  assert.match(read('en/index.html'), /data\/components\.en\.json/);
});
