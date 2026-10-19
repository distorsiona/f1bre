# Carpetas y seguimiento en Git

La raiz Git contiene `.github/` y `f1bre/`. No crear repositorios anidados. Mantener cada componente en su carpeta y sus instrucciones en su propio README.

| Contenido                           | Carpeta                                             | Seguimiento                                            |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| Interfaz y assets usados por la web | frontend/                                           | Versionar                                              |
| API y motor matematico              | backend/                                            | Versionar                                              |
| Procesamiento offline               | data_pipeline/                                      | Versionar                                              |
| Modelos y contratos publicados      | contracts/                                          | Versionar; regenerar desde modelos                     |
| Muestras pequenas y calibraciones   | fixtures/                                           | Versionar con procedencia y version                    |
| Arquitectura                        | docs/architecture/                                  | Versionar                                              |
| API externa                         | docs/api/                                           | Versionar                                              |
| Guia visual y mapa de CSS           | docs/design/                                        | Versionar                                              |
| Capturas de referencia              | docs/design/references/                             | Versionar referencias utiles                           |
| Documentos anteriores               | docs/history/                                       | Versionar como historial                               |
| Herramientas y pruebas compartidas  | scripts/ y tests/                                   | Versionar                                              |
| Entornos y dependencias instaladas  | .venv/ y node_modules/                              | Ignorados                                              |
| Datos descargados y cache           | data_pipeline/data/raw/ y data_pipeline/data/cache/ | Ignorados                                              |
| Respaldo local de migracion         | .migration-backups/                                 | Ignorado; conservar localmente                         |
| Secretos locales                    | .env y .env.*                                       | Ignorados; .env.example puede versionarse sin secretos |

Agregar documentos en su categoria y enlazarlos desde `docs/README.md`. Mantener una sola guia STYLE_UI en `docs/design/`. Los assets que usa la web pertenecen a `frontend/assets/`; las capturas para comparar disenos pertenecen a `docs/design/references/`.

Los JSON de contratos se versionan porque son parte de la interfaz publicada. Regenerarlos con `python -m backend.export_contracts` usando el entorno del backend. Las calibraciones pequenas se guardan en `fixtures/`, sin incluir la cache o telemetria completa que las origino.

## Revisar cambios

Desde la raiz Git:

```powershell
git status --short
git diff --stat
git diff
```

Los archivos nuevos aparecen como no seguidos hasta preparar el commit. Git detecta renombres comparando contenido al preparar y revisar el cambio. Revisar todos los archivos antes de agregarlos al indice. Mantener cambios de organizacion separados de cambios funcionales cuando sea posible.

Los comandos de ejecucion se mantienen: primero entrar en `f1bre/`. No renombrar carpetas ejecutables ni rutas de datos del backend para ordenar documentos.
