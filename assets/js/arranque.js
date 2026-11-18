/*
 * arranque.js — Marca la página como «con JavaScript» antes de pintarse.
 * arranque.js — Flags the page as "with JavaScript" before it paints.
 *
 * Solo con esta clase se ocultan los elementos que luego entran animados: si el script falla,
 * todo el contenido sigue visible.
 * Elements that animate in are hidden only under this class: if scripts fail, all content stays visible.
 */
document.documentElement.classList.add('js');
