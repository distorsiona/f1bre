/** Único cliente HTTP del proyecto; los módulos de UI no deben usar fetch directamente. */
import {
  ENDPOINTS,
  OPENF1_BASE_URL,
  REQUEST_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
  MAX_REQUEST_ATTEMPTS,
  CORE_ENDPOINTS,
} from '../config/openf1.js';
import { createResponseCache } from './response-cache.js';

/** Las dependencias inyectables permiten probar recargas y caché sin consultas reales. */
export function createOpenF1Client({
  cache = createResponseCache(),
  fetcher = (...args) => fetch(...args),
  interval = REQUEST_INTERVAL_MS,
} = {}) {
  const endpoints = Object.keys(ENDPOINTS);
  const pending = new Map();
  let queue = Promise.resolve(),
    last = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  /** Consulta GET con cola, caché, deduplicación y reintentos de HTTP 429. */
  function urlFor(endpoint, params = {}) {
    if (!endpoints.includes(endpoint)) throw Error('Unsupported endpoint.');
    // OpenF1 usa expresiones date<timestamp; agregar '=' después de '<' cambia el filtro.
    const filters = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => {
        const m = k.match(/^([a-z_]+)(>=|<=|>|<)$/);
        return m
          ? `${encodeURIComponent(m[1])}${m[2]}${encodeURIComponent(v)}`
          : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
      });
    return `${OPENF1_BASE_URL}/${endpoint}${filters.length ? '?' + filters.join('&') : ''}`;
  }
  /** Consulta síncrona para dibujar datos guardados, incluso si necesitan actualizarse. */
  function peek(endpoint, params = {}) {
    try {
      return cache.read(urlFor(endpoint, params));
    } catch {
      return null;
    }
  }
  function query(endpoint, params = {}, { force = false } = {}) {
    let key;
    try {
      key = urlFor(endpoint, params);
    } catch (e) {
      return Promise.reject(e);
    }
    const stored = cache.read(key);
    if (!force && stored?.fresh) return Promise.resolve(stored.rows);
    if (pending.has(key)) return pending.get(key);
    // Una sola cola limita también solicitudes provenientes de pantallas diferentes.
    const task = queue.then(async () => {
      for (let attempt = 0; attempt < MAX_REQUEST_ATTEMPTS; attempt++) {
        await wait(Math.max(0, interval - (Date.now() - last)));
        last = Date.now();
        const controller = new AbortController(),
          timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let response;
        try {
          response = await fetcher(key, { signal: controller.signal });
        } catch (e) {
          throw Error(
            e.name === 'AbortError'
              ? 'OpenF1 timed out. Retry.'
              : 'Unable to reach OpenF1. Check your connection.',
          );
        } finally {
          clearTimeout(timer);
        }
        if (response.status === 429 && attempt < MAX_REQUEST_ATTEMPTS - 1) {
          const retry = Number(response.headers.get('Retry-After'));
          await wait(retry > 0 ? Math.min(retry * 1000, 60000) : 5000 * (attempt + 1));
          continue;
        }
        if (!response.ok)
          throw Error(
            [401, 403].includes(response.status)
              ? 'This request requires authentication. Live data is not enabled.'
              : response.status === 429
                ? 'OpenF1 rate limit reached. Wait a minute and retry.'
                : `OpenF1 returned HTTP ${response.status}.`,
          );
        const rows = await response.json();
        if (!Array.isArray(rows)) throw Error('Unexpected OpenF1 response.');
        // El calendario expira pronto; históricos se reutilizan siete días.
        const ttl = endpoint === 'sessions' ? 5 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        cache.write(key, rows, ttl, endpoint === 'sessions' || CORE_ENDPOINTS.includes(endpoint));
        return rows;
      }
    });
    pending.set(key, task);
    // Recupera la cola después de un fallo, pero conserva el rechazo para quien pidió el dato.
    queue = task.catch(() => {});
    task.then(
      () => pending.delete(key),
      () => pending.delete(key),
    );
    return task;
  }
  return { query, endpoints, peek };
}
export const OpenF1 = createOpenF1Client();
