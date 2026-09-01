import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

test('no quedó index.html legacy en la raíz del repo', () => {
  assert.ok(!existsSync(join(process.cwd(), 'index.html')), 'index.html sigue existiendo');
  assert.ok(!existsSync(join(process.cwd(), 'en', 'index.html')), 'en/index.html sigue existiendo');
  assert.ok(!existsSync(join(process.cwd(), 'pt', 'index.html')), 'pt/index.html sigue existiendo');
});
test('la home la genera Astro', () => {
  assert.ok(existsSync(join(process.cwd(), 'src', 'pages', 'index.astro')));
});
