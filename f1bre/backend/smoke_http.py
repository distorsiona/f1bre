"""Verifica Uvicorn por TCP real en un puerto efimero y cierra solo su propio proceso."""
from __future__ import annotations
import json
from pathlib import Path
import socket
import subprocess
import sys
from time import sleep, monotonic
from urllib.error import URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]

def main() -> None:
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        port = reservation.getsockname()[1]
    process = subprocess.Popen([sys.executable,"-m","uvicorn","backend.main:app",
        "--host","127.0.0.1","--port",str(port),"--log-level","error"],cwd=ROOT,
        creationflags=getattr(subprocess,"CREATE_NO_WINDOW",0))
    base = f"http://127.0.0.1:{port}"
    try:
        deadline = monotonic() + 15
        while True:
            try:
                with urlopen(base+"/health",timeout=1) as response:
                    if json.load(response) != {"status":"ok"}:
                        raise RuntimeError("Unexpected health response")
                break
            except (URLError,TimeoutError):
                if process.poll() is not None or monotonic() > deadline:
                    raise RuntimeError("API did not start") from None
                sleep(0.1)
        payload = (ROOT/"fixtures/simulation_request.json").read_bytes()
        request = Request(base+"/api/simulate",data=payload,
            headers={"Content-Type":"application/json","Origin":"http://localhost:4173"},method="POST")
        with urlopen(request,timeout=5) as response:
            result = json.load(response)
            if response.headers.get("Access-Control-Allow-Origin") != "http://localhost:4173":
                raise RuntimeError("CORS header missing")
        if len(result["lap_telemetry"]) != 57 or result["pit_stops_count"] != 1:
            raise RuntimeError("Unexpected simulation")
        print(json.dumps({"http":"ok","port":port,"total_time_seconds":result["total_time_seconds"],
            "projected_time_formatted":result["projected_time_formatted"],"pit_stops_count":result["pit_stops_count"],
            "laps":len(result["lap_telemetry"])}))
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)

if __name__ == "__main__":
    main()
