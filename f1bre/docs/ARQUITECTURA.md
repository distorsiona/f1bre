# Organización del código

> Tras la fase 2, las rutas `src/`, `styles/`, `assets/`, `tests/`, `scripts/` e `index.html` de esta guia son relativas a `frontend/`. El servidor y las verificaciones del monorepo estan en `scripts/` de la raiz. Ver [registro de migracion](MIGRACION_MONOREPO.md).

La aplicación sigue siendo un sitio estático con módulos ES. No necesita build, backend propio, cuentas ni base de datos. Se debe abrir mediante un servidor HTTP local, porque los navegadores restringen imports de módulos desde `file://`.

## Mapa de archivos

```text
index.html                   Estructura de pantallas e identificadores del DOM
src/
  app.js                     Punto de entrada: controles, eventos, ruta y carga inicial
  config/openf1.js            Catálogo de endpoints, filtros, unidades y límites
  api/openf1-client.js        Único cliente HTTP: GET, cola, caché, errores y reintentos
  api/response-cache.js       Caché persistente acotada y selección de carrera guardada
  controllers/
    app-controller.js        Conecta eventos y coordina perfiles, filtros y análisis
    view-controller.js       Refresca o limpia vistas y sincroniza filtros de telemetría
  state/
    store.js                 Estado en memoria y contadores de respuestas obsoletas
    selectors.js             Pilotos visibles según el filtro de equipo
    entity-selectors.js      Clasificaciones, orden de pilotos/equipos y mejor resultado
  domain/
    race-data.js             Cálculos puros: ritmo, stints, boxes y rango de vuelta
  features/
    sessions.js              Hidratación inmediata y publicación progresiva de respuestas
    session-plan.js          Dependencias y prioridades de datos según la ruta activa
    telemetry.js             Selector de vuelta y consulta de telemetría
    data-explorer.js         Consulta bajo demanda de cualquier dataset permitido
    comparison-export.js     CSV de las métricas visibles
  views/
    home-view.js             Home: cabecera, carrusel, resultados, campeonato y stints
    drivers-view.js          Drivers: listado y búsqueda local
    teams-view.js            Teams: tarjetas y métricas por constructor
    race-analysis-view.js    Race Analysis: ritmo, estrategia, clima y eventos
    profile-view.js          Detalles de un piloto o equipo
  router/router.js           Visibilidad de vistas, rutas hash y navegación activa
  ui/
    components/entities.js   Retratos, logos, filas, colores y enlaces compartidos
    components/driver-profile.js Ficha editorial del piloto: nombre, métricas y retrato
    line-chart.js            Gráficos SVG reutilizables
  utils/
    dom.js                   Elementos, escape HTML, formato de métricas y colores
    html.js                  Templates HTML formateables; no sanitiza datos
    csv.js                   Creación y descarga de CSV
styles/
  index.css                  Orden de importación de estilos
  theme.css                  Fuentes, paleta general y accesibilidad
  layout.css                 Estructura y controles comunes
  entities.css               Tarjetas, imágenes, pilotos y perfiles
  analysis.css               Gráficos, tablas, neumáticos, clima y explorador
  responsive.css             Ajustes de escritorio, tablet y celular
  home.css                   Contenido Home y superficies/navegación de portal compartidas
  drivers.css                Clasificación de pilotos y selectores comunes del catálogo
  teams.css                  Tarjetas oscuras de equipos y adaptación a celular
  profile.css                Perfiles oscuros de equipos y pilotos
  driver-profile.css         Composición editorial con retrato y bandera
  race-analysis.css          Presentación oscura del análisis y sus controles
assets/                      Imágenes aportadas por el usuario
docs/                        Esta guía y el mapa de endpoints
tests/                       Pruebas sin conexión a Internet
scripts/                     Comprobación de módulos y prueba opcional de API real
```

## Flujo de información

1. `src/app.js` prepara opciones y listeners, resuelve la ruta y llama a `loadYear()`.
2. `features/sessions.js` restaura el calendario y los datos disponibles desde caché. Consulta después solo las dependencias pendientes de la ruta activa, definidas en `session-plan.js`.
3. Las respuestas se guardan en `state.data`, por nombre de endpoint. `state.session` identifica la carrera.
4. `domain/race-data.js` transforma esos registros en métricas. No accede a HTML ni realiza solicitudes.
5. Cada respuesta publica el estado; `controllers/view-controller.js` refresca solo la vista activa y conserva el selector de telemetría cuando sus dependencias no cambiaron. Los paneles pendientes indican carga.
6. Un perfil comunica la intención mediante `configureProfileActions`. El controlador cambia filtros y abre el análisis.
7. `router/router.js` muestra una sola sección y marca el enlace activo. Las rutas siguen siendo `#home`, `#drivers`, `#teams`, `#overview`, `#driver/numero` y `#team/nombre`.

## Límites entre responsabilidades

- Las vistas presentan datos del estado; no consultan OpenF1 ni importan otras vistas.
- El controlador conecta acciones y sincroniza vistas, selectores y telemetría.
- El cargador registra callbacks con `configureSessionViews`; no conoce los módulos visuales.
- Los componentes reciben la raíz DOM de la vista: colores, imágenes y eventos no recorren pantallas ajenas.
- `index.html` conserva el esqueleto de las secciones y los controles compartidos. La presentación dinámica está separada en `src/views/`.
- Los estilos y assets existentes se conservan; esta separación no cambia la apariencia.

