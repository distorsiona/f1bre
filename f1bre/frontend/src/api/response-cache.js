/** Caché local acotada. Guarda históricos; no necesita servidor ni base de datos. */
const PREFIX = 'f1bre:openf1:v1:';
const BUDGET = 3500000;
export function createResponseCache(
  getStorage = () => globalThis.localStorage,
  now = () => Date.now(),
) {
  const memory = new Map();
  function read(key) {
    try {
      const record = memory.get(key) || JSON.parse(getStorage()?.getItem(PREFIX + key) || 'null');
      if (
        !record ||
        !Array.isArray(record.rows) ||
        !Number.isFinite(record.savedAt) ||
        !Number.isFinite(record.expiresAt)
      )
        return null;
      memory.delete(key);
      memory.set(key, record);
      while (memory.size > 60) memory.delete(memory.keys().next().value);
      return { ...record, fresh: record.expiresAt > now() };
    } catch {
      return null;
    }
  }
  function write(key, rows, ttl, persistent = true) {
    const record = { rows, savedAt: now(), expiresAt: now() + ttl };
    memory.delete(key);
    memory.set(key, record);
    while (memory.size > 60) memory.delete(memory.keys().next().value);
    if (!persistent) return;
    try {
      const storage = getStorage();
      if (!storage) return;
      const value = JSON.stringify(record);
      if (value.length * 2 > BUDGET) return;
      const entries = [];
      let size = value.length * 2;
      for (let i = 0; i < storage.length; i++) {
        const name = storage.key(i);
        if (!name?.startsWith(PREFIX) || name === PREFIX + key) continue;
        const raw = storage.getItem(name) || '';
        let savedAt = 0;
        try {
          savedAt = JSON.parse(raw).savedAt || 0;
        } catch {
          /* Entrada corrupta: se elimina primero. */
        }
        entries.push({ name, size: raw.length * 2, savedAt });
        size += raw.length * 2;
      }
      entries.sort((a, b) => a.savedAt - b.savedAt);
      while (size > BUDGET && entries.length) {
        const old = entries.shift();
        storage.removeItem(old.name);
        size -= old.size;
      }
      // Ante cuotas compartidas más pequeñas se desalojan solo entradas de esta aplicación.
      while (true) {
        try {
          storage.setItem(PREFIX + key, value);
          break;
        } catch {
          if (!entries.length) break;
          storage.removeItem(entries.shift().name);
        }
      }
    } catch {
      /* Almacenamiento bloqueado o lleno: se conserva la caché en memoria. */
    }
  }
  return { read, write };
}

/** Preferencia pequeña y opcional: restaurar temporada y carrera tras una recarga. */
export function readSelection() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem('f1bre:selection:v1') || 'null');
  } catch {
    return null;
  }
}
export function saveSelection(session) {
  try {
    globalThis.localStorage?.setItem(
      'f1bre:selection:v1',
      JSON.stringify({ year: session.year, sessionKey: session.session_key }),
    );
  } catch {
    /* La navegación sigue funcionando si el navegador impide guardar preferencias. */
  }
}
