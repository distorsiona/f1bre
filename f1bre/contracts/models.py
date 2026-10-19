"""Contratos de simulacion y calibracion. Sin dependencias del servidor ni del pipeline."""
from __future__ import annotations
from typing import Annotated, Literal, Self
from pydantic import BaseModel, ConfigDict, Field, model_validator

Compound = Literal["SOFT", "MEDIUM", "HARD"]
PositiveLap = Annotated[int, Field(strict=True, ge=1)]
Seconds = Annotated[float, Field(ge=0, allow_inf_nan=False)]

class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True, allow_inf_nan=False)

class Stint(ContractModel):
    compound: Compound
    end_lap: PositiveLap

class SimulationRequest(ContractModel):
    circuit_id: Annotated[str, Field(min_length=1, max_length=100, pattern=r"^[a-z0-9][a-z0-9_-]*$")]
    total_laps: PositiveLap
    driver_id: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    team_id: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    stints: Annotated[list[Stint], Field(min_length=1)]

    @model_validator(mode="after")
    def validate_stint_boundaries(self) -> Self:
        previous = 0
        for stint in self.stints:
            if not previous < stint.end_lap <= self.total_laps:
                raise ValueError("Stint end_lap values must increase strictly and remain within [1, total_laps].")
            previous = stint.end_lap
        if previous != self.total_laps:
            raise ValueError("The last stint must end exactly at total_laps.")
        return self

class LapTelemetry(ContractModel):
    lap: PositiveLap
    compound: Compound
    tyre_age: PositiveLap
    lap_time: Seconds
    is_pit_lap: bool
    delta_vs_base: Seconds

class SimulationResponse(ContractModel):
    total_time_seconds: Seconds
    projected_time_formatted: Annotated[str, Field(pattern=r"^\d{2,}:\d{2}:\d{2}\.\d{3}$")]
    pit_stops_count: Annotated[int, Field(strict=True, ge=0)]
    lap_telemetry: list[LapTelemetry]

class DegradationCoefficients(ContractModel):
    alpha: Annotated[float, Field(ge=0)]
    beta: Annotated[float, Field(ge=0)]
    intercept: Annotated[float, Field(gt=0)]

class TeamCalibration(ContractModel):
    name: str
    compounds: dict[Compound, DegradationCoefficients]
    sources: dict[Compound, str]

    @model_validator(mode="after")
    def require_compounds(self) -> Self:
        expected = {"SOFT", "MEDIUM", "HARD"}
        if set(self.compounds) != expected or set(self.sources) != expected:
            raise ValueError("Team calibration requires all compounds and their sources.")
        return self

class CircuitCalibration(ContractModel):
    name: Annotated[str, Field(min_length=1)]
    total_laps: PositiveLap
    base_lap_time: Annotated[float, Field(gt=0)]
    pit_loss: Seconds
    fuel_effect: Seconds
    compounds: dict[Compound, DegradationCoefficients]
    teams: dict[str, TeamCalibration] = Field(default_factory=dict)

    @model_validator(mode="after")
    def require_all_compounds(self) -> Self:
        if set(self.compounds) != {"SOFT", "MEDIUM", "HARD"}:
            raise ValueError("Calibration must define SOFT, MEDIUM and HARD.")
        return self

class CalibrationFile(ContractModel):
    schema_version: Literal["1.0.0"]
    parameters_version: Annotated[str, Field(min_length=1)]
    synthetic: bool
    description: str
    circuits: Annotated[dict[str, CircuitCalibration], Field(min_length=1)]
    provenance: dict[str, object] = Field(default_factory=dict)

class CircuitSummary(ContractModel):
    circuit_id: str
    name: str
    total_laps: PositiveLap
    base_lap_time: float
    pit_loss: float
    fuel_effect: float
    compounds: list[Compound]
    parameters_version: str
    synthetic: bool
    teams: list[str] = Field(default_factory=list)

class HealthResponse(ContractModel):
    status: Literal["ok"] = "ok"
