# Endpoints de OpenF1 usados por F1BRE

> Tras la fase 2, las rutas `src/`, `styles/`, `assets/`, `tests/`, `scripts/` e `index.html` de esta guia son relativas a `frontend/`. El servidor y las verificaciones del monorepo estan en `scripts/` de la raiz. Ver [registro de migracion](../history/MIGRACION_MONOREPO.md).

Base: `https://api.openf1.org/v1`.

Todos son **GET externos**. F1BRE no tiene endpoints de backend propios, login ni base de datos. El servidor local en el puerto 4173 sirve archivos HTML, CSS y JavaScript; no obtiene ni almacena datos deportivos.

La fuente de verdad del catálogo es `src/config/openf1.js`. El único módulo que realiza solicitudes HTTP es `src/api/openf1-client.js`. Referencia del proveedor: https://openf1.org/docs/.

## Identificadores

- `year`: temporada.
- `session_key`: una sesión concreta, por ejemplo una carrera. Es el filtro principal para cruzar datasets.
- `meeting_key`: un fin de semana de Gran Premio, que puede contener varias sesiones.
- `driver_number`: número del piloto dentro de la sesión/temporada; no se trata como identidad permanente de toda su carrera.
- `date>=` y `date<`: límites UTC, inclusivo y exclusivo respectivamente. F1BRE los calcula con `date_start` y `lap_duration` de la vuelta elegida.

## Catálogo completo

| Endpoint                | Datos principales                                                                        | Filtros aplicados en F1BRE                                     | Cuándo se consulta                                           |
| ----------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| `/sessions`             | Fechas, circuito, país, temporada y claves de sesión                                     | Inicio: `year`, `session_name=Race`. Explorador: `session_key` | Al elegir temporada y en explorador                          |
| `/drivers`              | Nombre, número, acrónimo, equipo y `team_colour`                                         | `session_key`                                                  | Al elegir carrera; alimenta pilotos, equipos e imágenes      |
| `/laps`                 | Duración de vuelta, sectores, velocidades intermedias, speed trap, `date_start`, pit-out | `session_key`; explorador añade `driver_number`                | Al elegir carrera; ritmo, tabla y selector de vuelta         |
| `/stints`               | `compound`, `lap_start`, `lap_end`, `tyre_age_at_start`                                  | `session_key`; explorador añade `driver_number`                | Al elegir carrera; estrategia por piloto                     |
| `/pit`                  | `lap_number`, `lane_duration`, `stop_duration`, fecha                                    | `session_key`; explorador añade `driver_number`                | Al elegir carrera; visitas a boxes y duraciones              |
| `/weather`              | Temperaturas, humedad, presión, lluvia, viento                                           | `session_key`                                                  | Al elegir carrera; última observación y explorador           |
| `/race_control`         | Banderas, incidentes y mensajes de dirección de carrera                                  | `session_key`                                                  | Al elegir carrera; últimos 30 mensajes y explorador completo |
| `/session_result`       | Posición final, duración, vueltas, DNF/DNS/DSQ                                           | `session_key`; explorador añade `driver_number`                | Al elegir carrera; podio, perfiles y tabla                   |
| `/starting_grid`        | Posición de parrilla y datos publicados por el proveedor                                 | `session_key`; explorador añade `driver_number`                | Al elegir carrera; tabla si hay cobertura                    |
| `/championship_drivers` | `position_current`, `points_current`, valores iniciales                                  | `session_key`; explorador añade `driver_number`                | Al elegir carrera; clasificación y puntos de pilotos         |
| `/championship_teams`   | Posición y puntos de campeonato del equipo                                               | `session_key`; explorador añade `team_name` si está filtrado   | Al elegir carrera; tarjetas y perfiles de equipos            |
| `/car_data`             | `speed`, `throttle`, `brake`, `rpm`, `n_gear`, `drs`                                     | `session_key`, `driver_number`, rango UTC de vuelta            | Botón Load telemetry y explorador                            |
| `/location`             | Coordenadas aproximadas `x`, `y`, `z`                                                    | `session_key`, `driver_number`, rango UTC de vuelta            | Explorador, bajo demanda                                     |
| `/intervals`            | `interval` y `gap_to_leader`                                                             | `session_key`, `driver_number`, rango UTC de vuelta            | Explorador, bajo demanda                                     |
| `/position`             | Posición del piloto y fecha                                                              | `session_key`, `driver_number`, rango UTC de vuelta            | Explorador, bajo demanda                                     |
| `/overtakes`            | Piloto que adelanta, piloto adelantado y posición                                        | `session_key`, `overtaking_driver_number`                      | Explorador, bajo demanda                                     |
| `/team_radio`           | Fecha y enlace de grabación                                                              | `session_key`, `driver_number`                                 | Explorador, bajo demanda                                     |
| `/meetings`             | Nombre y datos del fin de semana                                                         | `meeting_key`                                                  | Cabecera de Home al cargar carrera y explorador              |

