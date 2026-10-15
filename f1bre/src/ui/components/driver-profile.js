/** Perfil editorial inspirado en la referencia: identidad, ficha y retrato con bandera.
 * Recibe datos ya cargados; no consulta OpenF1 ni inventa un histórico deportivo. */
import { html } from '../../utils/html.js';
import { escapeHtml, formatLapTime, formatMeasurement } from '../../utils/dom.js';
import { points } from '../../state/entity-selectors.js';
import { logo, portrait } from './entities.js';

function facts(items) {
  return html`<dl>
    ${items
      .map(
        ([label, value]) =>
          html`<div>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>`,
      )
      .join('')}
  </dl>`;
}

export function driverProfile(driver, session, championship, stats) {
  const firstName = driver.first_name || driver.full_name.split(' ').slice(0, -1).join(' ');
  const lastName = driver.last_name || driver.full_name.split(' ').at(-1);
  return html`<div class="driver-editorial" data-entity-team="${escapeHtml(driver.team_name)}">
    <span class="driver-editorial-acronym" aria-hidden="true"
      >${escapeHtml(driver.name_acronym || lastName.slice(0, 3))}</span
    >
    <div class="driver-editorial-copy">
      <div class="driver-editorial-brand">
        ${logo(driver.team_name, 'driver-editorial-logo')}
      </div>
      <header class="driver-editorial-heading">
        <p>FORMULA 1 / DRIVER PROFILE</p>
        <h1>
          <span class="driver-editorial-first"
            ><span class="driver-editorial-number">${driver.driver_number}</span>
            ${escapeHtml(firstName)}</span
          ><span class="driver-editorial-last">${escapeHtml(lastName)}</span>
        </h1>
      </header>
      <section class="driver-fact-panel" aria-label="Season standings">
        <h2>SEASON ${session.year}</h2>
        ${facts([
          ['Team', driver.team_name],
          ['Championship position', championship?.position_current ?? '—'],
          ['Season points', points(championship?.points_current)],
        ])}
      </section>
      <section class="driver-fact-panel" aria-label="Selected race metrics">
        <h2>SELECTED RACE <span>${escapeHtml(session.circuit_short_name)}</span></h2>
        ${facts([
          ['Race finish', stats.result?.position ?? '—'],
          ['Average race pace', formatLapTime(stats.pace)],
          ['Best recorded lap', formatLapTime(stats.best)],
          ['Pit lane visits', stats.pits?.length ?? '—'],
          ['Tyres', stats.stints.map((stint) => stint.compound || '?').join(' → ') || '—'],
          ['Mean stationary stop', formatMeasurement(stats.stop, ' s')],
        ])}
      </section>
      <div class="profile-actions">
        <button class="primary-button" id="profile-analysis">View race analysis →</button>
        <button class="secondary-button" data-team-profile="${escapeHtml(driver.team_name)}">
          View team
        </button>
      </div>
      <p class="profile-note">
        ${escapeHtml(session.date_start.slice(0, 10))} · Standings at the selected race. Missing
        measurements appear as —.
      </p>
    </div>
    <figure class="driver-editorial-visual" aria-label="${escapeHtml(driver.full_name)} portrait">
      ${portrait(driver, true)}
      <figcaption>${escapeHtml(driver.full_name)} <span>#${driver.driver_number}</span></figcaption>
    </figure>
  </div>`;
}
