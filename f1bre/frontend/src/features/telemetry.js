/** Telemetría bajo demanda por piloto/vuelta. Nunca descarga una carrera completa. */
import { $, RaceData, formatLapTime } from '../utils/dom.js';
import { state } from '../state/store.js';
import { OpenF1 } from '../api/openf1-client.js';
import { TELEMETRY_UNITS } from '../config/openf1.js';
import { renderLineChart } from '../ui/line-chart.js';
/** Reconstruye las vueltas del piloto e invalida cualquier respuesta de telemetría anterior. */
export function updateLapOptions() {
  ++state.teleGeneration;
  $('telemetry-chart').replaceChildren();
  $('telemetry-values').replaceChildren();
  $('telemetry-status').textContent = 'Choose a lap and load telemetry.';
  const laps = (state.data.laps || [])
    .filter(
      (l) =>
        String(l.driver_number) === $('driver').value &&
        RaceData.number(l.lap_duration) &&
        l.lap_duration > 0 &&
        l.date_start,
    )
    .sort((a, b) => a.lap_number - b.lap_number);
  $('lap').replaceChildren(
    ...laps.map(
      (l) => new Option(`Lap ${l.lap_number} · ${formatLapTime(l.lap_duration)}`, l.lap_number),
    ),
  );
  $('load-telemetry').disabled = !laps.length;
}

/** Localiza la vuelta elegida dentro de /laps para calcular el rango temporal de telemetría. */
export function getSelectedLap() {
  return (state.data.laps || []).find(
    (l) => String(l.driver_number) === $('driver').value && String(l.lap_number) === $('lap').value,
  );
}

/** Consulta /car_data solo para el piloto y la ventana UTC de la vuelta seleccionada. */
export async function loadTelemetry() {
  const token = ++state.teleGeneration,
    st = state.generation,
    lap = getSelectedLap();
  $('load-telemetry').disabled = true;
  $('telemetry-chart').replaceChildren();
  $('telemetry-values').replaceChildren();
  $('telemetry-status').textContent = 'Loading lap telemetry…';
  try {
    const rows = await OpenF1.query('car_data', {
      session_key: state.session.session_key,
      driver_number: $('driver').value,
      ...RaceData.lapWindow(lap),
    });
    if (token !== state.teleGeneration || st !== state.generation) return;
    const field = $('channel').value,
      units = TELEMETRY_UNITS,
      ordered = [...rows].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    $('telemetry-chart').innerHTML = renderLineChart(
      [
        {
          color: '#641f32',
          points: ordered.map((r) => ({
            lap: (Date.parse(r.date) - Date.parse(lap.date_start)) / 1000,
            value: r[field],
          })),
        },
      ],
      `${field} over lap time`,
      'Elapsed seconds',
      units[field],
    );
    const speeds = rows.map((r) => r.speed).filter(RaceData.number),
      rpms = rows.map((r) => r.rpm).filter(RaceData.number);
    $('telemetry-values').textContent =
      `Samples: ${rows.length} · Max speed: ${speeds.length ? Math.max(...speeds) + ' km/h' : '—'} · Max RPM: ${rpms.length ? Math.max(...rpms) : '—'}`;
    $('telemetry-status').textContent = rows.length
      ? 'OpenF1 car_data · UTC window from recorded lap start and duration.'
      : 'No telemetry available for this lap.';
  } catch (e) {
    if (token === state.teleGeneration) $('telemetry-status').textContent = e.message;
  } finally {
    if (token === state.teleGeneration) $('load-telemetry').disabled = false;
  }
}
