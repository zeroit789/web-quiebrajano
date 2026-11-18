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

  /* ---- La noche de un día concreto ----
     ---- The night of a given day ---- */

  // Recorre la noche de la fecha «AAAA-MM-DD» (de su mediodía al del día siguiente) en pasos de 5 min.
  // Walks the night of the date "YYYY-MM-DD" (from its noon to the next noon) in 5-minute steps.
  function noche(iso, lugar) {
    lugar = lugar || LUGAR;
    var p = iso.split('-');
    // 11:00 UTC ≈ mediodía en Madrid en invierno y 13:00 en verano: siempre antes de la puesta de Sol.
    // 11:00 UTC ≈ noon in Madrid in winter and 13:00 in summer: always before sunset.
    var inicio = Date.UTC(+p[0], +p[1] - 1, +p[2], 11, 0, 0);
    var paso = 5 * 60000;
    var muestras = [];
    for (var t = inicio; t <= inicio + 86400000; t += paso) {
      var e = estado(new Date(t), lugar);
      muestras.push({ t: t, sol: e.altSol, luna: e.altLuna });
    }

    // Primer cruce de un umbral en una dirección, interpolado. / First threshold crossing in one direction, interpolated.
    function cruce(campo, umbral, bajando, desde) {
      for (var i = Math.max(1, desde || 1); i < muestras.length; i++) {
        var a = muestras[i - 1][campo], b = muestras[i][campo];
        if (bajando ? (a >= umbral && b < umbral) : (a < umbral && b >= umbral)) {
          var f = (umbral - a) / (b - a);
          return { t: muestras[i - 1].t + f * paso, i: i };
        }
      }
      return null;
    }

    var puesta = cruce('sol', -0.833, true);
    var finCrepusculo = cruce('sol', -18, true);
    var inicioAlba = finCrepusculo ? cruce('sol', -18, false, finCrepusculo.i) : null;
    var salida = puesta ? cruce('sol', -0.833, false, puesta.i) : null;

    // Tramos de la noche: crepúsculo, Luna arriba o cielo oscuro. / Night spans: twilight, Moon up or dark sky.
    var tramos = [];
    var oscuroMin = 0;
    var primeroOscuro = null, ultimoOscuro = null;
    if (puesta && salida) {
      for (var j = puesta.i; j <= salida.i && j < muestras.length; j++) {
        var mu = muestras[j];
        var tipo = mu.sol >= -18 ? 'crepusculo' : (mu.luna > -0.833 ? 'luna' : 'oscuro');
        if (tipo === 'oscuro') {
          oscuroMin += 5;
          if (primeroOscuro === null) primeroOscuro = mu.t;
          ultimoOscuro = mu.t;
        }
        var ult = tramos[tramos.length - 1];
        if (ult && ult.tipo === tipo) ult.fin = mu.t + paso;
        else tramos.push({ tipo: tipo, inicio: mu.t, fin: mu.t + paso });
      }
    }

    // Estado de la Luna a medianoche local (≈ 23:00 UTC). / Moon state at local midnight (≈ 23:00 UTC).
    var medianoche = estado(new Date(inicio + 12 * 3600000), lugar);

    return {
      puesta: puesta && puesta.t,
      finCrepusculo: finCrepusculo && finCrepusculo.t,
      inicioAlba: inicioAlba && inicioAlba.t,
      salida: salida && salida.t,
      tramos: tramos,
      oscuroMin: oscuroMin,
      primeroOscuro: primeroOscuro,
      ultimoOscuro: ultimoOscuro !== null ? ultimoOscuro + paso : null,
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

  // Veredicto para observar según las horas de cielo oscuro y la Luna.
  // Observing verdict from the hours of dark sky and the Moon.
  function veredicto(n) {
    var h = n.oscuroMin / 60;
    if (h >= 6) return { nivel: 'excelente', texto: 'Noche excelente: cielo oscuro casi entero, la Vía Láctea y las galaxias en su mejor momento.' };
    if (h >= 3) return { nivel: 'buena', texto: 'Buena noche: varias horas sin Luna para el telescopio y otras con ella para mirar sus cráteres.' };
    if (h >= 1) return { nivel: 'corta', texto: 'Ventana corta de cielo oscuro. Sirve para una sesión, no para la Vía Láctea entera.' };
    return { nivel: 'luna', texto: 'Noche de Luna: buena para sus cráteres y para los planetas, mala para el cielo profundo.' };
  }

  // Formato de hora local HH:MM en la zona del refugio. / Local HH:MM time in the refuge's zone.
  var formatoHora = (typeof Intl !== 'undefined') ? new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: LUGAR.zona
  }) : null;
  function hora(t) {
    if (t === null || t === undefined) return '—';
    return formatoHora ? formatoHora.format(new Date(t)) : new Date(t).toISOString().slice(11, 16);
  }

  var Cielo = {
    LUGAR: LUGAR,
    estado: estado,
    noche: noche,
    lunasNuevas: lunasNuevas,
    nombreFase: nombreFase,
    veredicto: veredicto,
    hora: hora
  };

  // Exporta para el navegador (window.Cielo) y para Node (pruebas).
  // Exports for the browser (window.Cielo) and for Node (tests).
  if (typeof module !== 'undefined' && module.exports) module.exports = Cielo;
  else raiz.Cielo = Cielo;
})(this);
