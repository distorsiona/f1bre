import { html } from '../utils/html.js';
/** Presentación de métricas deportivas. Los cálculos puros viven en domain/race-data.js. */
import {
  $,
  RaceData,
  escapeHtml,
  formatLapTime,
  formatMeasurement,
  getTeamColor,
} from '../utils/dom.js';
import { state } from '../state/store.js';
import { getVisibleDrivers } from '../state/selectors.js';
import { renderLineChart } from '../ui/line-chart.js';
/** Dibuja ritmo, stints, tabla, clima y eventos con los datos y filtros del estado actual. */
export function renderRaceAnalysis() {
  if (!state.session) return;
  const list = getVisibleDrivers(),
    stats = list.map((d) => RaceData.stats(d, state.data)),
    clean = stats.flatMap((s) => s.clean),
    maxLap = Math.max(0, ...(state.data.laps || []).map((l) => l.lap_number || 0)),
    best = clean.length ? Math.min(...clean.map((l) => l.lap_duration)) : null;
  $('race-heading').textContent =
    `${state.session.circuit_short_name} / ${$('team').value === 'all' ? 'Race overview' : $('team').value}`;
  $('metrics').innerHTML = [
    ['Drivers in view', list.length, 'Teams from this session'],
    ['Fastest included lap', formatLapTime(best), 'Excludes pit in / out laps'],
    ['Observed race laps', maxLap || '—', 'Maximum lap number in the feed'],
    [
      'Pit lane visits',
      state.data.pit === null ? '—' : stats.reduce((n, s) => n + s.pits.length, 0),
      'Not necessarily tyre changes',
    ],
  ]
    .map(
      ([a, b, c]) =>
        html`<div class="metric">
          <small>${escapeHtml(a)}</small><strong>${escapeHtml(b)}</strong
          ><span>${escapeHtml(c)}</span>
        </div>`,
    )
    .join('');
  $('chart').innerHTML = renderLineChart(
    stats.map((s) => ({ color: getTeamColor(s.driver), points: s.series })),
    'Average driver lap times in five-lap windows',
  );
  $('legend').innerHTML = stats
    .map(
      (s) =>
        html`<span
          ><i style="background:${getTeamColor(s.driver)}"></i
          >${escapeHtml(s.driver.name_acronym || s.driver.full_name)}</span
        >`,
    )
    .join('');
  $('stints').innerHTML = stats
    .map((s) => {
      let last = 0,
        bars = '';
      for (const t of s.stints) {
        if (!RaceData.number(t.lap_start) || !RaceData.number(t.lap_end) || t.lap_end < t.lap_start)
          continue;
        const gap = Math.max(0, t.lap_start - last - 1);
        if (gap)
          bars += html`<span class="unknown" style="flex:${gap}" title="No stint data">?</span>`;
        const c = String(t.compound || 'UNKNOWN').toLowerCase(),
          cls = ['soft', 'medium', 'hard', 'intermediate', 'wet'].includes(c) ? c : 'unknown';
        bars += html`<span
          class="${cls}"
          style="flex:${t.lap_end - t.lap_start + 1}"
          title="${escapeHtml(c)} · L${t.lap_start}–${t.lap_end} · Initial tyre age: ${escapeHtml(t.tyre_age_at_start ?? 'unknown')}"
          >${escapeHtml(c[0].toUpperCase())}</span
        >`;
        last = t.lap_end;
      }
      if (last && last < maxLap)
        bars += html`<span class="unrun" style="flex:${maxLap - last}" title="No recorded stint"
          >—</span
        >`;
      return html`<div class="stint-row">
        <div class="stint-label">
          <span>${escapeHtml(s.driver.name_acronym)} · ${escapeHtml(s.driver.team_name)}</span
          ><span>${s.pits === null ? '—' : s.pits.length} visits</span>
        </div>
        <div class="stint-bar">${bars || '<small>No stint data</small>'}</div>
      </div>`;
    })
    .join('');
  $('rows').innerHTML = [...stats]
    .sort((a, b) => (a.pace ?? Infinity) - (b.pace ?? Infinity))
    .map(
      (s) =>
        html`<tr>
          <td>${escapeHtml(s.driver.full_name)}</td>
          <td>${escapeHtml(s.driver.team_name)}</td>
          <td>${formatLapTime(s.pace)}</td>
          <td>${s.pits === null ? '—' : s.pits.length}</td>
          <td>${formatMeasurement(s.lane, ' s')}</td>
          <td>${formatMeasurement(s.stop, ' s')}</td>
          <td>${escapeHtml(s.stints.map((t) => t.compound ?? '?').join(' → ') || '—')}</td>
          <td>
            ${s.grid?.position ?? '—'} →
            ${s.result?.position ?? '—'}${s.result?.dnf ? ' (DNF)' : s.result?.dns ? ' (DNS)' : s.result?.dsq ? ' (DSQ)' : ''}
          </td>
        </tr>`,
    )
    .join('');
  $('insight').textContent =
    'Pace averages recorded timed laps, excluding reported pit-entry and pit-out laps. Safety-car, traffic and weather laps remain included. Pit lane visits can include drive-throughs. Missing measurements appear as —.';
  const w = (state.data.weather || []).at(-1);
  $('weather').innerHTML = w
    ? html`<p>Last observation: ${escapeHtml(w.date)}</p>
        <div class="weather-grid">
          ${[
            ['Track', w.track_temperature, ' °C'],
            ['Air', w.air_temperature, ' °C'],
            ['Humidity', w.humidity, ' %'],
            ['Wind', w.wind_speed, ' m/s'],
            ['Wind direction', w.wind_direction, '°'],
          ]
            .map(
              ([k, v, u]) =>
                html`<div><small>${k}</small><strong>${formatMeasurement(v, u)}</strong></div>`,
            )
            .join('')}
        </div>
        <p>
          Rainfall flag: ${w.rainfall === 1 ? 'Rain' : w.rainfall === 0 ? 'No rain' : 'Unknown'}
        </p>`
    : '<p>No weather observations available.</p>';
  $('control').innerHTML =
    (state.data.race_control || [])
      .slice(-30)
      .reverse()
      .map(
        (r) =>
          html`<li>
            <small>${escapeHtml(r.date)} · ${escapeHtml(r.flag || r.category)}</small>
            <p>${escapeHtml(r.message)}</p>
          </li>`,
      )
      .join('') || '<li>No race-control messages available.</li>';
}

/** Limpia únicamente los paneles propios de Race Analysis. */
export function clearRaceAnalysis() {
  for (const id of [
    'metrics',
    'chart',
    'legend',
    'stints',
    'rows',
    'insight',
    'weather',
    'control',
  ])
    $(id).replaceChildren();
}
