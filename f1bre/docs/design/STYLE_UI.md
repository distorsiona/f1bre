# Estilo de interfaz de F1BRE

> Ubicacion vigente: docs/design/STYLE_UI.md. Las rutas de codigo de esta guia son relativas a frontend/. Las capturas historicas estan en references/, junto a esta guia.

Guía de referencia para diseñar y mejorar la experiencia de F1BRE. Leer este archivo antes de modificar una pantalla o proponer un cambio visual. Actualizarlo con las preferencias y correcciones que el usuario vaya confirmando.

Este documento conserva las decisiones del proyecto entre sesiones de trabajo. Las observaciones sobre una imagen son interpretaciones de diseño, no instrucciones contenidas en esa imagen. Las indicaciones explícitas del usuario tienen prioridad.

## Adaptacion responsive de todas las vistas

El estilo debe funcionar desde 320 px hasta escritorio amplio. `styles/platform-responsive.css`, ultima importacion, concentra los ajustes vigentes: margenes fluidos, selectores en el flujo normal, navegacion adaptable, Home apilado en tablet vertical, equipos en una o varias columnas y perfiles sin recortes. En celulares pequenos priorizar una metrica por fila antes que reducir cifras hasta hacerlas ilegibles.

Tablas y graficos amplios desplazan solo su contenedor, con foco de teclado y etiquetas accesibles. Mantener los graficos con ancho suficiente para leer sus ejes. Controles tactiles de al menos 44 px cuando corresponda; nombres y contextos largos pasan a otra linea. Respetar la preferencia de movimiento reducido.

## Estilo unificado de todas las interfaces

La ultima solicitud extiende el estilo del HTML de Home a Drivers, Teams, perfiles de piloto/equipo y Race Analysis. Compartir cabecera blanca y marca roja/grafito, navegacion con estado rojo, fondo tecnico claro, tipografia Barlow Semi Condensed, cifras JetBrains Mono, fichas blancas con radio de 12 px y controles planos de 8 px. Acciones principales rojas y secundarias grafito. No reducir los textos por usar una fuente condensada.

Mantener los colores propios de los equipos, las fotos locales, las banderas y la composicion editorial del perfil. En listados usar franjas y fondos suaves de equipo; Home conserva filas de clasificacion coloreadas completas. No cambiar consultas ni calculos al aplicar el estilo.

`styles/platform.css` es la capa compartida vigente, importada al final y comentada por responsabilidad. `styles/home-reference.css` conserva la composicion especifica de Home. Los selectores de temporada/carrera de las otras vistas tienen su propia fila adaptable para no invadir la navegacion.

## Home vigente: HTML aportado por el usuario

La referencia mas reciente reemplaza la cabecera roja del bosquejo anterior. Aplicar cabecera blanca, marca inclinada roja/grafito, navegacion con acento rojo, fondo tecnico claro punteado, tipografia Barlow Semi Condensed y cifras monoespaciadas. Dos columnas 7/12 y 5/12: carreras con informe del ganador y podio a la izquierda; standings coloreados a la derecha. Banda inferior con acceso a telemetria.

Implementacion: `styles/home-reference.css`, cargado despues de `sketch.css`, con comentarios por seccion. Mantener los datos reales y rutas existentes; no copiar los resultados ficticios, estatus FIA/live, latencia, pronosticos, cuenta de usuario ni circuito SVG ilustrativo del HTML como informacion verificada. Los retratos siguen siendo archivos locales aportados por el usuario. Sin login ni base de datos.

Las decisiones anteriores de Home quedan como historial; esta referencia tiene prioridad.

## Home: segundo bosquejo del usuario (referencia vigente)

Home se organiza en dos columnas: temporada, proxima carrera y ultima carrera a la izquierda; clasificacion amplia a la derecha. Fondo gris claro, fichas blancas sencillas, franja de navegacion roja y titulos gruesos e inclinados. La cabecera conserva las rutas existentes, sin crear Seasons o History como enlaces vacios.

Las filas de Drivers/Teams llevan el color completo del equipo, posicion grande, nombre, equipo y puntos. Usar contraste calculado para leer sobre cada color. Botones planos y redondeados, sin sombras. Home ya no lleva el gran retrato ni las siglas verticales de la propuesta anterior; los perfiles conservan su identidad propia.

