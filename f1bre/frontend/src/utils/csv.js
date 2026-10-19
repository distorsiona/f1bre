/** Exportación CSV en el navegador. No envía datos a un servidor. */
/** Convierte las filas a CSV, escapa comillas y libera la URL temporal después de descargar. */
export function downloadCsv(rows, name) {
  if (!rows.length) return;
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const csv = [
    keys,
    ...rows.map((r) =>
      keys.map((k) =>
        typeof r[k] === 'object' && r[k] !== null ? JSON.stringify(r[k]) : (r[k] ?? ''),
      ),
    ),
  ]
    .map((r) => r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
