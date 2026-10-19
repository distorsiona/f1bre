"""Descarga FP1/FP2 y exporta calibracion validada. Ejecutar desde la raiz."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
from pathlib import Path
import re
import tempfile

from data_pipeline.openf1_source import download_practices
import numpy as np
import pandas as pd

from contracts.models import CalibrationFile
from data_pipeline.cleaning import COMPOUNDS, select_long_runs
from data_pipeline.modeling import fit_compound

ROOT = Path(__file__).resolve().parents[1]


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def read_local_laps(path: Path, sessions: list[str]) -> tuple[pd.DataFrame, list[dict]]:
    """Importa CSV normalizado; tiempos como timedeltas o segundos.

    Requiere Session (FP1/FP2). No infiere banderas o precision ausentes.
    """
    frame = pd.read_csv(path, dtype={"TrackStatus": "string"})
    if "Session" not in frame:
        raise ValueError("Local CSV requires a Session column (FP1/FP2).")
    frame = frame.loc[frame["Session"].isin(sessions)].copy()
    if set(frame["Session"].unique()) != set(sessions):
        raise ValueError("Local CSV does not contain every requested session.")
    for column in ("LapTime", "PitInTime", "PitOutTime"):
        if column not in frame:
            raise ValueError(f"Local CSV missing {column}.")
        if pd.api.types.is_numeric_dtype(frame[column]):
            frame[column] = pd.to_timedelta(frame[column], unit="s", errors="raise")
        else:
            frame[column] = pd.to_timedelta(frame[column], errors="raise")
    for column in ("IsAccurate", "Deleted"):
        if column not in frame:
            raise ValueError(f"Local CSV missing {column}.")
        # Reject unknown values; pandas bool conversion would treat 'False' as True.
        frame[column] = frame[column].map({True: True, False: False, "True": True,
            "False": False, "true": True, "false": False}).astype("boolean")
    source_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    return frame, [{"session": s, "source": "local_normalized_csv", "file": path.name,
                    "sha256": source_hash, "raw_laps": int(frame.Session.eq(s).sum())}
                   for s in sessions]


def build_calibration(raw: pd.DataFrame, *, year: int, circuit_id: str, total_laps: int,
                      pit_loss: float, fuel_effect: float, reference_laps: float,
                      minimum: int, sources: list[dict]) -> dict:
    """Exporta todos los equipos presentes; cada respaldo tiene una fuente explicita."""
    clean = select_long_runs(raw, minimum)
    fitted, metrics = {}, {}
    for (team, compound), group in clean.groupby(["Team", "Compound"]):
        result = fit_compound(group, fuel_effect, reference_laps)
        fitted[(str(team), str(compound))] = result["coefficients"]
        metrics[f"{slug(str(team))}/{compound}"] = result["metrics"]
    if not fitted:
        raise ValueError("No fitted team/compound models.")
    # Balanced team medians avoid weighting the busiest team more heavily.
    available = {}
    for compound in COMPOUNDS:
        values = [value for (_, c), value in fitted.items() if c == compound]
        if values:
            available[compound] = {key: float(np.median([v[key] for v in values]))
                                   for key in ("alpha", "beta", "intercept")}
    # If a compound is absent everywhere, use an observed neighbouring compound
    # unchanged. No invented sporting offset: provenance marks this weak fallback.
    grid, grid_sources = {}, {}
    for compound in COMPOUNDS:
        donor = compound if compound in available else min(
            available, key=lambda c: (abs(COMPOUNDS.index(c) - COMPOUNDS.index(compound)), c))
        grid[compound] = dict(available[donor])
        grid_sources[compound] = f"grid_median:{donor}"
    teams = {}
    for name in sorted(raw["Team"].dropna().unique()):
        team_id = slug(str(name))
        if team_id in teams:
            raise ValueError("Team identifiers collide after normalization.")
        compounds, origins = {}, {}
        for compound in COMPOUNDS:
            value = fitted.get((str(name), compound))
            compounds[compound] = value if value is not None else dict(grid[compound])
            origins[compound] = "fitted" if value is not None else grid_sources[compound]
        teams[team_id] = {"name": str(name), "compounds": compounds, "sources": origins}
    digest_frame = clean[["Session", "Driver", "Team", "LapNumber", "TyreLife", "Compound", "LapSeconds"]]
    digest = hashlib.sha256(digest_frame.to_csv(index=False).encode()).hexdigest()
    version_material = json.dumps({"data": digest, "fuel": fuel_effect,
        "reference": reference_laps, "pit_loss": pit_loss, "laps": total_laps,
        "minimum": minimum, "teams": teams}, sort_keys=True).encode()
    version_digest = hashlib.sha256(version_material).hexdigest()[:12]
    return {
        "schema_version": "1.0.0", "parameters_version": f"{year}-{circuit_id}-fp-{version_digest}",
        "synthetic": False,
        "description": "OpenF1 practice-derived calibration; fuel and pit loss are assumptions, not measured loads.",
        "circuits": {circuit_id: {"name": circuit_id, "total_laps": total_laps,
            "base_lap_time": grid["MEDIUM"]["intercept"], "pit_loss": pit_loss,
            "fuel_effect": fuel_effect, "compounds": grid, "teams": teams}},
        "provenance": {"year": year, "sessions": sources, "generated_at": datetime.now(timezone.utc).isoformat(),
            "clean_laps_sha256": digest, "raw_laps": len(raw), "long_run_laps": len(clean),
            "minimum_continuous_laps": minimum, "pit_loss_source": "user_estimate",
            "fuel_effect_source": "user_estimate", "initial_stint_fuel_equivalent_laps": reference_laps,
            "fuel_correction": "subtract gamma * max(reference_laps - stint_elapsed_laps, 0)",
            "regression": "within-run centered quadratic NNLS; median run intercept; actual TyreLife",
            "fallback": grid_sources, "fits": metrics,
            "limitations": ["Unknown actual fuel loads and engine modes", "Session and track evolution remain confounders",
                            "Monotone degradation constraint can flatten noisy fits", "No validated race prediction accuracy"],
            "timing_quality": "OpenF1 proxy: positive sectors sum within 0.1 s; not FastF1 IsAccurate",
            "track_status": "Explicit green from race_control, conservative global/sector flag intervals; approximate lap timestamps",
            "inlap_policy": "Exclude pit endpoint laps, final stint laps, and laps preceding outlaps",
            "dependencies": {package: importlib.metadata.version(package)
                             for package in ("pandas", "numpy", "scikit-learn")}},
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--gp", required=True)
    parser.add_argument("--sessions", nargs="+", choices=["FP1", "FP2"], default=["FP1", "FP2"])
    parser.add_argument("--circuit-id")
    parser.add_argument("--total-laps", type=int, required=True)
    parser.add_argument("--pit-loss", type=float, default=23.0)
    parser.add_argument("--fuel-effect", type=float, default=0.035)
    parser.add_argument("--reference-fuel-laps", type=float, default=20.0)
    parser.add_argument("--min-run-laps", type=int, default=5)
    parser.add_argument("--cache", type=Path, default=ROOT / "data_pipeline/data/cache")
    parser.add_argument("--input-csv", type=Path, help="Use a normalized lap export without network.")
    parser.add_argument("--refresh", action="store_true", help="Refresh cached OpenF1 historical responses.")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if (args.total_laps < 1 or args.min_run_laps < 5 or args.reference_fuel_laps <= 0
            or not all(np.isfinite(v) and v >= 0 for v in
                       (args.pit_loss, args.fuel_effect, args.reference_fuel_laps))):
        parser.error("Invalid lap counts or non-finite/negative parameters.")
    if len(set(args.sessions)) != len(args.sessions):
        parser.error("Sessions must not repeat.")
    circuit_id = args.circuit_id or slug(args.gp)
    try:
        raw, sources = (read_local_laps(args.input_csv, args.sessions) if args.input_csv
                         else download_practices(args.year, args.gp, args.sessions, args.cache, args.refresh))
    except (OSError, ValueError) as exc:
        parser.exit(1, f"Practice data unavailable: {exc}\n"
            "No calibration exported. Check OpenF1 availability, use --refresh to renew cached data, "
            "or --input-csv with an existing FP1/FP2 export.\n")
    document = build_calibration(raw, year=args.year, circuit_id=circuit_id,
        total_laps=args.total_laps, pit_loss=args.pit_loss, fuel_effect=args.fuel_effect,
        reference_laps=args.reference_fuel_laps, minimum=args.min_run_laps, sources=sources)
    validated = CalibrationFile.model_validate(document)
    output = args.output or ROOT / f"fixtures/{circuit_id}_{args.year}_fp_calibrated.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    # Atomic publication: an interrupted export never replaces a valid calibration.
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=output.parent,
                                     suffix=".tmp", delete=False) as handle:
        temporary = Path(handle.name)
        handle.write(validated.model_dump_json(indent=2) + "\n")
    temporary.replace(output)
    print(json.dumps({"output": str(output), "version": validated.parameters_version,
                      "teams": len(validated.circuits[circuit_id].teams),
                      "long_run_laps": document["provenance"]["long_run_laps"]}))


if __name__ == "__main__":
    main()

