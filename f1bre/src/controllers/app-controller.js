/** Coordina acciones entre módulos. La UI comunica intención; este controlador aplica filtros. */
import { OpenF1 } from '../api/openf1-client.js';
import { $ } from '../utils/dom.js';
import { state } from '../state/store.js';
import {
  loadYear,
  loadRace,
  configureSessionViews,
  ensureRouteData,
} from '../features/sessions.js';
import { readSelection } from '../api/response-cache.js';
import { loadTelemetry, updateLapOptions } from '../features/telemetry.js';
import { loadDataset } from '../features/data-explorer.js';
import { exportComparison } from '../features/comparison-export.js';
import { refreshAnalysis, refreshViews, clearViews } from './view-controller.js';
import { configureProfileActions } from '../views/profile-view.js';
import { renderDriverList } from '../views/drivers-view.js';
import { configureHomeActions, centerSelectedRace } from '../views/home-view.js';

/** Rellena las opciones iniciales; no consulta OpenF1 hasta que loadYear se ejecute. */
export function initializeControls() {
  $('year').replaceChildren(
    ...Array.from(
      { length: Math.max(1, new Date().getFullYear() - 2022) },
      (_, i) => new Option(2023 + i, 2023 + i),
    ),
  );
  $('year').value = String(Math.min(2025, new Date().getFullYear()));
  const savedYear = String(readSelection()?.year || '');
  if ([...$('year').options].some((option) => option.value === savedYear))
    $('year').value = savedYear;
  $('endpoint').replaceChildren(
    ...OpenF1.endpoints.map((endpoint) => new Option(endpoint.replaceAll('_', ' '), endpoint)),
  );
  $('endpoint').value = 'laps';
}

/** Cambia de vuelta sin mostrar el gráfico que pertenecía a la selección anterior. */
function handleLapChange() {
  ++state.teleGeneration;
  $('telemetry-chart').replaceChildren();
  $('telemetry-values').replaceChildren();
  $('telemetry-status').textContent = 'Lap changed. Load telemetry to update.';
  $('load-telemetry').disabled = false;
}

/** Conserva la carrera cuando se reintenta una carga; si no hay carreras, recarga temporada. */
function retrySelection() {
  if (state.busy) return;
  if (state.sessions.length) loadRace({ force: true });
  else loadYear();
}

/** Une perfil deportivo y análisis sin que sus módulos se importen entre sí. */
function openProfileAnalysis({ teamName, driverNumber }) {
  $('team').value = teamName;
  refreshAnalysis();
  if (driverNumber !== undefined) {
    $('driver').value = String(driverNumber);
    updateLapOptions();
  }
  location.hash = 'overview';
}

/** Conecta eventos una sola vez. Las consultas solo ocurren en acciones que las requieren. */
export function bindEvents() {
  configureSessionViews({ clear: clearViews, refresh: refreshViews });
  window.addEventListener('resize', centerSelectedRace);
  configureHomeActions({
    selectRace: (sessionKey) => {
      $('race').value = String(sessionKey);
      loadRace();
    },
  });
  configureProfileActions({ openAnalysis: openProfileAnalysis });
  $('year').addEventListener('change', loadYear);
  $('race').addEventListener('change', loadRace);
  $('team').addEventListener('change', refreshAnalysis);
  $('driver').addEventListener('change', updateLapOptions);
  $('lap').addEventListener('change', handleLapChange);
  $('channel').addEventListener('change', () => {
    if (!state.busy && state.session) loadTelemetry();
  });
  $('load-telemetry').addEventListener('click', loadTelemetry);
  $('load-raw').addEventListener('click', loadDataset);
  $('retry').addEventListener('click', retrySelection);
  $('reset').addEventListener('click', () => {
    $('team').value = 'all';
    refreshAnalysis();
  });
  $('export').addEventListener('click', exportComparison);
  $('driver-search').addEventListener('input', renderDriverList);
  window.addEventListener('hashchange', () => {
    refreshViews();
    ensureRouteData();
    window.scrollTo(0, 0);
  });
}