Mostrar la proxima carrera solo si existe una futura publicada en el calendario de OpenF1. La ultima carrera corresponde por defecto a la ultima sesion finalizada; si se explora otra, etiquetarla Selected race y fechar la clasificacion. Nunca copiar puntos o nombres ficticios del bosquejo. Resultados y estrategia siguen accesibles en un desplegable inferior.

Los ajustes especificos estan al final de `styles/sketch.css`, en el bloque HOME - segundo bosquejo. Esta composicion reemplaza la descripcion anterior de Home con imagen lateral.

## Dirección vigente: bosquejo claro del usuario

La última referencia del usuario reemplaza la dirección oscura y la propuesta Home 02, rechazada por verse «MUY IA». Aplicar esta dirección a Home, Drivers, Teams, Race Analysis y los perfiles.

- Fondo gris claro `#ededed`, paneles blancos y texto grafito `#373737`. Eliminar el modo oscuro de todas las interfaces.
- Titulares grandes, gruesos e inclinados; números y apellidos con el color del equipo. La identidad deportiva viene de pilotos, logos, banderas y tipografía.
- Usar los colores reales de cada equipo como acentos reconocibles. Evitar grandes bloques multicolores, eslóganes y decoraciones que compitan con los datos.
- Paneles blancos redondeados, con encabezados separados por una línea fina, como las fichas de temporada e histórico del bosquejo.
- Botones cómodos, redondeados y planos: sin sombras fuertes ni esquinas demasiado cuadradas. Base grafito con texto blanco; controles secundarios claros.
- Home adapta esa composición: título y clasificación a la izquierda, imagen grande a la derecha, logo centrado sobre el encabezado y resultados debajo.
- Conservar las imágenes locales creadas por el usuario. Los retratos con bandera ya compuesta se muestran completos.
- Mantener comentarios en español en el CSS y documentar dónde cambiar cada parte. `styles/sketch.css`, importado al final, contiene el diseño claro vigente.

La última solicitud autoriza aplicar esta dirección directamente. La antigua propuesta independiente `proposals/home-v2.html` queda descartada y se conserva únicamente como antecedente.

## Referencias anteriores

Las referencias oscuras descritas más abajo son antecedentes. Sus decisiones de color, superficies y navegación activa quedan reemplazadas por la dirección clara anterior; se mantienen las funciones, la organización por vistas y los datos reales de OpenF1.

## Preferencias confirmadas por el usuario

- Mantener el carácter deportivo y la composición de su frontend anterior: equipos, pilotos, fotografías, logotipos y perfiles reconocibles.
- Evitar una apariencia genérica de plantilla o una interfaz que parezca generada por IA. Traducir esta preferencia en decisiones concretas de jerarquía, contenido y composición, no en adornos adicionales.
- Burdeo `#641F32` y verde militar `#4B573D` como colores de identidad general.
- Cada equipo y sus pilotos deben verse con sus colores respectivos. Usar `team_colour` de OpenF1 para la sesión seleccionada, con contraste de texto adecuado.
- Las imágenes las crea y aporta el usuario. Reutilizar las imágenes locales y respetar sus archivos; no generar imágenes nuevas por iniciativa propia.
- La primera versión está principalmente en inglés; español queda para una etapa posterior.
- Trabajar sin login, cuentas ni base de datos.
- Mejorar la UX antes de seguir ampliando funciones.

## Referencia visual recibida

El 14 de octubre de 2026 el usuario compartió una captura de un portal de F1 oscuro. La captura presenta una carrera seleccionada, imagen de un coche en pista, navegación horizontal, selector de temporada, carrusel de carreras, resultados, clasificación de campeonato y estrategia de neumáticos.

La referencia orienta el lenguaje visual. Sus textos, fechas, puntos, resultados y marcas no son datos verificados para copiar a F1BRE. Las métricas de la aplicación deben seguir procediendo de OpenF1.

### 1. Carácter general

La referencia inicial planteaba un portal compacto, centrado en una carrera y en la comparación de datos. La revisión actual pide conservar ese foco deportivo con una escala más generosa y una identidad visual más expresiva; «compacto» no debe convertirse en texto y botones diminutos.

La información deportiva ocupa el espacio principal. Evitar que un mensaje promocional, un eslogan o una sección de presentación desplace los resultados y los controles de exploración.

### 2. Fondo y superficies

- La captura usa fondo negro grisáceo, con paneles algo más claros.
- Separar superficies por diferencias moderadas de tono y bordes finos.
- Esquinas discretamente redondeadas y sombras mínimas.
- Reservar el contraste fuerte para información importante y estados activos.

