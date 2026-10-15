/** Vista Teams: equipos de la sesión, pilotos inscritos y métricas por constructor. */
import { $, escapeHtml } from '../utils/dom.js';
import { html } from '../utils/html.js';
import { state } from '../state/store.js';
import { teamsInSession, teamStanding, bestFinish, points } from '../state/entity-selectors.js';
import { logo, bindProfiles } from '../ui/components/entities.js';
export function renderTeams() {
  if (!state.session) return;
  $('teams-context').textContent =
    `${state.session.circuit_short_name} · ${state.session.date_start.slice(0, 10)} · Championship at selected race`;
  $('team-count').textContent =
    `${teamsInSession().length} teams · ${state.session.year} · Championship points at the selected race`;
  $('team-cards').innerHTML = teamsInSession()
    .map((name) => {
      const group = state.drivers.filter((d) => d.team_name === name),
        s = teamStanding(name),
        finishes = (state.data.session_result || []).filter((r) =>
          group.some((d) => d.driver_number === r.driver_number),
        );
      return html`<button
        class="team-card"
        data-team-profile="${escapeHtml(name)}"
        aria-label="Open ${escapeHtml(name)} team profile"
      >
        <span class="team-card-head"
          ><span class="team-card-title"
            ><strong>${escapeHtml(name)}</strong
            ><small>FORMULA 1 TEAM / ${state.session.year}</small></span
          ><span class="team-rank"><small>POS</small>${s?.position_current ?? '—'}</span></span
        ><span class="team-brand-slot"
          ><span class="team-monogram">${escapeHtml(name.toUpperCase())}</span
          >${logo(name, 'team-logo')}</span
        ><span class="team-drivers"
          >${group.map((d) => html`<span class="team-driver-line"><span class="team-driver-number">${d.driver_number}</span><span>${escapeHtml(d.full_name)}</span></span>`).join('')}</span
        ><span class="team-stats"
          ><span><strong>${points(s?.points_current)}</strong><small>SEASON POINTS</small></span
          ><span
            ><strong>${finishes.length ? bestFinish(finishes) : '—'}</strong
            ><small>BEST RACE FINISH</small></span
          ><span><strong>${group.length}</strong><small>DRIVERS</small></span></span
        ><span class="team-card-foot"><span>View team profile</span><span>→</span></span>
      </button>`;
    })
    .join('');
  bindProfiles($('teams'));
}
export function clearTeams() {
  $('team-cards').replaceChildren();
  $('team-count').textContent = 'Loading teams…';
  $('teams-context').textContent = 'Loading selected race…';
}
