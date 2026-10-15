# Revisión de f1-platform y dirección de F1BRE

Fecha: 14 de octubre de 2026.

Proyecto revisado: `C:\Users\RIO\Desktop\f1-platform`.
Proyecto web en construcción: `C:\Users\RIO\Documents\agente IA\f1bre`.

Esta revisión se basa en el código del backend y del frontend. No se ejecutó el proyecto de referencia, no se consultó su Supabase y no se modificó la carpeta original. Sus comentarios describen intenciones del proyecto anterior; no cambian las instrucciones actuales del usuario.

## Decisión de alcance

F1BRE funcionará sin inicio de sesión, cuentas, perfiles de usuario, suscripciones ni base de datos. Los perfiles de **pilotos y equipos** sí forman parte del contenido deportivo; no son cuentas de usuario.

Los datos deportivos se consultarán en OpenF1. Se puede conservar una caché temporal en memoria para reducir solicitudes: no persiste al cerrar o reiniciar y no requiere un motor de base de datos. Los archivos de código, imágenes y descargas CSV no constituyen una base de datos de la aplicación.

## Qué contiene el proyecto anterior

| Capa | Implementación observada | Relación con el nuevo alcance |
| --- | --- | --- |
| Backend | FastAPI; routers de inicio, temporadas, circuitos, pilotos, constructores y carreras | Puede servir como referencia de organización y contratos, pero sus consultas a Supabase deben reemplazarse |
| Almacenamiento | Clientes Supabase normal y administrativo; tablas deportivas y procesos de sincronización | Fuera del alcance actual |
| Fuentes deportivas | Jolpica para datos históricos y OpenF1 para datos de sesiones | Mantener OpenF1 como fuente del explorador actual; evaluar por separado el historial anterior a 2023 |
| Frontend | Flutter con objetivos web y aplicaciones nativas | Sus widgets Dart no se pueden copiar directamente al frontend HTML/JS actual |
| Navegación | Inicio, pilotos, equipos y temporadas; perfiles deportivos | Reutilizar la estructura funcional |
| Identidad visual | Fondos claros, rojo, barra lateral, tarjetas, logotipos e imágenes locales | Referencia de diseño disponible; no implica cambiar automáticamente el diseño actual |
| Acceso de usuarios | Icono de Profile y acción de Upgrade con callbacks vacíos | No se encontró un flujo real de login; omitir estos controles en F1BRE |

## Hallazgos que bloquean o limitan la reutilización

### 1. El backend actual no es independiente de Supabase

`backend/app/main.py` importa los routers al arrancar. Los seis routers deportivos principales importan `app.db.supabase`. A su vez, `backend/app/core/config.py` exige `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` durante la importación.

Por tanto, eliminar botones de cuenta o quitar las variables de entorno no convierte este backend en una versión sin base de datos. Hay que cambiar la fuente de datos de los routers y retirar del arranque los clientes y procesos de sincronización.

Los servicios `*_sync.py` escriben datos en Supabase. Sus endpoints de sincronización no son necesarios en una aplicación que consulta las APIs y usa únicamente caché temporal.

### 2. El módulo de estrategia está incompleto y no está registrado

`backend/app/api/strategy.py` está vacío. Los modelos de `backend/app/schemas/strategy.py` están comentados, mientras que el código activo desde la línea 179 contiene un router e intenta importar `StrategyResponse` del mismo módulo. También importa el servicio que, a su vez, necesita esos modelos.

Esto produce una dependencia circular y un modelo inexistente si se importa ese módulo. Además, `main.py` no registra un router de estrategia, así que el servicio de OpenF1 no queda expuesto por la aplicación actual.

Si se reutiliza FastAPI: separar modelos, cliente, servicio y router; registrar el router y comprobar el endpoint mediante una prueba de integración sin Supabase.

### 3. El contrato de estrategia perdería campos importantes

`strategy_service.py` transforma las vueltas, pero no conserva `date_start`, necesario para consultar telemetría por vuelta. Las paradas conservan `pit_duration`, pero omiten `lane_duration` y `stop_duration`. No hay consulta a `car_data` en el cliente revisado.

La adaptación debe preservar el inicio UTC de cada vuelta y distinguir tiempo en pit lane de tiempo detenido. El frontend actual F1BRE ya utiliza esas distinciones.

### 4. Las consultas no tienen una política compartida de caché y límites

El cliente OpenF1 crea un `httpx.AsyncClient` por petición. El servicio de estrategia consulta ocho datasets completos de una sesión uno detrás de otro, sin caché, control compartido de frecuencia ni recuperación parcial de errores.

En `TeamsScreen.dart`, además de cargar Home, se solicitan perfiles de todos los equipos mediante `Future.wait`. Al sustituir la base de datos por consultas externas, repetir ese patrón multiplicaría el tráfico hacia el proveedor.

