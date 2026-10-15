/** Home: portal deportivo compacto. Presenta datos cargados; no hace consultas HTTP. */
import { state } from '../state/store.js';
import { $, RaceData, escapeHtml, getTeamColor } from '../utils/dom.js';
import { html } from '../utils/html.js';

let standingsMode = 'drivers';
let expandedResults = false;
let selectRace = () => {};

/** El controlador proporciona la selección de carrera para evitar imports circulares. */
export function configureHomeActions(actions) {
  selectRace = actions.selectRace;
}

/** Mantiene visible la carrera activa al entrar en Home o cambiar el tamaño de pantalla. */
export function centerSelectedRace() {
  if (!document.body.classList.contains('home-mode')) return;
  window.requestAnimationFrame(() => {
    const carousel = $('home-races');
    const selected = carousel.querySelector('[aria-pressed="true"]');
    if (!selected) return;
    // Solo mueve el carrusel: una respuesta progresiva no debe desplazar toda la página.
    carousel.scrollLeft +=
      selected.getBoundingClientRect().left -
      carousel.getBoundingClientRect().left -
      (carousel.clientWidth - selected.clientWidth) / 2;
  });
}

/** Nombres de archivo locales, compatibles con los assets aportados por el usuario. */
function assetName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function orderedResults() {
  return [...(state.data.session_result || [])].sort(
    (a, b) => (a.position ?? 999) - (b.position ?? 999),
  );
}

/** Duración del ganador en h:mm:ss; los otros pilotos conservan su gap o estado real. */
function resultTime(result) {
  if (result.dsq) return 'DSQ';
  if (result.dns) return 'DNS';
  if (result.dnf) return 'DNF';
  if (result.position === 1 && RaceData.number(result.duration)) {
    const hours = Math.floor(result.duration / 3600),
      minutes = Math.floor((result.duration % 3600) / 60),
      seconds = (result.duration % 60).toFixed(3).padStart(6, '0');
    return `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`;
  }
  return RaceData.number(result.gap_to_leader)
    ? `+${result.gap_to_leader.toFixed(3)}`
    : result.gap_to_leader || '—';
}

function driverLabel(driver) {
  return driver?.full_name || 'Driver unavailable';
}

/** Cada enlace deportivo abre el perfil; no se necesita volver a consultar la API. */
function bindHomeProfiles(container = $('home')) {
  container.querySelectorAll('[data-driver-profile]').forEach(
    (button) =>
      (button.onclick = () => {
        location.hash = `driver/${button.dataset.driverProfile}`;
      }),
  );
  container.querySelectorAll('[data-team-profile]').forEach(
    (button) =>
      (button.onclick = () => {
        location.hash = `team/${encodeURIComponent(button.dataset.teamProfile)}`;
      }),
  );
}

/** La foto es opcional: intenta JPG y PNG locales; nunca genera o descarga una imagen. */
function configureRacePhoto() {
  const photo = $('home-race-photo');
  photo.hidden = true;
  photo.onload = () => {
    photo.hidden = false;
    $('home-photo-placeholder').hidden = true;
  };
  photo.onerror = () => {
    if (photo.dataset.format === 'jpg') {
      photo.dataset.format = 'png';
      photo.src = `assets/races/${assetName(state.session.circuit_short_name)}.png`;
    } else {
      photo.hidden = true;
      $('home-photo-placeholder').hidden = false;
    }
  };
  photo.dataset.format = 'jpg';
  photo.alt = `${state.session.circuit_short_name} race photograph`;
  photo.src = `assets/races/${assetName(state.session.circuit_short_name)}.jpg`;
}

/** La cabecera usa el nombre real de /meetings cuando está disponible. */
function renderRaceHeader() {
  const race = state.session,
    meeting = (state.data.meetings || [])[0],
    winnerResult = orderedResults().find(
      (result) => result.position === 1 && !result.dsq && !result.dns,
    ),
    winner = state.drivers.find((driver) => driver.driver_number === winnerResult?.driver_number),
    weather = (state.data.weather || []).at(-1);
  $('home-race-context').textContent =
    `${race.year} SEASON · ${race.circuit_short_name.toUpperCase()}`;
  $('home-race-title').textContent = (meeting?.meeting_name || race.circuit_short_name).replace(
    /Grand Prix$/i,
    'GP',
  );
  $('home-race-date').textContent = new Date(race.date_start).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  $('home-race-meta').innerHTML =
    html` ${winner ? html`<button class="home-meta-chip winner-chip" data-driver-profile="${winner.driver_number}" style="--team-color:${getTeamColor(winner)}"><span>Winner</span><strong>${escapeHtml(driverLabel(winner))}</strong><i aria-hidden="true"></i></button>` : html`<span class="home-meta-chip">Result unavailable</span>`}
      <span class="home-meta-chip"
        >${RaceData.number(weather?.air_temperature) ? `${weather.air_temperature.toFixed(0)}°C` : '—'}<span
          class="chip-divider"
        ></span
        >${weather?.rainfall === 0 ? 'No rain' : weather?.rainfall === 1 ? 'Rain' : 'Weather unavailable'}</span
      >
      <span class="home-meta-chip completed-chip">Completed</span>`;
  $('home-photo-circuit').textContent = race.circuit_short_name.toUpperCase();
  $('home-photo-location').textContent = race.country_name;
  configureRacePhoto();
}

