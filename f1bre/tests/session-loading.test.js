import test from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../src/state/store.js';
import { OpenF1 } from '../src/api/openf1-client.js';
import { loadRace, ensureRouteData, configureSessionViews } from '../src/features/sessions.js';
import { endpointsForRoute } from '../src/features/session-plan.js';

const tick = () => new Promise((resolve) => setImmediate(resolve));
const session = (key) => ({
  session_key: key,
  meeting_key: key,
  year: 2025,
  date_start: '2025-12-07T13:00:00Z',
  circuit_short_name: 'Yas Marina',
});
function setup() {
  const elements = new Map();
  globalThis.document = {
    querySelectorAll: () => [],
    getElementById: (id) => {
      if (!elements.has(id))
        elements.set(id, {
          value: '',
          disabled: false,
          textContent: '',
          classList: { toggle() {} },
          replaceChildren(...children) {
            this.value = String(children[0]?.value ?? '');
          },
          setAttribute() {},
        });
      return elements.get(id);
    },
  };
  globalThis.Option = class {
    constructor(text, value) {
      this.text = text;
      this.value = String(value);
    }
  };
  globalThis.location = { hash: '#drivers' };
  state.sessions = [session(100), session(200)];
  document.getElementById('race').value = '100';
  OpenF1.peek = () => null;
  return elements;
}
test('carga progresiva, cambio de vista, carrera obsoleta y restauración inmediata', async (t) => {
  const original = {
    query: OpenF1.query,
    peek: OpenF1.peek,
    document: globalThis.document,
    Option: globalThis.Option,
    location: globalThis.location,
  };
  try {
    await t.test(
      'Drivers publica pilotos antes del campeonato y omite vueltas y clima',
      async () => {
        setup();
        const calls = [];
        const snapshots = [];
        let drivers;
        let championship;
        configureSessionViews({
          clear() {},
          refresh() {
            snapshots.push(state.drivers.length);
          },
        });
        OpenF1.query = (endpoint) => {
          calls.push(endpoint);
          return new Promise((resolve) => {
            if (endpoint === 'drivers') drivers = resolve;
            else championship = resolve;
          });
        };
        const loading = loadRace();
        await tick();
        drivers([{ driver_number: 4, team_name: 'McLaren' }]);
        await tick();
        assert.ok(snapshots.includes(1));
        assert.equal(state.busy, true);
        assert.deepEqual(calls, ['drivers', 'championship_drivers']);
        championship([]);
        await loading;
        assert.equal(state.busy, false);
      },
    );
    await t.test(
      'al navegar durante la carga prioriza los endpoints de la nueva vista',
      async () => {
        setup();
        const calls = [];
        let release;
        OpenF1.query = async (endpoint) => {
          calls.push(endpoint);
          if (endpoint === 'drivers')
            return new Promise((resolve) => {
              release = resolve;
            });
          return [];
        };
        const loading = loadRace();
        await tick();
        location.hash = '#teams';
        ensureRouteData();
        release([{ driver_number: 4, team_name: 'McLaren' }]);
        await loading;
        assert.deepEqual(calls, ['drivers', 'championship_teams', 'session_result']);
      },
    );
    await t.test('un error de una carrera anterior no contamina la nueva selección', async () => {
      const elements = setup();
      let rejectOld;
      OpenF1.query = async (endpoint, params) => {
        if (params.session_key === 100)
          return new Promise((resolve, reject) => {
            rejectOld = reject;
          });
        return endpoint === 'drivers' ? [{ driver_number: 81, team_name: 'McLaren' }] : [];
      };
      const old = loadRace();
      await tick();
      elements.get('race').value = '200';
      await loadRace();
      rejectOld(Error('Old request'));
      await old;
      assert.equal(state.session.session_key, 200);
      assert.equal(state.drivers[0].driver_number, 81);
      assert.ok(!elements.get('load-status').textContent.includes('Unavailable'));
    });
    await t.test(
      'restaura caché antes de esperar la red y permite cargar otra vista después',
      async () => {
        setup();
        const calls = [];
        OpenF1.peek = (endpoint) =>
          ['drivers', 'championship_drivers'].includes(endpoint)
            ? {
                fresh: true,
                rows: endpoint === 'drivers' ? [{ driver_number: 4, team_name: 'McLaren' }] : [],
              }
            : null;
        OpenF1.query = async (endpoint) => {
          calls.push(endpoint);
          return [];
        };
        const loading = loadRace();
        assert.equal(state.drivers.length, 1);
        assert.equal(calls.length, 0);
        await loading;
        location.hash = '#teams';
        await ensureRouteData();
        assert.deepEqual(calls, ['championship_teams', 'session_result']);
      },
    );
    assert.ok(!endpointsForRoute('#drivers').includes('laps'));
    assert.ok(endpointsForRoute('#overview').includes('laps'));
  } finally {
    OpenF1.query = original.query;
    OpenF1.peek = original.peek;
    globalThis.document = original.document;
    globalThis.Option = original.Option;
    globalThis.location = original.location;
  }
});