Antecedente reemplazado: todas las vistas ahora usan el tema claro del bosquejo.

### 3. Jerarquía y tipografía

- Nombre del Gran Premio grande y claramente dominante.
- Ronda, circuito y contexto en una línea secundaria más pequeña.
- Títulos de panel con peso y tamaño suficientes para encontrarlos rápidamente; la revisión actual favorece una escala mayor.
- Tipografía sans serif legible; números de tablas alineados y fáciles de comparar.
- Menos tamaños tipográficos distintos y una jerarquía coherente entre pantallas.
- Etiquetas y metadatos discretos, pero legibles; no reducir el tamaño hasta comprometer la lectura.

La referencia combina un título de carrera amplio con datos muy compactos. No trasladar el tamaño del título a todos los encabezados o tarjetas.

### 4. Navegación

- La captura muestra cabecera horizontal con marca, secciones y selector de temporada.
- El estado activo se distingue con un acento pequeño y claro, como un subrayado.
- La navegación debe permitir entender dónde está el visitante sin competir con la carrera.

Todas las vistas comparten cabecera horizontal, navegación activa subrayada y selector de temporada. El selector de carrera se mantiene visible fuera de Home.

### 5. Cabecera de carrera e imágenes

- Integrar una imagen deportiva en la cabecera, junto al nombre y contexto del evento.
- Mantener el texto legible sobre una superficie estable o una superposición localizada.
- Presentar ganador, condiciones y estado de sesión como información breve y agrupada.
- La imagen aporta identidad al evento y no debe ocupar toda la primera pantalla.
- Usar las imágenes que entregue el usuario, con recortes visuales que respeten al sujeto.

El botón de highlights aparece en la captura, pero no es una función solicitada todavía. Incorporarlo solo si existe una fuente y una acción reales; no dejar botones decorativos.

### 6. Selector de carreras

- Franja de tarjetas compactas con ronda, fecha, país y nombre del evento.
- Carrera seleccionada distinguible mediante borde, contraste o subrayado.
- Estados comprensibles: próxima, completada o con resultados disponibles.
- Desplazamiento horizontal cuando no quepan todas las carreras.
- Mantener visibles la temporada y la carrera activas al navegar a equipos, pilotos o análisis.

Los eventos futuros o sus estados solo se mostrarán si la fuente y el alcance de la aplicación los permiten. La referencia no autoriza inventar un calendario.

### 7. Distribución de paneles

En escritorio, la captura tiene una columna principal más ancha para resultados y neumáticos, y otra más estrecha para el campeonato.

- Agrupar contenido relacionado en paneles cercanos.
- Resultados y estrategia de una misma carrera deben poder leerse sin recorrer secciones alejadas.
- Usar alineaciones, márgenes y bordes consistentes.
- Mantener una densidad útil: varias métricas a la vista con separaciones suficientes para leerlas.
- Evitar espacios vacíos grandes que obliguen a desplazarse para ver información esencial.

### 8. Tablas y clasificaciones

- Filas compactas con separación sutil.
- Encabezados secundarios y números alineados por columna.
- Nombre, posición, equipo y puntos fácilmente identificables.
- Logotipos, fotografías o banderas como apoyo a la identificación, sin reemplazar los nombres.
- Si un panel alterna pilotos y constructores, mostrar con claridad la opción activa.
- Diferenciar los resultados de carrera de los puntos de campeonato; indicar sesión o temporada de cada cifra.

Los controles segmentados de la captura son una referencia visual para futuras comparaciones, no una obligación de añadir un control a cada panel.

### 9. Colores con significado

| Elemento                         | Criterio                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Navegación y controles generales | Burdeo y verde militar, con contraste suficiente sobre la superficie elegida                |
| Equipo y sus pilotos             | Color correspondiente de OpenF1, aplicado consistentemente en tarjetas, perfiles y gráficos |
| Neumáticos                       | Colores reconocibles por compuesto, acompañados por nombre o abreviatura                    |
| Selección activa                 | Acento breve y consistente; no depender solo del color                                      |
| Texto y metadatos                | Neutros con jerarquía de contraste legible                                                  |
| Fotografías y logotipos          | Conservar los colores de los archivos aportados por el usuario                              |

El rojo de la marca de la captura no reemplaza automáticamente el burdeo del proyecto. Evitar alternar colores de fondo por posición de la tarjeta cuando eso contradiga la identidad del equipo.

