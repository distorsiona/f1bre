/** Verifica el cliente sin Internet; reemplaza fetch solo durante la prueba. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OpenF1 } from '../src/api/openf1-client.js';

test('deduplica, usa caché y serializa comparadores como exige OpenF1', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0,
    lastUrl = '';
  globalThis.fetch = async (url) => {
    calls++;
    lastUrl = url;
    return { ok: true, status: 200, json: async () => [{ driver_number: 4 }] };
  };
  try {
    await Promise.all([
      OpenF1.query('drivers', { session_key: 1 }),
      OpenF1.query('drivers', { session_key: 1 }),
    ]);
    assert.equal(calls, 1);
    await OpenF1.query('drivers', { session_key: 1 });
    assert.equal(calls, 1);
    assert.equal(OpenF1.endpoints.length, 18);
    await OpenF1.query('car_data', {
      'date>=': '2024-01-01T00:00:00Z',
      'date<': '2024-01-01T00:01:00Z',
    });
    assert.ok(lastUrl.includes('date>=2024-01-01'));
    assert.ok(lastUrl.includes('date<2024-01-01'));
    assert.ok(!lastUrl.includes('date%3C='));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test('rechaza rutas fuera del catálogo antes de realizar una solicitud', async () => {
  await assert.rejects(OpenF1.query('unknown_endpoint'), /Unsupported endpoint/);
});
