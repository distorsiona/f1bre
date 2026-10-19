# F1BRE

La aplicacion y sus componentes estan dentro de `f1bre/`. Ejecutar los comandos desde esa carpeta:

```powershell
cd f1bre
npm run dev
```

Abrir http://127.0.0.1:4173. La API Python se inicia por separado, segun su README.

- [Proyecto y comandos](f1bre/README.md)
- [Indice de documentacion](f1bre/docs/README.md)
- [Guia de interfaz](f1bre/docs/design/STYLE_UI.md)
- [Backend y simulador](f1bre/backend/README.md)
- [Pipeline OpenF1](f1bre/data_pipeline/README.md)
- [Contratos](f1bre/contracts/README.md)
- [Organizacion de carpetas y Git](f1bre/docs/ORGANIZACION.md)

```text
.github/             Configuracion de GitHub
f1bre/
  frontend/          Interfaz y assets de la web
  backend/           API y simulador
  data_pipeline/     Descarga y calibracion offline
  contracts/         Modelos y especificaciones
  fixtures/          Muestras y calibraciones
  docs/              Documentacion y referencias visuales
  scripts/           Herramientas del monorepo
  tests/             Pruebas del monorepo
```
