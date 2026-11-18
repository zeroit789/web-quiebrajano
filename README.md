# Cortijo Quiebrajano — web de demostración / demo website

[Español](#español) · [English](#english)

---

## Español

### Qué es

Web completa del **Cortijo Quiebrajano**, un refugio rural de astroturismo **ficticio** en la Sierra Sur de Jaén. Es una plantilla de ejemplo del portfolio de [danimefle.com](https://danimefle.com): la marca, el cortijo, las personas, los precios, la dirección y el correo (`reservas@quiebrajano.example`) son inventados. La Sierra Sur de Jaén, la sierra de Quiebrajano, la Pandera y la certificación Starlight de la comarca son reales; el cortijo no.

La parte viva de la web calcula en el navegador la fase de la Luna y las horas de cielo de verdad oscuro de cada noche (Sol más de 18° bajo el horizonte y Luna puesta) para la latitud del refugio, con el método de Paul Schlyter. No hay servidor ni base de datos.

### Páginas

| Página | Contenido |
| --- | --- |
| `index.html` | Portada: cielo a sangre, la Luna de esta noche, el cielo por estaciones, habitaciones, una noche aquí, «Elige tu noche», precios y cómo llegar. |
| `habitaciones.html` | Las cuatro habitaciones con su lámina, datos, lo que se ve desde la cama y precio. |
| `observacion.html` | Telescopio, cómo es una sesión, calendario lunar del mes (interactivo), lluvias de estrellas de 2027 y precios. |
| `sobre-nosotros.html` | Historia del cortijo, quién lo lleva, el lugar y cómo trabajan. |
| `contacto.html` | Formulario de reserva de demostración (no envía nada: prepara un correo), horario y mapa dibujado. |
| `aviso-legal.html`, `privacidad.html`, `cookies.html` | Textos legales de la web de demostración. |
| `creditos.html` | Autor y licencia de cada imagen, el vídeo, la tipografía y los datos. |
| `404.html` | Página de error. |

### Tecnología

- HTML, CSS y JavaScript sin paso de compilación ni librerías.
- Tipografía Schibsted Grotesk (SIL Open Font License 1.1, ficheros woff2 v7 de Google Fonts) servida desde `assets/fonts/`.
- Analítica con Plausible sin cookies (`analytics.danimefle.com`).
- `server.js` opcional para verla en local: solo usa módulos nativos de Node (probado con Node 24.22.2).

### Verla en local

```bash
node server.js 8080
# abre http://127.0.0.1:8080/
```

El servidor manda las mismas cabeceras de seguridad que `_headers` (menos HSTS, que no tiene sentido en `http://localhost`). También se puede abrir `index.html` directamente desde el disco.

### Desplegar en Cloudflare Pages

1. Crea un proyecto de Pages y súbelo sin paso de compilación (directorio de salida: la raíz).
2. O desde la terminal, con Wrangler 4.164.0: `npx wrangler@4.164.0 pages deploy . --project-name quiebrajano`.
3. `_headers` aplica la CSP, HSTS, `nosniff`, `Referrer-Policy` y `Permissions-Policy`. `404.html` se usa sola para las rutas que no existen.

Antes de subir, excluye lo que no es de la web: las capturas `captura-*.png`, `README.md`, `LICENSE`, `NOTICE.md`, `CREDITOS.md` y `server.js` no hacen falta en producción (no pasa nada si se suben).

### Cómo adaptarla

- **Textos**: están en cada `.html`. La cabecera y el pie se repiten en todas las páginas; si cambias un enlace, cámbialo en todas.
- **Colores y tamaños**: variables al principio de `assets/css/estilo.css` (`--bg`, `--ink`, `--accent`, `--step-*`, `--lado`).
- **Imágenes**: en `assets/img/` (WebP). Las imágenes para redes están en `assets/og/` (1200 × 630).
- **Lugar del cálculo lunar**: `LUGAR` en `assets/js/cielo.js` (latitud, longitud y zona horaria).
- **URL**: la base `https://quiebrajano.danimefle.com` solo aparece en `canonical`, `og:url`, `og:image`, `twitter:image`, el JSON-LD, `robots.txt` y `sitemap.xml`. Los enlaces internos son relativos.
- **Para un negocio real**: quita `<meta name="robots" content="noindex, follow">` de cada página, cambia los datos de ejemplo, revisa los textos legales con tus datos y valora añadir datos estructurados de negocio solo si la dirección es real.

### Créditos y licencias

- **Código**: licencia MIT (ver `LICENSE`). Los avisos sobre lo que no cubre (imágenes, tipografía y marca) están en [`NOTICE.md`](NOTICE.md).
- **Imágenes y vídeo**: dominio público, CC0, CC BY y CC BY-SA según cada una; lista completa en `creditos.html` y `CREDITOS.md`. Las versiones adaptadas de las CC BY-SA se comparten con la misma licencia.
- **Tipografía**: Schibsted Grotesk, de Bakken & Bæck y Henrik Kongsvoll, con licencia SIL Open Font License 1.1 (texto en `assets/fonts/OFL.txt`).
- **Datos**: listado de certificaciones de la Fundación Starlight (julio de 2026); método de cálculo de Paul Schlyter.

---

## English

### What it is

A complete website for **Cortijo Quiebrajano**, a **fictional** dark-sky rural refuge in the Sierra Sur de Jaén (Andalusia, Spain). It is a sample template from the [danimefle.com](https://danimefle.com) portfolio: the brand, the farmhouse, the people, the prices, the address and the email (`reservas@quiebrajano.example`) are made up. The Sierra Sur de Jaén, the Quiebrajano range, La Pandera and the area's Starlight certification are real; the farmhouse is not.

The live part of the site computes, in the browser, the Moon's phase and the hours of truly dark sky for each night (Sun more than 18° below the horizon and the Moon set) at the refuge's latitude, using Paul Schlyter's method. There is no server and no database.

### Pages

| Page | Content |
| --- | --- |
| `index.html` | Home: full-bleed sky, tonight's Moon, the sky by season, rooms, a night here, "Pick your night", prices and how to get there. |
| `habitaciones.html` | The four rooms with their plate, details, what you see from the bed and price. |
| `observacion.html` | Telescope, what a session is like, the month's lunar calendar (interactive), 2027 meteor showers and prices. |
| `sobre-nosotros.html` | The farmhouse's story, who runs it, the place and how they work. |
| `contacto.html` | Demo booking form (sends nothing: it prepares an email), arrival hours and a drawn map. |
| `aviso-legal.html`, `privacidad.html`, `cookies.html` | Legal pages for the demo site. |
| `creditos.html` | Author and licence of every image, the video, the typeface and the data. |
| `404.html` | Error page. |

### Technology

- HTML, CSS and JavaScript with no build step and no libraries.
- Schibsted Grotesk typeface (SIL Open Font License 1.1, Google Fonts v7 woff2 files) served from `assets/fonts/`.
- Cookie-free Plausible analytics (`analytics.danimefle.com`).
- Optional `server.js` to view it locally: Node built-in modules only (tested with Node 24.22.2).

### Run it locally

```bash
node server.js 8080
# open http://127.0.0.1:8080/
```

The server sends the same security headers as `_headers` (except HSTS, which makes no sense on `http://localhost`). You can also open `index.html` straight from disk.

### Deploy to Cloudflare Pages

1. Create a Pages project and upload it with no build step (output directory: the root).
2. Or from the terminal, with Wrangler 4.164.0: `npx wrangler@4.164.0 pages deploy . --project-name quiebrajano`.
3. `_headers` applies the CSP, HSTS, `nosniff`, `Referrer-Policy` and `Permissions-Policy`. `404.html` is used automatically for missing paths.

Files not needed in production: the `captura-*.png` screenshots, `README.md`, `LICENSE`, `NOTICE.md`, `CREDITOS.md` and `server.js` (uploading them does no harm).

### How to adapt it

- **Copy**: lives in each `.html` file. The header and footer are repeated on every page; change a link everywhere.
- **Colours and sizes**: variables at the top of `assets/css/estilo.css` (`--bg`, `--ink`, `--accent`, `--step-*`, `--lado`).
- **Images**: in `assets/img/` (WebP). Social images are in `assets/og/` (1200 × 630).
- **Location for the Moon maths**: `LUGAR` in `assets/js/cielo.js` (latitude, longitude and time zone).
- **URL**: the base `https://quiebrajano.danimefle.com` only appears in `canonical`, `og:url`, `og:image`, `twitter:image`, the JSON-LD, `robots.txt` and `sitemap.xml`. Internal links are relative.
- **For a real business**: remove `<meta name="robots" content="noindex, follow">` from every page, replace the sample data, rewrite the legal pages with your details and only add business structured data if the address is real.

### Credits and licences

- **Code**: MIT licence (see `LICENSE`). Notices on what it does not cover (images, typeface and brand) are in [`NOTICE.md`](NOTICE.md).
- **Images and video**: public domain, CC0, CC BY and CC BY-SA depending on each one; full list in `creditos.html` and `CREDITOS.md`. Adapted versions of CC BY-SA works are shared under the same licence.
- **Typeface**: Schibsted Grotesk by Bakken & Bæck and Henrik Kongsvoll, under the SIL Open Font License 1.1 (text in `assets/fonts/OFL.txt`).
- **Data**: Fundación Starlight certification list (July 2026); calculation method by Paul Schlyter.
