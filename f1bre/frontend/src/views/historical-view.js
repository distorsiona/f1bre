/** Catálogo sin carrera seleccionada y evolución de puntos oficiales por equipo. */
import { state } from '../state/store.js';
import { OpenF1 } from '../api/openf1-client.js';
import { createHomeView } from './home-view.js';
import { $, escapeHtml } from '../utils/dom.js';
const summary = createHomeView(state, 'historical-home');
export function initializeHistorical() {
  const root = $('historical-home');
  for (const child of $('home').children) root.append(child.cloneNode(true));
  root.querySelectorAll('[id]').forEach((element) => {
    element.id = element.id.replace(/^home/, 'historical-home');
  });
  summary.configureHomeActions({
    selectRace(key) {
      $('race').value = String(key);
      $('race').dispatchEvent(new window.Event('change'));
    },
  });
}
let results = [];
let loadedYear;
let generation = 0;
export function renderHistorical() {
  $('historical-home').hidden = !state.session;
  if (state.session) {
    summary.renderHome();
    $('historical-home')
      .querySelectorAll('a[href^="#overview"]')
      .forEach((link) => {
        link.href = '#overview/' + state.session.session_key;
      });
  }
  if (loadedYear !== $('year').value) {
    ++generation;
    loadedYear = $('year').value;
    results = [];
    $('historical-team').replaceChildren(new Option('All teams', 'all'));
    $('history-status').textContent = '';
    $('load-history').disabled = false;
  }
  $('historical-catalog').innerHTML =
    state.sessions
      .map(
        (race) =>
          `<button class="reset" data-open-race="${race.session_key}">${escapeHtml(race.circuit_short_name)} · ${escapeHtml(race.date_start.slice(0, 10))}</button>`,
      )
      .join('') || '<p>No completed races available.</p>';
  $('historical-catalog')
    .querySelectorAll('[data-open-race]')
    .forEach((button) => {
      button.onclick = () => {
        $('race').value = button.dataset.openRace;
        $('race').dispatchEvent(new window.Event('change'));
      };
    });
  const team = $('historical-team').value;
  const rows = results
    .flatMap(({ race, teams, error }) =>
      error
        ? `<tr><td>${escapeHtml(race.circuit_short_name)}</td><td colspan="4">Data unavailable</td></tr>`
        : teams
            .filter((row) => team === 'all' || row.team_name === team)
            .map(
              (row) =>
                `<tr><td>${escapeHtml(race.circuit_short_name)}</td><td>${escapeHtml(row.team_name)}</td><td>${row.position_current ?? '—'}</td><td>${row.points_current ?? '—'}</td><td>${Number.isFinite(row.points_current) && Number.isFinite(row.points_start) ? row.points_current - row.points_start : '—'}</td></tr>`,
            )
            .join(''),
    )
    .join('');
  $('historical-performance').innerHTML = rows
    ? `<table><thead><tr><th>Grand Prix</th><th>Team</th><th>Championship position</th><th>Cumulative points</th><th>Race points</th></tr></thead><tbody>${rows}</tbody></table>`
    : '<p>Load team performance to compare races.</p>';
}
export async function loadHistoricalPerformance() {
  const token = ++generation;
  const year = $('year').value;
  results = [];
  $('load-history').disabled = true;
  const races = [...state.sessions];
  for (const race of races) {
    let teams = [],
      error = false;
    try {
      teams = await OpenF1.query('championship_teams', { session_key: race.session_key });
    } catch {
      error = true;
    }
    if (token !== generation || year !== $('year').value) return;
    results.push({ race, teams, error });
    const chosen = $('historical-team').value;
    const names = [
      ...new Set(results.flatMap((item) => item.teams.map((row) => row.team_name))),
    ].sort();
    $('historical-team').replaceChildren(
      new Option('All teams', 'all'),
      ...names.map((name) => new Option(name, name)),
    );
    if (names.includes(chosen)) $('historical-team').value = chosen;
    $('history-status').textContent = `Loaded ${results.length} / ${races.length} races`;
    renderHistorical();
  }
  $('load-history').disabled = false;
}

export function resetHistorical() {
  loadedYear = undefined;
  renderHistorical();
}
