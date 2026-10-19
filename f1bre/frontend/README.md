<!-- Las rutas de src/, styles/, assets/, scripts/ y tests/ de esta guia son relativas a frontend/. -->

# Frontend de F1BRE

Sitio web para explorar equipos, pilotos, estrategia y telemetría histórica de F1 con datos de OpenF1. Sin cuentas, login, base de datos ni datos sintéticos.

## Empezar

Desde esta carpeta, iniciar el servidor:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Abrir http://127.0.0.1:4173. Detener con Ctrl+C. La aplicación usa módulos ES y debe abrirse por HTTP; no mediante doble clic en `index.html`. Requiere Internet para consultar OpenF1.

No hace falta instalar paquetes npm para ejecutar la web. Las dependencias son herramientas de desarrollo, no librerías cargadas en el navegador.

## Guías del proyecto

- [Dónde cambiar el CSS](../docs/design/ESTILOS.md): archivos, selectores y propiedades para personalizar la interfaz.
- [Estilo de interfaz](../docs/design/STYLE_UI.md): preferencias del usuario y criterios de las referencias visuales; leer antes de cambiar el diseño.
- [Arquitectura y mapa de archivos](../docs/architecture/ARQUITECTURA.md): qué hace cada módulo y dónde editar cada función o pantalla.
- [Endpoints de OpenF1](../docs/api/ENDPOINTS.md): los 18 endpoints, filtros, datos y pantallas que los utilizan.
- [Imágenes](assets/README.md): nombres y carpetas para las imágenes aportadas por el usuario.

## Estructura

```text
index.html    Estructura de las pantallas
src/          Lógica modular: configuración, API, estado, cálculos, funciones y UI
styles/       Paleta, estructura, tarjetas, análisis y adaptación a dispositivos
assets/       Fotografías y logotipos locales
../docs/      Arquitectura y endpoints del monorepo
tests/        Pruebas locales sin conexión a OpenF1
scripts/      Verificación de código y prueba opcional contra la API real
```

Las cuatro vistas principales viven en `src/views/`: `home-view.js`, `drivers-view.js`, `teams-view.js` y `race-analysis-view.js`. Los perfiles tienen su módulo aparte. Las rutas están en `src/router/router.js` y la coordinación en `src/controllers/view-controller.js`.

El punto de entrada es `src/app.js`. El catálogo central de endpoints está en `src/config/openf1.js`. Las llamadas HTTP se realizan únicamente en `src/api/openf1-client.js`.

## Desarrollo y verificación

Instalar las herramientas usando las versiones del lockfile:

```powershell
npm ci
```

Comandos disponibles:

```powershell
npm run check         # Sintaxis, imports, exports, ciclos y archivos de entrada
npm test              # Cálculos y cliente de API con respuestas simuladas
npm run format        # Formatea JS, CSS, HTML y documentación
npm run format:check  # Revisa formato sin modificar archivos
npm run test:api      # Opcional: consulta una carrera y telemetría reales de OpenF1
```

Los comentarios del código están en español. Los textos de la interfaz están en inglés. Se recomienda comprobar cambios de lógica con `check` y `test`; cambios visuales se revisan también en navegador.

## Funciones actuales

- Home claro con resumen del GP, fotografía local opcional, carrusel de carreras, resultados, estrategia de neumáticos y campeonato alternable entre pilotos/constructores.
- Lista de pilotos con búsqueda por nombre, número o equipo.
- Tarjetas de equipos, perfiles deportivos y navegación al análisis filtrado.
- Colores de equipo desde `team_colour` de OpenF1; texto claro u oscuro según contraste. Burdeo y verde militar se reservan para la interfaz general.
- Ritmo en ventanas de cinco vueltas, compuestos y stints por piloto, visitas a boxes y duraciones.
- Telemetría por piloto/vuelta: velocidad, acelerador, freno, RPM, marcha y DRS.
- Clima, mensajes de control de carrera y explorador de los 18 endpoints.
- Exportación CSV de la comparación y de los registros del explorador.

Las imágenes se reutilizaron del proyecto Flutter anterior, sin generarlas ni modificarlas. Puedes reemplazarlas en `assets/`; no cambian automáticamente al seleccionar temporada.

## Datos y límites

Fuente: https://openf1.org/docs/. Se listan carreras desde 2023 que terminaron hace más de 30 minutos. La temporada predeterminada es 2025, o el año actual si es anterior. No se habilitaron datos en vivo ni credenciales.

La cola del cliente separa peticiones al menos 2,2 segundos, deduplica solicitudes iguales y mantiene hasta 60 respuestas en memoria. Recargar borra esa caché. Varias pestañas no comparten esta cola.

Un valor desconocido aparece como “—”; no se convierte en cero. La parrilla puede estar ausente y los campeonatos/radio pueden tener cobertura parcial. OpenF1 no suministra fabricante del motor, combustible ni temperaturas de neumáticos.

El ritmo excluye pit-out y entradas al pit lane identificadas en el dataset de boxes, pero puede incluir tráfico y neutralizaciones. Las visitas a boxes pueden incluir drive-throughs. Estas mediciones no prueban por sí solas la intención o eficacia de una estrategia.

## Verificación de la reorganización

Se verificaron los módulos ES y su grafo de imports sin ciclos. Las cinco pruebas de cálculos y cliente pasaron. La prueba de API real es opcional y no forma parte de `npm test`.

Las verificaciones anteriores contra OpenF1 incluyeron Monza 2024 (sesión 9590), la sesión 9839, telemetría y descarga CSV. La disponibilidad del proveedor puede cambiar y no se verificó cada endpoint en todas las sesiones.

El rediseño de Home se comprobó con resultados reales: alternancia de campeonato entre pilotos y constructores, expansión de 8 a 20 resultados y cambio de Abu Dhabi a Qatar desde el carrusel. Se revisó a 1366 px y 390 px, sin desbordamiento horizontal de la página. Las tablas amplias permiten desplazamiento dentro de su panel.

## Próximas etapas

Pulir la UX y ajustar las pantallas a las imágenes de referencia del usuario. Después, ampliar comparaciones entre vueltas/pilotos, gráficos especializados del explorador y traducción al español. El sitio sigue siendo local y no se ha publicado.

## Carga rápida

Las carreras ya descargadas se restauran desde caché local al recargar. La primera visita carga datos por vista y muestra cada respuesta conforme llega: Drivers necesita dos datasets, Teams tres. El resto se consulta al abrir su pantalla. `Retry` actualiza la vista activa; se conserva la selección de temporada y carrera. Sin base de datos.
