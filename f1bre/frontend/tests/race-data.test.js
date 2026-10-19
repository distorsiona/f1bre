/** Pruebas de métricas: distinguen ausencia de datos de cero y aíslan pilotos. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { F1Data as RaceData } from '../src/domain/race-data.js';

const driver = { driver_number: 4 };
const data = {
  laps: [
    { driver_number: 4, lap_number: 1, lap_duration: null },
    { driver_number: 4, lap_number: 2, lap_duration: 90 },
    { driver_number: 4, lap_number: 3, lap_duration: 110 },
    { driver_number: 4, lap_number: 4, lap_duration: 120, is_pit_out_lap: true },
    { driver_number: 4, lap_number: 5, lap_duration: 92 },
    { driver_number: 81, lap_number: 2, lap_duration: 80 },
  ],
  pit: [{ driver_number: 4, lap_number: 3, lane_duration: 22, stop_duration: null }],
  stints: [],
  session_result: [],
  starting_grid: [],
};

test('el ritmo excluye pit in/out y no mezcla vueltas de otro piloto', () => {
  const stats = RaceData.stats(driver, data);
  assert.equal(stats.pace, 91);
  assert.equal(stats.best, 90);
  assert.equal(stats.pits.length, 1);
  assert.equal(stats.lane, 22);
  assert.equal(stats.stop, null);
  assert.deepEqual(stats.series, [{ lap: 1, value: 91 }]);
});
test('los datos ausentes siguen siendo null; cero sí es una medición', () => {
  assert.equal(RaceData.stats(driver, { ...data, pit: null }).pits, null);
  assert.equal(RaceData.stats(driver, { laps: [], pit: [] }).pace, null);
  assert.equal(RaceData.mean([null, undefined, NaN]), null);
  assert.equal(RaceData.mean([0, null, 10]), 5);
});
test('el rango de telemetría cubre exactamente la duración de la vuelta en UTC', () => {
  assert.deepEqual(RaceData.lapWindow({ date_start: '2025-01-01T00:00:00Z', lap_duration: 90 }), {
    'date>=': '2025-01-01T00:00:00.000Z',
    'date<': '2025-01-01T00:01:30.000Z',
  });
  assert.throws(() => RaceData.lapWindow({ lap_duration: null }));
});
