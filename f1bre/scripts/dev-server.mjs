/** Servidor local sin dependencias: sirve exclusivamente frontend/ en el mismo origen.
 * Cache-Control evita versiones antiguas de los modulos durante el desarrollo.
 * No es un backend de inferencia ni un servidor de produccion. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const frontend = fileURLToPath(new URL('../frontend/', import.meta.url));
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8',
};
export function createFrontendServer() {
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      // Admite tambien enlaces abiertos mediante la entrada antigua de la raiz.
      if (pathname === '/frontend') {
        response.writeHead(302, { Location: '/frontend/' }).end();
        return;
      }
      if (pathname.startsWith('/frontend/')) pathname = pathname.slice('/frontend'.length);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const target = path.resolve(frontend, '.' + pathname);
      if (!target.startsWith(frontend) || pathname.includes('\\') || pathname.includes('\0')) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const content = await readFile(target);
      response.writeHead(200, {
        'Content-Type': mime[path.extname(target)] || 'application/octet-stream',
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      response
        .writeHead(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 400)
        .end('File unavailable');
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 4173);
  const server = createFrontendServer();
  server.on('error', (error) => {
    console.error(
      error.code === 'EADDRINUSE'
        ? `Puerto ${port} ocupado. Conserva el servidor actual o elige otro con PORT.`
        : error.message,
    );
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () =>
    console.log(`F1BRE: http://127.0.0.1:${port} (frontend/). Ctrl+C para detener.`),
  );
}