Los filtros de la tabla describen el comportamiento de esta aplicación; no representan todos los filtros que admite OpenF1. El explorador muestra hasta 100 registros, pero el CSV contiene todos los registros de la consulta filtrada que devolvió la API.

## Ejemplos

Sesiones de carrera de una temporada:

```text
GET https://api.openf1.org/v1/sessions?year=2024&session_name=Race
```

Vueltas de un piloto en una sesión:

```text
GET https://api.openf1.org/v1/laps?session_key=9590&driver_number=4
```

Telemetría acotada a una vuelta:

```text
GET https://api.openf1.org/v1/car_data?session_key=9590&driver_number=4&date>=2024-09-01T13:03:34.412Z&date<2024-09-01T13:05:03.840Z
```

En el código se utiliza un objeto de filtros. El cliente conserva los comparadores de OpenF1 y codifica sus valores:

```js
await OpenF1.query('car_data', {
  session_key: selectedSessionKey,
  driver_number: selectedDriverNumber,
  ...RaceData.lapWindow(selectedLap),
});
```

## Política de consultas

1. La selección de temporada carga `/sessions` y conserva solo carreras terminadas hace más de 30 minutos.
2. `CORE_ENDPOINTS` es el catálogo de datasets de carrera, no una descarga obligatoria. `features/session-plan.js` define las dependencias por ruta: Drivers consulta solo pilotos/campeonato; Teams añade campeonato de equipos y resultados; Home y análisis cargan sus propias métricas. `/meetings` usa `meeting_key`; el resto usa `session_key`.
3. Cada respuesta se publica al llegar. Cambiar filtros o buscar usa datos cargados; navegar solicita únicamente las dependencias que falten. Cambiar carrera invalida respuestas anteriores.
4. La telemetría y los datasets adicionales se consultan bajo demanda. Los cuatro endpoints voluminosos de `LAP_WINDOW_ENDPOINTS` quedan limitados al piloto y la vuelta elegida.
5. Todas las llamadas pasan por una cola compartida que separa los inicios al menos 2,2 segundos. Las consultas iguales se deduplican y se conservan hasta 60 respuestas en memoria. Los históricos básicos también se guardan en localStorage: calendario cinco minutos, datos de carrera siete días. La lectura de caché no pasa por la cola.

## Datos faltantes y errores

- `[]`: consulta exitosa sin registros. `null` en `state.data`: pendiente o no disponible, distinguido por `state.datasetStatus`. El código no los reemplaza con datos sintéticos.
- Un fallo de un dataset inicial no elimina los otros datasets que sí cargaron. Se señala el dato no disponible.
- HTTP 429: hasta dos reintentos, con espera. HTTP 401/403: acceso requerido; esta aplicación no configura datos live.
- Timeout: 45 segundos para recibir la respuesta HTTP. La caché de históricos persiste al recargar; las respuestas voluminosas de telemetría/explorador permanecen solo en memoria.
- `starting_grid` puede devolver 404 para una sesión; no se infiere la parrilla desde el resultado final.
- Los endpoints de campeonato son beta. La radio tiene cobertura parcial. El tiempo estacionario de boxes puede faltar en sesiones antiguas.
- El fabricante del motor, combustible y temperatura de neumáticos no se obtienen de estos endpoints. No se inventan esas métricas.

Las pruebas contra la API real son opcionales: `npm run test:api`. Las pruebas normales (`npm test`) usan respuestas simuladas y no consumen solicitudes del proveedor.

## Caché y actualización manual

La caché persistente tiene un presupuesto aproximado de 3,5 MB; elimina primero entradas antiguas y no toca almacenamiento de otras aplicaciones. Ante cuotas, bloqueo o datos corruptos, se conserva el funcionamiento en memoria. Los datos caducados pueden mostrarse mientras se actualizan; si la actualización falla se mantienen y se informa del fallo. `Retry` fuerza la actualización de los endpoints de la vista activa. Se recuerda la última temporada y carrera. No hay base de datos ni backend propio.
