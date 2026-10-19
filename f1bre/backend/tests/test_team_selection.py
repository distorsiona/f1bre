"""Seleccion de equipos comprobada con datos controlados, explicitamente sinteticos."""
from __future__ import annotations
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import httpx
from backend.main import create_app
from backend.tests.test_simulation import simple_calibration


class TeamSelectionTests(unittest.IsolatedAsyncioTestCase):
    async def test_environment_selects_file_and_team_without_affecting_old_requests(self) -> None:
        circuit = simple_calibration().model_dump()
        coefficients = circuit["compounds"]
        faster = {c: {**v, "intercept": v["intercept"] - 1.0} for c, v in coefficients.items()}
        circuit["teams"] = {
            "team-a": {"name": "A", "compounds": coefficients,
                       "sources": {c: "controlled_test" for c in coefficients}},
            "team-b": {"name": "B", "compounds": faster,
                       "sources": {c: "controlled_test" for c in coefficients}},
        }
        document = {"schema_version": "1.0.0", "parameters_version": "controlled-test",
                    "synthetic": True, "description": "Unit test", "circuits": {"test": circuit}}
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "test.json"
            path.write_text(json.dumps(document), encoding="utf-8")
            with patch.dict("os.environ", {"F1BRE_CALIBRATION_PATH": str(path)}):
                app = create_app()
                async with app.router.lifespan_context(app):
                    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                        body = {"circuit_id": "test", "total_laps": 4,
                                "stints": [{"compound": "MEDIUM", "end_lap": 4}]}
                        baseline = await client.post("/api/simulate", json=body)
                        a = await client.post("/api/simulate", json={**body, "team_id": "team-a"})
                        b = await client.post("/api/simulate", json={**body, "team_id": "team-b"})
                        self.assertEqual(a.status_code, 200, a.text)
                        self.assertEqual(b.status_code, 200, b.text)
                        self.assertEqual(a.json(), baseline.json())
                        self.assertAlmostEqual(a.json()["total_time_seconds"] - b.json()["total_time_seconds"], 4.0)
                        unknown = await client.post("/api/simulate", json={**body, "team_id": "missing"})
                        self.assertEqual(unknown.status_code, 404)
                        invalid = await client.post("/api/simulate", json={**body, "team_id": ""})
                        self.assertEqual(invalid.status_code, 422)
                        circuits = (await client.get("/api/circuits")).json()
                        self.assertEqual(circuits[0]["teams"], ["team-a", "team-b"])


if __name__ == "__main__":
    unittest.main()
