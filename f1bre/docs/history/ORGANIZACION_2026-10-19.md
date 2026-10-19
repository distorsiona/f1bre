# Reorganizacion documental — 19 de octubre de 2026

Se agruparon documentos y referencias sin mover los componentes ejecutables.

| Antes                                             | Ahora                                |
| ------------------------------------------------- | ------------------------------------ |
| INICIO_PROYECTO_WEB.md en la raiz Git             | docs/history/INICIO_PROYECTO_WEB.md  |
| REVISION_F1_PLATFORM.md en la raiz Git            | docs/history/REVISION_F1_PLATFORM.md |
| docs/ARQUITECTURA.md                              | docs/architecture/ARQUITECTURA.md    |
| docs/ENDPOINTS.md                                 | docs/api/ENDPOINTS.md                |
| docs/ESTILOS.md                                   | docs/design/ESTILOS.md               |
| STYLE_UI.md en f1bre/                             | docs/design/STYLE_UI.md              |
| docs/MIGRACION_MONOREPO.md                        | docs/history/MIGRACION_MONOREPO.md   |
| ui-_.png, ui-_.jpg y openf1-preview.jpg en f1bre/ | docs/design/references/              |

Los destinos son relativos a `f1bre/`. Se movieron 30 archivos y se verifico su contenido mediante SHA-256 antes de actualizar enlaces documentales. Las capturas mantienen sus nombres y bytes originales.

Se agregaron un indice documental, un mapa de carpetas, un indice de capturas y un README de entrada en la raiz Git. Se actualizaron enlaces de los README del proyecto y frontend y el comando de formato para la nueva ubicacion de STYLE_UI.

Los documentos historicos describen estados anteriores y pueden mencionar rutas antiguas. Las carpetas ejecutables conservan sus ubicaciones. Respaldos, caches y entornos locales no se eliminaron ni se incorporaron al seguimiento. Esta operacion no incluye commit, push ni cambios en el indice Git.
