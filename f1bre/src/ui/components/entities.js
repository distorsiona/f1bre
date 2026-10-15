/** Componentes compartidos: retratos, logos, filas, colores y enlaces a perfiles.
 * Cada vista entrega su raíz para no modificar elementos de otras pantallas. */
import { html } from '../../utils/html.js';
import { RaceData, escapeHtml, getTeamColor } from '../../utils/dom.js';
import { state } from '../../state/store.js';
import { standing, points } from '../../state/entity-selectors.js';
export const slug = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export function teamSlug(name) {
  const n = name.toLowerCase();
  return n.includes('red bull')
    ? 'redbull'
    : n.includes('racing bulls') || n === 'rb'
      ? 'racingbulls'
      : n.includes('sauber')
        ? 'sauber'
        : n.includes('haas')
          ? 'haas'
          : n.includes('aston')
            ? 'astonmartin'
            : slug(name);
}

export function portrait(d, large = false) {
  return html`<div class="portrait">
    <span class="initials" aria-hidden="true"
      >${escapeHtml(d.name_acronym || '#' + d.driver_number)}</span
    ><img
      src="assets/drivers/${slug(d.last_name || d.full_name.split(' ').at(-1))}${large ? 'F' : ''}.png"
      alt="${escapeHtml(d.full_name)}"
      loading="lazy"
      data-portrait="${large ? 'large' : 'small'}"
    />
  </div>`;
}

export function logo(name, cls = 'mini-logo') {
  return html`<img
    class="${cls}"
    src="assets/teams/${teamSlug(name)}.png"
    alt="${escapeHtml(name)} logo"
    loading="lazy"
    data-logo
  />`;
}

export function entityPalette(driver) {
  const background = getTeamColor(driver),
    rgb = background
      .slice(1)
      .match(/.{2}/g)
      .map((v) => parseInt(v, 16) / 255),
    linear = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)),
    luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  const whiteContrast = 1.05 / (luminance + 0.05),
    darkContrast = (luminance + 0.05) / (0.0056 + 0.05),
    light = whiteContrast >= darkContrast;
  return {
    background,
    foreground: light ? '#ffffff' : '#111111',
    line: light ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.2)',
  };
}

export function applyEntityColors(root) {
  root
    .querySelectorAll('[data-driver-profile],[data-team-profile],[data-entity-team]')
    .forEach((el) => {
      const driver = el.dataset.driverProfile
        ? state.drivers.find((d) => String(d.driver_number) === el.dataset.driverProfile)
        : state.drivers.find(
            (d) => d.team_name === (el.dataset.teamProfile || el.dataset.entityTeam),
          );
      if (!driver) return;
      const palette = entityPalette(driver);
      el.style.setProperty('--team-color', palette.background);
      el.style.setProperty('--team-ink', palette.foreground);
      el.style.setProperty('--team-line', palette.line);
    });
}

export function imageFallbacks(root) {
  root.querySelectorAll('img[data-portrait],img[data-logo],img[data-car]').forEach((img) => {
    const loaded = () => {
      if (img.hasAttribute('data-car'))
        img.parentElement.querySelector('[data-car-placeholder]')?.setAttribute('hidden', '');
      if (img.previousElementSibling?.classList.contains('team-monogram'))
        img.previousElementSibling.hidden = true;
      if (img.dataset.portrait) {
        const initials = img.parentElement.querySelector('.initials');
        if (initials) initials.hidden = true;
        img.parentElement.classList.remove('missing');
      }
    };
    img.onload = loaded;
    img.onerror = () => {
      if (img.dataset.portrait === 'large' && !img.dataset.tried) {
        img.dataset.tried = '1';
        img.src = img.src.replace(/F\.png$/, '.png');
        return;
      }
      img.hidden = true;
      if (img.dataset.portrait) img.parentElement.classList.add('missing');
      if (
        img.hasAttribute('data-car') &&
        !img.dataset.noted &&
        !img.parentElement.querySelector('[data-car-placeholder]')
      ) {
        img.dataset.noted = '1';
        const note = document.createElement('p');
        note.className = 'context';
        note.textContent = 'Car image pending.';
        img.after(note);
      }
    };
    if (img.complete) {
      if (img.naturalWidth) loaded();
      else img.onerror();
    }
  });
}

export function driverRow(d, showRank = false) {
  const s = standing(d);
  return html`<button
    class="driver-row"
    data-driver-profile="${d.driver_number}"
    aria-label="Open ${escapeHtml(d.full_name)} profile"
  >
    ${showRank ? html`<span class="driver-rank"><span class="sr-only">Championship position </span>${s?.position_current ?? '—'}</span>` : ''}
    <span class="driver-logo">${logo(d.team_name)}</span
    ><span class="driver-number">${d.driver_number}</span>${portrait(d)}<span class="driver-info"
      ><strong>${escapeHtml(d.full_name)}</strong><small>${escapeHtml(d.team_name)}</small></span
    ><span class="driver-points">${points(s?.points_current)}<small>POINTS</small></span
    ><span class="row-arrow" aria-hidden="true">→</span>
  </button>`;
}

export function bindProfiles(root) {
  applyEntityColors(root);
  root.querySelectorAll('[data-driver-profile]').forEach(
    (el) =>
      (el.onclick = () => {
        location.hash = `driver/${el.dataset.driverProfile}`;
      }),
  );
  root.querySelectorAll('[data-team-profile]').forEach(
    (el) =>
      (el.onclick = () => {
        location.hash = `team/${encodeURIComponent(el.dataset.teamProfile)}`;
      }),
  );
  imageFallbacks(root);
}
