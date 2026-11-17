import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8080);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.json':'application/json'};
createServer((request, response) => {
  let path;
  try { path = resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`); }
  catch { response.writeHead(400).end(); return; }
  if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  if (path === root) path = resolve(root, 'index.html');
  try {
    if (!statSync(path).isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, {'Content-Type':mime[extname(path)] || 'application/octet-stream','Cache-Control':'no-cache'});
    if (request.method === 'HEAD') response.end(); else createReadStream(path).pipe(response);
  } catch { response.writeHead(404).end(); }
}).listen(port, '127.0.0.1', () => console.log(`Paris Love Story: http://127.0.0.1:${port}`));