/** Carrusel histórico: solo carreras finalizadas de la temporada, sin inventar rondas. */
function renderRaceCarousel() {
  $('home-races').innerHTML = state.sessions
    .map((race) => {
      const active = race.session_key === state.session.session_key,
        date = new Date(race.date_start).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          timeZone: 'UTC',
        });
      return html`<button
        class="home-race-card ${active ? 'selected' : ''}"
        data-race-session="${race.session_key}"
        aria-pressed="${active}"
      >
        <span class="race-card-top"
          ><span>${escapeHtml(date)}</span
          ><span class="country-tag"
            >${escapeHtml(race.country_code || race.country_name)}</span
          ></span
        ><strong>${escapeHtml(race.circuit_short_name)}</strong
        ><small>${active ? 'Selected race' : 'View results'}</small>
      </button>`;
    })
    .join('');
  $('home-races')
    .querySelectorAll('[data-race-session]')
    .forEach((button) => {
      button.onclick = () => {
        if (!state.busy && Number(button.dataset.raceSession) !== state.session.session_key)
          selectRace(button.dataset.raceSession);
      };
    });
  centerSelectedRace();
}

/** Resultados de carrera: el tiempo no se confunde con puntos acumulados de campeonato. */
function renderResults() {
  const rows = orderedResults(),
    visibleRows = expandedResults ? rows : rows.slice(0, 8);
  $('home-results-circuit').textContent = state.session.circuit_short_name;
  $('home-result-rows').innerHTML =
    visibleRows
      .map((result) => {
        const driver = state.drivers.find(
            (driver) => driver.driver_number === result.driver_number,
          ),
          color = driver ? getTeamColor(driver) : '#9da3ae';
        return html`<tr>
          <td class="home-position">${result.position ?? '—'}</td>
          <td class="home-number">${result.driver_number}</td>
          <td>
            <button class="home-driver-link" data-driver-profile="${result.driver_number}">
              <i style="background:${color}" aria-hidden="true"></i
              >${escapeHtml(driverLabel(driver))}
            </button>
          </td>
          <td class="home-team-cell">${escapeHtml(driver?.team_name || '—')}</td>
          <td class="home-number">${result.number_of_laps ?? '—'}</td>
          <td class="home-time">${escapeHtml(resultTime(result))}</td>
        </tr>`;
      })
      .join('') ||
    '<tr><td colspan="6" class="home-empty">No results available for this session.</td></tr>';
  $('home-expand-results').hidden = rows.length <= 8;
  $('home-expand-results').textContent = expandedResults
    ? 'Show top 8 ↑'
    : `All ${rows.length} results ↓`;
  $('home-expand-results').onclick = () => {
    expandedResults = !expandedResults;
    renderResults();
    bindHomeProfiles($('home-results-panel'));
  };
}

/** Alterna pilotos/equipos usando los dos datasets de campeonato ya cargados. */
function renderStandings() {
  document.querySelectorAll('[data-home-standings]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.homeStandings === standingsMode));
    button.onclick = () => {
      standingsMode = button.dataset.homeStandings;
      renderStandings();
    };
  });
  const driverMode = standingsMode === 'drivers',
    rows = [...(state.data[driverMode ? 'championship_drivers' : 'championship_teams'] || [])]
      .sort((a, b) => (a.position_current ?? 999) - (b.position_current ?? 999))
      .slice(0, 6);
  $('home-championship').innerHTML =
    rows
      .map((row) => {
        const driver = state.drivers.find((driver) =>
            driverMode
              ? driver.driver_number === row.driver_number
              : driver.team_name === row.team_name,
          ),
          name = driverMode ? driverLabel(driver) : row.team_name,
          team = driver?.team_name || row.team_name,
          color = driver ? getTeamColor(driver) : '#8d956e',
          target = driverMode
            ? `data-driver-profile="${row.driver_number}"`
            : `data-team-profile="${escapeHtml(team)}"`;
        return html`<button class="home-standing-row" ${target} style="--team-color:${color}">
          <span class="standing-rank">${row.position_current ?? '—'}</span
          ><span class="standing-team-mark" aria-hidden="true"></span
          ><span class="standing-name"
            ><strong>${escapeHtml(name)}</strong
            ><small
              >${escapeHtml(
                driverMode
                  ? team
                  : state.drivers
                      .filter((driver) => driver.team_name === team)
                      .map((driver) => driver.name_acronym)
                      .join(' / '),
              )}</small
            ></span
          ><span class="standing-points"
            >${RaceData.number(row.points_current) ? row.points_current : '—'}
            <small>PTS</small></span
          >
        </button>`;
      })
      .join('') || '<p class="home-empty">Championship data unavailable for this race.</p>';
  $('home-standing-link').href = driverMode ? '#drivers' : '#teams';
  $('home-standing-link').textContent = driverMode ? 'Explore drivers →' : 'Explore teams →';
  bindHomeProfiles($('home-championship'));
}

