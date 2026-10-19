"""Regresion con interceptos por tanda para reducir sesgo entre cargas/sesiones."""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression


def fit_compound(laps: pd.DataFrame, fuel_effect: float, reference_laps: float) -> dict:
    """Ajusta alpha/beta no negativos tras eliminar diferencias entre tandas.

    Combustible restante estimado = max(reference_laps - RunElapsed, 0).
    El intercepto es la mediana de interceptos por tanda, no la mejor vuelta.
    """
    data = laps.copy()
    age = data["TyreLife"].to_numpy(dtype=float)
    data["age"] = age
    data["age2"] = age * age
    data["corrected"] = data["LapSeconds"] - fuel_effect * np.maximum(
        reference_laps - data["RunElapsed"].to_numpy(dtype=float), 0.0)
    columns = ["age", "age2", "corrected"]
    centered = data[columns] - data.groupby("RunId")[columns].transform("mean")
    features = centered[["age", "age2"]].to_numpy()
    if np.linalg.matrix_rank(features) < 2:
        raise ValueError("Insufficient tyre-age variation for quadratic regression.")
    model = LinearRegression(fit_intercept=False, positive=True)
    model.fit(features, centered["corrected"].to_numpy())
    alpha, beta = (float(value) for value in model.coef_)
    data["offset"] = data["corrected"] - alpha * age - beta * age * age
    offsets = data.groupby("RunId")["offset"].mean()
    intercept = float(offsets.median())
    residuals = data["offset"] - data["RunId"].map(offsets)
    if not np.isfinite(intercept) or intercept <= 0:
        raise ValueError("Invalid fitted intercept.")
    return {
        "coefficients": {"alpha": alpha, "beta": beta, "intercept": intercept},
        "metrics": {"laps": len(data), "runs": len(offsets),
                    "age_min": float(age.min()), "age_max": float(age.max()),
                    "within_run_rmse_seconds": float(np.sqrt(np.mean(residuals ** 2))),
                    "constraint_active": alpha == 0.0 or beta == 0.0},
    }
