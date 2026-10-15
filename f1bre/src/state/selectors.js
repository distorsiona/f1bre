/** Selectores: derivan datos del estado sin modificarlo. */
import { state } from './store.js';
import { $ } from '../utils/dom.js';
/** Pilotos visibles en el análisis según el filtro de equipo. */
export const getVisibleDrivers = () =>
  state.drivers.filter((d) => $('team').value === 'all' || d.team_name === $('team').value);
