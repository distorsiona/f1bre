/** Regresion HTTP de la migracion: modulos, estilos, importmaps y rutas de imagen existentes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createFrontendServer } from '../scripts/dev-server.mjs';
const frontend = new URL('../frontend/', import.meta.url);
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? files(new URL(entry.name + '/', directory))
        : [new URL(entry.name, directory)],
    ),
  );
  return nested.flat();
}
test('frontend responde por HTTP en la raiz y por compatibilidad /frontend/', async (t) => {
  const server = createFrontendServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const prefix of ['', '/frontend']) {
    const response = await fetch(origin + prefix + '/');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const html = await response.text();
    for (const route of ['home', 'drivers', 'teams', 'profile', 'overview'])
      assert.ok(html.includes(`id="${route}"`));
    assert.ok(html.includes('id="navbar-root"'));
    const dependencies = [...html.matchAll(/(?:src|href)="((?:src|styles)\/[^" ]+)"/g)].map(
      (match) => match[1],
    );
    const map = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
    if (map)
      dependencies.push(
        ...Object.values(JSON.parse(map[1]).imports).map((name) => name.replace(/^\.\//, '')),
      );
    for (const name of dependencies) {
      const result = await fetch(origin + prefix + '/' + name);
      assert.equal(result.status, 200, name);
      assert.ok(!(await result.text()).startsWith('<!doctype'), name);
    }
  }
  // Todos los modulos/estilos/assets existentes siguen accesibles; imagenes ausentes siguen siendo opcionales.
  for (const directory of ['src/', 'styles/', 'assets/']) {
    for (const file of await files(new URL(directory, frontend))) {
      const relative = file.href.slice(frontend.href.length);
      const response = await fetch(origin + '/' + relative, { method: 'HEAD' });
      assert.equal(response.status, 200, relative);
    }
  }
  const home = await readFile(new URL('src/views/home-view.js', frontend), 'utf8');
  assert.ok(home.includes('renderHome'));
  assert.equal((await fetch(origin + '/backend/README.md')).status, 404);
  assert.equal((await fetch(origin + '/package.json', { method: 'POST' })).status, 405);
  assert.equal((await fetch(origin + '/src/app.js?version=smoke')).status, 200);
});
