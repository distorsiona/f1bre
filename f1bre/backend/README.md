# Backend: simulador de estrategias

Etapa 5: `SimulationRequest` acepta `team_id` opcional. `GET /api/circuits` lista los equipos disponibles del archivo activo. Seleccionar la calibracion mediante `F1BRE_CALIBRATION_PATH` y reiniciar la API; sin esa variable se conserva el fixture sintetico anterior. Equipo desconocido: 404. Sin equipo: coeficientes de circuito. Ver [pipeline, supuestos y estado de descarga real](../data_pipeline/README.md).

API independiente del frontend, sin base de datos ni dependencias de entrenamiento. Requiere Python 3.11 o superior. Ejecutar todos los comandos desde la raiz del proyecto.

## Instalar y arrancar

```powershell
python -m venv backend/.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

API: http://127.0.0.1:8000. Documentacion interactiva: http://127.0.0.1:8000/docs. Detener con Ctrl+C. El frontend se levanta por separado con `npm run dev` en el puerto 4173; ese comando no inicia Python. Esta entrega no conecta todavia la UI al simulador.

## Probar desde otra terminal

```powershell
curl.exe http://127.0.0.1:8000/health
curl.exe http://127.0.0.1:8000/api/circuits
curl.exe -X POST http://127.0.0.1:8000/api/simulate -H "Content-Type: application/json" --data-binary "@fixtures/simulation_request.json"
```

El ejemplo devuelve 57 vueltas, una parada, `total_time_seconds: 5468.634` y `projected_time_formatted: "01:31:08.634"`.

| Endpoint           | Responsabilidad                                                                |
| ------------------ | ------------------------------------------------------------------------------ |
| GET /health        | Estado del servicio con calibracion cargada: `{"status":"ok"}`                 |
| GET /api/circuits  | Circuitos disponibles, parametros basicos, version y marca de datos sinteticos |
| POST /api/simulate | Valida la estrategia y devuelve tiempos y telemetria por vuelta                |

Errores: 422 para contratos invalidos y 404 para circuitos sin calibracion. CORS permite localhost y 127.0.0.1 en los puertos 3000, 4173, 5173 y 8080. Para desplegar, configurar origenes concretos del entorno en `main.py`.

## Reglas del motor

`simulator.py` calcula, para cada vuelta `t` y edad del neumatico `a`:

```text
combustible = (total_laps - t) * fuel_effect
degradacion = alpha * a + beta * a²
lap_time = intercept + combustible + degradacion + perdida_de_boxes
```

- La edad empieza en 1 y vuelve a 1 despues de cada parada.
- Solo se cobra boxes al finalizar un stint no final. Cruzar la meta no es una parada.
- `intercept` es el tiempo base especifico del compuesto; no se suma otra vez `base_lap_time`.
- `delta_vs_base` contiene solamente combustible y degradacion, sin boxes ni diferencia de intercept.
- El total usa tiempos sin redondear; los campos de salida se redondean a 3 decimales. El formato legible conserva siempre los milisegundos.
- `driver_id` es metadato opcional y aun no modifica los coeficientes.
- Las vueltas del circuito son una referencia: la peticion puede simular cualquier N entero >= 1 con stints validos.

Los parametros JSON se validan y cargan una sola vez al arrancar; no hay descargas ni lecturas de disco por peticion. Una calibracion ausente o invalida impide el arranque. Reiniciar el servicio al cambiar los parametros.

Los fixtures predeterminados son **sinteticos**, para probar el sistema. El pipeline offline ya esta implementado; su calibracion real de Bahrain 2024 esta disponible mediante OpenF1 sin autenticacion. No hay predicciones reales validadas.

## Verificacion

```powershell
.\backend\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
.\backend\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
.\backend\.venv\Scripts\python.exe -m mypy --config-file backend/pyproject.toml
.\backend\.venv\Scripts\python.exe -m backend.export_contracts
.\backend\.venv\Scripts\python.exe -m backend.benchmark
.\backend\.venv\Scripts\python.exe -m backend.smoke_http
```

15 pruebas pasan: formula calculada a mano, limites, tipos estrictos, redondeo, reinicio de edad, CORS, contratos, carga unica y seleccion de equipo. Se incluye la comparacion con el archivo real entre equipos; no hay pruebas omitidas. `smoke_http` inicia y cierra su propio servidor en un puerto temporal.

Medicion local: 300 peticiones ASGI calientes de 57 vueltas, API p50 0.387 ms / p95 0.464 ms; motor p95 0.143 ms. Incluye validacion y serializacion; excluye TCP, red y arranque. El objetivo de 10 ms se cumple en esta medicion, sin garantizarlo en cualquier infraestructura o peticion: tiempo y memoria crecen O(N), y no se impone un maximo arbitrario de vueltas.
