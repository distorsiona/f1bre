/** Home tiene su propio snapshot; el catálogo nunca restaura carreras implícitamente. */
import { OpenF1 } from '../api/openf1-client.js';
import { state, homeState } from '../state/store.js';
import { seasonContext } from '../domain/season-context.js';
import { $ } from '../utils/dom.js';
import { renderHome } from '../views/home-view.js';
import { loadYear, loadRace, ensureRouteData, setLoadMessage } from './sessions.js';
import {
  renderHistorical,
  resetHistorical,
  loadHistoricalPerformance,
} from '../views/historical-view.js';
let previousRoute;
let homeGeneration = 0;
let routeGeneration = 0;
let requestedRace = null;
const routeName = () => (location.hash.slice(1) || 'home').split('/')[0];
export async function loadHome() {
  const token = ++homeGeneration;
  Object.assign(homeState, {
    year: new Date().getFullYear(),
    session: null,
    data: {},
    drivers: [],
    status: 'loading',
  });
  renderHome();
  if (routeName() === 'home') setLoadMessage('Loading current season…');
  try {
    const rows = await OpenF1.query(
      'sessions',
      { year: homeState.year, session_name: 'Race' },
      { force: true },
    );
    if (token !== homeGeneration) return;
    Object.assign(homeState, seasonContext(rows), { checkedAt: Date.now() });
    if (!homeState.session) {
      homeState.status = 'No completed races published for the current season.';
      renderHome();
      if (routeName() === 'home') setLoadMessage(homeState.status);
      return;
    }
    for (const endpoint of [
      'drivers',
      'championship_drivers',
      'championship_teams',
      'meetings',
      'session_result',
      'weather',
      'stints',
      'laps',
    ]) {
      const params =
        endpoint === 'meetings'
          ? { meeting_key: homeState.session.meeting_key }
          : { session_key: homeState.session.session_key };
      let data = null;
      try {
        data = await OpenF1.query(endpoint, params, {
          force: endpoint.startsWith('championship_'),
        });
      } catch {
        /* Panel sin cobertura: no inventar valores. */
      }
      if (token !== homeGeneration) return;
      homeState.data[endpoint] = data;
      if (endpoint === 'drivers') homeState.drivers = data || [];
      renderHome();
    }
    homeState.status = 'ready';
    renderHome();
    if (routeName() === 'home')
      setLoadMessage('Current season · Latest published completed-race standings · OpenF1');
  } catch (error) {
    if (token !== homeGeneration) return;
    homeState.status = error.message;
    renderHome();
    if (routeName() === 'home') setLoadMessage(error.message, true);
  }
}
/** Abrir una tarjeta es una selección explícita, incluso desde el Home actual. */
export function openHistoricalRace(sessionKey) {
  requestedRace = { sessionKey, year: homeState.year };
  if (routeName() === 'historical') activateRoute();
  else location.hash = 'historical';
}
export async function activateRoute() {
  const route = routeName();
  const changed = route !== previousRoute;
  const from = previousRoute;
  previousRoute = route;
  const token = ++routeGeneration;
  if (route === 'home') {
    ++state.generation;
    state.busy = false;
    if (changed) loadHome();
    return;
  }
  if (route === 'historical' && (changed || requestedRace)) {
    const requested = requestedRace;
    requestedRace = null;
    $('year').value = String(requested?.year || new Date().getFullYear() - 1);
    await loadYear();
    if (token !== routeGeneration) return;
    if (requested) {
      $('race').value = String(requested.sessionKey);
      await loadRace();
    }
    renderHistorical();
  } else if (
    route === 'overview' &&
    changed &&
    !(
      (['driver', 'team'].includes(from) ||
        location.hash.split('/')[1] === String(state.session?.session_key)) &&
      state.session
    )
  ) {
    $('year').value = String(new Date().getFullYear());
    await loadYear();
  } else if (
    ['drivers', 'teams', 'driver', 'team'].includes(route) &&
    (!state.session || from === 'home')
  ) {
    $('year').value = String(new Date().getFullYear());
    await loadYear();
    if (token !== routeGeneration) return;
    if (state.sessions.length) {
      $('race').value = String(state.sessions.at(-1).session_key);
      await loadRace();
    }
  } else {
    await ensureRouteData();
  }
}
export function retryRoute() {
  if (routeName() === 'home') return loadHome();
  return state.session ? loadRace({ force: true }) : loadYear();
}
export function bindNavigationEvents() {
  window.addEventListener('catalog-ready', renderHistorical);
  window.addEventListener('catalog-reset', resetHistorical);
  $('load-history').addEventListener('click', loadHistoricalPerformance);
  $('historical-team').addEventListener('change', renderHistorical);
}
