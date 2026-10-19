/** Transformaciones puras de OpenF1: sin DOM, estado global ni llamadas HTTP. */
export const F1Data = (() => {
  /** Valida un número finito; null y undefined no son mediciones de valor cero. */
  const number = (v) => typeof v === 'number' && Number.isFinite(v);
  /** Promedia únicamente mediciones válidas y devuelve null si no existen. */
  const mean = (v) => {
    v = v.filter(number);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  /** Excluye pit-out y entradas al pit lane según piloto y número de vuelta. */
  function paceLaps(laps, pits) {
    const p = new Set(pits.map((r) => `${r.driver_number}:${r.lap_number}`));
    return laps.filter(
      (l) =>
        number(l.lap_duration) &&
        l.lap_duration > 0 &&
        !l.is_pit_out_lap &&
        !p.has(`${l.driver_number}:${l.lap_number}`),
    );
  }
  /** Agrupa vueltas válidas en ventanas de cinco vueltas para el gráfico de ritmo. */
  function series(laps) {
    const bins = new Map();
    for (const l of laps) {
      const n = Math.floor((l.lap_number - 1) / 5) * 5 + 1;
      if (!bins.has(n)) bins.set(n, []);
      bins.get(n).push(l.lap_duration);
    }
    return [...bins].sort((a, b) => a[0] - b[0]).map(([lap, v]) => ({ lap, value: mean(v) }));
  }
  /** Cruza datasets por número de piloto dentro de la sesión y deriva métricas. */
  function stats(driver, data) {
    const mine = (k) => (data[k] || []).filter((r) => r.driver_number === driver.driver_number),
      laps = mine('laps'),
      pits = mine('pit'),
      clean = paceLaps(laps, pits),
      times = laps.map((l) => l.lap_duration).filter((n) => number(n) && n > 0);
    return {
      driver,
      laps,
      clean,
      pace: mean(clean.map((l) => l.lap_duration)),
      best: times.length ? Math.min(...times) : null,
      stints: mine('stints').sort((a, b) => a.stint_number - b.stint_number),
      pits: data.pit === null ? null : pits,
      lane: mean(pits.map((p) => p.lane_duration ?? p.pit_duration)),
      stop: mean(pits.map((p) => p.stop_duration)),
      result: mine('session_result')[0],
      grid: mine('starting_grid')[0],
      series: series(clean),
    };
  }
  /** Calcula límites UTC a partir de date_start y lap_duration de una vuelta. */
  function lapWindow(lap) {
    if (!lap?.date_start || !number(lap.lap_duration) || lap.lap_duration <= 0)
      throw Error('This lap has no valid time window. Choose another lap.');
    const t = Date.parse(lap.date_start);
    if (!Number.isFinite(t)) throw Error('Invalid lap timestamp.');
    return {
      'date>=': new Date(t).toISOString(),
      'date<': new Date(t + lap.lap_duration * 1000).toISOString(),
    };
  }
  return { number, mean, paceLaps, series, stats, lapWindow };
})();
