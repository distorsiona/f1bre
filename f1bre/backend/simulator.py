"""Motor determinista O(N): sin HTTP, entrenamiento, Pandas o aleatoriedad."""
from __future__ import annotations
from math import fsum
from contracts.models import CircuitCalibration, LapTelemetry, SimulationRequest, SimulationResponse

def format_race_time(seconds: float) -> str:
    """Formatea por milisegundos enteros para manejar correctamente cambios de minuto/hora."""
    milliseconds = round(seconds * 1000)
    hours, remaining = divmod(milliseconds, 3_600_000)
    minutes, remaining = divmod(remaining, 60_000)
    whole_seconds, fraction = divmod(remaining, 1000)
    return f"{hours:02d}:{minutes:02d}:{whole_seconds:02d}.{fraction:03d}"

def simulate_strategy(request: SimulationRequest, calibration: CircuitCalibration) -> SimulationResponse:
    """La primera vuelta de cada juego tiene edad 1; solo los stints no finales llevan boxes.

    base_lap_time es la referencia del circuito. El intercept especifico del compuesto
    es el termino constante de la formula; no se suma de nuevo base_lap_time.
    delta_vs_base incluye solo combustible y degradacion, excluye intercept y pit_loss.
    El total acumula valores sin redondear; solo la salida se redondea a 3 decimales.
    driver_id es metadato reservado y no altera coeficientes en este modelo inicial.
    """
    telemetry: list[LapTelemetry] = []
    raw_times: list[float] = []
    previous_end = 0
    final_stint = len(request.stints) - 1
    compounds = calibration.compounds
    if request.team_id is not None:
        if request.team_id not in calibration.teams:
            raise ValueError(f"Unknown team_id: {request.team_id}")
        compounds = calibration.teams[request.team_id].compounds
    for index, stint in enumerate(request.stints):
        coefficients = compounds[stint.compound]
        for lap in range(previous_end + 1, stint.end_lap + 1):
            age = lap - previous_end
            delta = ((request.total_laps - lap) * calibration.fuel_effect
                     + coefficients.alpha * age + coefficients.beta * age * age)
            is_pit_lap = index != final_stint and lap == stint.end_lap
            lap_time = coefficients.intercept + delta + (calibration.pit_loss if is_pit_lap else 0.0)
            raw_times.append(lap_time)
            telemetry.append(LapTelemetry(lap=lap, compound=stint.compound, tyre_age=age,
                lap_time=round(lap_time, 3), is_pit_lap=is_pit_lap, delta_vs_base=round(delta, 3)))
        previous_end = stint.end_lap
    total = round(fsum(raw_times), 3)
    return SimulationResponse(total_time_seconds=total, projected_time_formatted=format_race_time(total),
        pit_stops_count=final_stint, lap_telemetry=telemetry)
