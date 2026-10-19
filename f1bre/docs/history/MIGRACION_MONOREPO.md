# Migracion al monorepo — fases 1 y 2

## Estado y alcance

Trabajo realizado en la rama `refactor`. El nombre solicitado `\refactor` no es valido en Git; se uso `refactor`. El repositorio Git existente esta en la carpeta superior `agente IA/`; el proyecto sigue en `f1bre/`. No se creo un repositorio anidado, no se cambio la rama principal ni se hizo push, merge o despliegue.

Fases completadas: estado recuperable y verificado; estructura del monorepo preparada; web actual trasladada sin cambios de comportamiento. API, contratos HTTP de simulacion, modelo matematico y pipeline NO estan implementados en esta fase.

## Fase 1 — base recuperable

- Commit de referencia: `bef08c8c95bc4a37c71b7d707115100267b7fd36`.
- Archivo local: `.migration-backups/20261018T192223Z/before-monorepo.zip`.
- Copia: 119 archivos, excluidos `.git/`, `node_modules/` y la propia carpeta de respaldo.
- El respaldo incluye archivos modificados y no seguidos por Git; no solo el ultimo commit.
- `manifest.json` contiene SHA-256 y tamano; `working-tree.patch` y `git-status.txt` registran las diferencias previas.
- Se conservaron las eliminaciones previas de AVIF y las nuevas imagenes PNG del usuario. No se restauraron assets que el usuario habia eliminado.
- Antes de mover: `npm run check`, `npm run format:check` y las 16 pruebas del frontend pasaban.
- Referencias visuales previas: capturas `ui-*.png` / `ui-*.jpg` y `openf1-preview.jpg`, conservadas en la raiz e incluidas en el respaldo.

## Inventario de funcionamiento actual

| Area                   | Modulos actuales dentro de frontend/                                    | Responsabilidad conservada                      |
| ---------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Arranque/rutas         | `src/app.js`, `src/router/router.js`                                    | Navbar unico y vistas hash                      |
| Datos externos         | `src/api/openf1-client.js`, `src/config/openf1.js`                      | GET de OpenF1, cola y reintentos                |
| Carga/caches           | `src/features/sessions.js`, `src/api/response-cache.js`                 | Carga progresiva y seleccion persistida         |
| Calculos actuales      | `src/domain/race-data.js`, `src/state/entity-selectors.js`              | Ritmo, vueltas, stints, boxes y clasificaciones |
| UI                     | `src/views/`, `src/ui/`, `styles/`                                      | Home, listados, perfiles y analisis responsive  |
| Telemetria/exportacion | `src/features/telemetry.js`, `data-explorer.js`, `comparison-export.js` | Consultas bajo demanda y CSV                    |
| Assets                 | `assets/`                                                               | Imagenes originales, logos y banderas           |

Las llamadas siguen dirigidas a `https://api.openf1.org/v1`. Los calculos de negocio actuales permanecen temporalmente en el navegador: moverlos a la API corresponde a etapas posteriores. No se ha creado una dependencia nueva de backend para abrir la web.

## Fase 2 — movimientos

| Antes                                           | Ahora                                                   |
| ----------------------------------------------- | ------------------------------------------------------- |
| `src/`, `styles/`, `assets/`                    | `frontend/src/`, `frontend/styles/`, `frontend/assets/` |
| `tests/`, `scripts/` de la web                  | `frontend/tests/`, `frontend/scripts/`                  |
| `index.html` de la aplicacion                   | `frontend/index.html`                                   |
| `package.json`, lockfile y Prettier del cliente | Dentro de `frontend/`                                   |
| `proposals/`                                    | `frontend/proposals/`                                   |
| `README.md` anterior                            | `frontend/README.md`, con enlaces ajustados             |
| Documentacion y guia visual                     | Conservadas en `docs/` y `STYLE_UI.md` de la raiz       |

Nuevas carpetas `backend/`, `data_pipeline/`, `contracts/` y `fixtures/`: instrucciones de alcance, sin servidores ficticios, dependencias cientificas ni parametros inventados.

La raiz tiene comandos que delegan en frontend y un servidor local sin dependencias. Se mantienen lockfiles propios para herramientas generales y cliente. En instalaciones nuevas: `npm ci` y `npm --prefix frontend ci`. Los entornos Python se definiran por componente cuando exista su implementacion.

## Evidencia posterior

- Auditoria SHA-256: **86 archivos trasladados identicos**, incluidas todas las fuentes, estilos, imagenes, pruebas, propuestas e index de la aplicacion.
- `npm run check`: limites de carpetas, imports/exports, ausencia de ciclos y referencias HTML/CSS correctas; 31 modulos del frontend.
- `npm test`: **17 pruebas correctas**: 1 regresion HTTP del monorepo y 16 del frontend.
- HTTP prueba `/`, alias `/frontend/`, entrada HTML, importmap, modulos con query, todos los modulos/estilos/assets existentes, ausencia de acceso a backend y metodos permitidos.
- Navegador, antes y despues: sesion `9839`, temporada `2025`, 20 pilotos, 20 curvas de ritmo, 20 filas de comparacion y un navbar. OpenF1 no publica starting_grid para esa seleccion en la respuesta observada; la UI ya lo indicaba antes del traslado.
- Vistas verificadas: Home, Drivers (20 pilotos), Teams (10 equipos), driver/12, team/Mercedes y Race Analysis. Temporada/carrera conservadas al navegar.
- Logos, coche Mercedes y retratos locales comprobados cargados. El fondo y la tipografia se conservaron.
- Recargar el enlace antiguo `/#overview` abre `/frontend/#overview` bajo el servidor Python antiguo; mantiene el hash y el origen de localStorage.

## Arranque compatible

Recomendado desde `f1bre/`:

```powershell
npm run dev
```

Sirve `frontend/` en http://127.0.0.1:4173 con `Cache-Control: no-store`, sin entrenamiento ni consultas desde el servidor. La API externa la sigue consultando el navegador.

Alternativa:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory frontend
```

Un servidor Python que ya estuviera sirviendo la raiz puede continuar: el nuevo `index.html` de compatibilidad redirige al cliente y conserva hash/query. No abrir dos servidores en el mismo puerto. Para un puerto alternativo con Node:

```powershell
$env:PORT = '4174'
npm run dev
```

## Recuperacion sin sobrescribir el trabajo actual

El respaldo es local y esta ignorado por Git. Puede abrirse con el explorador o extraerse en una carpeta NUEVA fuera de `f1bre/` para revisar el estado anterior. No ejecutar `git reset --hard`, no reemplazar a ciegas el proyecto ni restaurar el ZIP encima de las carpetas migradas: eso mezclaria ambas estructuras.

El ZIP conserva el proyecto anterior; los archivos `base-commit.txt`, `git-status.txt` y `working-tree.patch` permiten reconstruir tambien su contexto Git. Si se necesita revertir, revisar primero los cambios nuevos y preparar una restauracion dirigida. Esta migracion no ha creado commits automaticos de los cambios previos del usuario.

## Siguiente etapa

Definir el contrato HTTP y el esquema de coeficientes antes de implementar el motor. Mantener el frontend funcionando con datos de OpenF1 durante la transicion. CI/CD y despliegues independientes pertenecen a la fase 7; no se han agregado automatizaciones que publiquen nada.
