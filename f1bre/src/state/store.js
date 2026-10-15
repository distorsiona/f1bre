/** Estado temporal de la aplicación. No hay almacenamiento persistente ni base de datos.
 * Los contadores generation invalidan respuestas antiguas después de cambiar la selección. */
export const state = {
  sessions: [],
  // Sesión completa seleccionada desde /sessions; null durante una nueva carga.
  session: null,
  // Clave = endpoint. Array = respuesta válida; null = consulta fallida o no disponible.
  data: {},
  datasetStatus: {},
  drivers: [],
  generation: 0,
  // Invalidan telemetría/explorador sin cancelar la carga global de la carrera.
  teleGeneration: 0,
  rawGeneration: 0,
  busy: false,
};
