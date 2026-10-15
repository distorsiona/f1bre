import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineChart } from '../src/ui/line-chart.js';

test('el gráfico contiene las curvas y ejes dentro de un único SVG', () => {
  const markup = renderLineChart(
    [
      {
        color: '#ff8700',
        points: [
          { lap: 1, value: 90 },
          { lap: 2, value: 89 },
        ],
      },
    ],
    'Race pace',
  );
  assert.equal((markup.match(/<svg\b/g) || []).length, 1);
  assert.equal((markup.match(/<\/svg>/g) || []).length, 1);
  assert.ok(markup.indexOf('<polyline') < markup.indexOf('</svg>'));
  assert.ok(markup.indexOf('<line') < markup.indexOf('</svg>'));
  assert.match(markup, /90|89/);
});
