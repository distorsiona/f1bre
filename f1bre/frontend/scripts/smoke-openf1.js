/** Prueba opcional con la API real; no se ejecuta durante npm test. */
import { OpenF1 } from '../src/api/openf1-client.js';
import { F1Data as RaceData } from '../src/domain/race-data.js';
import { CORE_ENDPOINTS } from '../src/config/openf1.js';

try {
  const sessions = await OpenF1.query('sessions', {
    year: 2024,
    session_name: 'Race',
    country_name: 'Italy',
  });
  const race = sessions.find((session) => session.circuit_short_name === 'Monza');
  if (!race) throw Error('Monza session missing');
  const data = {};
  for (const endpoint of CORE_ENDPOINTS) {
    try {
      data[endpoint] = await OpenF1.query(
        endpoint,
        endpoint === 'meetings'
          ? { meeting_key: race.meeting_key }
          : { session_key: race.session_key },
      );
    } catch (error) {
      if (!['starting_grid', 'championship_drivers', 'championship_teams'].includes(endpoint))
        throw error;
      data[endpoint] = null;
      console.log(`Optional ${endpoint} unavailable: ${error.message}`);
    }
  }
  const driver = data.drivers.find((driver) => driver.driver_number === 4);
  if (!driver) throw Error('Driver missing');
  const stats = RaceData.stats(driver, data);
  if (!stats.clean.length || !stats.stints.length || !stats.pits?.length)
    throw Error('Missing core data');
  const lap = stats.clean.find((lap) => lap.date_start);
  const telemetry = await OpenF1.query('car_data', {
    session_key: race.session_key,
    driver_number: driver.driver_number,
    ...RaceData.lapWindow(lap),
  });
  if (!telemetry.length) throw Error('Missing telemetry');
  console.log(
    JSON.stringify(
      {
        session: race.session_key,
        counts: Object.fromEntries(
          Object.entries(data).map(([name, rows]) => [name, rows?.length ?? null]),
        ),
        driver: driver.full_name,
        pace: stats.pace,
        telemetrySamples: telemetry.length,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
