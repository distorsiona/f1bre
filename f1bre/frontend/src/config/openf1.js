/**
 * Catálogo de endpoints externos de OpenF1.
 * No existen rutas de backend propias: el navegador consulta esta API directamente.
 * Referencia: https://openf1.org/docs/
 */
export const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

/** Políticas del cliente histórico: caché temporal, cola compartida y timeout. */
export const REQUEST_INTERVAL_MS = 2200;
export const REQUEST_TIMEOUT_MS = 45000;
export const MAX_REQUEST_ATTEMPTS = 3;
export const MAX_CACHE_ENTRIES = 60;
export const HISTORICAL_DELAY_MS = 30 * 60 * 1000;

/**
 * Este objeto es la lista permitida del cliente y del selector de datasets.
 * `scope` indica el ámbito, no la lista completa de filtros admitidos por OpenF1.
 * Los datasets grandes se consultan con un piloto y una ventana de una vuelta.
 */
export const ENDPOINTS = Object.freeze({
  car_data: {
    scope: 'session + driver + time',
    description: 'Velocidad, acelerador, freno, RPM, marcha y estado DRS.',
  },
  championship_drivers: {
    scope: 'session',
    description: 'Puntos y posición de campeonato por piloto; endpoint beta.',
  },
  championship_teams: {
    scope: 'session',
    description: 'Puntos y posición de campeonato por equipo; endpoint beta.',
  },
  drivers: { scope: 'session', description: 'Pilotos inscritos, número, nombre, equipo y color.' },
  intervals: {
    scope: 'session + driver + time',
    description: 'Intervalo con el coche precedente y diferencia con el líder.',
  },
  laps: { scope: 'session', description: 'Vueltas, duración, sectores, speed traps e inicio UTC.' },
  location: {
    scope: 'session + driver + time',
    description: 'Coordenadas aproximadas del coche: x, y, z.',
  },
  meetings: { scope: 'meeting', description: 'Información del fin de semana del Gran Premio.' },
  overtakes: {
    scope: 'session + overtaking driver',
    description: 'Adelantamientos registrados y piloto que adelanta.',
  },
  pit: {
    scope: 'session',
    description: 'Visitas al pit lane, duración en pit lane y tiempo detenido.',
  },
  position: {
    scope: 'session + driver + time',
    description: 'Posiciones del piloto durante la sesión.',
  },
  race_control: {
    scope: 'session',
    description: 'Banderas, neutralizaciones, incidentes y mensajes de dirección de carrera.',
  },
  sessions: {
    scope: 'year or session',
    description: 'Sesiones de cada temporada y sus fechas, circuito y session_key.',
  },
  session_result: {
    scope: 'session',
    description: 'Resultados de sesión, posiciones finales y estados DNF/DNS/DSQ.',
  },
  starting_grid: {
    scope: 'session',
    description: 'Parrilla cuando existe cobertura; puede devolver 404.',
  },
  stints: {
    scope: 'session',
    description: 'Compuestos de neumático, rango de vueltas y edad inicial.',
  },
  team_radio: {
    scope: 'session + driver',
    description: 'Enlaces de grabaciones de radio disponibles; cobertura parcial.',
  },
  weather: { scope: 'session', description: 'Temperaturas, humedad, presión, lluvia y viento.' },
});

/** Datasets que se cargan al abrir una carrera; el resto se solicita bajo demanda. */
export const CORE_ENDPOINTS = Object.freeze([
  'meetings',
  'drivers',
  'laps',
  'stints',
  'pit',
  'weather',
  'race_control',
  'session_result',
  'starting_grid',
  'intervals',
  'team_radio',
  'championship_drivers',
  'championship_teams',
]);

/** Los valores se muestran en su unidad original; DRS mantiene los códigos de la API. */
export const TELEMETRY_UNITS = Object.freeze({
  speed: 'km/h',
  throttle: '%',
  brake: '0 / 100',
  rpm: 'rpm',
  n_gear: 'gear',
  drs: 'raw status',
});

/** Filtros del explorador, compartidos para evitar listas dispersas en la UI. */
export const DRIVER_FILTER_ENDPOINTS = Object.freeze([
  'car_data',
  'location',
  'intervals',
  'position',
  'team_radio',
  'laps',
  'pit',
  'stints',
  'session_result',
  'starting_grid',
  'championship_drivers',
]);
export const LAP_WINDOW_ENDPOINTS = Object.freeze([
  'car_data',
  'location',
  'intervals',
  'position',
]);