La solución debe reutilizar datos ya cargados, consultar telemetría bajo demanda y limitar las solicitudes globalmente. Si se añade un backend, esas responsabilidades deben centralizarse allí.

### 5. El frontend contiene recorridos pendientes y datos ausentes convertidos a cero

- `SeasonsScreen.dart`, desde la línea 515: abrir temporada muestra un mensaje; no navega al detalle.
- `SeasonDetailScreen.dart`: clasificación y carreras son tarjetas de contenido pendiente.
- `app_layout.dart`, líneas 303–346: notificaciones, trofeo, perfil y Upgrade tienen acciones vacías.
- `TeamsScreen.dart`, desde la línea 127: un fallo de perfil se transforma en cero victorias y cero podios. Eso confunde ausencia de información con un resultado deportivo real.
- `DriverProfileScreen.dart`, línea 915, y `TeamProfileScreen.dart`, línea 18: hay navegación o valores predeterminados fijados en 2026.

En F1BRE, los errores deben mostrarse como datos no disponibles, las temporadas deben provenir de la selección y solo deben aparecer controles con una acción funcional.

### 6. La configuración de web y las pruebas requieren revisión

`ApiConfig` fija la API en `http://127.0.0.1:8000`. `main.py` no configura CORS: si Flutter Web se sirve desde otro origen, las llamadas pueden ser bloqueadas por el navegador. Un despliegue necesitaría configurar el origen y la URL de la API, o servir frontend y API bajo el mismo origen.

`frontend/test/widget_test.dart` conserva el test de contador de la plantilla y usa `MyApp`, mientras que `main.dart` define `F1App`. No verifica la aplicación actual y contiene una referencia que no coincide con su clase de entrada.

## Qué conviene reutilizar

1. **Estructura de contenido:** inicio con contexto de temporada, listas de equipos y pilotos, perfiles deportivos y detalle de carrera.
2. **Modelo mental de navegación:** pasar de un equipo a sus pilotos y desde una carrera al análisis de estrategia.
3. **Separación de responsabilidades:** cliente de API, transformaciones, modelos y componentes de presentación.
4. **Material visual existente:** logotipos y fotografías como candidatos para revisar e incorporar. Algunas carpetas contienen únicamente parte de los equipos o pilotos; deben existir alternativas cuando falta una imagen.
5. **Definición de métricas:** puntos, victorias, podios e historial, siempre asociados a una temporada y cobertura de datos explícitas.

Los identificadores internos de Supabase que aparecen en los modelos no deben convertirse en una dependencia nueva. Para OpenF1, usar `session_key`, `meeting_key` y número de piloto dentro de su sesión/temporada. Los números de piloto no deben tratarse como una identidad permanente para todo el historial.

## Arquitectura recomendada para continuar

Mantener por ahora el frontend web F1BRE que ya consulta OpenF1, y adaptar gradualmente las secciones útiles del proyecto anterior. Eso permite conservar los gráficos, filtros y exportación ya verificados.

La primera etapa puede funcionar directamente con la API y la caché temporal que ya tiene el cliente. FastAPI es opcional: tiene sentido incorporarlo si necesitamos compartir caché entre visitantes, consolidar consultas o normalizar respuestas. No necesita base de datos para esas funciones.

Si se incorpora, la estructura sería:

```text
Frontend web
    → API FastAPI sin autenticación
        → Cliente OpenF1 con límites y timeout
        → Caché temporal en memoria
        → Transformaciones y métricas
```

No se trasladarán Supabase, endpoints de sincronización, tablas, cuentas ni credenciales del proyecto anterior. No se añade un backend solo para conservar la estructura antigua.

## Orden de implementación

1. Mantener el explorador de carrera y telemetría existente como núcleo.
2. Añadir vistas deportivas de equipos y pilotos basadas en la sesión seleccionada, con navegación funcional.
3. Añadir inicio con resumen de carrera y temporada. Si una clasificación no está disponible, indicarlo sin inventar puntuaciones.
4. Conectar el detalle de temporada con las carreras disponibles en OpenF1.
5. Añadir comparación entre pilotos, evolución de posiciones y relación entre paradas y ritmo.
6. Evaluar el historial anterior a 2023 como una ampliación separada: OpenF1 no cubre toda la historia que el proyecto previo pretendía obtener de Jolpica.

Estos pasos son el plan derivado de la revisión, no funciones ya implementadas. La carpeta original sigue siendo material de referencia y esta revisión no constituye una migración de su código.

## Comprobación de la revisión

Se inspeccionaron arranque, routers, configuración, clientes deportivos, servicio y esquema de estrategia, llamadas HTTP del frontend, modelos y pantallas principales. Se buscaron instrucciones AGENTS.md dentro del proyecto y no se encontraron. No se ejecutaron pruebas ni se afirmó que el proyecto anterior arranque: los hallazgos de esta revisión son estáticos.
