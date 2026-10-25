/** Calendario relativo al reloj del usuario, sin temporadas ni carreras prefijadas. */
export function seasonContext(rows, now = new Date()) {
  const year = now.getFullYear();
  const calendar = rows.filter((row) => Number(row.year) === year && !row.is_cancelled);
  const sessions = calendar
    .filter((row) => Date.parse(row.date_end) <= now.getTime())
    .sort((a, b) => Date.parse(a.date_end) - Date.parse(b.date_end));
  return { year, calendar, sessions, session: sessions.at(-1) || null };
}
