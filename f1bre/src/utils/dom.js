/** Utilidades compartidas de DOM, textos, tiempos y colores. */
import { F1Data } from '../domain/race-data.js';
export const RaceData = F1Data;
/** Acceso a elementos por su id estable en index.html. */
export const $ = (id) => document.getElementById(id);
/** Escapa valores externos antes de insertarlos en un template HTML. */
export const escapeHtml = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
/** Formatea segundos como minutos:segundos; null se muestra como —. */
export const formatLapTime = (n) =>
  RaceData.number(n) ? `${Math.floor(n / 60)}:${(n % 60).toFixed(3).padStart(6, '0')}` : '—';
/** Formatea un número con una cifra decimal y unidad opcional. */
export const formatMeasurement = (v, u = '') => (RaceData.number(v) ? v.toFixed(1) + u : '—');
/** Acepta solo HEX RGB válido de OpenF1; burdeo es el color de respaldo. */
export const getTeamColor = (d) =>
  /^[0-9a-f]{6}$/i.test(d.team_colour || '') ? '#' + d.team_colour : '#641f32';
