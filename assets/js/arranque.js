/*
 * arranque.js — Marca la página como «con JavaScript» antes de pintarse.
 * arranque.js — Flags the page as "with JavaScript" before it paints.
 *
 * Lo que se oculta o se sustituye (entradas animadas, lienzos de la Luna) no depende de esta clase,
 * sino de las que pone pagina.js tras instalar sus manejadores: si ese script falla, todo sigue visible.
 * Whatever hides or gets replaced (animated entrances, Moon canvases) does not depend on this class but
 * on the ones pagina.js sets after installing its handlers: if that script fails, everything stays visible.
 */
document.documentElement.classList.add('js');
