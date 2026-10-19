"""API ligera. Ejecutar desde la raiz: python -m uvicorn backend.main:app --port 8000."""
from __future__ import annotations
from contextlib import asynccontextmanager
from pathlib import Path
import os
from typing import AsyncIterator
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contracts.models import CalibrationFile, CircuitSummary, HealthResponse, SimulationRequest, SimulationResponse
from backend.calibration import DEFAULT_CALIBRATION_PATH, load_calibration
from backend.simulator import simulate_strategy

# Origenes explicitos: sin comodin ni credenciales; /frontend/ no forma parte del origen.
LOCAL_ORIGINS = [f"http://{host}:{port}" for host in ("localhost", "127.0.0.1")
                 for port in (3000, 4173, 5173, 8080)]

def create_app(calibration_path: Path | None = None) -> FastAPI:
    calibration: CalibrationFile | None = None

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        nonlocal calibration
        selected_path = calibration_path or Path(os.environ.get("F1BRE_CALIBRATION_PATH", str(DEFAULT_CALIBRATION_PATH)))
        calibration = load_calibration(selected_path)
        yield
        calibration = None

    api = FastAPI(title="F1BRE Strategy Simulator", version="1.0.0", lifespan=lifespan,
        description="Simulacion determinista con calibraciones offline; consultar procedencia y supuestos del archivo activo.")
    api.add_middleware(CORSMiddleware, allow_origins=LOCAL_ORIGINS, allow_credentials=False,
        allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

    def parameters() -> CalibrationFile:
        if calibration is None:
            raise HTTPException(status_code=503, detail="Calibration not loaded.")
        return calibration

    @api.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        parameters()
        return HealthResponse()

    @api.get("/api/circuits", response_model=list[CircuitSummary])
    async def circuits() -> list[CircuitSummary]:
        data = parameters()
        return [CircuitSummary(circuit_id=identifier, name=circuit.name, total_laps=circuit.total_laps,
            base_lap_time=circuit.base_lap_time, pit_loss=circuit.pit_loss, fuel_effect=circuit.fuel_effect,
            compounds=["SOFT", "MEDIUM", "HARD"], parameters_version=data.parameters_version, synthetic=data.synthetic, teams=sorted(circuit.teams))
            for identifier, circuit in sorted(data.circuits.items())]

    @api.post("/api/simulate", response_model=SimulationResponse,
        responses={404: {"description": "Circuito sin calibracion disponible."}})
    async def simulate(request: SimulationRequest) -> SimulationResponse:
        circuit = parameters().circuits.get(request.circuit_id)
        if circuit is None:
            raise HTTPException(status_code=404, detail=f"Unknown circuit_id: {request.circuit_id}")
        if request.team_id is not None and request.team_id not in circuit.teams:
            raise HTTPException(status_code=404, detail=f"Unknown team_id: {request.team_id}")
        return simulate_strategy(request, circuit)

    return api

app = create_app()
