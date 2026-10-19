"""Pruebas del adaptador OpenF1 sin conexiones externas."""
from __future__ import annotations
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
from data_pipeline.openf1_source import OpenF1Client, green_during, normalize_session


def message(date: str, flag: str, scope: str = "Track", **extra: object) -> dict:
    return {"date": f"2024-02-29T{date}+00:00", "flag": flag, "scope": scope, **extra}


class TrackStatusTests(unittest.TestCase):
    def test_yellow_overlap_and_sector_clear(self) -> None:
        messages = [message("11:30:00", "GREEN"), message("11:33:00", "YELLOW", "Sector", sector=2),
                    message("11:35:00", "CLEAR", "Sector", sector=2)]
        self.assertTrue(green_during(pd.Timestamp("2024-02-29T11:31Z"), pd.Timestamp("2024-02-29T11:32Z"), messages))
        self.assertFalse(green_during(pd.Timestamp("2024-02-29T11:32Z"), pd.Timestamp("2024-02-29T11:34Z"), messages))
        self.assertFalse(green_during(pd.Timestamp("2024-02-29T11:34Z"), pd.Timestamp("2024-02-29T11:36Z"), messages))
        self.assertTrue(green_during(pd.Timestamp("2024-02-29T11:36Z"), pd.Timestamp("2024-02-29T11:37Z"), messages))

    def test_unknown_track_and_safety_car_not_assumed_green(self) -> None:
        start, end = pd.Timestamp("2024-02-29T11:31Z"), pd.Timestamp("2024-02-29T11:32Z")
        self.assertFalse(green_during(start, end, []))
        messages = [message("11:29:00", "GREEN"), message("11:30:00", "", message="VIRTUAL SAFETY CAR DEPLOYED")]
        self.assertFalse(green_during(start, end, messages))
        for flag in ("RED", "CHEQUERED"):
            restricted = [message("11:29:00", "GREEN"), message("11:31:30", flag)]
            self.assertFalse(green_during(start, end, restricted))


class AdapterTests(unittest.TestCase):
    def test_sectors_used_tyres_inlaps_outlaps_and_deleted_laps(self) -> None:
        laps = [{"driver_number": 16, "lap_number": n, "date_start": f"2024-02-29T11:{30 + n}:00Z",
                 "lap_duration": 60.0, "duration_sector_1": 20.0, "duration_sector_2": 20.0,
                 "duration_sector_3": 20.0, "is_pit_out_lap": n == 1} for n in range(1, 7)]
        laps[2]["duration_sector_3"] = None
        data = {"laps": laps, "stints": [{"driver_number": 16, "lap_start": 1, "lap_end": 6,
            "stint_number": 1, "tyre_age_at_start": 3, "compound": "MEDIUM"}],
            "drivers": [{"driver_number": 16, "team_name": "Ferrari"}], "pit": [],
            "race_control": [message("11:30:00", "GREEN"), message("11:40:00", "", driver_number=16,
                message="CAR 16 LAP TIME 1:00.000 DELETED - TRACK LIMITS")]}
        frame = normalize_session({}, "FP1", data)
        self.assertEqual(frame.iloc[0].TyreLife, 4)
        self.assertFalse(frame.iloc[2].IsAccurate)
        self.assertFalse(pd.isna(frame.iloc[0].PitOutTime))
        self.assertFalse(pd.isna(frame.iloc[-1].PitInTime))
        self.assertTrue(frame.Deleted.all())

    def test_missing_stint_or_timing_not_manufactured_valid(self) -> None:
        payload = {"laps": [{"driver_number": 1, "lap_number": 1}],
                   "stints": [{"driver_number": 2, "lap_start": 1, "lap_end": 2}],
                   "drivers": [{"driver_number": 1, "team_name": "A"}], "pit": [],
                   "race_control": [message("11:30:00", "GREEN")]}
        row = normalize_session({}, "FP1", payload).iloc[0]
        self.assertTrue(pd.isna(row.TyreLife))
        self.assertFalse(row.IsAccurate)
        self.assertNotEqual(row.TrackStatus, "1")

    def test_http_cache_avoids_duplicate_network_calls(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            response = MagicMock()
            response.__enter__.return_value.read.return_value = json.dumps([{"session_key": 1}])
            with patch("data_pipeline.openf1_source.urlopen", return_value=response) as fetch:
                client = OpenF1Client(Path(folder))
                self.assertEqual(client.get("sessions", year=2024), client.get("sessions", year=2024))
                self.assertEqual(fetch.call_count, 1)


if __name__ == "__main__":
    unittest.main()
