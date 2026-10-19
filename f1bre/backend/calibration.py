"""Carga validada de coeficientes; se ejecuta al arrancar, nunca por vuelta/peticion."""
from __future__ import annotations
from pathlib import Path
from contracts.models import CalibrationFile

DEFAULT_CALIBRATION_PATH = Path(__file__).resolve().parents[1] / "fixtures" / "circuits_calibration.json"

def load_calibration(path: Path = DEFAULT_CALIBRATION_PATH) -> CalibrationFile:
    """Una configuracion ausente/corrupta impide arrancar; no se inventan coeficientes."""
    return CalibrationFile.model_validate_json(path.read_bytes())
