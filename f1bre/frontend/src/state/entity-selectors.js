/** Consultas deportivas compartidas; no dibujan pantallas ni realizan peticiones. */
import { state } from './store.js';
import { RaceData } from '../utils/dom.js';
export function standing(d) {
  return (state.data.championship_drivers || []).find((r) => r.driver_number === d.driver_number);
}

export function sortedDrivers() {
  return [...state.drivers].sort(
    (a, b) =>
      (standing(a)?.position_current ?? 999) - (standing(b)?.position_current ?? 999) ||
      a.driver_number - b.driver_number,
  );
}

export function teamStanding(name) {
  return (state.data.championship_teams || []).find((r) => r.team_name === name);
}

export function teamsInSession() {
  return [...new Set(state.drivers.map((d) => d.team_name))].sort(
    (a, b) =>
      (teamStanding(a)?.position_current ?? 999) - (teamStanding(b)?.position_current ?? 999) ||
      a.localeCompare(b),
  );
}

export function bestFinish(rows) {
  const positions = rows
    .filter((r) => RaceData.number(r.position) && r.position > 0 && !r.dns && !r.dsq)
    .map((r) => r.position);
  return positions.length ? Math.min(...positions) : '—';
}

export const points = (n) => (RaceData.number(n) ? Number(n.toFixed(1)).toString() : '—');
