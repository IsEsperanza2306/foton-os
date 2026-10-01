/* Foton OS · Marca
   Pone el logo de Foton en las páginas que todavía no traen uno: dentro de su encabezado si lo tienen
   (blanco u oscuro según el fondo) o, si no, en una pastilla azul arriba a la izquierda.
   Las páginas que ya traen logo no se tocan. Se carga solo desde _acceso.js, o con
   <script src="_marca.js" defer></script> en las páginas sin acceso. */
(function () {
  'use strict';
  if (window.top !== window.self || window.FOTON_MARCA) return;
  window.FOTON_MARCA = true;
  const SCRIPT = document.currentScript;
  const BASE = new URL('.', SCRIPT && SCRIPT.src ? SCRIPT.src : location.href);
  const img = n => new URL('assets/' + n, BASE).href;
  const ya = () => document.querySelector('[data-foton-logo], .logo, .pc-logo, img[alt^="Foton" i], img[src*="logo"]');

  // ¿el fondo es claro? (luminancia del primer color opaco hacia arriba)
  function claro(el) {
    for (; el && el !== document.documentElement; el = el.parentElement) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > 0.5)) return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) > 150;
    }
    return true;
  }

  function encabezado() {
    const c = [...document.querySelectorAll('header, .hdr, .header, .topbar, .top-bar, .app-header, nav')];
    return c.find(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.top < 60 && r.height > 30 && r.height < 160 && r.width > innerWidth * 0.6 && cs.display !== 'none' && cs.visibility !== 'hidden'; });
  }

  function poner() {
    if (ya() || document.getElementById('fos-marca')) return;
    const h = encabezado();
    const st = document.createElement('style');
    st.textContent = '@media print{#fos-marca{display:none!important}}';
    document.head.appendChild(st);
    if (h) {
      const i = document.createElement('img');
      i.id = 'fos-marca'; i.alt = 'Foton'; i.src = img(claro(h) ? 'logo-foton-oscuro.png' : 'logo-foton-blanco.png');
      i.style.cssText = 'height:26px;width:auto;display:inline-block;vertical-align:middle;margin:0 14px 0 0;flex:none';
      h.insertBefore(i, h.firstChild);
      return;
    }
    const a = document.createElement('a');
    a.id = 'fos-marca'; a.href = new URL('index.html', BASE).href; a.setAttribute('aria-label', 'Foton OS');
    a.style.cssText = 'position:fixed;left:12px;top:12px;z-index:2147481000;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:14px;text-decoration:none;background:linear-gradient(160deg,rgba(0,26,77,.94),rgba(10,47,110,.94));box-shadow:0 6px 20px rgba(0,10,40,.28),0 1px 0 rgba(255,255,255,.18) inset;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)';
    a.innerHTML = '<img src="' + img('logo-foton-blanco.png') + '" alt="Foton" style="height:20px;width:auto;display:block"><small style="font:700 10px Inter,sans-serif;letter-spacing:.2em;color:#7CC2FF">OS</small>';
    document.body.appendChild(a);
  }
  // espera a que la página arme su encabezado (hubs y paneles lo dibujan con script)
  const listo = () => setTimeout(poner, 700);
  document.readyState === 'complete' ? listo() : window.addEventListener('load', listo);
})();
