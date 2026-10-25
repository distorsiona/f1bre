/** Carga progresiva: caché primero, dependencias de la vista después. */
import { $ } from '../utils/dom.js';
import { state } from '../state/store.js';
import { OpenF1 } from '../api/openf1-client.js';
import { saveSelection } from '../api/response-cache.js';
import { endpointsForRoute } from './session-plan.js';
import { CORE_ENDPOINTS, OPENF1_BASE_URL } from '../config/openf1.js';
let clearViews = () => {};
let refreshViews = () => {};
let completed = new Set();
let errors = new Set();
let runner = null;
let forceNetwork = false;
export function configureSessionViews(actions) {
  clearViews = actions.clear;
  refreshViews = actions.refresh;
}
export function setLoadMessage(text, error = false) {
  $('load-status').textContent = text;
  $('load-status').classList.toggle('error', error);
}
/** La navegación y la carrera siguen disponibles mientras llegan paneles secundarios. */
export function setLoading(value) {
  state.busy = value;
  const hasDrivers = state.drivers.length > 0;
  const hasLaps = Array.isArray(state.data.laps);
  document
    .querySelectorAll('[data-page]')
    .forEach((page) => page.setAttribute('aria-busy', String(value)));
  $('year').disabled = false;
  $('race').disabled = !state.sessions.length;
  for (const id of ['team', 'reset', 'load-raw']) $(id).disabled = !hasDrivers;
  for (const id of ['driver', 'lap', 'channel']) $(id).disabled = !hasLaps;
  $('load-telemetry').disabled = !hasLaps || !$('lap').value || value;
  $('export').disabled = ![
    'drivers',
    'laps',
    'pit',
    'stints',
    'session_result',
    'starting_grid',
  ].every((endpoint) => completed.has(endpoint));
}
function parameters(endpoint) {
  return endpoint === 'meetings'
    ? { meeting_key: state.session.meeting_key }
    : { session_key: state.session.session_key };
}
/** Cada publicación preserva el filtro elegido y distingue lo pendiente de mediciones cero. */
function publish() {
  const previous = $('team').value;
  const teams = [...new Set(state.drivers.map((driver) => driver.team_name))].sort();
  $('team').replaceChildren(
    new Option('All teams', 'all'),
    ...teams.map((team) => new Option(team, team)),
  );
  if (teams.includes(previous)) $('team').value = previous;
  refreshViews();
}
function report() {
  if ((location.hash || '#home') === '#home') return;
  const plan = endpointsForRoute(location.hash);
  const unavailable = plan.filter((endpoint) => errors.has(endpoint));
  setLoadMessage(
    'OpenF1 · Session ' +
      state.session.session_key +
      (unavailable.length ? ' · Unavailable: ' + unavailable.join(', ') : ' · Data ready'),
    !!unavailable.length,
  );
}
/** Reevalúa la ruta después de cada respuesta; no descarga pantallas que no se han abierto. */
export function ensureRouteData() {
  if (
    !state.session ||
    !['overview', 'historical', 'drivers', 'teams', 'driver', 'team'].includes(
      location.hash.slice(1).split('/')[0],
    )
  )
    return Promise.resolve();
  if (runner?.token === state.generation) return runner.promise;
  const token = state.generation;
  const promise = Promise.resolve().then(async () => {
    try {
      while (token === state.generation) {
        const endpoint = endpointsForRoute(location.hash).find((name) => !completed.has(name));
        if (!endpoint) break;
        setLoading(true);
        setLoadMessage(
          'OpenF1 · Loading ' + endpoint.replaceAll('_', ' ') + ' · Showing available data',
        );
        let rows = null;
        try {
          rows = await OpenF1.query(endpoint, parameters(endpoint), { force: forceNetwork });
        } catch {
          /* Se informa solo si la selección todavía corresponde a esta respuesta. */
        }
        if (token !== state.generation) return;
        if (rows === null) errors.add(endpoint);
        completed.add(endpoint);
        state.datasetStatus[endpoint] = rows === null ? 'error' : 'ready';
        // Si falló la actualización, conservamos los datos guardados y avisamos del error.
        if (rows !== null || state.data[endpoint] === null) state.data[endpoint] = rows;
        if (endpoint === 'drivers') state.drivers = state.data.drivers || [];
        publish();
      }
    } finally {
      if (token === state.generation) {
        runner = null;
        setLoading(false);
        report();
      }
    }
  });
  runner = { token, promise };
  return promise;
}
/** Actualiza el calendario sin restaurar una carrera seleccionada anteriormente. */
export async function loadYear() {
  const token = ++state.generation;
  ++state.teleGeneration;
  ++state.rawGeneration;
  state.session = null;
  state.drivers = [];
  state.data = {};
  state.sessions = [];
  state.calendar = [];
  window.dispatchEvent(new window.Event('catalog-reset'));
  completed = new Set();
  errors = new Set();
  state.datasetStatus = {};
  runner = null;
  clearViews();
  setLoading(true);
  $('race').replaceChildren(new Option('Choose a Grand Prix', ''));
  setLoadMessage('Loading historical race sessions…');
  const params = { year: $('year').value, session_name: 'Race' };
  try {
    const rows = await OpenF1.query('sessions', params, { force: true });
    if (token !== state.generation) return;
    state.calendar = rows;
    state.sessions = rows
      .filter((session) => !session.is_cancelled && Date.parse(session.date_end) <= Date.now())
      .sort((a, b) => Date.parse(a.date_start) - Date.parse(b.date_start));
    if (!state.sessions.length) {
      setLoading(false);
      setLoadMessage('No completed races available. Choose another year.');
      window.dispatchEvent(new window.Event('catalog-ready'));
      refreshViews();
      return;
    }
    $('race').replaceChildren(
      new Option('Choose a Grand Prix', ''),
      ...state.sessions.map(
        (session) =>
          new Option(
            session.circuit_short_name + ' · ' + session.date_start.slice(0, 10),
            session.session_key,
          ),
      ),
    );
    $('race').value = '';
    setLoading(false);
    setLoadMessage('Choose a Grand Prix to open its analysis.');
    window.dispatchEvent(new window.Event('catalog-ready'));
    refreshViews();
  } catch (error) {
    if (token === state.generation) {
      setLoading(false);
      setLoadMessage(error.message, true);
    }
  }
}
/** Hidrata todos los datasets guardados antes de la primera solicitud de la vista. */
export async function loadRace(options = {}) {
  const chosen = state.sessions.find((session) => String(session.session_key) === $('race').value);
  if (!chosen) {
    ++state.generation;
    state.session = null;
    ++state.teleGeneration;
    ++state.rawGeneration;
    runner = null;
    state.data = {};
    state.datasetStatus = {};
    state.drivers = [];
    clearViews();
    setLoading(false);
    refreshViews();
    return;
  }
  ++state.generation;
  ++state.teleGeneration;
  ++state.rawGeneration;
  runner = null;
  completed = new Set();
  errors = new Set();
  forceNetwork = options.force === true;
  state.session = chosen;
  state.drivers = [];
  state.data = {};
  state.datasetStatus = {};
  clearViews();
  for (const endpoint of CORE_ENDPOINTS) {
    const saved = OpenF1.peek(endpoint, parameters(endpoint));
    state.data[endpoint] = saved?.rows || null;
    state.datasetStatus[endpoint] = saved ? 'cached' : 'pending';
    if (saved?.fresh && !forceNetwork) completed.add(endpoint);
  }
  state.drivers = state.data.drivers || [];
  saveSelection(chosen);
  $('source-link').href = OPENF1_BASE_URL + '/laps?session_key=' + chosen.session_key;
  publish();
  setLoading(true);
  await ensureRouteData();
}
