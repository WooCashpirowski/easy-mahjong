import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const root = process.argv.includes('--dist') ? resolve(projectRoot, 'dist') : projectRoot;
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json; charset=utf-8' };

const server = http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.slice(root.length + 1).replaceAll(sep, '/');
    const allowed = ['index.html', 'styles.css', 'favicon.svg', 'manifest.webmanifest', 'sw.js'].includes(relative) ||
      (relative.startsWith('src/') && extname(path) === '.js') ||
      (relative.startsWith('icons/') && extname(path) === '.png');
    if (!path.startsWith(root + sep) || !allowed) {
      response.writeHead(404).end('Nie znaleziono pliku.');
      return;
    }
    const content = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404).end('Nie znaleziono pliku.');
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} jest zajęty. Ustaw PORT, aby wybrać inny.` : error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => console.log(`Mahjong: http://${host === '127.0.0.1' ? 'localhost' : host}:${server.address().port}`));