### 10. Estrategia de neumáticos

- Líneas o segmentos horizontales por piloto.
- Compuestos diferenciados por color y etiquetas.
- Longitud proporcional a las vueltas registradas.
- Paradas y cambios de compuesto identificables.
- Leyenda cercana al gráfico.
- Datos faltantes diferenciados de vueltas efectivamente registradas.

### 11. Adaptación a celular

La imagen recibida es una referencia de escritorio. Las siguientes son pautas de implementación para adaptar ese lenguaje a pantallas pequeñas:

- Apilar paneles conservando la prioridad de resultados y contexto de carrera.
- Permitir desplazamiento horizontal en carrusel y tablas amplias, sin desbordar toda la página.
- Mantener controles táctiles cómodos y etiquetas legibles.
- Simplificar navegación antes de reducirla a iconos ambiguos.
- Conservar temporada, carrera, filtros y forma de volver al recorrido anterior.

## Qué evitar

- Hero promocional enorme, eslóganes de relleno y bloques de presentación que retrasen el acceso a los datos.
- Gradientes, resplandores, efectos de vidrio o sombras intensas que no estén justificados por una referencia del usuario.
- Tarjetas repetitivas con información poco útil, iconos arbitrarios o exceso de badges.
- Botones sin acción, apartados vacíos presentados como completos o métricas inventadas.
- Convertir errores de API en cero puntos, victorias o podios.
- Avatar, login, perfil de usuario, logout o suscripción mientras esas funciones estén fuera del alcance.
- Aplicar un rediseño completo por una interpretación no confirmada de una sola captura.

## Cómo usar esta guía en los próximos cambios

1. Identificar la pantalla y el recorrido que el usuario quiere mejorar.
2. Revisar esta guía y la imagen de referencia específica de esa pantalla.
3. Conservar los datos reales, colores deportivos y archivos de imagen del usuario.
4. Replicar primero distribución, jerarquía, espaciado y proporciones; ajustar después los detalles.
5. Verificar navegación, filtros, lectura y adaptación a celular.
6. Registrar aquí las nuevas decisiones confirmadas, distinguiéndolas de las observaciones de una imagen.

## Registro de preferencias

| Fecha      | Información incorporada                                                                                        | Estado                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 2026-10-14 | Composición deportiva del frontend anterior e imágenes del usuario                                             | Confirmado                                                                |
| 2026-10-14 | Burdeo y verde militar para la identidad general                                                               | Confirmado                                                                |
| 2026-10-14 | Colores propios para cada equipo y sus pilotos                                                                 | Confirmado e implementado                                                 |
| 2026-10-14 | Priorizar mejoras de UX antes de ampliar funciones                                                             | Confirmado                                                                |
| 2026-10-14 | Portal compacto, tablas, paneles, carrusel y cabecera contextual                                               | Rasgos identificados en la nueva referencia y solicitados para documentar |
| 2026-10-14 | Fondo oscuro global y sustitución de barra lateral por cabecera horizontal                                     | Solicitado e implementado en todas las vistas                             |
| 2026-10-14 | Aplicar la referencia a Home: fondo oscuro, cabecera horizontal, resultados, carrusel, campeonato y neumáticos | Solicitado e implementado para Home                                       |

## Drivers: aplicación del estilo de Home

Solicitado el 14 de octubre de 2026. Fondo oscuro, panel de clasificación compacto y bordes discretos. Cada fila conserva retrato y logo locales; el color de OpenF1 identifica al equipo mediante el borde izquierdo, número y base del retrato. La posición y los puntos corresponden al campeonato en la carrera seleccionada, sin inventar puestos cuando falta el feed. Búsqueda por nombre, equipo o número, perfiles y acceso a análisis se conservan. En celular se compactan las columnas sin desplazar horizontalmente toda la página.

## Teams: aplicación del estilo de Home

Solicitado el 14 de octubre de 2026. Cabecera horizontal compartida y selectores de temporada/carrera visibles, fondo oscuro y tarjetas compactas con bordes discretos. El color del equipo identifica el borde superior y los números de sus pilotos; logos locales sobre una superficie neutra. Cada tarjeta distingue posición de campeonato, puntos de temporada y mejor resultado en la carrera seleccionada. Tres columnas en escritorio, dos en tablet y una en celular. Se conserva el acceso al perfil deportivo.

## Detalle de equipo

