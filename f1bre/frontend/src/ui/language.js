/** Idioma compartido sin consultas HTTP. Conserva textos originales para volver al ingles.
 * Agrega traducciones aqui; nombres propios y datos deportivos se mantienen intactos. */
const spanish = {
  Home: 'Inicio',
  Drivers: 'Pilotos',
  Teams: 'Equipos',
  Historical: 'Histórico',
  'Race Analysis': 'Análisis de carrera',
  'Race analysis': 'Análisis de carrera',
  Season: 'Temporada',
  Race: 'Carrera',
  Standings: 'Clasificación',
  Support: 'Soporte',
  Language: 'Idioma',
  Close: 'Cerrar',
  English: 'English',
  Español: 'Español',
  'Choose language': 'Selecciona el idioma',
  'Contact support': 'Contactar con soporte',
  'For any suggestions or else, contact:': 'Para sugerencias u otras consultas, contacta a:',
  'UPCOMING GRAND PRIX': 'PRÓXIMO GRAN PREMIO',
  'No upcoming race available': 'No hay próxima carrera disponible',
  'For this season in the OpenF1 calendar.': 'Para esta temporada en el calendario de OpenF1.',
  'FINISHED / LAST RACE REPORT': 'FINALIZADA / ÚLTIMA CARRERA',
  'FINISHED / SELECTED RACE': 'FINALIZADA / CARRERA SELECCIONADA',
  'RACE WINNER': 'GANADOR',
  'FINAL PODIUM': 'PODIO FINAL',
  'Recorded race results / OpenF1': 'Resultados registrados / OpenF1',
  'Race results & strategy ↗': 'Resultados y estrategia ↗',
  'Race results & strategy analysis →': 'Resultados y análisis de estrategia →',
  'Race results & strategy': 'Resultados y estrategia',
  'Explore drivers →': 'Explorar pilotos →',
  'Explore teams →': 'Explorar equipos →',
  'RACE TELEMETRY & SECTOR ANALYSIS': 'TELEMETRÍA Y ANÁLISIS DE SECTORES',
  'Open telemetry studio ↗': 'Abrir telemetría ↗',
  Retry: 'Reintentar',
  'Source ↗': 'Fuente ↗',
  'All teams': 'Todos los equipos',
  'Reset team': 'Restablecer equipo',
  'Search driver or team': 'Buscar piloto o equipo',
  DRIVERS: 'PILOTOS',
  TEAMS: 'EQUIPOS',
  'RACE ANALYSIS': 'ANÁLISIS DE CARRERA',
  'SEASON POINTS': 'PUNTOS DE TEMPORADA',
  'BEST RACE FINISH': 'MEJOR RESULTADO',
  'View team profile': 'Ver equipo',
  Team: 'Equipo',
  'Championship position': 'Posición en campeonato',
  'Season points': 'Puntos de temporada',
  'Race finish': 'Resultado',
  'Average race pace': 'Ritmo medio',
  'Best recorded lap': 'Mejor vuelta registrada',
  'Pit lane visits': 'Visitas a boxes',
  Tyres: 'Neumaticos',
  'Mean stationary stop': 'Parada media',
  'SELECTED RACE': 'CARRERA SELECCIONADA',
  '← Back to drivers': '← Volver a pilotos',
  '← Back to teams': '← Volver a equipos',
  'View race analysis →': 'Ver análisis de carrera →',
  'View team': 'Ver equipo',
  'Team legacy': 'Historia del equipo',
  'Car specifications': 'Especificaciones del coche',
  'Power Unit': 'Unidad de potencia',
  Chassis: 'Chasis',
  Weight: 'Peso',
  'Top Speed': 'Velocidad máxima',
  'Race pace evolution': 'Evolución del ritmo',
  'Stint strategy': 'Estrategia de neumáticos',
  'Strategy comparison': 'Comparación de estrategias',
  'Download CSV ↓': 'Descargar CSV ↓',
  'A closer look at every lap': 'Detalle de cada vuelta',
  Driver: 'Piloto',
  Lap: 'Vuelta',
  Channel: 'Canal',
  Speed: 'Velocidad',
  Throttle: 'Acelerador',
  Brake: 'Freno',
  Gear: 'Marcha',
  'DRS status': 'Estado del DRS',
  'Load telemetry ↗': 'Cargar telemetría ↗',
  Weather: 'Clima',
  'Race control': 'Control de carrera',
  'Data explorer': 'Explorador de datos',
  Dataset: 'Datos',
  'Load dataset ↗': 'Cargar datos ↗',
  'Download dataset CSV ↓': 'Descargar datos CSV ↓',
  'DRIVERS IN VIEW': 'PILOTOS VISIBLES',
  'FASTEST INCLUDED LAP': 'VUELTA MÁS RÁPIDA',
  'OBSERVED RACE LAPS': 'VUELTAS REGISTRADAS',
  'PIT LANE VISITS': 'VISITAS A BOXES',
  'RACE RESULTS': 'RESULTADOS',
  'TYRE STRATEGY': 'ESTRATEGIA DE NEUMATICOS',
  'RACE CONDITIONS': 'CONDICIONES DE CARRERA',
  'Independent fan project. Not affiliated with Formula 1.':
    'Proyecto independiente de aficionados. Sin afiliacion con Formula 1.',
  'Data from OpenF1 ↗': 'Datos de OpenF1 ↗',
};
let language = 'en';
try {
  language = window.localStorage.getItem('f1bre.language') === 'es' ? 'es' : 'en';
} catch {
  /* Preferencia opcional. */
}
const originals = new window.WeakMap();
/** Traduce etiquetas conocidas; temporadas y recuentos conservan sus cifras reales. */
function translate(text) {
  if (spanish[text]) return spanish[text];
  return text
    .replace(/^Season (\d{4})$/, 'Temporada $1')
    .replace(/^SEASON (\d{4})$/, 'TEMPORADA $1')
    .replace(/^(\d+) completed races$/, '$1 carreras finalizadas');
}
function apply() {
  document.documentElement.lang = language;
  const walker = document.createTreeWalker(document.body, window.NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest('script,style,select,pre,[data-no-translate]')) continue;
    const current = node.textContent;
    const saved = originals.get(node);
    const original = saved && current === saved.rendered ? saved.original : current;
    const text = original.trim();
    const rendered = language === 'es' ? original.replace(text, translate(text)) : original;
    originals.set(node, { original, rendered });
    if (current !== rendered) node.textContent = rendered;
  }
  document
    .querySelectorAll('[data-language]')
    .forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.language === language)),
    );
}
/** Observa publicaciones progresivas de las vistas; evita volver a consultar los datos. */
export function initializeLanguage() {
  apply();
  const observer = new window.MutationObserver(apply);
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
}
export function setLanguage(value) {
  language = value === 'es' ? 'es' : 'en';
  try {
    window.localStorage.setItem('f1bre.language', language);
  } catch {
    /* Sigue funcionando sin almacenamiento. */
  }
  apply();
}
