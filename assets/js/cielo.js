/*
 * cielo.js — Cálculos astronómicos del refugio Cortijo Quiebrajano (sin dependencias, sin DOM).
 * cielo.js — Astronomy maths for the Cortijo Quiebrajano refuge (no dependencies, no DOM).
 *
 * Posiciones del Sol y de la Luna con el método de Paul Schlyter («How to compute planetary positions»),
 * con las perturbaciones principales de la Luna y la paralaje topocéntrica. Precisión de pocos minutos de
 * arco: de sobra para saber la fase, cuándo sale y se pone la Luna y cuántas horas de cielo oscuro hay.
 * Sun and Moon positions with Paul Schlyter's method ("How to compute planetary positions"), with the main
 * lunar perturbations and topocentric parallax. A few arcminutes of accuracy: plenty to know the phase,
 * when the Moon rises and sets and how many hours of dark sky there are.
 *
 * Todo se calcula en UTC; la hora local se formatea con Intl en Europe/Madrid.
 * Everything is computed in UTC; local time is formatted with Intl in Europe/Madrid.
 */
(function (raiz) {
  'use strict';

  /* ---- Constantes y utilidades ----
     ---- Constants and helpers ---- */

  // Situación de cálculo: Sierra Sur de Jaén (aprox.), altitud ignorada.
  // Observer used for the maths: Sierra Sur de Jaén (approx.), altitude ignored.
  var LUGAR = { lat: 37.58, lon: -3.85, zona: 'Europe/Madrid' };
  var RAD = Math.PI / 180;
  var MES_SINODICO = 29.530588853;

  function sen(g) { return Math.sin(g * RAD); }
  function cos(g) { return Math.cos(g * RAD); }
  function atan2g(y, x) { return Math.atan2(y, x) / RAD; }
  // Normaliza un ángulo a 0–360. / Normalises an angle to 0–360.
  function rev(g) { return g - Math.floor(g / 360) * 360; }

  // Días desde 2000-01-00 0h UT (la época de Schlyter) a partir de una fecha JS.
  // Days since 2000 Jan 0.0 UT (Schlyter's epoch) from a JS Date.
  function diaSchlyter(fecha) {
    return fecha.getTime() / 86400000 + 2440587.5 - 2451543.5;
  }

  /* ---- Sol ----
     ---- Sun ---- */

  // Devuelve longitud eclíptica, anomalía media y longitud media del Sol para el día d.
  // Returns the Sun's ecliptic longitude, mean anomaly and mean longitude for day d.
  function sol(d) {
    var w = 282.9404 + 4.70935e-5 * d;
    var e = 0.016709 - 1.151e-9 * d;
    var M = rev(356.0470 + 0.9856002585 * d);
    var E = M + (e / RAD) * sen(M) * (1 + e * cos(M));
    var xv = cos(E) - e;
    var yv = Math.sqrt(1 - e * e) * sen(E);
    var v = atan2g(yv, xv);
    return { lon: rev(v + w), M: M, L: rev(M + w) };
  }

  /* ---- Luna ----
     ---- Moon ---- */

  // Longitud y latitud eclípticas geocéntricas de la Luna y su distancia en radios terrestres.
  // The Moon's geocentric ecliptic longitude and latitude and its distance in Earth radii.
  function luna(d, s) {
    var N = rev(125.1228 - 0.0529538083 * d);
    var i = 5.1454;
    var w = rev(318.0634 + 0.1643573223 * d);
    var a = 60.2666;
    var e = 0.054900;
    var M = rev(115.3654 + 13.0649929509 * d);

    // Ecuación de Kepler por iteración. / Kepler's equation by iteration.
    var E = M + (e / RAD) * sen(M) * (1 + e * cos(M));
    for (var k = 0; k < 6; k++) {
      E = E - (E - (e / RAD) * sen(E) - M) / (1 - e * cos(E));
    }
    var xv = a * (cos(E) - e);
    var yv = a * Math.sqrt(1 - e * e) * sen(E);
    var v = atan2g(yv, xv);
    var r = Math.sqrt(xv * xv + yv * yv);

    var xh = r * (cos(N) * cos(v + w) - sen(N) * sen(v + w) * cos(i));
    var yh = r * (sen(N) * cos(v + w) + cos(N) * sen(v + w) * cos(i));
    var zh = r * (sen(v + w) * sen(i));
    var lon = atan2g(yh, xh);
    var lat = atan2g(zh, Math.sqrt(xh * xh + yh * yh));

    // Perturbaciones principales (evección, variación, ecuación anual…).
    // Main perturbations (evection, variation, annual equation…).
    var Ms = s.M, Mm = M, Ls = s.L, Lm = rev(M + w + N);
    var D = Lm - Ls, F = Lm - N;
    lon += -1.274 * sen(Mm - 2 * D) + 0.658 * sen(2 * D) - 0.186 * sen(Ms)
      - 0.059 * sen(2 * Mm - 2 * D) - 0.057 * sen(Mm - 2 * D + Ms) + 0.053 * sen(Mm + 2 * D)
      + 0.046 * sen(2 * D - Ms) + 0.041 * sen(Mm - Ms) - 0.035 * sen(D) - 0.031 * sen(Mm + Ms)
      - 0.015 * sen(2 * F - 2 * D) + 0.011 * sen(Mm - 4 * D);
    lat += -0.173 * sen(F - 2 * D) - 0.055 * sen(Mm - F - 2 * D) - 0.046 * sen(Mm + F - 2 * D)
      + 0.033 * sen(F + 2 * D) + 0.017 * sen(2 * Mm + F);
    r += -0.58 * cos(Mm - 2 * D) - 0.46 * cos(2 * D);

    return { lon: rev(lon), lat: lat, r: r };
  }

  /* ---- Coordenadas y altura sobre el horizonte ----
     ---- Coordinates and altitude above the horizon ---- */

  // Pasa de eclípticas a ecuatoriales (ascensión recta y declinación, en grados).
  // Converts ecliptic to equatorial coordinates (right ascension and declination, degrees).
  function aEcuatorial(lon, lat, ecl) {
    var x = cos(lon) * cos(lat);
    var y = sen(lon) * cos(lat);
    var z = sen(lat);
    var ye = y * cos(ecl) - z * sen(ecl);
    var ze = y * sen(ecl) + z * cos(ecl);
    return { ra: rev(atan2g(ye, x)), dec: atan2g(ze, Math.sqrt(x * x + ye * ye)) };
  }

  // Altura (grados) de un astro dados su RA/Dec, el tiempo sidéreo local y la latitud.
  // Altitude (degrees) of a body given its RA/Dec, local sidereal time and latitude.
  function altura(ra, dec, tsl, lat) {
    var H = tsl - ra;
    return Math.asin(sen(lat) * sen(dec) + cos(lat) * cos(dec) * cos(H)) / RAD;
  }

  // Estado completo del cielo en un instante: alturas de Sol y Luna, fase e iluminación.
  // Full sky state at an instant: Sun and Moon altitudes, phase and illumination.
  function estado(fecha, lugar) {
    lugar = lugar || LUGAR;
    var d = diaSchlyter(fecha);
    var ecl = 23.4393 - 3.563e-7 * d;
    var s = sol(d);
    var m = luna(d, s);

    // Tiempo sidéreo local en grados. / Local sidereal time in degrees.
    var ut = (fecha.getUTCHours() + fecha.getUTCMinutes() / 60 + fecha.getUTCSeconds() / 3600);
    var tsl = rev(s.L + 180 + ut * 15 + lugar.lon);

    var se = aEcuatorial(s.lon, 0, ecl);
    var me = aEcuatorial(m.lon, m.lat, ecl);
    var altSol = altura(se.ra, se.dec, tsl, lugar.lat);
    var altLunaGeo = altura(me.ra, me.dec, tsl, lugar.lat);
    // Paralaje: la Luna se ve más baja desde la superficie. / Parallax: the Moon looks lower from the surface.
    var paralaje = Math.asin(1 / m.r) / RAD;
    var altLuna = altLunaGeo - paralaje * cos(altLunaGeo);

    // Elongación y fracción iluminada. / Elongation and illuminated fraction.
    var elong = Math.acos(cos(s.lon - m.lon) * cos(m.lat)) / RAD;
    var anguloFase = 180 - elong;
    var iluminada = (1 + cos(anguloFase)) / 2;
    var avance = rev(m.lon - s.lon); // 0 = luna nueva, 180 = llena / 0 = new, 180 = full

    return {
      altSol: altSol,
      altLuna: altLuna,
      iluminada: iluminada,
      creciente: avance < 180,
      avance: avance,
      edad: avance / 360 * MES_SINODICO
    };
  }

  /* ---- Hora local y desfase de la zona del refugio ----
     ---- Local time and offset of the refuge's time zone ---- */

  // Partes de fecha y hora locales con formatToParts (no depende del formato regional).
  // Local date and time parts with formatToParts (independent of the locale's format).
  var partesLocales = (typeof Intl !== 'undefined') ? new Intl.DateTimeFormat('en-GB', {
    timeZone: LUGAR.zona, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }) : null;
  function partes(t) {
    var r = {};
    if (!partesLocales) {
      var d = new Date(t);
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds() };
    }
    partesLocales.formatToParts(new Date(t)).forEach(function (x) { if (x.type !== 'literal') r[x.type] = +x.value; });
    return r;
  }
  // Minutos que la hora local va por delante de UTC en un instante. / Minutes local time is ahead of UTC at an instant.
  function desfase(t) {
    var q = partes(t);
    return Math.round((Date.UTC(q.year, q.month - 1, q.day, q.hour, q.minute, q.second) - Math.floor(t / 1000) * 1000) / 60000);
  }
  // Instante UTC de una hora local de un día (corrige el cambio de hora). / UTC instant of a local time on a day (handles DST).
  function instanteLocal(a, m, d, h) {
    var aprox = Date.UTC(a, m - 1, d, h);
    var t = aprox - desfase(aprox) * 60000;
    return aprox - desfase(t) * 60000;
  }

  /* ---- La noche de un día concreto ----
     ---- The night of a given day ---- */

  // Recorre la noche de la fecha «AAAA-MM-DD» (de su mediodía local al del día siguiente) en pasos de 5 min
  // e interpola cada cruce del Sol y de la Luna dentro del paso, para que los tramos empiecen y acaben en su minuto.
  // Walks the night of "YYYY-MM-DD" (local noon to next local noon) in 5-minute steps and interpolates every
  // Sun and Moon crossing inside a step, so spans start and end at their real minute.
  var UMBRAL_PUESTA = -0.833;   // borde superior con refracción / upper limb with refraction
  var UMBRAL_NOCHE = -18;       // fin del crepúsculo astronómico / end of astronomical twilight
  function noche(iso, lugar) {
    lugar = lugar || LUGAR;
    var p = iso.split('-').map(Number);
    var inicio = instanteLocal(p[0], p[1], p[2], 12);
    var fin = instanteLocal(p[0], p[1], p[2] + 1, 12);
    var paso = 5 * 60000;
    var muestras = [];
    for (var t = inicio; t < fin + paso; t += paso) {
      var e = estado(new Date(Math.min(t, fin)), lugar);
      muestras.push({ t: Math.min(t, fin), sol: e.altSol, luna: e.altLuna });
      if (t >= fin) break;
    }

    // Instante en que una magnitud cruza un umbral entre dos muestras (interpolación lineal).
    // Instant at which a quantity crosses a threshold between two samples (linear interpolation).
    function corte(a, b, campo, umbral) {
      var va = a[campo], vb = b[campo];
      if ((va - umbral) * (vb - umbral) > 0 || va === vb) return null;
      return a.t + (umbral - va) / (vb - va) * (b.t - a.t);
    }
    // Valor interpolado en un instante dentro de un paso. / Value interpolated at an instant inside a step.
    function valor(a, b, campo, t) { return a[campo] + (b[campo] - a[campo]) * (t - a.t) / (b.t - a.t); }

    // Puesta y salida del Sol (cruces en el sentido correcto). / Sunset and sunrise (crossings in the right direction).
    var puesta = null, salida = null, finCrepusculo = null, inicioAlba = null;
    for (var k = 1; k < muestras.length; k++) {
      var a = muestras[k - 1], b = muestras[k];
      if (puesta === null && a.sol >= UMBRAL_PUESTA && b.sol < UMBRAL_PUESTA) puesta = corte(a, b, 'sol', UMBRAL_PUESTA);
      if (finCrepusculo === null && a.sol >= UMBRAL_NOCHE && b.sol < UMBRAL_NOCHE) finCrepusculo = corte(a, b, 'sol', UMBRAL_NOCHE);
      if (finCrepusculo !== null && inicioAlba === null && a.sol < UMBRAL_NOCHE && b.sol >= UMBRAL_NOCHE) inicioAlba = corte(a, b, 'sol', UMBRAL_NOCHE);
      if (puesta !== null && salida === null && a.sol < UMBRAL_PUESTA && b.sol >= UMBRAL_PUESTA) salida = corte(a, b, 'sol', UMBRAL_PUESTA);
    }

    // Tramos exactos entre la puesta y la salida: se parte cada paso por los cruces que contiene.
    // Exact spans between sunset and sunrise: each step is split at the crossings inside it.
    var tramos = [];
    var oscuroMs = 0;
    var primeroOscuro = null, ultimoOscuro = null;
    if (puesta !== null && salida !== null) {
      for (var m = 1; m < muestras.length; m++) {
        var x = muestras[m - 1], y = muestras[m];
        var desde = Math.max(x.t, puesta), hasta = Math.min(y.t, salida);
        if (hasta <= desde) continue;
        var cortes = [desde, hasta];
        [corte(x, y, 'sol', UMBRAL_NOCHE), corte(x, y, 'luna', UMBRAL_PUESTA)].forEach(function (c) {
          if (c !== null && c > desde && c < hasta) cortes.push(c);
        });
        cortes.sort(function (u, v) { return u - v; });
        for (var q = 1; q < cortes.length; q++) {
          var t0 = cortes[q - 1], t1 = cortes[q];
          if (t1 <= t0) continue;
          var medio = (t0 + t1) / 2;
          var sol = valor(x, y, 'sol', medio), lunaAlt = valor(x, y, 'luna', medio);
          var tipo = sol >= UMBRAL_NOCHE ? 'crepusculo' : (lunaAlt > UMBRAL_PUESTA ? 'luna' : 'oscuro');
          if (tipo === 'oscuro') {
            oscuroMs += t1 - t0;
            if (primeroOscuro === null) primeroOscuro = t0;
            ultimoOscuro = t1;
          }
          var ult = tramos[tramos.length - 1];
          if (ult && ult.tipo === tipo) ult.fin = t1;
          else tramos.push({ tipo: tipo, inicio: t0, fin: t1 });
        }
      }
    }

    // Estado de la Luna a la medianoche local de verdad (00:00 del día siguiente en Madrid).
    // Moon state at the true local midnight (00:00 of the next day in Madrid).
    var medianoche = estado(new Date(instanteLocal(p[0], p[1], p[2] + 1, 0)), lugar);

    return {
      puesta: puesta,
      finCrepusculo: finCrepusculo,
      inicioAlba: inicioAlba,
      salida: salida,
      tramos: tramos,
      oscuroMin: Math.round(oscuroMs / 60000),
      primeroOscuro: primeroOscuro,
      ultimoOscuro: ultimoOscuro,
      luna: medianoche
    };
  }

  /* ---- Lunas nuevas ----
     ---- New moons ---- */

  // Busca las próximas n lunas nuevas desde una fecha (cruce del avance por 0°, refinado por bisección).
  // Finds the next n new moons from a date (the phase angle crossing 0°, refined by bisection).
  function lunasNuevas(desde, n) {
    var lista = [];
    var t = desde.getTime();
    var antes = estado(new Date(t)).avance;
    while (lista.length < n) {
      var t2 = t + 6 * 3600000;
      var ahora = estado(new Date(t2)).avance;
      if (antes > 300 && ahora < 60) {
        var a = t, b = t2;
        for (var k = 0; k < 30; k++) {
          var mitad = (a + b) / 2;
          if (estado(new Date(mitad)).avance > 180) a = mitad; else b = mitad;
        }
        lista.push(new Date((a + b) / 2));
      }
      t = t2; antes = ahora;
    }
    return lista;
  }

  /* ---- Nombre de la fase y veredicto ----
     ---- Phase name and verdict ---- */

  // Nombre de la fase en castellano a partir del avance (0–360°).
  // Spanish phase name from the phase angle (0–360°).
  function nombreFase(avance) {
    if (avance < 12 || avance >= 348) return 'Luna nueva';
    if (avance < 80) return 'Luna creciente';
    if (avance < 100) return 'Cuarto creciente';
    if (avance < 168) return 'Gibosa creciente';
    if (avance < 192) return 'Luna llena';
    if (avance < 260) return 'Gibosa menguante';
    if (avance < 280) return 'Cuarto menguante';
    return 'Luna menguante';
  }

  // Veredicto ceñido a lo que se calcula: las horas sin Sol (por debajo de −18°) ni Luna sobre el horizonte.
  // Verdict limited to what is computed: hours with no Sun (below −18°) and no Moon above the horizon.
  function veredicto(n) {
    var h = n.oscuroMin / 60;
    if (h >= 6) return { nivel: 'larga', texto: 'Noche larga de cielo oscuro: más de seis horas sin Sol ni Luna sobre el horizonte.' };
    if (h >= 3) return { nivel: 'media', texto: 'Entre tres y seis horas sin Sol ni Luna; el resto de la noche, la Luna está arriba.' };
    if (h >= 1) return { nivel: 'corta', texto: 'Ventana corta: entre una y tres horas sin Sol ni Luna sobre el horizonte.' };
    return { nivel: 'luna', texto: 'La Luna está sobre el horizonte casi toda la noche: menos de una hora de cielo oscuro.' };
  }

  // Hora local HH:MM en la zona del refugio, con formatToParts. / Local HH:MM time in the refuge's zone, via formatToParts.
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function hora(t) {
    if (t === null || t === undefined) return '—';
    var q = partes(t);
    return dos(q.hour) + ':' + dos(q.minute);
  }
  // Fecha local «AAAA-MM-DD» de un instante. / Local "YYYY-MM-DD" date of an instant.
  function fechaLocal(t) {
    var q = partes(t);
    return q.year + '-' + dos(q.month) + '-' + dos(q.day);
  }

  var Cielo = {
    LUGAR: LUGAR,
    estado: estado,
    noche: noche,
    lunasNuevas: lunasNuevas,
    nombreFase: nombreFase,
    veredicto: veredicto,
    hora: hora,
    fechaLocal: fechaLocal,
    horaLocal: function (t) { return partes(t).hour; }
  };

  // Exporta para el navegador (window.Cielo) y para Node (pruebas).
  // Exports for the browser (window.Cielo) and for Node (tests).
  if (typeof module !== 'undefined' && module.exports) module.exports = Cielo;
  else raiz.Cielo = Cielo;
})(this);
