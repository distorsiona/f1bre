# Dónde cambiar el diseño

Todos los archivos de `styles/` tienen comentarios en español encima de cada bloque: indican qué elemento se modifica y las propiedades que conviene tocar. Los bloques `@media` indican el ancho de pantalla en el que se aplican sus ajustes.

| Qué quieres cambiar                              | Archivo y selector                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Tamaño del logo en el perfil del piloto          | `styles/driver-profile.css`: `.driver-editorial-logo` → `max-width`, `height`                                      |
| Centrar el logo                                  | `styles/driver-profile.css`: `.driver-editorial-brand` → `justify-content`                                         |
| Nombre, apellido y número grandes                | `styles/driver-profile.css`: `.driver-editorial-heading h1`, `.driver-editorial-last`, `.driver-editorial-number`  |
| Siglas verticales                                | `styles/driver-profile.css`: `.driver-editorial-acronym` → `font`, `top`, `left`, `letter-spacing`                 |
| Tamaño del retrato con bandera                   | `styles/driver-profile.css`: `.driver-editorial`, `.driver-editorial-visual .portrait` → columnas y `aspect-ratio` |
| Fichas del piloto                                | `styles/driver-profile.css`: `.driver-fact-panel`                                                                  |
| Enlace para volver a Drivers                     | `styles/profile.css`: `.profile-mode .back-link`; `--driver-color` lo asigna `src/views/profile-view.js`           |
| Detalle de equipo                                | `styles/profile.css`: `.team-detail-*`                                                                             |
| Listado de pilotos                               | `styles/drivers.css`: `.drivers-mode .driver-row` y sus elementos                                                  |
| Listado de equipos                               | `styles/teams.css`: `.teams-mode .team-card`                                                                       |
| Resultados, carrusel y campeonato de Home        | `styles/home.css`: `.home-*` y `#home-*`                                                                           |
| Fondo, texto y navegación oscuros de toda la web | `styles/home.css`: `body.portal-mode` y `.portal-mode .sidebar`                                                    |
| Burdeo y verde militar base                      | `styles/theme.css`: `:root` → `--burgundy`, `--military`                                                           |
| Selectores de temporada y carrera                | `styles/drivers.css`: `.catalog-mode .session-toolbar`; en Home, `styles/home.css`                                 |
| Paneles, controles y gráficos del análisis       | `styles/race-analysis.css`: `.analysis-mode`                                                                       |
| Fuentes y accesibilidad global                   | `styles/theme.css`                                                                                                 |

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
