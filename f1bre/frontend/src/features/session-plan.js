/** Dependencias por pantalla, ordenadas por prioridad de presentación. */
const PLANS = {
  drivers: ['drivers', 'championship_drivers'],
  teams: ['drivers', 'championship_teams', 'session_result'],
  home: [
    'drivers',
    'meetings',
    'session_result',
    'championship_drivers',
    'championship_teams',
    'weather',
    'stints',
    'laps',
  ],
  historical: [
    'drivers',
    'meetings',
    'session_result',
    'championship_drivers',
    'championship_teams',
    'weather',
    'stints',
    'laps',
    'pit',
  ],
  overview: [
    'drivers',
    'laps',
    'pit',
    'stints',
    'session_result',
    'starting_grid',
    'intervals',
    'team_radio',
    'weather',
    'race_control',
  ],
  driver: ['drivers', 'championship_drivers', 'session_result', 'laps', 'pit', 'stints'],
  team: [
    'drivers',
    'championship_teams',
    'championship_drivers',
    'session_result',
    'laps',
    'pit',
    'stints',
  ],
};
export function endpointsForRoute(hash) {
  const route = String(hash || '')
    .replace(/^#/, '')
    .split('/')[0];
  return PLANS[route] || PLANS.home;
}