El detalle de equipo (`#team/nombre`) también adopta el portal oscuro: cabecera con acento del equipo y logo local, métricas compactas, pilotos y coche agrupados en paneles. Mantener temporada y carrera visibles, retorno a Teams y acceso al análisis filtrado. El modo oscuro se extendió posteriormente al perfil de piloto por solicitud explícita del usuario.

## Race Analysis: aplicación del portal oscuro

Solicitado el 14 de octubre de 2026. Navegación horizontal y temporada/carrera visibles. Paneles oscuros compactos para métricas, evolución del ritmo, neumáticos, comparación, telemetría, clima, eventos y exploración de datos. Conservar las curvas con colores deportivos y usar una cuadrícula discreta. Tablas anchas se desplazan dentro de su panel; la lista de stints conserva todas las filas mediante desplazamiento propio. En celular se apilan gráficos y controles y se presentan dos métricas por fila. Burdeo para cargas bajo demanda y verde militar para acciones generales.

## Modo oscuro completo y estados de carga

Por solicitud del usuario, todas las vistas, incluidos perfiles de pilotos y equipos, comparten modo oscuro y navegación horizontal. Mantener la identidad burdeo/verde militar y los acentos de OpenF1. La interfaz debe presentar datos guardados inmediatamente, mostrar carga por panel y evitar convertir datos pendientes en ceros.

## Perfil de piloto: referencia con retrato y bandera

El usuario solicita una composición editorial: siglas verticales grandes a la izquierda, número y nombre dominantes, apellido destacado con el color del equipo y logo arriba. Fichas compactas de temporada y carrera en la columna izquierda; retrato completo con bandera en la derecha. Reutilizar los archivos locales `assets/drivers/apellidoF.png`, que ya integran ambas imágenes, sin generar ni recortar la bandera. Mantener el modo oscuro solicitado. En celular apilar las columnas sin perder el retrato. No copiar los valores de ejemplo de la referencia ni inventar un histórico de victorias.

## Navbar reutilizable

Temporada y carrera permanecen dentro del navbar en todas las vistas, incluido Home. Una sola plantilla en `src/ui/components/navbar.js`; montaje unico antes de inicializar controles y estado activo actualizado por el router. `styles/navbar.css` define escritorio, tablet y celular. No duplicar cabeceras o selectores al crear nuevas vistas.

## Iconos auxiliares del navbar

Mundo para idioma y auriculares para soporte, con trazo simple grafito, controles de 44 px y estados rojos. Ventanas pequenas claras y redondeadas. Selector ingles/espanol y correo de soporte configurable; conservar el marcador "email" mientras no exista direccion.

## Consistencia de cabecera y titulos

La altura, tipografia y padding del navbar deben ser identicos al cambiar de vista para un mismo ancho de pantalla. No crear variantes de navbar para Home. Season usa exactamente la escala de Drivers: 52 px maximo en escritorio y 36 px en celular; el ano mantiene esa escala. La franja de telemetria superior fue retirada y no debe volver.

## Nombre del piloto en celular

En perfiles hasta 700 px, centrar numero/nombre y apellido respecto al ancho completo y usar una escala protagonista de 52 a 70 px. Quitar el espacio lateral y las siglas decorativas verticales en celular; conservarlas en escritorio. Mantener el apellido con el color real del equipo. Ajustes en `styles/platform-responsive.css`.

## Alineacion del perfil del piloto

En escritorio, el boton de regreso, logo del equipo y borde superior del retrato comparten altura. Numero/nombre y apellido ocupan la columna completa inmediatamente debajo del logo. En celular se apilan regreso, logo, nombre, retrato y fichas. Evitar espacios superiores grandes y conservar la imagen con bandera completa. Reglas finales en `styles/platform-responsive.css`, bloque PERFIL DE PILOTO.

## Curvas de companeros de equipo

En Race Analysis, cada piloto conserva el matiz del equipo pero tiene un tono distinto. Diferenciar tambien con trazo continuo/discontinuo y reflejar ambos en la leyenda. La asignacion es estable por numero de piloto dentro del equipo, independiente del orden o filtro. Implementacion en `src/ui/driver-chart-style.js`.

## Ubicacion tras la migracion al monorepo

Las rutas de implementacion `src/`, `styles/` y `assets/` mencionadas en esta guia se encuentran ahora dentro de `frontend/`. Se conservaron sin cambios las fuentes, estilos e imagenes. Esta guia sigue en la raiz porque es compartida por el proyecto.
