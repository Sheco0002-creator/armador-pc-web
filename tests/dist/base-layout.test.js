import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = () => readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8');

test('home lleva lang=es', () => {
  assert.match(html(), /<html[^>]*lang="es"/);
});
test('home carga /css/style.css', () => {
  assert.match(html(), /<link[^>]+href="\/css\/style\.css"/);
});
test('home incluye gtag G-GH7D533JHR', () => {
  assert.match(html(), /G-GH7D533JHR/);
});
test('home tiene los 3 hreflang + x-default', () => {
  const h = html();
  assert.match(h, /hreflang="es"[^>]*href="https:\/\/tupcgamer\.com\/"/);
  assert.match(h, /hreflang="en"[^>]*href="https:\/\/tupcgamer\.com\/en\/"/);
  assert.match(h, /hreflang="pt"[^>]*href="https:\/\/tupcgamer\.com\/pt\/"/);
  assert.match(h, /hreflang="x-default"/);
});
