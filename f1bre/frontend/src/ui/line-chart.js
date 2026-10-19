import { html } from '../utils/html.js';
/** Dibujos SVG reutilizables. Sus entradas ya deben estar filtradas/calculadas. */
import { RaceData, escapeHtml } from '../utils/dom.js';
/** Genera un gráfico SVG a partir de puntos { lap, value }; no solicita datos externos. */
export function renderLineChart(lines, label, xLabel = 'Lap', unit = 's') {
  const all = lines
    .flatMap((l) => l.points)
    .filter((p) => RaceData.number(p.value) && RaceData.number(p.lap));
  if (!all.length) return '<p class="empty">No measurements available.</p>';
  const minX = Math.min(...all.map((p) => p.lap)),
    maxX = Math.max(...all.map((p) => p.lap)),
    minY = Math.min(...all.map((p) => p.value)),
    maxY = Math.max(...all.map((p) => p.value)),
    pad = Math.max((maxY - minY) * 0.12, 1),
    lo = minY - pad,
    hi = maxY + pad,
    x = (n) => 55 + ((n - minX) / Math.max(1, maxX - minX)) * 475,
    y = (n) => 180 - ((n - lo) / (hi - lo)) * 150;
  // El contenedor se crea completo al final: evita que el formateador cierre un SVG parcial.
  let svg = '';
  for (let i = 0; i < 5; i++) {
    const v = lo + ((hi - lo) * i) / 4;
    svg += html`<line
        x1="55"
        x2="530"
        y1="${y(v)}"
        y2="${y(v)}"
        stroke="#d4d5cc"
        stroke-dasharray="3 5"
      /><text x="2" y="${y(v) + 4}">${v.toFixed(1)}</text>`;
    const axis = minX + ((maxX - minX) * i) / 4;
    svg += html`<text x="${x(axis)}" y="205" text-anchor="middle"
      >${axis.toFixed(xLabel === 'Lap' ? 0 : 1)}</text
    >`;
  }
  for (const line of lines) {
    const points = line.points.filter((p) => RaceData.number(p.value) && RaceData.number(p.lap));
    if (points.length)
      svg += `<polyline points="${points.map((p) => `${x(p.lap)},${y(p.value)}`).join(' ')}" fill="none" stroke="${line.color}" stroke-width="2"${line.dashArray ? ` stroke-dasharray="${escapeHtml(line.dashArray)}"` : ''}><title>${escapeHtml(line.label || label)}</title></polyline><circle cx="${x(points[0].lap)}" cy="${y(points[0].value)}" r="2" fill="${line.color}"/>`;
  }
  return html`<svg viewBox="0 0 560 225" role="img" aria-label="${escapeHtml(label)}">
    <title>${escapeHtml(label)}</title>
    ${svg}
    <text x="300" y="223" text-anchor="middle">${escapeHtml(xLabel)} · ${escapeHtml(unit)}</text>
  </svg>`;
}
