/** Verifica limites de carpetas y una sola fuente de la aplicacion. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const at = (name) => fileURLToPath(new URL('../' + name, import.meta.url));
for (const name of [
  'frontend/src/app.js',
  'frontend/index.html',
  'frontend/styles/index.css',
  'frontend/assets/README.md',
  'frontend/tests',
  'frontend/package-lock.json',
  'backend/README.md',
  'data_pipeline/README.md',
  'contracts/README.md',
  'fixtures/README.md',
]) {
  assert.ok(existsSync(at(name)), `Falta ${name}`);
}
assert.ok(!existsSync(at('src')), 'src/ debe existir solo dentro de frontend/');
assert.ok(!existsSync(at('assets')), 'assets/ debe existir solo dentro de frontend/');
const entry = readFileSync(at('index.html'), 'utf8');
assert.ok(
  entry.includes("new URL('./frontend/'"),
  'La entrada antigua debe conservar acceso al frontend',
);
assert.ok(entry.includes('window.location.hash'), 'La entrada antigua debe conservar la ruta hash');
console.log('Monorepo: frontend aislado, carpetas preparadas y entrada anterior compatible.');
