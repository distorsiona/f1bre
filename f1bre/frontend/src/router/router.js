/** Enrutador por hash: visibilidad, navegación activa y resolución de perfiles. Sin consultas HTTP. */
import { state } from '../state/store.js';
import { $ } from '../utils/dom.js';
import { centerSelectedRace } from '../views/home-view.js';
import { showProfile } from '../views/profile-view.js';
import { updateNavbar } from '../ui/components/navbar.js';
export function renderRoute() {
  const rawHash = location.hash.slice(1) || 'home',
    parts = rawHash.split('/'),
    kind = parts[0],
    page =
      kind === 'driver' || kind === 'team'
        ? 'profile'
        : ['home', 'teams', 'drivers', 'overview', 'historical'].includes(kind)
          ? kind
          : 'home';
  document.body.classList.toggle('home-mode', page === 'home');
  document.body.classList.toggle('drivers-mode', page === 'drivers');
  document.body.classList.toggle('teams-mode', page === 'teams');
  document.body.classList.toggle('analysis-mode', page === 'overview');
  const teamProfile = page === 'profile' && kind === 'team';
  document.body.classList.toggle('profile-mode', page === 'profile');
  document.body.classList.toggle('team-profile-mode', teamProfile);
  document.body.classList.toggle(
    'catalog-mode',
    page === 'drivers' || page === 'teams' || page === 'overview' || page === 'profile',
  );
  document.body.classList.toggle(
    'portal-mode',
    ['home', 'drivers', 'teams', 'overview', 'historical', 'profile'].includes(page),
  );
  document.querySelectorAll('[data-page]').forEach((el) => {
    el.hidden = el.dataset.page !== page;
  });
  $('selection-panel').hidden = !['overview', 'historical'].includes(page);
  $('season-field').hidden = page !== 'historical';
  $('selection-hint').textContent =
    page === 'historical'
      ? 'Choose a Grand Prix to see its race summary.'
      : 'Choose a Grand Prix to open its analysis.';
  $('analysis-details').hidden = !state.session;
  $('source-link').hidden = page === 'home' || !state.session;
  if (page === 'home') centerSelectedRace();
  updateNavbar(kind === 'driver' || kind === 'team' ? kind : page);
  $('page-title').textContent = {
    home: 'RACING ANALYTICS',
    teams: 'TEAMS',
    drivers: 'DRIVERS',
    overview: 'RACE ANALYSIS',
    historical: 'HISTORICAL',
    profile: 'PROFILE',
  }[page];
  if (page === 'profile') {
    let id;
    try {
      id = decodeURIComponent(parts.slice(1).join('/'));
    } catch {
      id = '';
    }
    showProfile(kind, id);
  }
}
