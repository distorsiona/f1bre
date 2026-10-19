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

import { driverChartStyle } from '../src/ui/driver-chart-style.js';
test('los companeros conservan tonos distintos y estables al reordenar pilotos', () => {
  for (const team_colour of ['4781D7', '00D2BE', 'FF8000', 'EF1A2D', '00FF00']) {
    const drivers = [1, 6].map((driver_number) => ({
      driver_number,
      team_name: 'Team',
      team_colour,
    }));
    const first = driverChartStyle(drivers[0], drivers);
    const second = driverChartStyle(drivers[1], drivers);
    assert.notEqual(first.color, second.color);
    assert.notEqual(first.dashArray, second.dashArray);
    assert.deepEqual(second, driverChartStyle(drivers[1], [...drivers].reverse()));
    const markup = renderLineChart(
      [{ ...second, label: 'Second driver', points: [{ lap: 1, value: 90 }] }],
      'Pace',
    );
    assert.ok(markup.includes(`stroke="${second.color}"`));
    assert.ok(markup.includes('stroke-dasharray="7 4"'));
    assert.ok(markup.includes('Second driver'));
  }
});
