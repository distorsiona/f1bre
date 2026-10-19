"""Pruebas de contratos y motor con expectativas calculadas de forma independiente."""
from __future__ import annotations
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import httpx
from contracts.models import CircuitCalibration, SimulationRequest
from backend.calibration import DEFAULT_CALIBRATION_PATH, load_calibration
from backend.main import create_app
from backend.simulator import format_race_time, simulate_strategy
EXAMPLE = {'circuit_id': 'bahrain', 'total_laps': 4, 'stints': [{'compound': 'SOFT', 'end_lap': 2}, {'compound': 'HARD', 'end_lap': 4}]}

def simple_calibration() -> CircuitCalibration:
    return CircuitCalibration.model_validate({'name': 'Test', 'total_laps': 4, 'base_lap_time': 100.0, 'pit_loss': 20.0, 'fuel_effect': 0.1, 'compounds': {'SOFT': {'alpha': 1.0, 'beta': 0.1, 'intercept': 100.0}, 'MEDIUM': {'alpha': 0.8, 'beta': 0.08, 'intercept': 101.0}, 'HARD': {'alpha': 0.5, 'beta': 0.05, 'intercept': 102.0}}})

class SimulatorTests(unittest.TestCase):

    def test_hand_calculated_fuel_degradation_pit_and_age_reset(self) -> None:
        request = SimulationRequest.model_validate(EXAMPLE)
        result = simulate_strategy(request, simple_calibration())
        self.assertEqual([lap.lap_time for lap in result.lap_telemetry], [101.4, 122.6, 102.65, 103.2])
        self.assertEqual([lap.delta_vs_base for lap in result.lap_telemetry], [1.4, 2.6, 0.65, 1.2])
        self.assertEqual([lap.tyre_age for lap in result.lap_telemetry], [1, 2, 1, 2])
        self.assertEqual([lap.is_pit_lap for lap in result.lap_telemetry], [False, True, False, False])
        self.assertEqual(result.total_time_seconds, 429.85)
        self.assertEqual(result.projected_time_formatted, '00:07:09.850')
        self.assertEqual(result.pit_stops_count, 1)
        self.assertEqual(result, simulate_strategy(request, simple_calibration()))

    def test_one_lap_has_no_finish_line_pit_loss_or_fuel_load(self) -> None:
        request = SimulationRequest(circuit_id='bahrain', total_laps=1, stints=[{'compound': 'SOFT', 'end_lap': 1}])
        result = simulate_strategy(request, load_calibration().circuits['bahrain'])
        self.assertEqual(result.total_time_seconds, 92.868)
        self.assertEqual(result.pit_stops_count, 0)
        self.assertFalse(result.lap_telemetry[0].is_pit_lap)

    def test_total_uses_unrounded_laps(self) -> None:
        data = simple_calibration().model_dump()
        data['fuel_effect'] = 0.0
        for coefficients in data['compounds'].values():
            coefficients.update(intercept=100.0004, alpha=0.0, beta=0.0)
        request = SimulationRequest.model_validate({'circuit_id': 'bahrain', 'total_laps': 3, 'stints': [{'compound': 'HARD', 'end_lap': 3}]})
        result = simulate_strategy(request, CircuitCalibration.model_validate(data))
        self.assertEqual(result.total_time_seconds, 300.001)
        self.assertEqual(sum((lap.lap_time for lap in result.lap_telemetry)), 300.0)

    def test_time_format_carries_milliseconds(self) -> None:
        self.assertEqual(format_race_time(59.9996), '00:01:00.000')
        self.assertEqual(format_race_time(3599.9996), '01:00:00.000')
        self.assertEqual(format_race_time(360000.125), '100:00:00.125')

