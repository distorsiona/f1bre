"""Pruebas sin red: limpieza deportiva y recuperacion de coeficientes conocidos."""
from __future__ import annotations
import unittest
from pathlib import Path
import tempfile
import pandas as pd
from contracts.models import CalibrationFile
from data_pipeline.cleaning import select_long_runs
from data_pipeline.modeling import fit_compound
from data_pipeline.process_practices import build_calibration, read_local_laps


def sample_laps() -> pd.DataFrame:
    rows = []
    for session in ("FP1", "FP2"):
        for team, driver, baseline in [("Team A", "AAA", 90.0), ("Team B", "BBB", 91.0)]:
            for lap in range(1, 13):
                time = baseline + .08 * lap + .002 * lap ** 2 + .035 * (20 - (lap - 1))
                rows.append(dict(Session=session, Driver=driver, Team=team, LapNumber=float(lap),
                    Stint=1.0, Compound="MEDIUM", TyreLife=float(lap),
                    LapTime=pd.Timedelta(seconds=time), TrackStatus="1", PitInTime=pd.NaT,
                    PitOutTime=pd.NaT, IsAccurate=True, Deleted=False))
    return pd.DataFrame(rows)


class CleaningTests(unittest.TestCase):
    def test_flags_boxes_deleted_and_unknown_break_continuity(self) -> None:
        for field, value in [("TrackStatus", "12"), ("TrackStatus", "4"),
            ("TrackStatus", "6"), ("TrackStatus", None), ("IsAccurate", False),
            ("Deleted", True), ("Deleted", None), ("PitInTime", pd.Timedelta(seconds=1)),
            ("PitOutTime", pd.Timedelta(seconds=1))]:
            with self.subTest(field=field, value=value):
                raw = sample_laps().iloc[:12].copy()
                raw[field] = raw[field].astype(object)
                raw.loc[5, field] = value
                clean = select_long_runs(raw)
                self.assertEqual(len(clean), 11)
                self.assertEqual(clean.groupby("RunId").size().tolist(), [5, 6])

    def test_short_fragments_not_joined_across_session_or_missing_lap(self) -> None:
        raw = sample_laps()
        short = raw.loc[raw.LapNumber.le(4)]
        with self.assertRaises(ValueError):
            select_long_runs(short)
        gap = raw.iloc[:12].drop(index=5)
        clean = select_long_runs(gap)
        self.assertEqual(clean.groupby("RunId").size().tolist(), [5, 6])

    def test_compound_changes_and_used_tyre_age(self) -> None:
        raw = sample_laps().iloc[:12].copy()
        raw.loc[6:, "Compound"] = "HARD"
        raw["TyreLife"] += 4
        clean = select_long_runs(raw)
        self.assertEqual(clean.groupby("RunId").size().tolist(), [6, 6])
        self.assertEqual(clean.TyreLife.min(), 5)


class ModelingTests(unittest.TestCase):
    def test_local_csv_round_trip_preserves_flags_and_timedeltas(self) -> None:
        raw = sample_laps()
        raw.loc[0, "Deleted"] = True
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "laps.csv"
            raw.to_csv(path, index=False)
            restored, sources = read_local_laps(path, ["FP1", "FP2"])
            self.assertTrue(restored.loc[0, "Deleted"])
            self.assertFalse(restored.loc[1, "Deleted"])
            self.assertEqual(restored.loc[1, "TrackStatus"], "1")
            self.assertEqual(len(sources), 2)
            self.assertEqual(restored.loc[1, "LapTime"], raw.loc[1, "LapTime"])
            self.assertEqual(len(select_long_runs(restored)), 47)

    def test_recovers_known_coefficients_with_fuel_and_run_offsets(self) -> None:
        clean = select_long_runs(sample_laps())
        group = clean.loc[clean.Team.eq("Team A")].copy()
        group.loc[group.Session.eq("FP2"), "LapSeconds"] += 1.0
        fitted = fit_compound(group, .035, 20)["coefficients"]
        self.assertAlmostEqual(fitted["alpha"], .08, places=6)
        self.assertAlmostEqual(fitted["beta"], .002, places=6)
        self.assertAlmostEqual(fitted["intercept"], 90.5, places=6)

    def test_export_validates_and_marks_unobserved_compounds(self) -> None:
        result = build_calibration(sample_laps(), year=2024, circuit_id="test", total_laps=57,
            pit_loss=23.0, fuel_effect=.035, reference_laps=20.0, minimum=5, sources=[])
        calibration = CalibrationFile.model_validate(result)
        a = calibration.circuits["test"].teams["team-a"]
        self.assertEqual(a.sources["MEDIUM"], "fitted")
        self.assertEqual(a.sources["SOFT"], "grid_median:MEDIUM")
        self.assertEqual(a.sources["HARD"], "grid_median:MEDIUM")
        self.assertFalse(calibration.synthetic)

    def test_version_changes_with_fuel_assumption(self) -> None:
        kwargs = dict(year=2024, circuit_id="test", total_laps=57, pit_loss=23.0,
                      reference_laps=20.0, minimum=5, sources=[])
        a = build_calibration(sample_laps(), fuel_effect=.035, **kwargs)
        b = build_calibration(sample_laps(), fuel_effect=.04, **kwargs)
        self.assertNotEqual(a["parameters_version"], b["parameters_version"])


if __name__ == "__main__":
    unittest.main()
