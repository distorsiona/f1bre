/** Compara los archivos trasladados con el respaldo previo sin restaurar ni escribir fuentes. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const snapshot = readFileSync(path.join(root, '.migration-backups/LATEST.txt'), 'utf8').trim();
const manifest = JSON.parse(readFileSync(path.join(snapshot, 'manifest.json'), 'utf8'));
let verified = 0;
for (const [name, record] of Object.entries(manifest)) {
  if (!/^(src|styles|assets|tests|scripts|proposals)\//.test(name) && name !== 'index.html')
    continue;
  const bytes = readFileSync(path.join(root, 'frontend', name));
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    record.sha256,
    `Contenido modificado: ${name}`,
  );
  verified++;
}
console.log(
  `${verified} archivos de aplicacion, estilos, imagenes y pruebas identicos al respaldo previo.`,
);
