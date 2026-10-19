/** Explorador de los 18 endpoints y exportación de sus registros originales. */
import { $, RaceData } from '../utils/dom.js';
import { state } from '../state/store.js';
import { OpenF1 } from '../api/openf1-client.js';
import { downloadCsv } from '../utils/csv.js';
import { getSelectedLap } from './telemetry.js';
import { DRIVER_FILTER_ENDPOINTS, LAP_WINDOW_ENDPOINTS } from '../config/openf1.js';
/** Consulta un endpoint del catálogo. Limita los datasets voluminosos a una vuelta y exporta su respuesta. */
export async function loadDataset() {
  const token = ++state.rawGeneration,
    st = state.generation;
  if (!state.session) return;
  const endpoint = $('endpoint').value;
  let params = { session_key: state.session.session_key };
  if (endpoint === 'meetings') params = { meeting_key: state.session.meeting_key };
  if (DRIVER_FILTER_ENDPOINTS.includes(endpoint) && $('driver').value)
    params.driver_number = $('driver').value;
  if (endpoint === 'overtakes') params.overtaking_driver_number = $('driver').value;
  try {
    if (LAP_WINDOW_ENDPOINTS.includes(endpoint))
      Object.assign(params, RaceData.lapWindow(getSelectedLap()));
    if (endpoint === 'championship_teams' && $('team').value !== 'all')
      params.team_name = $('team').value;
    $('load-raw').disabled = true;
    $('raw-download').disabled = true;
    $('raw-preview').replaceChildren();
    $('raw-status').textContent = `Loading ${endpoint}…`;
    const rows = await OpenF1.query(endpoint, params);
    if (token !== state.rawGeneration || st !== state.generation) return;
    $('raw-status').textContent =
      `${rows.length} records · Showing first 100 · Filters: ${JSON.stringify(params)}`;
    $('raw-preview').textContent = JSON.stringify(rows.slice(0, 100), null, 2);
    $('raw-download').disabled = !rows.length;
    $('raw-download').onclick = () =>
      downloadCsv(rows, `f1bre-${state.session.session_key}-${endpoint}.csv`);
  } catch (e) {
    if (token === state.rawGeneration) $('raw-status').textContent = e.message;
  } finally {
    if (token === state.rawGeneration) $('load-raw').disabled = false;
  }
}
