"""Fuente OpenF1 historica, sin autenticacion ni dependencias HTTP adicionales."""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import re
import time
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import urlopen

import pandas as pd

BASE_URL = "https://api.openf1.org/v1"


class OpenF1Client:
    """Cache por consulta y limite conservador de 25 peticiones/minuto.

    Cache de historicos sin caducidad; --refresh fuerza renovar. Nunca se
    guardan respuestas HTTP fallidas. Los reintentos son limitados.
    """
    def __init__(self, cache: Path, refresh: bool = False) -> None:
        self.cache = cache / "openf1"
        self.cache.mkdir(parents=True, exist_ok=True)
        self.refresh = refresh
        self.last_request = 0.0

    def get(self, endpoint: str, **filters: object) -> list[dict]:
        url = f"{BASE_URL}/{endpoint}?{urlencode(sorted(filters.items()))}"
        path = self.cache / (hashlib.sha256(url.encode()).hexdigest() + ".json")
        if path.exists() and not self.refresh:
            result = json.loads(path.read_text(encoding="utf-8"))
        else:
            for attempt in range(4):
                time.sleep(max(0.0, 2.5 - (time.monotonic() - self.last_request)))
                self.last_request = time.monotonic()
                try:
                    with urlopen(url, timeout=60) as response:
                        result = json.load(response)
                    break
                except HTTPError as exc:
                    if exc.code not in (429, 500, 502, 503, 504) or attempt == 3:
                        raise
                    retry = exc.headers.get("Retry-After", "")
                    time.sleep(min(60.0, float(retry) if retry.isdigit() else 5.0 * (attempt + 1)))
            if not isinstance(result, list) or not all(isinstance(row, dict) for row in result):
                raise ValueError(f"Unexpected OpenF1 response: {endpoint}")
            temporary = path.with_suffix(".tmp")
            temporary.write_text(json.dumps(result), encoding="utf-8")
            temporary.replace(path)
        if not isinstance(result, list) or not all(isinstance(row, dict) for row in result):
            raise ValueError(f"Invalid OpenF1 cache: {endpoint}; retry with --refresh.")
        return result


def timestamp(value: object) -> pd.Timestamp:
    return pd.to_datetime(value, utc=True, errors="coerce")


def green_during(start: pd.Timestamp, end: pd.Timestamp, messages: list[dict]) -> bool:
    """Reconstruccion conservadora: exige verde explicito y examina toda la vuelta.

    Una amarilla de cualquier sector bloquea hasta su CLEAR/GREEN. SC/VSC/roja
    no terminan por anunciar 'IN THIS LAP'; requieren bandera verde global.
    """
    known_green, global_block = False, False
    blocked_sectors: set[str] = set()
    for item in messages:
        date = timestamp(item.get("date"))
        if pd.isna(date) or date > end:
            continue
        if date >= start and (not known_green or global_block or blocked_sectors):
            return False
        flag = str(item.get("flag") or "").upper()
        text = str(item.get("message") or "").upper()
        scope = str(item.get("scope") or "").upper()
        sector = str(item.get("sector") or "unknown")
        if flag in ("YELLOW", "DOUBLE YELLOW"):
            if scope == "SECTOR":
                blocked_sectors.add(sector)
            else:
                global_block = True
        elif (flag in ("RED", "CHEQUERED") or "SESSION SUSPENDED" in text
              or "DEPLOYED" in text and ("SAFETY CAR" in text or "VSC" in text or "SC DEPLOYED" in text)):
            global_block = True
        elif flag in ("GREEN", "CLEAR"):
            if scope == "SECTOR":
                blocked_sectors.discard(sector)
            elif scope in ("TRACK", "ALL", "") and item.get("driver_number") is None:
                known_green, global_block = True, False
                blocked_sectors.clear()
        elif "GREEN LIGHT" in text or text.strip() == "TRACK CLEAR":
            known_green, global_block = True, False
            blocked_sectors.clear()
        # A restriction beginning anywhere within the lap rejects that lap.
        if date >= start and (not known_green or global_block or blocked_sectors):
            return False
    return known_green and not global_block and not blocked_sectors


