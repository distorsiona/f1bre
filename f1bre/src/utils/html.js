/**
 * Etiqueta de templates HTML: permite que el formateador ordene el markup dentro de JS.
 * No es un sanitizador. Los datos externos deben pasar por escapeHtml antes de insertarse.
 */
export function html(strings, ...values) {
  return strings.reduce(
    (result, part, index) => result + part + (index < values.length ? values[index] : ''),
    '',
  );
}
