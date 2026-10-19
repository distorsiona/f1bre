/** Coordina el refresco de vistas tras cargar una carrera. Ninguna vista importa a otra. */
import { $ } from '../utils/dom.js';
import { getVisibleDrivers } from '../state/selectors.js';
import { renderHome, clearHome } from '../views/home-view.js';
import { renderDriverList, clearDrivers } from '../views/drivers-view.js';
import { renderTeams, clearTeams } from '../views/teams-view.js';
import { clearProfile } from '../views/profile-view.js';
import { renderRaceAnalysis, clearRaceAnalysis } from '../views/race-analysis-view.js';
import { updateLapOptions } from '../features/telemetry.js';
import { renderRoute } from '../router/router.js';
import { state } from '../state/store.js';

let previousLaps;
let previousDrivers;
let previousTeam;

/** Sincroniza filtros de telemetría después de dibujar el análisis de la selección. */
export function refreshAnalysis() {
  renderRaceAnalysis();
  if (
    previousLaps === state.data.laps &&
    previousDrivers === state.drivers &&
    previousTeam === $('team').value
  )
    return;
  previousLaps = state.data.laps;
  previousDrivers = state.drivers;
  previousTeam = $('team').value;
  const previous = $('driver').value;
  const drivers = getVisibleDrivers();
  $('driver').replaceChildren(
    ...drivers.map((d) => new Option(`${d.name_acronym} · ${d.full_name}`, d.driver_number)),
  );
  if (drivers.some((d) => String(d.driver_number) === previous)) $('driver').value = previous;
  updateLapOptions();
}

/** Los datos compartidos cambiaron: cada vista actualiza exclusivamente su pantalla. */
export function refreshViews() {
  const route = (location.hash.slice(1) || 'home').split('/')[0];
  if (route === 'drivers') renderDriverList();
  else if (route === 'teams') renderTeams();
  else if (route === 'overview') refreshAnalysis();
  else if (!['driver', 'team'].includes(route)) renderHome();
  renderRoute();
  showPendingPanels();
}

/** Evita presentar un dataset todavía pendiente como cero o como una lista vacía definitiva. */
function showPendingPanels() {
  const groups = {
    'driver-list': ['drivers'],
    'team-cards': ['drivers'],
    chart: ['drivers', 'laps', 'pit'],
    legend: ['drivers', 'laps', 'pit'],
    stints: ['drivers', 'stints', 'pit', 'laps'],
    rows: ['drivers', 'laps', 'pit', 'stints', 'session_result'],
    weather: ['weather'],
    control: ['race_control'],
    'home-result-rows': ['drivers', 'session_result'],
    'home-tyre-rows': ['drivers', 'session_result', 'stints', 'laps'],
    'home-conditions': ['weather'],
  };
  for (const [id, endpoints] of Object.entries(groups)) {
    const element = $(id);
    if (element.closest('[data-page]')?.hidden) continue;
    const missing = endpoints.filter((endpoint) => state.data[endpoint] === null);
    if (!missing.length) continue;
    const pending = missing.some((endpoint) => state.datasetStatus?.[endpoint] !== 'error');
    // Un endpoint opcional fallido no oculta las mediciones válidas de toda la comparación.
    if (
      !pending &&
      ['rows', 'chart', 'legend', 'stints'].includes(id) &&
      Array.isArray(state.data.drivers)
    )
      continue;
    const message = endpoints.some((endpoint) => state.datasetStatus?.[endpoint] === 'error')
      ? 'Data unavailable. Use Retry.'
      : 'Loading data…';
    element.innerHTML =
      element.tagName === 'TBODY'
        ? '<tr><td colspan="8" class="empty">' + message + '</td></tr>'
        : element.tagName === 'UL'
          ? '<li class="empty">' + message + '</li>'
          : '<p class="empty">' + message + '</p>';
  }
}

/** Invalida contenido anterior y descargas antes de cargar una nueva selección. */
export function clearViews() {
  previousLaps = undefined;
  previousDrivers = undefined;
  previousTeam = undefined;
  clearHome();
  clearDrivers();
  clearTeams();
  clearProfile();
  clearRaceAnalysis();
  for (const id of ['telemetry-chart', 'telemetry-values', 'raw-preview', 'driver', 'lap'])
    $(id).replaceChildren();
  $('raw-download').disabled = true;
  $('source-link').removeAttribute('href');
  $('telemetry-status').textContent = 'Choose a driver and lap, then load telemetry.';
  $('raw-status').textContent = 'Load an endpoint to inspect its original fields.';
}
