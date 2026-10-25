import test from 'node:test';
import assert from 'node:assert/strict';
import { seasonContext } from '../src/domain/season-context.js';
import { createHomeView } from '../src/views/home-view.js';
import { OpenF1 } from '../src/api/openf1-client.js';
import { state, homeState } from '../src/state/store.js';
import { configureSessionViews, loadRace } from '../src/features/sessions.js';
import { activateRoute, loadHome } from '../src/features/navigation.js';

function mockDOM() {
  const elements = new Map();
  globalThis.document = {
    querySelectorAll: () => [],
    getElementById(id) {
      if (!elements.has(id))
        elements.set(id, {
          value: id === 'team' ? 'all' : '',
          children: [],
          textContent: '',
          innerHTML: '',
          previousElementSibling: {},
          classList: { toggle() {} },
          replaceChildren(...children) {
            this.children = children;
            this.value = String(children[0]?.value ?? '');
          },
          setAttribute() {},
          removeAttribute() {},
          querySelectorAll: () => [],
          querySelector: () => null,
          closest: () => null,
        });
      return elements.get(id);
    },
  };
  globalThis.window = { Event: class {}, dispatchEvent() {}, requestAnimationFrame: (fn) => fn() };
  globalThis.Option = class {
    constructor(text, value) {
      this.text = text;
      this.value = value;
    }
  };
  globalThis.location = { hash: '#historical' };
  return (id) => document.getElementById(id);
}
const race = (year, key = 1, extra = {}) => ({
  year,
  session_key: key,
  meeting_key: key,
  date_start: `${year}-01-01T10:00:00Z`,
  date_end: `${year}-01-01T12:00:00Z`,
  circuit_short_name: 'Test circuit',
  country_name: 'Test country',
  ...extra,
});

test('el reloj determina temporada y última carrera finalizada sin incluir futuras o canceladas', () => {
  const rows = [
    race(2024),
    race(2025, 2),
    race(2025, 3, { is_cancelled: true }),
    race(2025, 4, { date_end: '2025-06-01T12:00:01Z' }),
  ];
  const context = seasonContext(rows, new Date(2025, 5, 1, 0, 0, 0));
  assert.equal(context.year, 2025);
  assert.equal(context.session.session_key, 2);
  assert.equal(seasonContext(rows, new Date(2026, 0, 1)).session, null);
});

test('Historical y Race Analysis abren catálogos; Drivers y Teams conservan sus datos', async () => {
  const original = { query: OpenF1.query, peek: OpenF1.peek };
  const $ = mockDOM();
  const calls = [];
  OpenF1.peek = () => null;
  OpenF1.query = async (endpoint, params) => {
    calls.push(endpoint);
    return endpoint === 'sessions' ? [race(Number(params.year))] : [];
  };
  configureSessionViews({ clear() {}, refresh() {} });
  try {
    await activateRoute();
    assert.equal(state.session, null);
    assert.equal($('race').value, '');
    assert.deepEqual(calls, ['sessions']);
    $('race').value = '1';
    await loadRace();
    assert.equal(location.hash, '#historical');
    assert.equal(state.session.session_key, 1);
    assert.ok(calls.includes('championship_teams'));
    location.hash = '#overview';
    calls.length = 0;
    await activateRoute();
    assert.equal(state.session, null);
    assert.equal($('race').value, '');
    assert.deepEqual(calls, ['sessions']);
    location.hash = '#drivers';
    await activateRoute();
    assert.ok(state.session);
    assert.ok(calls.includes('championship_drivers'));
    location.hash = '#teams';
    await activateRoute();
    assert.ok(calls.includes('championship_teams'));
  } finally {
    Object.assign(OpenF1, original);
  }
});

test('el resumen histórico tiene DOM y estado independientes del Home', () => {
  const $ = mockDOM();
  const snapshot = (year) => ({
    session: race(year),
    year,
    sessions: [race(year)],
    calendar: [],
    data: {},
    drivers: [],
    status: 'ready',
  });
  const current = snapshot(2026),
    historical = snapshot(2024);
  const home = createHomeView(current);
  const history = createHomeView(historical, 'historical-home');
  home.renderHome();
  const before = $('home-season-title').innerHTML;
  history.renderHome();
  assert.equal($('home-season-title').innerHTML, before);
  assert.match($('historical-home-season-title').innerHTML, /2024/);
  assert.match(before, /2026/);
});

test('Home ignora selección histórica y consulta campeonatos frescos de la temporada actual', async () => {
  mockDOM();
  const original = { query: OpenF1.query, peek: OpenF1.peek };
  const calls = [];
  location.hash = '#home';
  state.session = race(2023, 99);
  OpenF1.query = async (endpoint, params, options) => {
    calls.push({ endpoint, params, options });
    return endpoint === 'sessions' ? [race(new Date().getFullYear(), 7)] : [];
  };
  try {
    await loadHome();
    assert.equal(homeState.session.session_key, 7);
    assert.equal(state.session.session_key, 99);
    for (const name of ['championship_drivers', 'championship_teams']) {
      const call = calls.find((item) => item.endpoint === name);
      assert.equal(call.params.session_key, 7);
      assert.equal(call.options.force, true);
    }
  } finally {
    Object.assign(OpenF1, original);
  }
});