class ApiTests(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self) -> None:
        self.app = create_app()
        self.lifespan = self.app.router.lifespan_context(self.app)
        await self.lifespan.__aenter__()
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=self.app), base_url='http://testserver')

    async def asyncTearDown(self) -> None:
        await self.client.aclose()
        await self.lifespan.__aexit__(None, None, None)

    async def test_health_and_circuits(self) -> None:
        self.assertEqual((await self.client.get('/health')).json(), {'status': 'ok'})
        response = await self.client.get('/api/circuits')
        self.assertEqual(response.status_code, 200)
        circuits = {circuit['circuit_id']: circuit for circuit in response.json()}
        self.assertEqual(circuits['bahrain']['total_laps'], 57)
        self.assertEqual(circuits['bahrain']['base_lap_time'], 93.5)
        self.assertTrue(circuits['bahrain']['synthetic'])

    async def test_example_strategy_has_exactly_one_pit_and_57_laps(self) -> None:
        example = json.loads((DEFAULT_CALIBRATION_PATH.parent / 'simulation_request.json').read_text())
        response = await self.client.post('/api/simulate', json=example)
        self.assertEqual(response.status_code, 200, response.text)
        result = response.json()
        self.assertEqual(len(result['lap_telemetry']), 57)
        self.assertEqual([lap['lap'] for lap in result['lap_telemetry']], list(range(1, 58)))
        self.assertEqual([lap['lap'] for lap in result['lap_telemetry'] if lap['is_pit_lap']], [18])
        self.assertEqual(result['pit_stops_count'], 1)
        self.assertEqual(result, (await self.client.post('/api/simulate', json=example)).json())

    async def test_unknown_circuit_returns_404(self) -> None:
        self.assertEqual((await self.client.post('/api/simulate', json={**EXAMPLE, 'circuit_id': 'missing'})).status_code, 404)

    async def test_invalid_boundaries_types_compounds_and_unknown_fields(self) -> None:
        invalid = [{**EXAMPLE, 'total_laps': 0}, {**EXAMPLE, 'total_laps': True}, {**EXAMPLE, 'total_laps': '4'}, {**EXAMPLE, 'total_laps': 4.0}, {**EXAMPLE, 'stints': []}, {**EXAMPLE, 'unexpected': 1}, *[{**EXAMPLE, 'stints': stints} for stints in [[{'compound': 'SOFT', 'end_lap': 3}], [{'compound': 'SOFT', 'end_lap': 0}, {'compound': 'HARD', 'end_lap': 4}], [{'compound': 'SOFT', 'end_lap': 5}, {'compound': 'HARD', 'end_lap': 4}], [{'compound': 'SOFT', 'end_lap': 2}, {'compound': 'HARD', 'end_lap': 2}, {'compound': 'HARD', 'end_lap': 4}], [{'compound': 'SOFT', 'end_lap': 3}, {'compound': 'HARD', 'end_lap': 2}, {'compound': 'HARD', 'end_lap': 4}], [{'compound': 'INTERMEDIATE', 'end_lap': 4}], [{'compound': 'soft', 'end_lap': 4}], [{'compound': 'SOFT', 'end_lap': True}], [{'compound': 'SOFT', 'end_lap': 4.0}]]]]
        for body in invalid:
            with self.subTest(body=body):
                self.assertEqual((await self.client.post('/api/simulate', json=body)).status_code, 422)

    async def test_cors_allows_frontend_origins_but_not_arbitrary_hosts(self) -> None:
        for origin in ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:4173']:
            response = await self.client.options('/api/simulate', headers={'Origin': origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers['access-control-allow-origin'], origin)
        response = await self.client.options('/api/simulate', headers={'Origin': 'https://example.com', 'Access-Control-Request-Method': 'POST'})
        self.assertEqual(response.status_code, 400)
        self.assertNotIn('access-control-allow-origin', response.headers)

    async def test_no_fixture_read_during_requests(self) -> None:
        with patch('backend.main.load_calibration', side_effect=AssertionError('Per-request file read')):
            for _ in range(3):
                self.assertEqual((await self.client.post('/api/simulate', json=EXAMPLE)).status_code, 200)

    async def test_stored_contract_matches_actual_openapi(self) -> None:
        stored = json.loads((DEFAULT_CALIBRATION_PATH.parents[1] / 'contracts/openapi.json').read_text())
        self.assertEqual(stored, (await self.client.get('/openapi.json')).json())

class StartupTests(unittest.IsolatedAsyncioTestCase):

    async def test_missing_or_invalid_calibration_fails_startup(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'invalid.json'
            for content in [None, '{"schema_version":"wrong"}', '{"not_json":']:
                if content is not None:
                    path.write_text(content)
                with self.subTest(content=content), self.assertRaises((OSError, ValueError)):
                    app = create_app(path)
                    async with app.router.lifespan_context(app):
                        pass
if __name__ == '__main__':
    unittest.main()
