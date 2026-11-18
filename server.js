/*
 * server.js — Servidor local para ver la web con las mismas cabeceras que en Cloudflare Pages.
 * server.js — Local server to view the site with the same headers as on Cloudflare Pages.
 *
 * Solo usa módulos nativos de Node. Lee las cabeceras de _headers y sirve 404.html si no existe la ruta.
 * Uses Node built-in modules only. Reads the headers from _headers and serves 404.html for missing paths.
 * Uso / Usage:  node server.js [puerto]   (por defecto / default 8080)
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = __dirname;
const PUERTO = Number(process.argv[2]) || 8080;

// Tipos de contenido por extensión. / Content types by extension.
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.webm': 'video/webm', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.md': 'text/plain; charset=utf-8'
};

// Lee las cabeceras del bloque «/*» de _headers. / Reads the headers of the "/*" block in _headers.
function leerCabeceras() {
  const cab = {};
  try {
    const lineas = fs.readFileSync(path.join(RAIZ, '_headers'), 'utf8').split(/\r?\n/);
    let dentro = false;
    for (const l of lineas) {
      if (/^\S/.test(l)) { dentro = l.trim() === '/*'; continue; }
      const m = l.match(/^\s+([^:]+):\s*(.+)$/);
      // HSTS y upgrade-insecure-requests no tienen sentido en http://localhost. / Skipped on http://localhost.
      if (dentro && m && m[1] !== 'Strict-Transport-Security') cab[m[1]] = m[2].replace('; upgrade-insecure-requests', '');
    }
  } catch (e) { /* sin _headers / no _headers */ }
  return cab;
}
const CABECERAS = leerCabeceras();

// Atiende cada petición sin salir de la carpeta. / Serves each request without leaving the folder.
http.createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta.endsWith('/')) ruta += 'index.html';
  const fichero = path.normalize(path.join(RAIZ, ruta));
  const dentro = fichero.startsWith(RAIZ) && !fichero.includes(`${path.sep}.`);
  fs.readFile(dentro ? fichero : '', (err, datos) => {
    if (err) {
      res.writeHead(404, { ...CABECERAS, 'Content-Type': TIPOS['.html'] });
      return res.end(fs.readFileSync(path.join(RAIZ, '404.html')));
    }
    res.writeHead(200, { ...CABECERAS, 'Content-Type': TIPOS[path.extname(fichero)] || 'application/octet-stream' });
    res.end(datos);
  });
}).listen(PUERTO, '127.0.0.1', () => console.log(`Cortijo Quiebrajano en http://127.0.0.1:${PUERTO}/`));
