# F1BRE — monorepo

Etapa 5: pipeline offline de FP1/FP2 y seleccion de equipo en la API implementados. Pipeline adaptado a OpenF1 sin autenticacion; calibracion real de Bahrain 2024 disponible. [Estructura, instalacion, calibracion y verificacion](data_pipeline/README.md).

Web de Formula 1 con datos historicos de OpenF1. Fases 1 a 4 implementadas: frontend aislado, contratos de datos y API FastAPI con simulador determinista. El frontend conserva su funcionamiento con OpenF1 y todavia no consume el nuevo simulador. Sin entrenamiento, login ni base de datos.

## Ver la web

Desde esta carpeta:

```powershell
npm run dev
```

Abrir http://127.0.0.1:4173. Detener con Ctrl+C. Guardar los archivos y recargar el navegador para ver cambios; el servidor de desarrollo desactiva la cache HTTP. Requiere Node.js para este comando e Internet para OpenF1.

Alternativa con Python, sin instalar dependencias:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory frontend
```

Si usas `py`, sustituye `python` por `py`. No ejecutes ambos servidores en el mismo puerto. La orden antigua `python -m http.server 4173 --bind 127.0.0.1`, desde la raiz, tambien funciona: `index.html` redirige a `frontend/` conservando la vista y los parametros de la URL. No es necesario parar un servidor existente para usar esa compatibilidad.

## Estructura y responsabilidades

```text
frontend/        Web actual: HTML, JS, CSS, assets, pruebas y herramientas propias
backend/         API FastAPI y motor determinista de estrategias
data_pipeline/   Descarga FP1/FP2, limpieza, regresion y exportacion offline
contracts/       Modelos Pydantic, OpenAPI y esquemas JSON generados
fixtures/        Calibraciones sinteticas y estrategia de ejemplo
docs/            Arquitectura, endpoints, estilos y registro de migracion
scripts/         Servidor local y verificaciones del monorepo
tests/           Regresion HTTP de rutas/archivos tras la migracion
STYLE_UI.md      Guia visual compartida
index.html       Entrada de compatibilidad para servidores que siguen en la raiz
```

Los antiguos `src/`, `styles/`, `assets/`, `tests/` y `scripts/` de la web estan dentro de `frontend/`. Imagenes de pilotos: `frontend/assets/drivers/apellidoF.png`. Las capturas de referencia anteriores permanecen en la raiz.

## Instalar herramientas

La web estatica y el servidor local no requieren paquetes npm. Para formato y verificaciones completas, instalar herramientas por componente:

```powershell
npm ci
npm --prefix frontend ci
```

No se comparten entornos Python ni se instala FastF1, Pandas o Scikit-learn en el cliente. Las dependencias actuales del frontend tienen su propio `package.json` y lockfile.

## Verificar

```powershell
npm run check         # Estructura del monorepo y validacion de modulos del frontend
npm test              # Regresion HTTP y todas las pruebas existentes del frontend
npm run format:check  # Formato de herramientas, documentacion y frontend
npm run test:api      # Opcional: llamadas reales a OpenF1; necesita Internet
npm run verify:migration # Compara fuentes/assets trasladados con el respaldo local
```

`verify:migration` requiere `.migration-backups/`, excluido de Git: es una auditoria local de esta migracion, no un requisito de CI para otros clones. `npm test` no usa el respaldo ni consulta OpenF1.

Para trabajar solo con el cliente: `npm --prefix frontend run check` o `cd frontend` y `npm test`.

## Guias

- [Registro, verificaciones y recuperacion de fases 1 y 2](docs/MIGRACION_MONOREPO.md).
- [Mapa del frontend y flujo de datos](docs/ARQUITECTURA.md).
- [Endpoints actuales de OpenF1](docs/ENDPOINTS.md).
- [Donde cambiar los estilos](docs/ESTILOS.md).
- [Guia de estilo visual](STYLE_UI.md).
- [Documentacion especifica del frontend](frontend/README.md).

## Flujo de ramas

Trabajo actual en `refactor`. Git no admite `\` en nombres de ramas. La rama conserva los cambios previos del usuario; la copia recuperable registra ese estado anterior a los movimientos. No se hizo merge, push ni despliegue.

Tras revisar esta migracion se puede integrar en la rama principal. Para trabajo futuro, usar ramas cortas por funcionalidad y cambios de contrato compatibles. API, motor y codigo del pipeline ya estan implementados. La calibracion real ya esta disponible; la integracion con la UI sigue pendiente.

## API de simulacion (puerto 8000)

Instalacion, arranque, endpoints, pruebas y ejemplos curl en [backend/README.md](backend/README.md). Los parametros actuales son sinteticos. Ejecutar la API en otra terminal: npm run dev inicia solamente el frontend.
