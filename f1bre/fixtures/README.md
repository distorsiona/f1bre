# Fixtures sinteticos

Etapa 5: `simulation_request_real_team.json` muestra como seleccionar Ferrari. Requiere activar `bahrain_2024_fp_calibrated.json`, ya generado con OpenF1 para 10 equipos. El ejemplo no funciona con el fixture sintetico sin equipos. Ver [pipeline y pasos de ejecucion](../data_pipeline/README.md).

`circuits_calibration.json` contiene parametros ilustrativos para Bahrain y Monza, con los tres compuestos. No representa telemetria real ni modelos entrenados. El indicador `synthetic` y `parameters_version` identifican su procedencia.

`simulation_request.json` es una estrategia reproducible de 57 vueltas en Bahrain: SOFT hasta la 18 y HARD hasta la 57. Produce una sola parada y un tiempo estimado de ejemplo de 01:31:08.634.

El backend carga este archivo al arrancar, independientemente del directorio de ejecucion. Validar cambios con las pruebas del backend. No guardar telemetria pesada en esta carpeta; el pipeline futuro debe producir archivos compatibles con `contracts/coefficients.schema.json`.
