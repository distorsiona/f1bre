import { SUPPORT_EMAIL } from '../../config/site.js';
import { setLanguage } from '../language.js';
/** Navbar compartido por todas las vistas.
 * Posee el HTML y el estado activo de navegacion; no consulta OpenF1.
 * Los selectores se crean una sola vez: app-controller conserva sus opciones y eventos.
 */
const template = `<header class="sidebar navbar">
      <a class="brand" href="#home" aria-label="F1BRE home">F1BRE<span>platform</span></a>
      <nav aria-label="Main navigation">
        <a href="#home" data-nav="home"><span class="nav-icon" aria-hidden="true">⌂</span>Home</a>
        <a href="#drivers" data-nav="drivers"
          ><span class="nav-icon" aria-hidden="true">▤</span>Drivers</a
        >
        <a href="#teams" data-nav="teams"
          ><span class="nav-icon" aria-hidden="true">▦</span>Teams</a
        >
        <a href="#overview" data-nav="overview"
          ><span class="nav-icon" aria-hidden="true">⌁</span>Race analysis</a
        >
      </nav>
<div class="session-toolbar navbar-session">
          <label>Season<select id="year"></select></label
          ><label><span class="navbar-field-label">Race</span><select id="race"></select></label
          >
        </div>
<div class="navbar-tools">
<button class="navbar-icon" id="language-toggle" type="button" aria-label="Choose language" title="Language" aria-haspopup="dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/></svg></button>
<button class="navbar-icon" id="support-toggle" type="button" aria-label="Contact support" title="Support" aria-haspopup="dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2a8 8 0 0116 0v2M4 12H3v6h4v-6H4zm16 0h1v6h-4v-6h3zm0 6v2h-7"/><path d="M10 20h3"/></svg></button>
</div>
<dialog id="language-dialog" class="navbar-dialog" aria-labelledby="language-title"><div class="navbar-dialog-heading"><h2 id="language-title">Choose language</h2><button type="button" data-close-dialog aria-label="Close">×</button></div><div class="language-options"><button type="button" data-language="en">English</button><button type="button" data-language="es">Español</button></div></dialog>
<dialog id="support-dialog" class="navbar-dialog" aria-labelledby="support-title"><div class="navbar-dialog-heading"><h2 id="support-title">Support</h2><button type="button" data-close-dialog aria-label="Close">×</button></div><p>For any suggestions or else, contact:</p><p id="support-email" data-no-translate></p></dialog>
</header>`;

/** Montaje idempotente: navegar nunca recrea selectores ni pierde su seleccion. */
export function mountNavbar() {
  const root = document.getElementById('navbar-root');
  if (!root || root.querySelector('.navbar')) return;
  root.innerHTML = template;
  const email = root.querySelector('#support-email');
  email.textContent = SUPPORT_EMAIL || '"email"';
  // Sin direccion configurada no se crea un enlace de correo ficticio.
  if (SUPPORT_EMAIL) {
    const link = document.createElement('a');
    link.href = 'mailto:' + SUPPORT_EMAIL;
    link.textContent = SUPPORT_EMAIL;
    email.replaceChildren(link);
  }
  for (const kind of ['language', 'support']) {
    const dialog = root.querySelector('#' + kind + '-dialog');
    root.querySelector('#' + kind + '-toggle').onclick = () => dialog.showModal();
    dialog.querySelector('[data-close-dialog]').onclick = () => dialog.close();
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      }
    });
  }
  root.querySelectorAll('[data-language]').forEach((button) => {
    button.onclick = () => {
      setLanguage(button.dataset.language);
      root.querySelector('#language-dialog').close();
    };
  });
}

/** El router entrega la ruta resuelta; los perfiles activan su listado correspondiente. */
export function updateNavbar(page) {
  const activePage = page === 'driver' ? 'drivers' : page === 'team' ? 'teams' : page;
  document.querySelectorAll('#navbar-root [data-nav]').forEach((link) => {
    const active = link.dataset.nav === activePage;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
