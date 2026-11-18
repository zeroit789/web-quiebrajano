/*
 * server.js — Servidor local para ver la web con las mismas cabeceras que en Cloudflare Pages.
 * server.js — Local server to view the site with the same headers as on Cloudflare Pages.
 *
 * Solo usa módulos nativos de Node y escucha únicamente en 127.0.0.1. Lee las cabeceras de _headers,
 * no sale nunca de la carpeta de la web, no sirve nada que empiece por «.» y responde 404.html si falta.
 * Uses Node built-in modules only and listens on 127.0.0.1 only. Reads the headers from _headers,
 * never leaves the site folder, never serves anything starting with "." and answers 404.html if missing.
 * Uso / Usage:  node server.js [puerto]   (por defecto / default 8080)
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = fs.realpathSync(__dirname);
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
      // HSTS y upgrade-insecure-requests no tienen sentido en http://localhost. / Pointless on http://localhost.
      if (dentro && m && m[1] !== 'Strict-Transport-Security') cab[m[1]] = m[2].replace('; upgrade-insecure-requests', '');
    }
  } catch (e) { /* sin _headers / no _headers */ }
  return cab;
}
const CABECERAS = leerCabeceras();

// Respuesta de texto simple con las cabeceras de seguridad. / Plain-text reply with the security headers.
function responder(res, codigo, texto) {
  res.writeHead(codigo, { ...CABECERAS, 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(texto);
}

// Devuelve la ruta real del fichero pedido o null si no se puede servir. / Real path of the requested file, or null.
function resolver(rutaUrl) {
  const partes = rutaUrl.split('/').filter(Boolean);
  // Nada que empiece por «.» (.git, .local, .taste-skill…). / Nothing starting with "." (.git, .local…).
  if (partes.some((p) => p.startsWith('.'))) return null;
  let candidato = path.join(RAIZ, ...partes);
  try {
    if (fs.statSync(candidato).isDirectory()) candidato = path.join(candidato, 'index.html');
    const real = fs.realpathSync(candidato);
    // Debe quedar dentro de la raíz, sin «..» ni ruta absoluta. / Must stay inside the root.
    const rel = path.relative(RAIZ, real);
    if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
    if (rel.split(path.sep).some((p) => p.startsWith('.'))) return null;
    return fs.statSync(real).isFile() ? real : null;
  } catch (e) {
    return null;
  }
}

// Atiende cada petición; cualquier error interno responde 500 sin tumbar el servidor.
// Serves each request; any internal error answers 500 without bringing the server down.
const servidor = http.createServer((req, res) => {
  try {
    let ruta;
    try {
      ruta = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    } catch (e) {
      return responder(res, 400, 'Petición mal formada.');
    }
    if (ruta.includes('\0')) return responder(res, 400, 'Petición mal formada.');
    const fichero = resolver(ruta);
    if (!fichero) {
      const pagina404 = resolver('/404.html');
      res.writeHead(404, { ...CABECERAS, 'Content-Type': TIPOS['.html'] });
      return res.end(pagina404 ? fs.readFileSync(pagina404) : 'No encontrado.');
    }
    fs.readFile(fichero, (err, datos) => {
      if (err) return responder(res, 500, 'Error al leer el fichero.');
      res.writeHead(200, { ...CABECERAS, 'Content-Type': TIPOS[path.extname(fichero)] || 'application/octet-stream' });
      res.end(datos);
    });
  } catch (e) {
    if (!res.headersSent) responder(res, 500, 'Error interno.');
    else res.end();
  }
});
servidor.on('clientError', (err, socket) => { socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'); });
servidor.listen(PUERTO, '127.0.0.1', () => console.log(`Cortijo Quiebrajano en http://127.0.0.1:${PUERTO}/`));
