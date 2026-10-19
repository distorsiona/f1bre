"""Mide motor y round-trip ASGI caliente; excluye red, arranque, reload y concurrencia."""
from __future__ import annotations
import json
from pathlib import Path
from statistics import median
from time import perf_counter_ns
import asyncio
import httpx
from contracts.models import SimulationRequest
from backend.calibration import load_calibration
from backend.main import create_app
from backend.simulator import simulate_strategy

COUNT = 300

async def main() -> None:
    payload = json.loads((Path(__file__).resolve().parents[1]/"fixtures/simulation_request.json").read_text())
    request = SimulationRequest.model_validate(payload)
    circuit = load_calibration().circuits[request.circuit_id]
    engine_times: list[float] = []
    api_times: list[float] = []
    app = create_app()
    async with app.router.lifespan_context(app), httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        for _ in range(20):
            (await client.post("/api/simulate",json=payload)).raise_for_status()
        for _ in range(COUNT):
            start = perf_counter_ns()
            simulate_strategy(request,circuit)
            engine_times.append((perf_counter_ns()-start)/1_000_000)
            start = perf_counter_ns()
            (await client.post("/api/simulate",json=payload)).raise_for_status()
            api_times.append((perf_counter_ns()-start)/1_000_000)
    print(json.dumps({"laps":request.total_laps,"samples":COUNT,"scope":"local warm ASGI; includes validation and serialization, excludes TCP",
        "engine_p50_ms":round(median(engine_times),3),"engine_p95_ms":round(sorted(engine_times)[int(COUNT*.95)-1],3),
        "api_p50_ms":round(median(api_times),3),"api_p95_ms":round(sorted(api_times)[int(COUNT*.95)-1],3)},indent=2))

if __name__ == "__main__":
    asyncio.run(main())
