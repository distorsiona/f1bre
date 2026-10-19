# Pipeline offline con OpenF1

Fuente principal: OpenF1 historico, sin cuenta ni autenticacion. El pipeline usa la biblioteca estandar para HTTP y depende de pandas, numpy, scikit-learn y Pydantic. FastF1 y F1TV ya no intervienen en la descarga ni en la calibracion.

Verificado con Bahrain 2024: FP1 (session_key 9465) y FP2 (9466), 959 vueltas recibidas, 322 vueltas en tandas largas seleccionadas y 10 equipos. El archivo real esta en `fixtures/bahrain_2024_fp_calibrated.json`. SOFT esta ajustado por equipo; MEDIUM esta ajustado donde hay suficientes vueltas validas y usa respaldo para Ferrari/Red Bull. HARD usa respaldo de MEDIUM porque no hay tandas validas para ajustarlo. Los datos son reales; combustible y perdida en boxes siguen siendo supuestos.

## Estructura

```text
data_pipeline/
  requirements.txt          Dependencias directas, sin FastF1
  requirements-lock.txt     Dependencias resueltas del entorno verificado
  openf1_source.py          HTTP, cache, sesiones y normalizacion conservadora
  process_practices.py      CLI, calibracion, procedencia y exportacion atomica
  cleaning.py               Tandas continuas y filtros comunes
  modeling.py               Regresion por equipo y compuesto
  tests/                    Pruebas sin red
  data/cache/openf1/        Respuestas historicas, excluidas de Git
  .venv/                    Entorno aislado, excluido de Git
fixtures/
  bahrain_2024_fp_calibrated.json
  simulation_request_real_team.json
```

## Instalar y calibrar

Desde la raiz `f1bre`, con Python 3.11 o superior:

```powershell
python -m venv data_pipeline/.venv
.\data_pipeline\.venv\Scripts\python.exe -m pip install -r data_pipeline/requirements-lock.txt
.\data_pipeline\.venv\Scripts\python.exe -m data_pipeline.process_practices --year 2024 --gp Bahrain --sessions FP1 FP2 --total-laps 57
```

No ejecutar comandos `fastf1 auth`. El entorno existente puede conservar paquetes de instalaciones anteriores; el codigo y los archivos de dependencias ya no los requieren. Un entorno nuevo con el lockfile instala solamente las dependencias del pipeline OpenF1.

Opciones adicionales: `--circuit-id`, `--pit-loss` (23 segundos por defecto), `--fuel-effect` (0.035 segundos por vuelta de carga), `--reference-fuel-laps` (20), `--min-run-laps` (minimo 5), `--output`, `--cache`, `--refresh`. `--total-laps` es obligatorio para no confundir vueltas de practica con distancia de carrera. `--gp` acepta un nombre de GP, pais o circuito que identifique un unico meeting; se excluyen los tests de pretemporada. El adaptador requiere las sesiones FP1/FP2 solicitadas y rechaza fuentes incompletas.

Las respuestas se guardan por consulta en la cache. Los historicos se reutilizan sin caducidad; `--refresh` los vuelve a descargar. Las peticiones de red estan separadas por 2.5 segundos y los errores 429/5xx tienen reintentos limitados. No se descargan canales de telemetria de alta frecuencia. La cache esta excluida de Git.

## Endpoints y limpieza

Se consultan `meetings`, `sessions`, `drivers`, `laps`, `stints`, `pit` y `race_control`. Se conservan session_key, meeting_key, fechas y huellas SHA-256 de las respuestas.

- **Neumaticos:** se exige un stint unico para cada vuelta. Edad = `tyre_age_at_start + lap_number - lap_start + 1`. No se reinicia artificialmente la edad de juegos usados.
- **Tiempo:** tres sectores positivos cuya suma coincida con el tiempo total dentro de 0.1 segundos. Esta comprobacion propia se almacena en la columna interna `IsAccurate`; no equivale al indicador de FastF1.
- **Banderas:** se exige verde explicito antes de la vuelta y se recorren los mensajes que afectan a todo su intervalo. Amarillas por sector bloquean hasta CLEAR/GREEN de ese sector; SC/VSC, rojas y bandera a cuadros bloquean globalmente. Anunciar que el safety car entrara no equivale a pista verde. Una pista sin estado conocido se descarta.
- **Boxes:** descartar out-laps indicados por OpenF1, vueltas de `pit`, vueltas anteriores a out-laps y ultima vuelta de cada stint como posible in-lap. Esto puede descartar alguna vuelta valida, de forma conservadora.
- **Eliminadas:** interpretar mensajes de borrado/restitucion usando piloto y tiempo de vuelta. Si un borrado no puede asociarse con confianza, excluir al piloto afectado (o la sesion si no se conoce).
- **Tandas:** cambio de sesion/piloto/equipo/stint/compuesto o hueco en numero/edad rompe la secuencia. Las vueltas descartadas no permiten unir fragmentos. Retener al menos cinco vueltas consecutivas. Vueltas duplicadas se rechazan.

