# Contratos de datos

Extension compatible de etapa 5: `team_id` opcional en la peticion, `teams` en calibracion y listado de circuitos, y `provenance` en el archivo de parametros. Cada equipo exige SOFT, MEDIUM y HARD junto con la fuente de cada compuesto. Los archivos antiguos siguen siendo validos con mapas vacios por defecto. El JSON generado documenta estos campos; regenerarlo tras cambiar modelos.

`models.py` es la fuente de verdad: modelos Pydantic estrictos, campos adicionales prohibidos y validacion de stints ordenados dentro de [1, total_laps], terminando exactamente en total_laps. Solo se aceptan SOFT, MEDIUM y HARD.

- `openapi.json`: especificacion HTTP completa de FastAPI.
- `schemas/simulation_request.schema.json`: entrada del simulador.
- `schemas/simulation_response.schema.json`: salida y telemetria.
- `coefficients.schema.json`: archivo de calibracion del pipeline.

Regenerar desde la raiz con:

```powershell
.\backend\.venv\Scripts\python.exe -m backend.export_contracts
```

No editar a mano los JSON generados. Las reglas entre varios campos (como el orden de las paradas) se validan en Pydantic; JSON Schema no expresa por si solo todas esas relaciones. Las pruebas comparan el OpenAPI guardado con el de la API ejecutable.

Tiempos expresados en segundos. `tyre_age` empieza en 1. Detalles matematicos, errores y comandos en `../backend/README.md`. Version HTTP inicial 1.0.0; los parametros tienen su propia `parameters_version`. Mantener los cambios compatibles o versionar el contrato antes de romper clientes.
