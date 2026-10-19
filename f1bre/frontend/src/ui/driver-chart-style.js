/** Identidad de curvas por piloto: mismo equipo, distinto tono y trazo.
 * Ordenar por numero mantiene el estilo estable al filtrar o reordenar resultados.
 * Solo afecta a los graficos; no modifica el color oficial de tarjetas o perfiles. */
export function driverChartStyle(driver, drivers) {
  const teammates = drivers
    .filter((item) => item.team_name === driver.team_name)
    .slice()
    .sort((a, b) => Number(a.driver_number) - Number(b.driver_number));
  const index = Math.max(
    0,
    teammates.findIndex((item) => item.driver_number === driver.driver_number),
  );
  const base = /^[0-9a-f]{6}$/i.test(driver.team_colour || '') ? driver.team_colour : '641f32';
  // El segundo piloto conserva el matiz pero usa un tono notablemente mas oscuro.
  const factor = index === 0 ? 0.92 : Math.max(0.35, 0.56 - (index - 1) * 0.12);
  const color =
    '#' +
    base
      .match(/.{2}/g)
      .map((channel) =>
        Math.round(parseInt(channel, 16) * factor)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');
  return { color, dashArray: index === 0 ? '' : '7 4' };
}