Los timestamps de inicio de OpenF1 son aproximados y la cobertura de mensajes puede ser incompleta. Los criterios permiten una reconstruccion conservadora, no garantizan igualdad con FastF1 ni ausencia de toda anomalia. Los colores de minisectores no se interpretan como banderas de pista.

## Combustible, regresion y respaldos

La carga real y el modo de motor son desconocidos. Se aplica:

```text
tiempo_corregido = tiempo_observado - gamma * max(referencia - vueltas_desde_inicio_del_stint, 0)
tiempo_corregido = intercept + alpha * edad + beta * edad²
```

El combustible se consume tambien durante vueltas descartadas. La referencia equivale a 20 vueltas al inicio de un stint, por defecto; es configurable y no es una medicion. La perdida de boxes tambien es una estimacion configurable.

El ajuste centra las variables por tanda para reducir el sesgo de diferencias constantes entre cargas y sesiones. Alpha/beta son no negativos, y el intercepto publicado es la mediana de interceptos de tanda. Se publican numero de vueltas/tandas, rango de edad y RMSE dentro de las tandas. No es una evaluacion predictiva independiente. `constraint_active` marca ajustes con algun coeficiente cero.

Cada compuesto de cada equipo tiene `sources`:

- `fitted`: ajuste de ese equipo y compuesto.
- `grid_median:COMPOUND`: mediana de coeficientes de equipos con datos del compuesto, con el mismo peso por equipo.
- Si ningun equipo tiene un compuesto, se copia sin modificar el compuesto observado mas cercano. No se inventa una diferencia entre compuestos; el donante queda registrado. En Bahrain 2024, HARD hereda MEDIUM y debe interpretarse como respaldo de baja confianza.

Los equipos sin long runs pueden recibir respaldos para todos sus compuestos. `synthetic: false` identifica el origen real de las vueltas, sin convertir respaldos o estimaciones en mediciones. Fuera del rango de edad observado se extrapola. Trafico, temperatura y evolucion de pista siguen siendo factores de confusion. No hay precision de carrera validada.

El JSON se valida con los contratos Pydantic y se publica mediante reemplazo atomico. La version depende de datos, coeficientes y supuestos; la fecha de generacion es metadato. Los fixtures sinteticos originales se conservan.

## Activar los parametros reales en FastAPI

Detener la API anterior con Ctrl+C si ocupa el puerto 8000. Desde la raiz:

```powershell
$env:F1BRE_CALIBRATION_PATH = (Resolve-Path fixtures/bahrain_2024_fp_calibrated.json).Path
.\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Reiniciar despues de recalibrar: el servicio carga una sola vez y el recargador no observa necesariamente JSON. Sin variable se conserva el fixture sintetico. Para volver a el: `Remove-Item Env:F1BRE_CALIBRATION_PATH` y reiniciar.

```powershell
curl.exe http://127.0.0.1:8000/api/circuits
curl.exe -X POST http://127.0.0.1:8000/api/simulate -H "Content-Type: application/json" --data-binary "@fixtures/simulation_request_real_team.json"
```

`GET /api/circuits` publica version, origen sintetico y equipos disponibles. `team_id` debe ser uno de esos identificadores (por ejemplo, ferrari o red-bull-racing). Sin equipo se usa el modelo de parrilla; desconocido devuelve 404. `driver_id` sigue siendo metadato. El frontend permanece separado y aun no consume este simulador.

## Verificar y reproducir

```powershell
.\data_pipeline\.venv\Scripts\python.exe -m unittest discover -s data_pipeline/tests -v
.\backend\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
.\backend\.venv\Scripts\python.exe -m mypy --config-file backend/pyproject.toml
npm run verify:migration
```

Las pruebas no descargan datos. Incluyen cache HTTP, banderas, sectores, neumaticos usados, boxes, limpieza, ajuste conocido y comparacion entre Ferrari/Red Bull usando el archivo real. Se verificaron 12 pruebas del pipeline y 15 del backend, sin omisiones.

Entrada opcional: `--input-csv "ruta/al/archivo.csv"` para un CSV normalizado con Session (FP1/FP2), Driver, Team, LapNumber, Stint, Compound, TyreLife, LapTime, TrackStatus, PitInTime, PitOutTime, IsAccurate y Deleted. Tiempos en segundos numericos o timedeltas; booleanos True/False. El usuario debe identificar correctamente GP y anio. Este modo conserva compatibilidad con exportaciones anteriores; no infiere banderas faltantes como verdes.

Referencia: [documentacion oficial de OpenF1](https://openf1.org/docs/). El acceso historico desde 2023 no requiere autenticacion; el acceso en vivo tiene condiciones distintas. Respetar las condiciones de uso del proveedor.
