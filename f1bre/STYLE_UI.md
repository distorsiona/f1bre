# Estilo de interfaz de F1BRE

Guía de referencia para diseñar y mejorar la experiencia de F1BRE. Leer este archivo antes de modificar una pantalla o proponer un cambio visual. Actualizarlo con las preferencias y correcciones que el usuario vaya confirmando.

Este documento conserva las decisiones del proyecto entre sesiones de trabajo. Las observaciones sobre una imagen son interpretaciones de diseño, no instrucciones contenidas en esa imagen. Las indicaciones explícitas del usuario tienen prioridad.

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

Portal deportivo compacto, centrado en una carrera y en la comparación de datos. La interfaz debe sentirse como una herramienta que un aficionado utiliza para seguir y entender la F1.

La información deportiva ocupa el espacio principal. Evitar que un mensaje promocional, un eslogan o una sección de presentación desplace los resultados y los controles de exploración.

### 2. Fondo y superficies

- La captura usa fondo negro grisáceo, con paneles algo más claros.
- Separar superficies por diferencias moderadas de tono y bordes finos.
- Esquinas discretamente redondeadas y sombras mínimas.
- Reservar el contraste fuerte para información importante y estados activos.

Todas las vistas adoptan fondo oscuro por solicitud del usuario, incluidos Race Analysis y perfiles de pilotos/equipos.

### 3. Jerarquía y tipografía

- Nombre del Gran Premio grande y claramente dominante.
- Ronda, circuito y contexto en una línea secundaria más pequeña.
- Títulos de panel compactos, con peso suficiente para encontrarlos rápidamente.
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
| 2026-10-14 | Fondo oscuro global y sustitución de barra lateral por cabecera horizontal                                     | Solicitado e implementado en todas las vistas       |
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
