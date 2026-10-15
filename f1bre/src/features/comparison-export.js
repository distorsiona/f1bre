/** Exportación de la comparación visible. La fuente y la sesión quedan incluidas en el CSV. */
import { RaceData } from '../utils/dom.js';
import { state } from '../state/store.js';
import { getVisibleDrivers } from '../state/selectors.js';
import { downloadCsv } from '../utils/csv.js';

export function exportComparison() {
  if (!state.session) return;
  const rows = getVisibleDrivers().map((driver) => {
    const stats = RaceData.stats(driver, state.data);
    return {
      source: 'OpenF1',
      session_key: state.session.session_key,
      year: state.session.year,
      circuit: state.session.circuit_short_name,
      driver_number: driver.driver_number,
      driver: driver.full_name,
      team: driver.team_name,
      average_pace_seconds: stats.pace,
      best_recorded_lap_seconds: stats.best,
      pit_lane_visits: stats.pits?.length,
      mean_lane_seconds: stats.lane,
      mean_stationary_stop_seconds: stats.stop,
      tyre_sequence: stats.stints.map((stint) => stint.compound).join(' / '),
      grid: stats.grid?.position,
      result: stats.result?.position,
      dnf: stats.result?.dnf,
      dns: stats.result?.dns,
      dsq: stats.result?.dsq,
    };
  });
  downloadCsv(rows, `f1bre-${state.session.session_key}-openf1.csv`);
}