/** Stints de los seis primeros pilotos con datos. La escala usa vueltas observadas. */
function renderTyres() {
  const maxLap = Math.max(1, ...(state.data.laps || []).map((lap) => lap.lap_number || 0)),
    results = orderedResults()
      .filter((result) => !result.dns)
      .slice(0, 6);
  $('home-tyre-rows').innerHTML =
    results
      .map((result) => {
        const driver = state.drivers.find(
          (driver) => driver.driver_number === result.driver_number,
        );
        if (!driver) return '';
        const stints = RaceData.stats(driver, state.data).stints;
        return html`<div class="home-tyre-row">
          <button data-driver-profile="${driver.driver_number}">
            ${escapeHtml(driver.last_name || driver.name_acronym)}
          </button>
          <div
            class="home-tyre-track"
            role="img"
            aria-label="${escapeHtml(driverLabel(driver))}: ${escapeHtml(stints.map((stint) => `${stint.compound || 'unknown'}, laps ${stint.lap_start} to ${stint.lap_end}`).join('; ') || 'No stint data')}"
          >
            ${stints
              .map((stint) => {
                if (!RaceData.number(stint.lap_start) || !RaceData.number(stint.lap_end)) return '';
                const compound = String(stint.compound || 'unknown').toLowerCase(),
                  cls = ['soft', 'medium', 'hard', 'intermediate', 'wet'].includes(compound)
                    ? compound
                    : 'unknown';
                return html`<span
                  class="home-tyre-segment ${cls}"
                  style="left:${((stint.lap_start - 1) / maxLap) * 100}%;width:${(Math.max(0, stint.lap_end - stint.lap_start + 1) / maxLap) * 100}%"
                  title="${escapeHtml(stint.compound || 'Unknown')} · L${stint.lap_start}–${stint.lap_end}"
                ></span>`;
              })
              .join('')}
          </div>
        </div>`;
      })
      .join('') || '<p class="home-empty">No stint data available.</p>';
  $('home-tyre-scale').innerHTML = [1, Math.round(maxLap / 2), maxLap]
    .map((lap) => `<span>L${lap}</span>`)
    .join('');
}

/** Meteo de la última observación, con timestamp explícito y unidades del proveedor. */
function renderConditions() {
  const weather = (state.data.weather || []).at(-1);
  $('home-conditions').innerHTML = [
    [
      'TRACK',
      RaceData.number(weather?.track_temperature)
        ? `${weather.track_temperature.toFixed(1)}°C`
        : '—',
    ],
    [
      'AIR',
      RaceData.number(weather?.air_temperature) ? `${weather.air_temperature.toFixed(1)}°C` : '—',
    ],
    ['HUMIDITY', RaceData.number(weather?.humidity) ? `${weather.humidity.toFixed(0)}%` : '—'],
    ['WIND', RaceData.number(weather?.wind_speed) ? `${weather.wind_speed.toFixed(1)} m/s` : '—'],
  ]
    .map(([label, value]) => html`<div><small>${label}</small><strong>${value}</strong></div>`)
    .join('');
  $('home-weather-time').textContent = weather?.date
    ? `Last observation · ${new Date(weather.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`
    : 'Weather unavailable';
}

export function renderHome() {
  if (!state.session) return;
  renderRaceHeader();
  renderRaceCarousel();
  renderResults();
  renderStandings();
  renderTyres();
  renderConditions();
  bindHomeProfiles();
  $('home-races-prev').onclick = () => $('home-races').scrollBy({ left: -420, behavior: 'smooth' });
  $('home-races-next').onclick = () => $('home-races').scrollBy({ left: 420, behavior: 'smooth' });
}

/** Limpia las mediciones anteriores mientras se carga otra carrera. */
export function clearHome() {
  $('home-results-circuit').textContent = '';
  $('home-photo-placeholder').hidden = false;
  $('home-photo-circuit').textContent = 'SELECTED RACE';
  $('home-photo-location').textContent = 'Loading session…';
  $('home-race-date').textContent = '';
  $('home-weather-time').textContent = '';
  $('home-tyre-scale').replaceChildren();
  $('home-expand-results').hidden = true;
  $('home-race-title').textContent = 'Loading race…';
  $('home-race-context').textContent = 'HISTORICAL FORMULA 1';
  $('home-race-meta').replaceChildren();
  $('home-race-photo').hidden = true;
  $('home-result-rows').innerHTML =
    '<tr><td colspan="6" class="home-empty">Loading race results…</td></tr>';
  for (const id of ['home-championship', 'home-tyre-rows', 'home-conditions'])
    $(id).innerHTML = '<p class="home-empty">Loading race data…</p>';
}
