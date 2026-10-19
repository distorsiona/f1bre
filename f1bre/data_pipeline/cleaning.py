"""Seleccion estricta de vueltas y tandas continuas, sin unir huecos de datos."""
from __future__ import annotations

import numpy as np
import pandas as pd

COMPOUNDS = ("SOFT", "MEDIUM", "HARD")


def select_long_runs(laps: pd.DataFrame, minimum: int = 5) -> pd.DataFrame:
    """Una bandera, boxes, cambio de juego o vuelta ausente rompe la tanda.

    TrackStatus debe ser exactamente '1' (verde durante toda la vuelta).
    IsAccurate, Deleted y TyreLife desconocidos se rechazan conservadoramente.
    """
    required = {"Session", "Driver", "Team", "LapNumber", "Stint", "Compound",
                "TyreLife", "LapTime", "TrackStatus", "PitInTime", "PitOutTime",
                "IsAccurate", "Deleted"}
    missing = required - set(laps.columns)
    if missing:
        raise ValueError(f"Missing lap columns: {sorted(missing)}")
    if minimum < 5:
        raise ValueError("Long runs require at least five laps.")
    frame = laps.copy()
    frame["LapSeconds"] = frame["LapTime"].dt.total_seconds()
    valid = (frame["TrackStatus"].eq("1") & frame["IsAccurate"].eq(True)
             & frame["Deleted"].eq(False) & frame["PitInTime"].isna()
             & frame["PitOutTime"].isna() & frame["Compound"].isin(COMPOUNDS)
             & frame["TyreLife"].gt(0) & frame["Stint"].notna()
             & np.isfinite(frame["TyreLife"]) & np.isfinite(frame["LapNumber"])
             & frame["LapNumber"].gt(0) & frame["LapSeconds"].gt(0)
             & np.isfinite(frame["LapSeconds"]) & frame["Team"].notna()
             & frame["Driver"].notna() & frame["Session"].notna())
    valid &= ~frame.duplicated(["Session", "Driver", "LapNumber"], keep=False)
    frame = frame.loc[valid.fillna(False)].sort_values(["Session", "Driver", "LapNumber"])
    if frame.empty:
        raise ValueError("No valid green laps available.")
    # LapNumber and actual TyreLife preserve interruptions and used tyre ages.
    keys = ["Session", "Driver", "Team", "Stint", "Compound"]
    previous = frame.shift()
    boundary = frame[keys].ne(previous[keys]).any(axis=1)
    boundary |= frame["LapNumber"].sub(previous["LapNumber"]).ne(1)
    boundary |= frame["TyreLife"].sub(previous["TyreLife"]).ne(1)
    frame["RunId"] = boundary.cumsum().astype(str)
    frame = frame.loc[frame.groupby("RunId")["RunId"].transform("size").ge(minimum)].copy()
    if frame.empty:
        raise ValueError("No continuous long runs meet the minimum length.")
    # Fuel is consumed on out-laps/invalid laps too: use stint-relative lap number.
    stint_start = laps.groupby(["Session", "Driver", "Stint"])["LapNumber"].min()
    frame["RunElapsed"] = [float(row.LapNumber - stint_start.loc[(row.Session, row.Driver, row.Stint)])
                           for row in frame.itertuples()]
    return frame.reset_index(drop=True)
