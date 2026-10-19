import test from 'node:test';
import assert from 'node:assert/strict';
import { createResponseCache } from '../src/api/response-cache.js';
import { createOpenF1Client } from '../src/api/openf1-client.js';

function storage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key: (i) => [...values.keys()][i],
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
test('una nueva instancia recupera datos persistidos sin volver a solicitar la API', async () => {
  const disk = storage();
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return { ok: true, json: async () => [{ driver_number: 4 }] };
  };
  const first = createOpenF1Client({
    cache: createResponseCache(() => disk),
    fetcher,
    interval: 0,
  });
  await first.query('drivers', { session_key: 9839, driver_number: 4 });
  const reloaded = createOpenF1Client({
    cache: createResponseCache(() => disk),
    fetcher,
    interval: 0,
  });
  assert.deepEqual(await reloaded.query('drivers', { driver_number: 4, session_key: 9839 }), [
    { driver_number: 4 },
  ]);
  assert.equal(calls, 1);
  await reloaded.query('drivers', { session_key: 9839, driver_number: 4 }, { force: true });
  assert.equal(calls, 2);
});
test('la caché caducada queda disponible para mostrarla mientras se obtiene la nueva', async () => {
  const disk = storage();
  let clock = 0;
  let release;
  const cache = createResponseCache(
    () => disk,
    () => clock,
  );
  cache.write('https://api.openf1.org/v1/drivers?session_key=1', [{ driver_number: 1 }], 10);
  clock = 11;
  const client = createOpenF1Client({
    cache,
    interval: 0,
    fetcher: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  assert.equal(client.peek('drivers', { session_key: 1 }).fresh, false);
  const request = client.query('drivers', { session_key: 1 });
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(client.peek('drivers', { session_key: 1 }).rows[0].driver_number, 1);
  release({ ok: true, json: async () => [{ driver_number: 4 }] });
  assert.equal((await request)[0].driver_number, 4);
});
test('almacenamiento bloqueado, cuotas o contenido corrupto no rompen las consultas', () => {
  const cache = createResponseCache(() => {
    throw Error('Blocked');
  });
  cache.write('race', [], 1000);
  assert.deepEqual(cache.read('race').rows, []);
  assert.equal(cache.read('missing'), null);
  const disk = storage();
  disk.setItem('f1bre:openf1:v1:broken', '{');
  assert.equal(createResponseCache(() => disk).read('broken'), null);
  const full = {
    ...disk,
    setItem: () => {
      throw Error('Quota');
    },
  };
  const fallback = createResponseCache(() => full);
  fallback.write('race', [{ position: 1 }], 1000);
  assert.equal(fallback.read('race').rows[0].position, 1);
});
test('las respuestas voluminosas bajo demanda se guardan solo en memoria', async () => {
  const disk = storage();
  const client = createOpenF1Client({
    cache: createResponseCache(() => disk),
    interval: 0,
    fetcher: async () => ({ ok: true, json: async () => [{ speed: 300 }] }),
  });
  await client.query('car_data', { session_key: 1 });
  assert.equal(disk.length, 0);
});