## Estado y respuestas antiguas

`state.generation` cambia cuando comienza una nueva carga de temporada o carrera. Cada consulta captura ese valor y compara al terminar: si pertenece a una selección anterior, no actualiza la pantalla.

`teleGeneration` y `rawGeneration` cumplen la misma función para telemetría y explorador. Cambiar de piloto o vuelta invalida los resultados anteriores. Estos contadores no cancelan por sí mismos la petición HTTP; impiden presentar una respuesta obsoleta.

`state.data[endpoint]` es un array cuando hay registros disponibles (también desde caché) y `null` cuando está pendiente o falló. `state.datasetStatus` distingue `pending`, `cached`, `ready` y `error`. Los cálculos mantienen `null` para valores desconocidos; el formato de pantalla los presenta como “—”. Un valor de cero no se convierte en dato ausente.

## Dónde hacer cada cambio

| Cambio                                        | Archivos principales                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Diseño de inicio, pilotos, equipos o perfiles | `src/views/home-view.js`, `drivers-view.js`, `teams-view.js`, `profile-view.js` y sus estilos  |
| Estructura general y navegación visible       | `index.html`, `styles/layout.css`, `src/router/router.js`                                      |
| Comportamiento de botones o filtros           | `src/controllers/app-controller.js`                                                            |
| Colores base y fuentes                        | `styles/theme.css`                                                                             |
| Colores deportivos                            | `getTeamColor` en `utils/dom.js` y `entityPalette` en `ui/components/entities.js`; usan OpenF1 |
| Gráficos y tablas del análisis                | `src/views/race-analysis-view.js`, `src/ui/line-chart.js`, `styles/analysis.css`               |
| Cálculo de una métrica                        | `src/domain/race-data.js` y su prueba en `tests/race-data.test.js`                             |
| Endpoint, límites o unidades                  | `src/config/openf1.js`; actualizar también `docs/ENDPOINTS.md`                                 |
| Filtros de una consulta                       | `src/features/sessions.js`, `telemetry.js` o `data-explorer.js`                                |
| Imágenes                                      | `assets/`; instrucciones en `assets/README.md`                                                 |

## Convenciones

- Comentarios en español explican propósito, fuente de datos y decisiones que pueden resultar poco evidentes.
- Las funciones tienen nombres de acción, por ejemplo `loadTelemetry`, `renderRaceAnalysis` y `exportComparison`.
- El cliente centraliza `fetch`; no se realizan peticiones desde templates o componentes visuales.
- Los valores externos insertados en HTML deben pasar por `escapeHtml`. La etiqueta `html` solo ayuda a formatear markup; no hace sanitización.
- Los datos deportivos no se sustituyen por ejemplos ni por cero cuando hay un error.
- Prettier mantiene el formato: `npm run format`. Revisar sin modificar: `npm run format:check`.
- Las dependencias npm son de desarrollo. La web funciona sin `node_modules` porque usa módulos nativos del navegador.

## Verificación

`npm run check` revisa sintaxis, imports, exports, ausencia de ciclos y rutas de assets de código. Incluye una comprobación conservadora de referencias libres para detectar helpers que faltan en las importaciones. No reemplaza una revisión de comportamiento en navegador. `npm test` prueba los cálculos y el cliente sin Internet. `npm run test:api` hace solicitudes reales y debe usarse cuando haya cambios de integración que lo justifiquen.

## Rendimiento y persistencia

`OpenF1.peek` restaura datos guardados sin esperar red; `query` reutiliza entradas vigentes y deduplica solicitudes. `response-cache.js` conserva históricos básicos en localStorage con caducidad y presupuesto acotado. `Retry` fuerza actualización. El calendario caducado se actualiza sin bloquear datos existentes. Las pruebas cubren recargas sin red, expiración, cuotas, cambios de ruta y respuestas de carreras obsoletas.

## Navbar compartido

`src/ui/components/navbar.js` contiene marca, enlaces y selectores de temporada/carrera. `src/app.js` llama `mountNavbar()` antes de inicializar controles. El montaje es idempotente y nunca se repite al navegar; el controlador conserva las consultas y los eventos de seleccion. `router/router.js` solo resuelve la ruta y llama `updateNavbar()` para marcar el enlace activo.

`index.html` contiene un unico `#navbar-root`, sin copiar la cabecera en cada vista. `styles/navbar.css`, ultima capa de estilos, define su distribucion responsive. Los selectores usan los mismos IDs `year` y `race` para conservar la integracion con OpenF1.

## Idioma y soporte

El navbar incluye iconos SVG de mundo y auriculares. Abren dialogos nativos accesibles con cierre por boton, Escape o fondo. El idioma ingles/espanol y las traducciones de etiquetas compartidas viven en `src/ui/language.js`; la preferencia usa la clave `f1bre.language` y sigue funcionando si el almacenamiento esta bloqueado. Los datos originales de OpenF1 no se modifican. Las frases nuevas deben agregarse al diccionario; los textos tecnicos no incluidos conservan su original.

Para configurar el correo, completa `SUPPORT_EMAIL` en `src/config/site.js`. Vacio muestra el marcador literal `"email"`; con una direccion aparece un enlace `mailto:`. No hay formulario ni envio automatico de mensajes.
