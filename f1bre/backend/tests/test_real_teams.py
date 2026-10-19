"""Regresion con practicas reales de OpenF1; no descarga datos durante las pruebas."""
from __future__ import annotations
import json
from pathlib import Path
import unittest
import httpx
from backend.calibration import load_calibration
from backend.main import create_app
from backend.simulator import simulate_strategy
from contracts.models import SimulationRequest

FIXTURE = Path(__file__).resolve().parents[2] / "fixtures/bahrain_2024_fp_calibrated.json"


@unittest.skipUnless(FIXTURE.exists(), "Real calibration unavailable: run the FastF1 pipeline or provide a warm cache/CSV.")
class RealTeamsTests(unittest.TestCase):
    def test_real_team_models_produce_distinct_deterministic_simulations(self) -> None:
        data = load_calibration(FIXTURE)
        self.assertFalse(data.synthetic)
        self.assertTrue(all(s["source"] == "openf1" for s in data.provenance["sessions"]))
        circuit = data.circuits["bahrain"]
        results = []
        common = [c for c in ("SOFT", "MEDIUM", "HARD") if all(
            circuit.teams[t].sources[c] == "fitted" for t in ("ferrari", "red-bull-racing"))]
        self.assertTrue(common, "Real comparison requires a shared fitted compound.")
        observed = common[0]
        for team_id in ("ferrari", "red-bull-racing"):
            team = circuit.teams[team_id]
            request = SimulationRequest.model_validate({"circuit_id": "bahrain", "team_id": team_id,
                "total_laps": 10, "stints": [{"compound": observed, "end_lap": 10}]})
            result = simulate_strategy(request, circuit)
            self.assertEqual(result, simulate_strategy(request, circuit))
            self.assertEqual(len(result.lap_telemetry), 10)
            coefficients = team.compounds[observed]
            # Independent sum of the defined formula, without any pit on the finish lap.
            expected = sum(coefficients.intercept + (10 - lap) * circuit.fuel_effect
                + coefficients.alpha * lap + coefficients.beta * lap ** 2 for lap in range(1, 11))
            self.assertAlmostEqual(result.total_time_seconds, round(expected, 3), places=3)
            self.assertEqual(result.pit_stops_count, 0)
            results.append(result.total_time_seconds)
        self.assertNotEqual(*results)


@unittest.skipUnless(FIXTURE.exists(), "Real calibration unavailable; no fabricated real-data fixture.")
class RealTeamApiTests(unittest.IsolatedAsyncioTestCase):
    async def test_select_file_and_team_and_reject_unknown_team(self) -> None:
        app = create_app(FIXTURE)
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                circuits = (await client.get("/api/circuits")).json()
                self.assertIn("ferrari", circuits[0]["teams"])
                body = {"circuit_id": "bahrain", "total_laps": 2,
                        "stints": [{"compound": "SOFT", "end_lap": 2}]}
                a = await client.post("/api/simulate", json={**body, "team_id": "ferrari"})
                b = await client.post("/api/simulate", json={**body, "team_id": "red-bull-racing"})
                self.assertEqual(a.status_code, 200, a.text)
                self.assertEqual(b.status_code, 200, b.text)
                self.assertNotEqual(a.json()["total_time_seconds"], b.json()["total_time_seconds"])
                unknown = await client.post("/api/simulate", json={**body, "team_id": "missing"})
                self.assertEqual(unknown.status_code, 404)
                self.assertEqual((await client.post("/api/simulate", json=body)).status_code, 200)


if __name__ == "__main__":
    unittest.main()
