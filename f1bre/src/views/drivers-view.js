/** Vista Drivers: listado, búsqueda local y acceso a perfiles. */
import { $ } from '../utils/dom.js';
import { state } from '../state/store.js';
import { sortedDrivers } from '../state/entity-selectors.js';
import { driverRow, bindProfiles } from '../ui/components/entities.js';
export function renderDriverList() {
  const search = $('driver-search').value.toLowerCase().trim(),
    list = sortedDrivers().filter((d) =>
      `${d.full_name} ${d.team_name} ${d.driver_number}`.toLowerCase().includes(search),
    );
  $('driver-list').innerHTML = list.length
    ? list.map((d) => driverRow(d, true)).join('')
    : '<p class="empty">No drivers match your search.</p>';
  $('driver-count').textContent =
    `${list.length} drivers · ${state.session?.year || ''} · Selected race entry list`;
  $('drivers-context').textContent = state.session
    ? `${state.session.circuit_short_name} · ${state.session.date_start.slice(0, 10)} · Championship at selected race`
    : 'Choose a completed race';
  bindProfiles($('drivers'));
}
export function clearDrivers() {
  $('driver-list').innerHTML = '<p class="empty">Loading selected race…</p>';
  $('driver-count').textContent = 'Loading drivers…';
  $('drivers-context').textContent = 'Loading selected race…';
}
