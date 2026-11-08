/* Foton OS · Cristal para las herramientas
   Lleva el estilo del escritorio a cada panel sin tocar su HTML:
   - fondo ambiental azul desenfocado detrás de la página
   - superficies blancas → vidrio claro (translúcido, canto blanco, sombra suave)
   - pestañas y segmentados → indicador que se desliza con resorte
   - tarjetas → entrada escalonada (desenfoque a nítido) al cargar y al cambiar de vista
   - cifras grandes y títulos → serif, como en el escritorio
   Se carga desde _sistema.js. Lee los estilos ya calculados, así funciona con cualquier panel.
   Se apaga al imprimir. */
(function () {
  'use strict';
  if (window.__cristal) return; window.__cristal = 1;
  const D = document, H = D.documentElement;
  const QUIETO = matchMedia('(prefers-reduced-motion:reduce)').matches;

  const CSS = `
  html.cr{background:#E9EFF8!important}
  html.cr body{background:transparent!important}
  .cr-amb{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;background:linear-gradient(180deg,#EAF1FB,#E6ECF6)}
  .cr-amb i{position:absolute;border-radius:50%;filter:blur(70px)}
  .cr-amb i:nth-child(1){width:52vw;height:52vw;right:-14vw;top:-22vw;background:#8CC8FF;opacity:.72}
  .cr-amb i:nth-child(2){width:60vw;height:60vw;left:-20vw;bottom:-30vw;background:#2F7DE6;opacity:.30}
  .cr-amb i:nth-child(3){width:30vw;height:30vw;left:30vw;top:30vh;background:#FFFFFF;opacity:.9}
  .cr-amb i:nth-child(4){width:26vw;height:26vw;right:6vw;bottom:-6vw;background:#5FB0FF;opacity:.32}
  .cr-amb::after{content:"";position:absolute;inset:0;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}

  /* vidrio */
  .cr-v{background-color:rgba(255,255,255,.62)!important;background-image:linear-gradient(160deg,rgba(255,255,255,.55),rgba(255,255,255,0) 46%)!important;
    border-color:rgba(255,255,255,.85)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 1px 2px rgba(0,26,77,.04),0 10px 30px rgba(0,26,77,.08)!important}
  .cr-v.cr-sinborde{border:1px solid rgba(255,255,255,.85)!important}
  .cr-v.cr-hov{transition:transform .35s cubic-bezier(.34,1.32,.5,1),box-shadow .3s,background-color .25s!important}
  .cr-v.cr-hov:hover{transform:translateY(-3px);background-color:rgba(255,255,255,.78)!important;box-shadow:inset 0 1px 0 #fff,0 18px 44px rgba(0,26,77,.14)!important}
  .cr-m{background-color:rgba(250,252,255,.9)!important;-webkit-backdrop-filter:blur(26px) saturate(170%);backdrop-filter:blur(26px) saturate(170%);
    border-color:rgba(255,255,255,.9)!important;box-shadow:inset 0 1px 0 #fff,0 30px 80px rgba(0,26,77,.28)!important}
  .cr-t{background-color:transparent!important;background-image:none!important}
  .cr-t2{background-color:rgba(255,255,255,.38)!important;background-image:none!important}
  .cr-in{background-color:rgba(255,255,255,.72)!important;border-color:rgba(0,26,77,.10)!important}
  .cr-in:focus,.cr-in:focus-within{background-color:#fff!important}
  .fos-hd{box-shadow:inset 0 -1px 0 rgba(255,255,255,.08),0 10px 30px rgba(0,26,77,.18)!important}

  /* pestañas con indicador */
  .cr-tabs{position:relative!important;isolation:isolate}
  .cr-tabs>.cr-act{background:transparent!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important}
  .cr-tabs>*{position:relative;z-index:1}
  .cr-tabs>.cr-ind{position:absolute!important;z-index:0!important;left:0;top:0;pointer-events:none;margin:0!important;padding:0!important;
    transition:left .5s cubic-bezier(.34,1.32,.5,1),width .5s cubic-bezier(.34,1.32,.5,1),top .4s,height .4s,opacity .2s}

  /* tipografía de display */
  .cr-num{font-family:"Instrument Serif","Iowan Old Style",Georgia,serif!important;font-weight:400!important;letter-spacing:-.01em!important;font-variant-numeric:lining-nums tabular-nums}
.cr-h2{font-family:"Instrument Serif","Iowan Old Style",Georgia,serif!important;font-weight:400!important;text-transform:none!important;letter-spacing:-.01em!important;font-size:1.18em!important}
  .cr-bar{background:rgba(236,243,252,.5)!important;-webkit-backdrop-filter:blur(22px) saturate(170%)!important;backdrop-filter:blur(22px) saturate(170%)!important;border-color:rgba(255,255,255,.7)!important}
  .cr-h1{font-family:"Instrument Serif","Iowan Old Style",Georgia,serif!important;font-weight:400!important;text-transform:none!important;letter-spacing:-.012em!important}

  @media (prefers-reduced-motion:reduce){.cr-tabs>.cr-ind,.cr-v.cr-hov{transition:none!important}}
  @media print{html.cr{background:#fff!important}.cr-amb{display:none!important}
    .cr-v,.cr-m,.cr-t2,.cr-in{background:#fff!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;border-color:#e3e7ee!important}}`;

  // ── utilidades de color ──
  const rgba = s => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const claro = c => c && c.a > .92 && c.r > 228 && c.g > 230 && c.b > 232 && (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) < 26;
  const blanco = c => claro(c) && c.r > 247 && c.g > 247 && c.b > 247;

  const SALTA = new Set(['HTML', 'BODY', 'SCRIPT', 'STYLE', 'SVG', 'PATH', 'IMG', 'CANVAS', 'VIDEO', 'IFRAME', 'OPTION', 'BR', 'HR', 'TD', 'TH', 'TR', 'THEAD', 'TBODY', 'LI', 'SPAN', 'B', 'I', 'EM', 'STRONG', 'SMALL', 'LABEL', 'P', 'H1', 'H2', 'H3', 'H4']);
  const CELDA = new Set(['TD', 'TH', 'TR', 'THEAD', 'TBODY', 'TFOOT', 'LI', 'SPAN', 'LABEL', 'P']);
  const nuevos = [];
  const r0 = el => el.getBoundingClientRect();

  function clasificar(el) {
    if (el.nodeType !== 1 || el.__cr) return;
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'svg' || el.closest('svg,.fos-hd,#fos-sheet,.cr-amb,[data-cr-no]')) return;
    el.__cr = 1;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') { el.__cr = 0; return; }
    const bg = rgba(cs.backgroundColor);
    const fs = parseFloat(cs.fontSize);
    // cifras y títulos grandes → serif
    if (fs >= 28 && el.childElementCount <= 2 && !el.closest('button,select,input,textarea,table,.cr-tabs')) {
      const tx = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      if (tx && tx.length <= 14 && /^[\s$%+−\-–—,.:0-9kKmMxX/]+$/.test(tx) && /\d|—|–/.test(tx)) el.classList.add('cr-num');
    }
    if (tag === 'H1' && fs >= 30 && !el.closest('.cr-tabs')) el.classList.add('cr-h1');
    if (tag === 'H2' && fs >= 22 && /condensed|barlow|tight/i.test(cs.fontFamily) && !el.closest('.fos-hd')) el.classList.add('cr-h2');
    if (cs.position === 'sticky' && r0(el).width >= innerWidth * .9) { const b = rgba(cs.backgroundColor); if (b && b.a > .5 && b.r > 225) { el.classList.add('cr-bar'); return; } }
    if (!bg || bg.a < .9) return;
    const dentro = el.parentElement && el.parentElement.closest('.cr-v,.cr-m,.cr-t2');
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') { if (claro(bg) && dentro) el.classList.add('cr-in'); return; }
    if (!claro(bg)) return;
    if (CELDA.has(tag) || SALTA.has(tag)) { if (dentro) el.classList.add(blanco(bg) ? 'cr-t' : 'cr-t2'); return; }
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) { if (!r.width) el.__cr = 0; return; }
    const esBoton = tag === 'BUTTON' || el.getAttribute('role') === 'button' || (tag === 'A' && r.height < 56);
    if (esBoton) { if (dentro && blanco(bg)) el.classList.add('cr-t'); return; }
    // fondo de página: bloques de ancho completo sin redondear
    if (r.width >= innerWidth * .9 && parseFloat(cs.borderTopLeftRadius) < 4) { el.classList.add('cr-t'); return; }
    if (dentro) { el.classList.add(blanco(bg) ? 'cr-t' : 'cr-t2'); return; }
    // ventanas flotantes (modales, hojas) → vidrio más opaco
    if (el.closest('dialog,[role="dialog"]') || cs.position === 'fixed' || (el.parentElement && getComputedStyle(el.parentElement).position === 'fixed')) { el.classList.add('cr-m'); return; }
    el.classList.add('cr-v');
    if (cs.borderTopWidth === '0px') el.classList.add('cr-sinborde');
    if (tag === 'A' || cs.cursor === 'pointer') el.classList.add('cr-hov');
    nuevos.push(el);
  }

  // ── pestañas: el indicador copia el aspecto del botón activo y se desliza ──
  const ACTIVO = '[aria-current="true"],[aria-current="page"],[aria-pressed="true"],[aria-selected="true"],.active,.on,.sel,.is-active,.current,.activo,.act';
  function pestanas(raiz) {
    (raiz.querySelectorAll ? raiz : D).querySelectorAll('[role="tablist"],div,nav').forEach(c => {
      if (c.__crt || c.closest('[data-cr-no],#fos-sheet')) return;
      const hijos = [...c.children].filter(x => x.matches('button,a,[role="tab"]'));
      if (hijos.length < 2 || hijos.length !== [...c.children].filter(x => !x.classList.contains('cr-ind')).length) return;
      const act = hijos.filter(x => x.matches(ACTIVO));
      if (act.length !== 1) return;
      const cs = getComputedStyle(act[0]), bg = rgba(cs.backgroundColor);
      const otro = hijos.find(x => x !== act[0]), bo = otro && rgba(getComputedStyle(otro).backgroundColor);
      const pinta = (bg && bg.a > .3 && !(bo && bo.a > .3 && bo.r === bg.r && bo.g === bg.g && bo.b === bg.b)) || cs.backgroundImage !== 'none';
      if (!pinta) return;
      const r0 = act[0].getBoundingClientRect(); if (!r0.width) return;
      c.__crt = 1;
      const ind = D.createElement('i'); ind.className = 'cr-ind'; ind.setAttribute('aria-hidden', 'true');
      ['backgroundColor', 'backgroundImage', 'boxShadow', 'borderRadius', 'border'].forEach(k => ind.style[k] = cs[k]);
      c.classList.add('cr-tabs'); c.prepend(ind);
      let primero = true;
      const mover = () => {
        const a = [...c.children].find(x => x !== ind && x.matches(ACTIVO));
        [...c.children].forEach(x => x.classList.toggle('cr-act', x === a));
        if (!a || !a.offsetWidth) { ind.style.opacity = 0; return; }
        if (primero || QUIETO) ind.style.transition = 'none';
        ind.style.opacity = 1; ind.style.left = a.offsetLeft + 'px'; ind.style.top = a.offsetTop + 'px'; ind.style.width = a.offsetWidth + 'px'; ind.style.height = a.offsetHeight + 'px';
        if (primero) { void ind.offsetWidth; ind.style.transition = ''; primero = false; }
      };
      mover();
      new MutationObserver(() => requestAnimationFrame(mover)).observe(c, { attributes: true, subtree: true, attributeFilter: ['class', 'aria-current', 'aria-pressed', 'aria-selected'], childList: true });
      new ResizeObserver(() => { primero = true; mover(); }).observe(c);
    });
  }

  // ── entrada escalonada de lo nuevo que está a la vista ──
  function entrar() {
    if (QUIETO || !nuevos.length) { nuevos.length = 0; return; }
    const vis = nuevos.splice(0).filter(el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; }).slice(0, 18);
    vis.forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(14px)', filter: 'blur(7px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
      { duration: 650, delay: Math.min(i, 12) * 45, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
  }

  function barrer(raiz) {
    if (raiz === D.body) { D.body.querySelectorAll('*').forEach(clasificar); }
    else { clasificar(raiz); raiz.querySelectorAll && raiz.querySelectorAll('*').forEach(clasificar); }
  }

  function arrancar() {
    H.classList.add('cr');
    const st = D.createElement('style'); st.id = 'cr-css'; st.textContent = CSS; D.head.appendChild(st);
    if (!D.querySelector('link[href*="Instrument+Serif"]')) { const l = D.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap'; D.head.appendChild(l); }
    const amb = D.createElement('div'); amb.className = 'cr-amb'; amb.setAttribute('aria-hidden', 'true'); amb.innerHTML = '<i></i><i></i><i></i><i></i>'; D.body.prepend(amb);
    barrer(D.body); pestanas(D); entrar();
    let pend = new Set(), t;
    new MutationObserver(ms => {
      ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && pend.add(n)));
      if (!pend.size) return;
      clearTimeout(t); t = setTimeout(() => {
        const lote = [...pend]; pend = new Set();
        lote.forEach(n => n.isConnected && barrer(n));
        lote.forEach(n => n.isConnected && pestanas(n.parentElement || n));
        entrar();
      }, 40);
    }).observe(D.body, { childList: true, subtree: true });
    // lo que estaba oculto (pestañas que se muestran después) se clasifica al aparecer
    D.addEventListener('click', () => setTimeout(() => { D.body.querySelectorAll('*').forEach(el => { if (el.__cr === 0) { el.__cr = undefined; clasificar(el); } }); pestanas(D); entrar(); }, 60), true);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', () => setTimeout(arrancar, 30)); else setTimeout(arrancar, 30);
})();
