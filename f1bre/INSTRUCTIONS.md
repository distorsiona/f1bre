### Directrices de Control de Versiones y Gestión de Git

Como agente de software para este proyecto, debes seguir un flujo estricto y seguro de Git antes de finalizar cualquier tarea o sesión de desarrollo.

#### 1. Principio de Aislamiento y Trabajo en Ramas
- Nunca realices commits directos sobre la rama `master` o de producción sin orden expresa.
- Trabaja sobre ramas descriptivas basadas en la tarea actual (por ejemplo: `refactor`, `feature/navbar`, `feature/simulation-api`, `fix/pit-window`).
- Antes de comenzar a editar código, verifica la rama activa:
  `git branch --show-current`

#### 2. Protocolo Obligatorio Pre-Commit
Antes de preparar o confirmar cualquier archivo:
1. Revisa el estado del árbol de trabajo:
   `git status`
2. Verifica que los archivos pesados, temporales o cachés de telemetría no se incluyan en el área de preparación (stage):
   - Nunca agregar: `.venv/`, `f1_cache/`, `node_modules/`, archivos de telemetría masiva (`.parquet`, `.csv`), o salidas temporales de datos.
3. Asegura que los cambios pasen las pruebas correspondientes del módulo modificado (por ejemplo, `pytest` en backend o `npm test` en frontend).

#### 3. Política de Commits Atómicos y Claros
- Realiza commits pequeños, autocontenidos y frecuentes (al concluir cada subtarea lógica funcional).
- Sigue el formato de mensajes semánticos (*Conventional Commits*):
  - `feat(<módulo>): descripción concisa en imperativo` (ej. `feat(navbar): add dynamic season selector`)
  - `fix(<módulo>): corrección de fallo puntual` (ej. `fix(backend): correct degradation quadratic factor`)
  - `refactor(<módulo>): reorganización de código sin cambio funcional` (ej. `refactor(contracts): update simulation schemas`)
  - `ci(<módulo>): ajustes de workflows o tests` (ej. `ci: add automated PR checks`)
- Agrega únicamente los archivos pertinentes al alcance de la tarea:
  `git add <ruta/al/archivo_o_directorio>`
  `git commit -m "tipo(scope): descripción"`

#### 4. Protocolo Seguro de Push y Sincronización
Para mantener respaldados los cambios en el repositorio remoto (`origin`) y evitar pérdidas locales:
1. Si la rama remota ha tenido cambios recientes de otros colaboradores o integraciones, integra con rebase o merge limpio:
   `git pull --no-edit origin <nombre_de_rama>`
2. Si es la primera vez que se publica la rama en GitHub, vincula la rama de seguimiento explícitamente:
   `git push -u origin <nombre_de_rama>`
3. En envíos subsecuentes en la misma rama de trabajo:
   `git push origin <nombre_de_rama>`
4. Confirma la integridad remota y local:
   `git status` debe reflejar: `"Your branch is up to date with 'origin/<nombre_de_rama>'"` y `"working tree clean"`.