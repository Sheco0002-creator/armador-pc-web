import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel) => readFileSync(join(process.cwd(), 'dist', rel), 'utf8');

test('header ES enlaza a /configurador.html', () => {
  assert.match(read('index.html'), /href="\/configurador\.html"/);
});
test('header EN enlaza a /en/configurador.html', () => {
  assert.ok(existsSync(join(process.cwd(), 'dist', 'en', 'index.html')));
  assert.match(read('en/index.html'), /href="\/en\/configurador\.html"/);
});
test('footer tiene link a privacidad', () => {
  assert.match(read('index.html'), /href="\/privacidad\.html"/);
});
test('nav trae el script de menu movil', () => {
  assert.match(read('index.html'), /nav-toggle/);
});