def normalize_session(session: dict, identifier: str, payload: dict[str, list[dict]]) -> pd.DataFrame:
    """Adapta a columnas internas; IsAccurate es un proxy, no el de FastF1.

    Solo acepta tiempos con tres sectores consistentes, estado de pista conocido,
    stint unico y edad conocida. Fin de stint y vuelta anterior a out-lap se
    descartan conservadoramente como posibles in-laps.
    """
    laps, stints = payload["laps"], payload["stints"]
    drivers = {d["driver_number"]: d for d in payload["drivers"]}
    messages = sorted(payload["race_control"], key=lambda m: str(m.get("date") or ""))
    if not laps or not stints or not messages or not drivers:
        raise ValueError(f"OpenF1 incomplete session {identifier}: laps/stints/drivers/race_control required.")
    pit_laps = {(p.get("driver_number"), p.get("lap_number")) for p in payload["pit"]}
    pit_laps |= {(l.get("driver_number"), l["lap_number"] - 1) for l in laps
                 if l.get("is_pit_out_lap") is True and isinstance(l.get("lap_number"), int)}
    deleted: dict[tuple[object, float], bool] = {}
    unknown_deleted: set[object] = set()
    for item in messages:
        text = str(item.get("message") or "").upper()
        if "DELETED" not in text and "REINSTATED" not in text:
            continue
        driver = item.get("driver_number")
        if driver is None:
            match = re.search(r"CAR\s+(\d+)", text)
            driver = int(match.group(1)) if match else None
        match = re.search(r"(\d+):(\d{2}\.\d{3})", text)
        if match and driver is not None:
            seconds = int(match.group(1)) * 60 + float(match.group(2))
            deleted[(driver, round(seconds, 3))] = "DELETED" in text
        else:
            unknown_deleted.add(driver)
    rows = []
    for lap in laps:
        driver, number = lap.get("driver_number"), lap.get("lap_number")
        if not isinstance(number, int):
            continue
        matches = [s for s in stints if s.get("driver_number") == driver
                   and isinstance(s.get("lap_start"), int) and isinstance(s.get("lap_end"), int)
                   and s["lap_start"] <= number <= s["lap_end"]]
        stint = matches[0] if len(matches) == 1 else {}
        duration = lap.get("lap_duration")
        duration = float(duration) if isinstance(duration, (float, int)) else float("nan")
        start = timestamp(lap.get("date_start"))
        end = start + pd.Timedelta(seconds=duration) if math.isfinite(duration) else pd.NaT
        sectors = [lap.get(f"duration_sector_{i}") for i in (1, 2, 3)]
        accurate = (math.isfinite(duration) and duration > 0 and not pd.isna(start)
                    and all(isinstance(v, (float, int)) and math.isfinite(v) and v > 0 for v in sectors))
        accurate = bool(accurate and abs(sum(sectors) - duration) <= .1)
        green = accurate and green_during(start, end, messages)
        in_pit = (driver, number) in pit_laps or number == stint.get("lap_end")
        age_start = stint.get("tyre_age_at_start")
        age = (float(age_start) + number - stint["lap_start"] + 1
               if isinstance(age_start, (int, float)) and stint else float("nan"))
        removed = (None in unknown_deleted or driver in unknown_deleted
                   or deleted.get((driver, round(duration, 3)), False))
        rows.append({"Session": identifier, "Driver": str(driver), "Team": drivers.get(driver, {}).get("team_name"),
            "LapNumber": float(number), "Stint": stint.get("stint_number"), "Compound": stint.get("compound"),
            "TyreLife": age, "LapTime": pd.Timedelta(seconds=duration) if math.isfinite(duration) else pd.NaT,
            "TrackStatus": "1" if green else "unknown_or_restricted",
            "PitInTime": pd.Timedelta(0) if in_pit else pd.NaT,
            "PitOutTime": pd.Timedelta(0) if lap.get("is_pit_out_lap") is not False else pd.NaT,
            "IsAccurate": accurate, "Deleted": removed})
    return pd.DataFrame(rows)


def download_practices(year: int, grand_prix: str, sessions: list[str], cache: Path,
                       refresh: bool = False) -> tuple[pd.DataFrame, list[dict]]:
    client = OpenF1Client(cache, refresh)
    meetings = client.get("meetings", year=year)
    needle = grand_prix.casefold()
    matches = [m for m in meetings if needle in " ".join(str(m.get(k) or "")
               for k in ("meeting_name", "country_name", "location", "circuit_short_name")).casefold()]
    matches = [m for m in matches if "testing" not in str(m.get("meeting_name", "")).casefold()]
    if len(matches) != 1:
        raise ValueError(f"GP must identify exactly one meeting; found {len(matches)} for {grand_prix}.")
    meeting = matches[0]
    available = client.get("sessions", meeting_key=meeting["meeting_key"])
    frames, sources = [], []
    for identifier in sessions:
        name = {"FP1": "Practice 1", "FP2": "Practice 2"}[identifier]
        selected = [s for s in available if s.get("session_name") == name]
        if len(selected) != 1:
            raise ValueError(f"Missing or ambiguous {identifier} in OpenF1.")
        session = selected[0]
        payload = {endpoint: client.get(endpoint, session_key=session["session_key"])
                   for endpoint in ("drivers", "laps", "stints", "pit", "race_control")}
        frame = normalize_session(session, identifier, payload)
        frames.append(frame)
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        sources.append({"source": "openf1", "session": identifier, "session_key": session["session_key"],
                        "meeting_key": meeting["meeting_key"], "event": meeting["meeting_name"],
                        "date": session["date_start"], "raw_laps": len(frame), "payload_sha256": digest})
    return pd.concat(frames, ignore_index=True), sources
