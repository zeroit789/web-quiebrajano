/*
 * pagina.js — Comportamiento de todas las páginas de Cortijo Quiebrajano.
 * pagina.js — Behaviour shared by every Cortijo Quiebrajano page.
 *
 * 1. Entradas escalonadas (y todo visible si algo falla).
 * 2. Vídeo en bucle que solo corre cuando se ve.
 * 3. Menú plegable del móvil: foco dentro, Escape y foco de vuelta.
 * 4. Formulario de reserva de demostración: valida, avisa y prepara un correo.
 * 5. La Luna: panel «Esta noche», calculador «Elige tu noche» y calendario lunar del mes.
 * 1. Staggered entrances (and everything visible if something fails).
 * 2. Looping video that only runs while visible.
 * 3. Collapsible phone menu: focus kept inside, Escape and focus returned.
 * 4. Demo booking form: validates, reports and prepares an email.
 * 5. The Moon: "Tonight" panel, "Pick your night" calculator and the month's lunar calendar.
 */
(function () {
  'use strict';

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CORREO = 'reservas@quiebrajano.example';

  /* ========== 1. Entradas escalonadas ==========
     ========== 1. Staggered entrances ========== */

  // Observa cada pieza marcada; las que entran juntas se escalonan 70 ms.
  // Watches each marked piece; pieces entering together are staggered by 70 ms.
  function prepararEntradas() {
    var piezas = Array.prototype.slice.call(document.querySelectorAll('[data-revela]'));
    if (!('IntersectionObserver' in window) || sinMovimiento) {
      piezas.forEach(function (p) { p.classList.add('visto'); });
      return;
    }
    var observador = new IntersectionObserver(function (entradas) {
      var n = 0;
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--retardo', Math.min(n * 70, 210) + 'ms');
        e.target.classList.add('visto');
        observador.unobserve(e.target);
        n++;
      });
    }, { rootMargin: '0px 0px 6% 0px', threshold: 0 });
    piezas.forEach(function (p) { observador.observe(p); });
    // Lo que recibe el foco se muestra aunque no haya entrado aún. / Focused content shows even if not yet revealed.
    document.addEventListener('focusin', function (e) {
      var p = e.target.closest && e.target.closest('[data-revela]');
      if (p) p.classList.add('visto');
    });
  }

  /* ========== 2. Vídeo: corre solo cuando se ve ==========
     ========== 2. Video: runs only while visible ========== */
  function prepararVideo() {
    Array.prototype.forEach.call(document.querySelectorAll('video'), function (v) {
      // Botón visible para pausar o seguir (WCAG 2.2.2). / Visible pause/play button (WCAG 2.2.2).
      var pausado = sinMovimiento;
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'video-boton';
      function rotular() { boton.textContent = pausado ? 'Reproducir el vídeo' : 'Pausar el vídeo'; boton.setAttribute('aria-pressed', pausado ? 'true' : 'false'); }
      boton.addEventListener('click', function () {
        pausado = !pausado;
        if (pausado) v.pause(); else { var q = v.play(); if (q && q.catch) q.catch(function () {}); }
        rotular();
      });
      rotular();
      v.insertAdjacentElement('afterend', boton);
      if (sinMovimiento) { v.pause(); return; }
      // Sin IntersectionObserver, arranca ya: el botón está puesto. / Without IntersectionObserver, start now: the button is in place.
      if (!('IntersectionObserver' in window)) { var r = v.play(); if (r && r.catch) r.catch(function () {}); return; }
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !pausado) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }).observe(v);
    });
  }

  /* ========== 3. Menú del móvil ==========
     ========== 3. Phone menu ========== */
  function prepararMenu() {
    var boton = document.querySelector('.menu-boton');
    var menu = document.getElementById('menu-principal');
    var cabecera = document.querySelector('.cabecera');
    if (!boton || !menu || !cabecera) return;
    cabecera.classList.add('menu-plegable');
    // Lo que queda fuera de la cabecera se vuelve inerte con el menú abierto. / Everything outside the header goes inert while open.
    var fuera = Array.prototype.filter.call(document.body.children, function (n) { return n !== cabecera && n.tagName !== 'SCRIPT'; });

    // Abre o cierra el menú y deja el foco donde toca. / Opens or closes the menu and places focus.
    function poner(abierto, devolverFoco) {
      menu.classList.toggle('abierto', abierto);
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.textContent = abierto ? 'Cerrar' : 'Menú';
      document.body.classList.toggle('menu-abierto', abierto);
      fuera.forEach(function (n) { if (abierto) n.setAttribute('inert', ''); else n.removeAttribute('inert'); });
      if (abierto) { var primero = menu.querySelector('a'); if (primero) primero.focus(); }
      else if (devolverFoco) boton.focus();
    }
    boton.addEventListener('click', function () { poner(!menu.classList.contains('abierto'), true); });

    // Escape cierra; Tab no sale del menú abierto. / Escape closes; Tab stays inside the open menu.
    document.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('abierto')) return;
      if (e.key === 'Escape') { e.preventDefault(); poner(false, true); return; }
      if (e.key !== 'Tab') return;
      var focos = [boton].concat(Array.prototype.slice.call(menu.querySelectorAll('a, button')));
      var i = focos.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); focos[focos.length - 1].focus(); }
      else if (!e.shiftKey && i === focos.length - 1) { e.preventDefault(); focos[0].focus(); }
    });
    // Un enlace del menú lo cierra; al pasar a escritorio se cierra solo. / A menu link closes it; going to desktop closes it.
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) poner(false, false); });
    window.matchMedia('(min-width: 1101px)').addEventListener('change', function (m) { if (m.matches) poner(false, false); });
  }

  /* ========== 4. Formulario de reserva (demostración) ==========
     ========== 4. Booking form (demo) ========== */
  function prepararFormulario() {
    var form = document.getElementById('form-reserva');
    if (!form) return;
    var resultado = document.getElementById('form-resultado');
    var resumen = document.getElementById('form-resumen');
    var enlace = document.getElementById('form-correo');
    var hoy = isoLocal(new Date());
    var campos = {
      nombre: document.getElementById('f-nombre'),
      correo: document.getElementById('f-correo'),
      llegada: document.getElementById('f-llegada'),
      noches: document.getElementById('f-noches'),
      personas: document.getElementById('f-personas'),
      habitacion: document.getElementById('f-habitacion'),
      mensaje: document.getElementById('f-mensaje')
    };
    campos.llegada.min = hoy;

    // Habitación que llega en la dirección (?habitacion=Orion). / Room passed in the URL (?habitacion=Orion).
    var parametros = {};
    try { parametros = new URLSearchParams(location.search); } catch (e) { parametros = new URLSearchParams(''); }
    var llegada = parametros.get('llegada');
    if (llegada && /^\d{4}-\d{2}-\d{2}$/.test(llegada) && !isNaN(aFecha(llegada)) && llegada >= hoy) campos.llegada.value = llegada;
    var HABITACIONES = { 'Me da igual': 1, 'Orion': 1, 'Aldebaran': 1, 'Vega': 1, 'Capella': 1, 'Solo observacion': 1 };
    var pedida = parametros.get('habitacion');
    if (pedida && Object.hasOwn(HABITACIONES, pedida)) campos.habitacion.value = pedida;

    // Comprobaciones de cada campo. / Checks for each field.
    var reglas = {
      nombre: function (v) { return v.trim().length > 0; },
      correo: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      llegada: function (v) { return /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= hoy; },
      noches: function (v) { return /^\d+$/.test(v) && +v >= 1 && +v <= 7; },
      personas: function (v) { return /^\d+$/.test(v) && +v >= 1 && +v <= 4; }
    };

    // Marca o desmarca el error de un campo. / Marks or clears a field's error.
    function marcar(nombre, ok) {
      var campo = campos[nombre];
      var error = document.getElementById('e-' + nombre);
      campo.setAttribute('aria-invalid', ok ? 'false' : 'true');
      error.hidden = ok;
      return ok;
    }
    Object.keys(reglas).forEach(function (n) {
      campos[n].addEventListener('blur', function () { if (campos[n].getAttribute('aria-invalid') === 'true') marcar(n, reglas[n](campos[n].value)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var primero = null;
      Object.keys(reglas).forEach(function (n) {
        var ok = marcar(n, reglas[n](campos[n].value));
        if (!ok && !primero) primero = campos[n];
      });
      if (primero) { resultado.hidden = true; primero.focus(); return; }

      // Mensaje para el programa de correo. / Message for the mail client.
      var habitacion = campos.habitacion.options[campos.habitacion.selectedIndex].text;
      var fecha = fmtLarga.format(aFecha(campos.llegada.value));
      var cuerpo = 'Hola, soy ' + campos.nombre.value.trim() + '.\n\nQueremos venir la noche del ' + fecha +
        ', ' + campos.noches.value + ' noche(s), ' + campos.personas.value + ' persona(s).\nHabitación: ' + habitacion +
        '\nCorreo de respuesta: ' + campos.correo.value.trim() + (campos.mensaje.value.trim() ? '\n\n' + campos.mensaje.value.trim() : '') + '\n';
      enlace.href = 'mailto:' + CORREO + '?subject=' + encodeURIComponent('Reserva para la noche del ' + fecha) + '&body=' + encodeURIComponent(cuerpo);
      resumen.textContent = campos.personas.value + ' persona(s), ' + campos.noches.value + ' noche(s) desde el ' + fecha + ', habitación: ' + habitacion +
        '. Desde esta web no se envía nada: pulsa el botón para abrir tu correo con el mensaje ya escrito.';
      resultado.hidden = false;
      resultado.focus();
    });
    // El botón sale desactivado en el HTML: sin este script, no se puede enviar. / Disabled in HTML: without this script, nothing submits.
    var enviar = form.querySelector('[type=submit]');
    if (enviar) enviar.disabled = false;
  }

  /* ========== 5. La Luna ==========
     ========== 5. The Moon ========== */

  var ZONA = 'Europe/Madrid';
  // Partes locales con formatToParts: no dependen del formato regional. / Local parts via formatToParts: locale-independent.
  var fmtPartes = new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
  function partes(d) {
    var r = {};
    fmtPartes.formatToParts(d).forEach(function (x) { if (x.type !== 'literal') r[x.type] = x.value; });
    return r;
  }
  var fmtLarga = new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
  var fmtCorta = new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', day: 'numeric', month: 'long' });
  var fmtDia = new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', weekday: 'long' });
  var fmtMes = new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', month: 'long', year: 'numeric' });

  // Fecha local «AAAA-MM-DD» de un instante. / Local "YYYY-MM-DD" date of an instant.
  function isoLocal(d) { var q = partes(d); return q.year + '-' + q.month + '-' + q.day; }
  // Suma días a una fecha ISO sin líos de horario. / Adds days to an ISO date with no DST trouble.
  function sumarDias(iso, n) {
    var p = iso.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n, 12)).toISOString().slice(0, 10);
  }
  // Fecha ISO como Date al mediodía UTC, para formatear. / ISO date as a Date at UTC noon, for formatting.
  function aFecha(iso) { var p = iso.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)); }
  // La noche de un instante de luna nueva: antes del mediodía cuenta la anterior. / New-moon night: before noon counts the previous one.
  function nocheDe(instante) {
    var iso = isoLocal(instante);
    return (+partes(instante).hour < 12) ? sumarDias(iso, -1) : iso;
  }
  // «4 h 20 min» a partir de minutos. / "4 h 20 min" from minutes.
  function duracion(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + ' min';
    return h + ' h' + (m ? ' ' + m + ' min' : '');
  }

  // Traza la parte no iluminada de la Luna (terminador como media elipse). / Traces the unlit part of the Moon.
  function trazarSombra(ctx, c, R, avance) {
    var k = (1 - Math.cos(avance * Math.PI / 180)) / 2;
    var rx = R * Math.abs(2 * k - 1);
    ctx.save();
    ctx.translate(c, c);
    if (avance >= 180) ctx.scale(-1, 1); // menguante: luz a la izquierda / waning: light on the left
    ctx.beginPath();
    ctx.moveTo(0, -R);
    ctx.arc(0, 0, R + 1, -Math.PI / 2, Math.PI / 2, true);
    if (k < 0.5) ctx.ellipse(0, 0, rx, R + 1, 0, Math.PI / 2, -Math.PI / 2, true);
    else ctx.ellipse(0, 0, rx, R + 1, 0, Math.PI / 2, Math.PI * 1.5, false);
    ctx.closePath();
    ctx.restore();
  }

  /* ---- Luna grande: foto real con la sombra calculada ----
     ---- Large Moon: a real photo with the computed dark side ---- */
  function crearDibujoLuna(lienzo) {
    var ctx = lienzo.getContext('2d');
    var foto = new Image();
    var listo = false;
    var actual = null;
    var animacion = null;
    foto.onload = function () { listo = true; if (actual !== null) pintar(actual); };
    foto.src = 'assets/img/luna.webp';

    // Ajusta la resolución del lienzo a la pantalla. / Fits the canvas resolution to the screen.
    function ajustar() {
      var lado = Math.round(lienzo.getBoundingClientRect().width * (window.devicePixelRatio || 1));
      if (lado > 0 && lienzo.width !== lado) { lienzo.width = lado; lienzo.height = lado; if (actual !== null) pintar(actual); }
    }
    // Pinta la foto y encima la sombra. / Paints the photo and the dark side over it.
    function pintar(avance) {
      var s = lienzo.width, c = s / 2, R = s * 0.47;
      ctx.clearRect(0, 0, s, s);
      if (!listo) return;
      ctx.save();
      ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(foto, c - R * 1.01, c - R * 1.01, R * 2.02, R * 2.02);
      trazarSombra(ctx, c, R, avance);
      ctx.fillStyle = 'rgba(17,17,17,0.93)';
      ctx.fill();
      ctx.restore();
    }
    // Lleva la fase a la nueva en 700 ms por el camino corto. / Takes the phase to the new one in 700 ms.
    function ir(destino) {
      if (animacion) cancelAnimationFrame(animacion);
      if (actual === null || sinMovimiento) { actual = destino; pintar(actual); return; }
      var origen = actual, delta = ((destino - origen + 540) % 360) - 180, t0 = performance.now();
      function paso(t) {
        var f = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - f, 3);
        actual = (origen + delta * e + 360) % 360;
        pintar(actual);
        if (f < 1) animacion = requestAnimationFrame(paso);
      }
      animacion = requestAnimationFrame(paso);
    }
    window.addEventListener('resize', ajustar);
    ajustar();
    return { ir: ir };
  }

  // Luna pequeña del calendario: disco plano con su sombra. / Small calendar Moon: flat disc with its dark side.
  function pintarMini(lienzo, avance) {
    var lado = 52;
    lienzo.width = lado; lienzo.height = lado;
    var ctx = lienzo.getContext('2d'), c = lado / 2, R = lado * 0.46;
    ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fillStyle = '#d6d2cc'; ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.clip();
    trazarSombra(ctx, c, R, avance);
    ctx.fillStyle = '#3a3a3a';
    ctx.fill();
    ctx.restore();
  }

  function prepararLuna() {
    var C = window.Cielo;
    if (!C) return;
    var hoy = isoLocal(new Date());
    var cache = {};
    // Noche calculada una sola vez por fecha. / Night computed once per date.
    function noche(iso) { return cache[iso] || (cache[iso] = C.noche(iso)); }
    var nuevas = C.lunasNuevas(new Date(), 6).map(function (d) {
      var iso = nocheDe(d);
      return { iso: iso, horas: Math.round(noche(iso).oscuroMin / 60) };
    });

    /* ---- Panel «Esta noche» del héroe ----
       ---- Hero "Tonight" panel ---- */
    var lienzoHeroe = document.getElementById('luna-heroe');
    if (lienzoHeroe) {
      var nh = noche(hoy);
      crearDibujoLuna(lienzoHeroe).ir(nh.luna.avance);
      lienzoHeroe.setAttribute('aria-label', 'La Luna de esta noche: ' + C.nombreFase(nh.luna.avance).toLowerCase() + ', ' + Math.round(nh.luna.iluminada * 100) + ' % iluminada');
      document.getElementById('heroe-fase').textContent = C.nombreFase(nh.luna.avance) + ', ' + Math.round(nh.luna.iluminada * 100) + ' % iluminada';
      document.getElementById('heroe-oscuro').textContent = nh.oscuroMin > 0
        ? 'Cielo oscuro de ' + C.hora(nh.primeroOscuro) + ' a ' + C.hora(nh.ultimoOscuro) + ' (' + duracion(nh.oscuroMin) + ')'
        : 'La Luna está sobre el horizonte toda la noche: no hay horas de cielo oscuro.';
      if (nuevas.length) document.getElementById('heroe-nueva').textContent = 'Próxima luna nueva: noche del ' + fmtCorta.format(aFecha(nuevas[0].iso)) + ', ' + nuevas[0].horas + ' h de cielo oscuro.';
    }

    /* ---- Calculador «Elige tu noche» ----
       ---- "Pick your night" calculator ---- */
    var caja = document.getElementById('calculador');
    if (!caja) return;
    caja.hidden = false;
    var entrada = document.getElementById('calc-fecha');
    var el = {
      fase: document.getElementById('calc-fase'),
      detalle: document.getElementById('calc-detalle'),
      oscuro: document.getElementById('calc-oscuro'),
      barra: document.getElementById('calc-noche'),
      puesta: document.getElementById('calc-puesta'),
      salida: document.getElementById('calc-salida'),
      veredicto: document.getElementById('calc-veredicto'),
      pedir: document.getElementById('calc-pedir'),
      resultado: caja.querySelector('.calc-resultado'),
      lista: document.getElementById('lunas-lista')
    };
    var luna = crearDibujoLuna(document.getElementById('luna-lienzo'));

    // Botones de las próximas lunas nuevas. / Buttons for the next new moons.
    el.lista.innerHTML = '';
    nuevas.forEach(function (n) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'luna-boton';
      b.setAttribute('data-iso', n.iso);
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = fmtCorta.format(aFecha(n.iso)) + '<small>' + fmtDia.format(aFecha(n.iso)) + ' · ' + n.horas + ' h de cielo oscuro</small>';
      b.addEventListener('click', function () { elegir(n.iso); });
      li.appendChild(b);
      el.lista.appendChild(li);
    });

    // Calcula y pinta la noche elegida. / Computes and paints the chosen night.
    function elegir(iso) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
      entrada.value = iso;
      var n = noche(iso), L = n.luna, pct = Math.round(L.iluminada * 100);
      el.fase.textContent = C.nombreFase(L.avance);
      var evento = '';
      for (var i = 1; i < n.tramos.length; i++) {
        var a = n.tramos[i - 1].tipo, b = n.tramos[i].tipo;
        if (a === 'luna' && b === 'oscuro') { evento = 'se pone a las ' + C.hora(n.tramos[i].inicio); break; }
        if (a === 'oscuro' && b === 'luna') { evento = 'sale a las ' + C.hora(n.tramos[i].inicio); break; }
      }
      // Días de lunación solo entre 1 y 28. / Days of lunation only from 1 to 28.
      var dias = Math.round(L.edad);
      el.detalle.textContent = pct + ' % iluminada' + (dias >= 1 && dias <= 28 ? ' · ' + dias + (dias === 1 ? ' día' : ' días') + ' de lunación' : '') + (evento ? ' · la Luna ' + evento : '');
      el.oscuro.textContent = n.oscuroMin > 0
        ? 'Cielo oscuro de ' + C.hora(n.primeroOscuro) + ' a ' + C.hora(n.ultimoOscuro) + ' · ' + duracion(n.oscuroMin)
        : 'Sin cielo oscuro: la Luna alumbra toda la noche.';

      // Barra de la noche, de la puesta a la salida del Sol. / Night bar, from sunset to sunrise.
      el.barra.innerHTML = '';
      var total = n.salida - n.puesta;
      n.tramos.forEach(function (t, j) {
        var s = document.createElement('span');
        s.className = 't-' + t.tipo;
        s.style.left = ((t.inicio - n.puesta) / total * 100).toFixed(2) + '%';
        s.style.width = ((Math.min(t.fin, n.salida) - t.inicio) / total * 100).toFixed(2) + '%';
        if (!sinMovimiento) { s.style.transform = 'scaleX(0)'; s.style.transitionDelay = (j * 70) + 'ms'; }
        el.barra.appendChild(s);
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          Array.prototype.forEach.call(el.barra.children, function (s) { s.style.transform = 'scaleX(1)'; });
        });
      });
      el.puesta.textContent = 'Puesta ' + C.hora(n.puesta);
      el.salida.textContent = 'Salida ' + C.hora(n.salida);

      var v = C.veredicto(n);
      el.veredicto.textContent = v.texto;
      var larga = fmtLarga.format(aFecha(iso));
      el.pedir.textContent = 'Pedir la noche del ' + larga;
      el.pedir.href = 'contacto.html?llegada=' + iso + '#formulario';

      Array.prototype.forEach.call(el.lista.querySelectorAll('.luna-boton'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-iso') === iso ? 'true' : 'false');
      });
      luna.ir(L.avance);
      document.getElementById('luna-lienzo').setAttribute('aria-label', 'La Luna la noche del ' + larga + ': ' + C.nombreFase(L.avance).toLowerCase() + ', ' + pct + ' % iluminada');
      if (!sinMovimiento) {
        el.resultado.classList.remove('cambia');
        void el.resultado.offsetWidth;
        el.resultado.classList.add('cambia');
      }
      document.dispatchEvent(new CustomEvent('noche-elegida', { detail: iso }));
    }

    entrada.addEventListener('change', function () { elegir(entrada.value); });
    document.getElementById('calc-antes').addEventListener('click', function () { elegir(sumarDias(entrada.value || hoy, -1)); });
    document.getElementById('calc-despues').addEventListener('click', function () { elegir(sumarDias(entrada.value || hoy, 1)); });

    prepararCalendario(noche, elegir, hoy);
    elegir(hoy);
  }

  /* ---- Calendario lunar del mes ----
     ---- The month's lunar calendar ---- */
  function prepararCalendario(noche, elegir, hoy) {
    var caja = document.getElementById('calendario-mes');
    if (!caja) return;
    var C = window.Cielo;
    caja.hidden = false;
    var cuerpo = document.getElementById('cal-cuerpo');
    var titulo = document.getElementById('cal-titulo');
    var mes = { a: +hoy.slice(0, 4), m: +hoy.slice(5, 7) - 1 };
    var elegida = hoy;

    // Pinta el mes: una fila por semana, de lunes a domingo. / Paints the month: one row per week, Monday to Sunday.
    function pintar() {
      var primero = new Date(Date.UTC(mes.a, mes.m, 1, 12));
      var nombre = fmtMes.format(primero);
      titulo.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
      var dias = new Date(Date.UTC(mes.a, mes.m + 1, 0, 12)).getUTCDate();
      var hueco = (primero.getUTCDay() + 6) % 7;
      cuerpo.innerHTML = '';
      var fila = document.createElement('tr');
      for (var h = 0; h < hueco; h++) fila.appendChild(document.createElement('td'));
      for (var d = 1; d <= dias; d++) {
        var iso = mes.a + '-' + String(mes.m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var n = noche(iso);
        var horas = n.oscuroMin / 60;
        var td = document.createElement('td');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'dia' + (iso === hoy ? ' dia-hoy' : '');
        b.setAttribute('data-iso', iso);
        b.setAttribute('aria-pressed', iso === elegida ? 'true' : 'false');
        b.setAttribute('aria-label', fmtDia.format(aFecha(iso)) + ' ' + fmtCorta.format(aFecha(iso)) + (iso === hoy ? ' (hoy)' : '') + ': ' +
          C.nombreFase(n.luna.avance).toLowerCase() + ', ' + (horas >= 0.5 ? Math.round(horas) + ' horas' : 'sin horas') + ' de cielo oscuro');
        b.innerHTML = '<span class="dia-numero" aria-hidden="true">' + d + '</span>';
        var lienzo = document.createElement('canvas');
        lienzo.setAttribute('aria-hidden', 'true');
        pintarMini(lienzo, n.luna.avance);
        b.appendChild(lienzo);
        b.insertAdjacentHTML('beforeend', '<span class="dia-barra" aria-hidden="true"><i style="width:' + Math.min(100, horas / 12 * 100).toFixed(0) + '%"></i></span>' +
          '<span class="dia-horas" aria-hidden="true">' + (horas >= 0.5 ? Math.round(horas) + ' h' : '—') + '</span>');
        b.addEventListener('click', (function (x) { return function () { elegir(x); }; })(iso));
        td.appendChild(b);
        fila.appendChild(td);
        if ((hueco + d) % 7 === 0) { cuerpo.appendChild(fila); fila = document.createElement('tr'); }
      }
      if (fila.children.length) {
        while (fila.children.length < 7) fila.appendChild(document.createElement('td'));
        cuerpo.appendChild(fila);
      }
    }
    // Cambia de mes. / Changes month.
    function mover(n) {
      mes.m += n;
      if (mes.m < 0) { mes.m = 11; mes.a--; }
      if (mes.m > 11) { mes.m = 0; mes.a++; }
      pintar();
    }
    document.getElementById('cal-antes').addEventListener('click', function () { mover(-1); });
    document.getElementById('cal-despues').addEventListener('click', function () { mover(1); });

    // Cuando se elige una noche en otro control, el calendario la sigue. / The calendar follows nights picked elsewhere.
    document.addEventListener('noche-elegida', function (e) {
      elegida = e.detail;
      var a = +elegida.slice(0, 4), m = +elegida.slice(5, 7) - 1;
      if (a !== mes.a || m !== mes.m) { mes.a = a; mes.m = m; pintar(); return; }
      Array.prototype.forEach.call(cuerpo.querySelectorAll('.dia'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-iso') === elegida ? 'true' : 'false');
      });
    });
    pintar();
  }

  /* ========== Arranque ==========
     ========== Start ========== */
  function iniciar() {
    prepararEntradas();
    prepararVideo();
    prepararMenu();
    prepararFormulario();
    prepararLuna();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
