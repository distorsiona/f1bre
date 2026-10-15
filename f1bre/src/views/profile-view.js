/** Vista de detalle de piloto o equipo. Delega la acción de análisis al controlador. */
import { $, RaceData, escapeHtml, formatLapTime, getTeamColor } from '../utils/dom.js';
import { html } from '../utils/html.js';
import { state } from '../state/store.js';
import { standing, teamStanding, points } from '../state/entity-selectors.js';
import { logo, driverRow, teamSlug, bindProfiles } from '../ui/components/entities.js';

import { driverProfile } from '../ui/components/driver-profile.js';

let openAnalysis = () => {};

export function configureProfileActions(actions) {
  openAnalysis = actions.openAnalysis;
}

// Datos opcionales de los equipos.
// Completar con información verificada de cada constructor.
const TEAM_DETAILS = {};

const display = (value) =>
  value === undefined || value === null || value === '' ? '—' : String(value);

function statCards(items, circuit) {
  return html`
    <div class="profile-stat-grid">
      ${items
        .map(
          ([label, value]) => html`
            <article class="summary-card">
              <small>${escapeHtml(label)}</small>
              <strong>${escapeHtml(display(value))}</strong>
              <span>${escapeHtml(circuit)}</span>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function teamProfile(name, group, season, circuit, date, standings, stats, pace) {
  const details = TEAM_DETAILS[name] || {};

  const specs = [
    ['Power Unit', details.powerUnit],
    ['Chassis', details.chassis],
    ['Weight', details.weight],
    ['Tyres', details.tyres],
    ['Top Speed', details.topSpeed],
  ];

  const legacy = [
    ["Constructors' Titles", details.constructorTitles],
    ["Drivers' Titles", details.driverTitles],
    ['Grand Prix Wins', details.grandPrixWins],
    ['Podiums', details.podiums],
  ];

  const metrics = [
    ['Championship position', standings?.position_current ?? '—'],
    ['Season points', points(standings?.points_current)],
    ['Race finish', stats.map((r) => r.result?.position ?? '—').join(' / ')],
    ['Average race pace', formatLapTime(pace)],
  ];

  return html`
    <div class="team-detail" data-entity-team="${escapeHtml(name)}">
      <!-- TEAM HEADER -->
      <header class="team-detail-header">
        <div>
          <span class="eyebrow"> FORMULA 1 TEAM / ${escapeHtml(String(season))} </span>

          <h2>${escapeHtml(name.toUpperCase())}</h2>

          <p class="team-detail-year">${escapeHtml(String(season))}</p>
        </div>

        <div class="team-detail-brand">
          <span class="team-monogram"> ${escapeHtml(name.toUpperCase())} </span>

          ${logo(name, 'team-logo')}
        </div>
      </header>

      <!-- MAIN TEAM LAYOUT -->
      <div class="team-detail-layout">
        <!-- CAR -->
        <article class="team-detail-car panel">
          <img
            src="assets/cars/${teamSlug(name)}.png"
            alt="${escapeHtml(name)} car, top view"
            data-car
            loading="lazy"
          />

          <p class="car-fallback" data-car-placeholder>Car image unavailable</p>
        </article>

        <!-- CENTER COLUMN -->
        <div class="team-detail-center">
          <!-- DRIVERS -->
          <section class="team-detail-panel team-detail-drivers">
            <h3>Drivers</h3>

            <div class="driver-list">${group.map((driver) => driverRow(driver)).join('')}</div>
          </section>

          <!-- CAR SPECIFICATIONS -->
          <section class="team-detail-panel team-detail-specs">
            <h3>Car specifications</h3>

            <dl>
              ${specs
                .map(
                  ([key, value]) => html`
                    <div>
                      <dt>${escapeHtml(key)}</dt>
                      <dd>${escapeHtml(display(value))}</dd>
                    </div>
                  `,
                )
                .join('')}
            </dl>
          </section>
        </div>

        <!-- TEAM LEGACY -->
        <aside class="team-detail-panel team-detail-legacy">
          <h3>Team legacy</h3>

          <dl>
            ${legacy
              .map(
                ([key, value]) => html`
                  <div>
                    <dt>${escapeHtml(key)}</dt>
                    <dd>${escapeHtml(display(value))}</dd>
                  </div>
                `,
              )
              .join('')}
          </dl>

          <p class="legacy-note">
            Historical records are shown when verified team data is available.
          </p>
        </aside>
      </div>

      <!-- SELECTED RACE -->
      <section class="team-detail-race">
        <h3>
          Selected race
          <span> · ${escapeHtml(circuit)} ${escapeHtml(String(season))} </span>
        </h3>

        ${statCards(metrics, circuit)}

        <div class="team-detail-race-actions">
          <button class="primary-button" id="profile-analysis">View race analysis →</button>
        </div>
      </section>

      <p class="profile-note">
        Selected session: ${escapeHtml(date)}. Season standings use OpenF1's championship feed when
        available. Missing records appear as —.
      </p>
    </div>
  `;
}

export function showProfile(kind, id) {
  if (!state.session) {
    $('profile-content').innerHTML = '<p class="empty">Load a race to view this profile.</p>';
    return;
  }

  let d, group, name;

  if (kind === 'driver') {
    d = state.drivers.find((r) => String(r.driver_number) === String(id));

    if (!d) {
      $('profile-content').innerHTML =
        '<p class="empty">This driver is not in the selected race.</p>';
      return;
    }

    group = [d];
    name = d.full_name;
  } else {
    name = id;

    group = state.drivers.filter((r) => r.team_name === name);

    if (!group.length) {
      $('profile-content').innerHTML =
        '<p class="empty">This team is not in the selected race.</p>';
      return;
    }
  }

  const stats = group.map((r) => RaceData.stats(r, state.data));

  const s = d ? standing(d) : teamStanding(name);

  const pace = RaceData.mean(stats.map((item) => item.pace));

  const circuit = state.session.circuit_short_name;
  const date = state.session.date_start.slice(0, 10);

  $('profile-back').href = d ? '#drivers' : '#teams';

  $('profile-back').textContent = d ? '← Back to drivers' : '← Back to teams';
  // El enlace queda fuera de la ficha: recibe el color del piloto de forma explícita.
  if (d) $('profile-back').style.setProperty('--driver-color', getTeamColor(d));
  else $('profile-back').style.removeProperty('--driver-color');

  if (!d) {
    // TEAM PROFILE
    $('profile-content').innerHTML = teamProfile(
      name,
      group,
      state.session.year,
      circuit,
      date,
      s,
      stats,
      pace,
    );
  } else {
    $('profile-content').innerHTML = driverProfile(d, state.session, s, stats[0]);
  }

  // RACE ANALYSIS ACTION
  $('profile-analysis').onclick = () => {
    openAnalysis({
      teamName: d ? d.team_name : name,
      driverNumber: d?.driver_number,
    });
  };

  // PROFILE NAVIGATION
  bindProfiles($('profile'));
}

export function clearProfile() {
  $('profile-content').innerHTML = '<p class="empty">Loading selected race…</p>';
}
