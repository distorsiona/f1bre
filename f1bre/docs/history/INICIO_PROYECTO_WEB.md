# Inicio del proyecto web

Este documento es el punto de partida para construir un sitio web desde cero con ayuda del agente. El tipo de sitio, su contenido y sus funciones todavía están por definir. Los campos pendientes no representan decisiones tomadas.

## 1. Idea y objetivo

Completa lo que ya tengas claro; el agente te ayudará a definir lo demás.

| Pregunta                                            | Respuesta                                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ¿Cómo se llamará el proyecto?                       | F1BRE                                                                                           |
| ¿Qué ofrecerá el sitio?                             | Visualización de las métricas y telemetrías de F1 para entender técnicas y especializarse en F1 |
| ¿Quién lo usará?                                    | Fanáticos de F1                                                                                 |
| ¿Qué problema resolverá?                            | Entender cómo se toman las decisiones y estrategias por cada equipo en la F1                    |
| ¿Qué acción principal debe realizar el visitante?   | Poder filtrar por equipo, carrera, motor las distintas estrategias por equipo                   |
| ¿Qué resultado indicará que el sitio funciona bien? | La correcta visualización de las métricas obtenidas y la simplicidad para utilizar la página    |
| ¿En qué idioma estará?                              | Inglés principalmente, luego español                                                            |

## 2. Alcance de la primera versión

Construiremos una primera versión pequeña y funcional. Solo se incluirán las páginas y funciones necesarias para cumplir el objetivo principal.

- Tipo de sitio: Herramienta complementaria para fanáticos de la F1
- Páginas o secciones necesarias: Inicio, página por equipos
- Funciones indispensables: Visualización de datos
- Funciones para una etapa posterior: Luego veremos
- Necesidad de cuentas de usuario, pagos o almacenamiento de datos: Sin inicio de sesión, cuentas, pagos ni base de datos en esta etapa. Consultas a OpenF1 y caché temporal en memoria.
- Fecha deseada de lanzamiento y presupuesto para servicios externos: por definir.

Una función se considerará terminada cuando una persona pueda usarla y obtener el resultado esperado. Los formularios y botones deben tener un comportamiento real; si falta una integración, deberá quedar indicado claramente.

## 3. Contenido y diseño

- Identidad: nombre, logotipo y colores disponibles, o propuesta del agente si todavía no existen.
- Estilo visual: Mantener la UI del frontend de f1-platform: fondo claro, barra lateral, tarjetas de equipos, filas de pilotos con fotos y perfiles. Colores burdeo (#641F32) y verde militar (#4B573D).
- Referencias visuales: Frontend Flutter en C:\Users\RIO\Desktop\f1-platform\frontend.
- Contenido disponible: El usuario crea y actualiza las imágenes. Reutilizar las imágenes locales existentes; no generar imágenes nuevas.
- Datos de contacto y enlaces que se mostrarán: por definir.

El agente puede redactar textos provisionales y proponer una dirección visual. Debe identificar el contenido de ejemplo y evitar inventar testimonios, clientes, resultados comerciales o datos de contacto como si fueran reales.

## 4. Decisiones técnicas

El agente elegirá la solución más sencilla que permita cumplir el alcance acordado y explicará brevemente su elección antes de implementarla.

- Para un sitio informativo sencillo, considerar HTML, CSS y JavaScript.
- Si las funciones requieren servidor, usuarios o datos persistentes, proponer una arquitectura adecuada a esos requisitos.
- Usar una estructura de archivos clara y mantener las dependencias necesarias al mínimo.
- Adaptar el sitio a celulares, tabletas y computadores.
- Incluir navegación con teclado, etiquetas de formularios y contraste legible.
- Mantener claves y credenciales fuera del código y de este documento.
- Documentar cómo ejecutar, revisar y actualizar el proyecto.

El alojamiento, dominio, integraciones y sus posibles costos se definirán cuando se conozcan las necesidades. Preparar este documento no implica publicar ni contratar servicios.

## 5. Forma de trabajar con el agente

1. **Definir:** revisar este documento y hacer pocas preguntas esenciales para resolver los campos que bloqueen el inicio.
2. **Proponer:** presentar el objetivo, las secciones, las funciones de la primera versión y una dirección visual concreta.
3. **Construir:** crear una primera versión que se pueda abrir y revisar, con el recorrido principal funcionando.
4. **Ajustar:** incorporar comentarios sobre diseño, textos y comportamiento.
5. **Verificar:** revisar las funciones implementadas, los enlaces, los formularios y la adaptación a distintos tamaños de pantalla.
6. **Entregar:** indicar qué quedó listo, cómo ejecutarlo y qué requisitos faltan para publicarlo.

El agente debe avanzar con decisiones reversibles cuando tenga información suficiente y registrar los supuestos relevantes. Debe consultar cuando falte una definición que cambie el propósito del sitio, implique un costo o requiera acceso a una cuenta externa.

## 6. Criterios de aceptación

- [ ] El sitio comunica qué ofrece y para quién está pensado.
- [ ] La acción principal del visitante funciona de principio a fin.
- [ ] Las páginas y secciones acordadas están implementadas.
- [ ] La navegación y los enlaces funcionan.
- [ ] Los formularios, si existen, muestran validaciones y resultados claros.
- [ ] El contenido de ejemplo está identificado o reemplazado por contenido real.
- [ ] El sitio puede usarse en celular y computador.
- [ ] Se revisaron los aspectos básicos de accesibilidad.
- [ ] No hay credenciales incluidas en archivos públicos.
- [ ] Existe un README con instrucciones para ejecutar y mantener el proyecto.
- [ ] Las verificaciones realizadas y cualquier limitación están documentadas.

## 7. Entregables

- Código fuente organizado del sitio.
- Primera versión revisable y funcional dentro del alcance acordado.
- README con requisitos e instrucciones de ejecución.
- Archivo de ejemplo de variables de entorno, solo si son necesarias, sin secretos reales.
- Registro breve de pendientes y decisiones importantes.
- Si se solicita publicación: configuración de alojamiento y enlace verificado del sitio publicado.

## 8. Instrucción para comenzar con el agente

Copia este texto en el chat o pide al agente que lea este archivo:

> Lee INICIO_PROYECTO_WEB.md y ayúdame a construir mi sitio web desde cero. Empieza por preguntarme qué ofrecerá el sitio, quién lo usará y qué acción principal quiero que realice el visitante. Con mis respuestas, completa el alcance inicial, propone las secciones y una dirección visual, y elige una solución técnica sencilla. Después crea una primera versión local que pueda revisar y sigue trabajando hasta completar las funciones acordadas. Documenta cómo ejecutarla y los pendientes. No publiques el sitio ni contrates servicios hasta que te lo solicite.

## 9. Registro de decisiones

| Fecha      | Decisión                                                               | Motivo                                                                                                    |
| ---------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 2026-10-14 | Preparar el documento de inicio antes de construir                     | Definir el objetivo y el alcance del sitio                                                                |
| 2026-10-14 | Consultar OpenF1 para las métricas disponibles                         | Usar datos deportivos reales y señalar datos ausentes                                                     |
| 2026-10-14 | Excluir inicio de sesión y base de datos                               | Instrucción explícita del usuario; usar f1-platform como referencia de estructura y funciones             |
| 2026-10-14 | Mantener la composición del frontend previo con burdeo y verde militar | Mostrar equipos, pilotos y perfiles con imágenes aportadas por el usuario                                 |
| 2026-10-14 | Mostrar cada piloto y equipo con su color de OpenF1                    | Reservar burdeo y verde militar para la interfaz general; aplicar colores de equipo a tarjetas y perfiles |
