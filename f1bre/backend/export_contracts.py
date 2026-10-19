"""Regenera contratos desde Pydantic/FastAPI: python -m backend.export_contracts."""
from __future__ import annotations
import json
from pathlib import Path
from contracts.models import CalibrationFile, SimulationRequest, SimulationResponse
from backend.main import app

ROOT = Path(__file__).resolve().parents[1]

def export_contracts() -> None:
    outputs = {
        "contracts/openapi.json": app.openapi(),
        "contracts/schemas/simulation_request.schema.json": SimulationRequest.model_json_schema(),
        "contracts/schemas/simulation_response.schema.json": SimulationResponse.model_json_schema(),
        "contracts/coefficients.schema.json": CalibrationFile.model_json_schema(),
    }
    for relative, document in outputs.items():
        path = ROOT / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    export_contracts()
