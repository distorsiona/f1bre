# Dónde cambiar el diseño

> Tras la fase 2, las rutas `src/`, `styles/`, `assets/`, `tests/`, `scripts/` e `index.html` de esta guia son relativas a `frontend/`. El servidor y las verificaciones del monorepo estan en `scripts/` de la raiz. Ver [registro de migracion](../history/MIGRACION_MONOREPO.md).

La adaptación a tamaños de pantalla está centralizada en `styles/platform-responsive.css`, importado al final. Incluye escritorio amplio, tablet, celular y pantallas de 320 px. Para columnas, márgenes, controles, gráficos desplazables y tamaños móviles, modifica este archivo.

La apariencia compartida vigente está en `styles/platform.css`, cargado al final: cabecera, fuentes, fondos, botones, paneles y ajustes para Drivers, Teams, perfiles y análisis. Para cambiar la composición específica de Home usa `styles/home-reference.css`.

Home usa ahora `styles/home-reference.css`, cargado al final: cabecera, ticker, temporada, fichas, podio, standings y banda de telemetría. Las otras vistas comparten `platform.css`; `sketch.css` conserva bases de los bosquejos anteriores.

El diseño vigente es claro y se ajusta en `styles/sketch.css`, importado al final. Allí están comentados los fondos, botones redondeados, colores de texto y la nueva composición de Home. Los archivos por vista de la tabla conservan las bases estructurales; una regla de `sketch.css` puede sobrescribirlas.

Todos los archivos de `styles/` tienen comentarios en español encima de cada bloque: indican qué elemento se modifica y las propiedades que conviene tocar. Los bloques `@media` indican el ancho de pantalla en el que se aplican sus ajustes.

| Qué quieres cambiar                             | Archivo y selector                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Tamaño del logo en el perfil del piloto         | `styles/driver-profile.css`: `.driver-editorial-logo` → `max-width`, `height`                                      |
| Centrar el logo                                 | `styles/driver-profile.css`: `.driver-editorial-brand` → `justify-content`                                         |
| Nombre, apellido y número grandes               | `styles/driver-profile.css`: `.driver-editorial-heading h1`, `.driver-editorial-last`, `.driver-editorial-number`  |
| Siglas verticales                               | `styles/driver-profile.css`: `.driver-editorial-acronym` → `font`, `top`, `left`, `letter-spacing`                 |
| Tamaño del retrato con bandera                  | `styles/driver-profile.css`: `.driver-editorial`, `.driver-editorial-visual .portrait` → columnas y `aspect-ratio` |
| Fichas del piloto                               | `styles/driver-profile.css`: `.driver-fact-panel`                                                                  |
| Enlace para volver a Drivers                    | `styles/profile.css`: `.profile-mode .back-link`; `--driver-color` lo asigna `src/views/profile-view.js`           |
| Detalle de equipo                               | `styles/profile.css`: `.team-detail-*`                                                                             |
| Listado de pilotos                              | `styles/drivers.css`: `.drivers-mode .driver-row` y sus elementos                                                  |
| Listado de equipos                              | `styles/teams.css`: `.teams-mode .team-card`                                                                       |
| Resultados, carrusel y campeonato de Home       | `styles/home.css`: `.home-*` y `#home-*`                                                                           |
| Fondo, texto y navegación claros de toda la web | `styles/sketch.css`: `body.sketch-theme` y `.sidebar`                                                              |
| Burdeo y verde militar base                     | `styles/theme.css`: `:root` → `--burgundy`, `--military`                                                           |
| Selectores de temporada y carrera               | `styles/drivers.css`: `.catalog-mode .session-toolbar`; en Home, `styles/home.css`                                 |
| Paneles, controles y gráficos del análisis      | `styles/race-analysis.css`: `.analysis-mode`                                                                       |
| Fuentes y accesibilidad global                  | `styles/theme.css`                                                                                                 |

## Cómo leer las propiedades

- `color`: color del texto. `background`: fondo. `border`: borde. `border-radius`: redondeado.
- `font-size`: tamaño del texto. `font-weight`: grosor. `letter-spacing`: separación entre letras.
- `width` y `height`: tamaño; `min-*` y `max-*` definen límites.
- `padding`: espacio interior. `margin`: espacio exterior. `gap`: separación entre elementos de una fila o cuadrícula.
- `grid-template-columns`: proporción o cantidad de columnas.
- `justify-content` y `align-items`: alineación del contenido; su dirección depende del contenedor.
- `object-fit: contain`: muestra la imagen completa. `cover`: llena el marco y puede recortarla. `object-position`: decide el punto de encuadre.
- `@media (max-width: 700px)`: cambios que se activan en pantallas de hasta 700 píxeles.

## Por qué un cambio puede no verse

`styles/index.css` carga primero las bases y después los diseños específicos. Por ejemplo, `entities.css` define una fila de piloto base, mientras `drivers.css` ajusta su apariencia actual en Drivers. Entre reglas de igual prioridad y especificidad gana la última. Los selectores más específicos también pueden prevalecer.

Revisa además el `@media` de la pantalla que estés usando: el logo del perfil tiene un tamaño de escritorio y otro de celular. Para cambiar ambos, modifica los dos bloques comentados.

Los colores `--team-color`, `--team-ink` y `--team-line` se asignan desde `src/ui/components/entities.js` usando OpenF1. `getTeamColor`, en `src/utils/dom.js`, valida el color. Conserva esas variables para que cada piloto y equipo mantenga su identidad.

Los comentarios explican el CSS existente; no cambian el diseño ni sus valores.

## Navbar

La cabecera y los selectores compartidos se ajustan en `styles/navbar.css`. Su HTML esta centralizado en `src/ui/components/navbar.js`. Cambia aqui su distribucion en escritorio, tablet y celular, sin repetirla en las vistas.
