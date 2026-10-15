/**
 * Punto de entrada de F1BRE. index.html carga este archivo como módulo ES.
 * Orden: preparar controles → conectar eventos → mostrar ruta → consultar temporada.
 */
import { initializeControls, bindEvents } from './controllers/app-controller.js';
import { renderRoute } from './router/router.js';
import { loadYear } from './features/sessions.js';

initializeControls();
bindEvents();
renderRoute();
loadYear();
