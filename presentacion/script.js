/* ═══════════════════════════════════════════════
   FOTON PRESENTACIÓN · motor de diapositivas
   Teclado (← → espacio, Inicio/Fin, F), rueda, deslizar,
   puntos de navegación, enlace directo (#3) y conteo animado.
═══════════════════════════════════════════════ */
(function () {
  'use strict';

  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var dotsEl = document.getElementById('dots');
  var cnt = document.getElementById('cnt');
  var bar = document.getElementById('bar');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var fsBtn = document.getElementById('fs');
  var cur = -1;
  var lock = false;

  var pad = function (n) { return String(n).padStart(2, '0'); };

  slides.forEach(function (s, i) {
    var d = document.createElement('button');
    d.className = 'dot';
    d.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
    d.addEventListener('click', function () { go(i); });
    dotsEl.appendChild(d);
  });
  var dots = Array.prototype.slice.call(dotsEl.children);

  /* Conteo animado de cifras */
  var fmt = new Intl.NumberFormat('es-MX');
  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach(function (el) {
      var to = +el.dataset.count, pre = el.dataset.prefix || '', t0 = null, dur = 1600;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = pre + fmt.format(to); return; }
      el.textContent = pre + '0';
      function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = pre + fmt.format(Math.round(to * e));
        if (p < 1 && root.classList.contains('on')) requestAnimationFrame(step);
        else el.textContent = pre + fmt.format(to);
      }
      setTimeout(function () { requestAnimationFrame(step); }, 450);
    });
  }

  function go(i) {
    i = Math.max(0, Math.min(total - 1, i));
    if (i === cur) return;
    slides.forEach(function (s, k) {
      s.classList.toggle('on', k === i);
      s.classList.toggle('past', k < i);
      s.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      if (k === i) { var inn = s.querySelector('.inner'); if (inn) inn.scrollTop = 0; }
    });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    cnt.innerHTML = '<b>' + pad(i + 1) + '</b> / ' + pad(total);
    bar.style.width = ((i + 1) / total * 100) + '%';
    prev.disabled = i === 0;
    next.disabled = i === total - 1;
    cur = i;
    countUp(slides[i]);
    if (history.replaceState) history.replaceState(null, '', '#' + (i + 1));
    lock = true; setTimeout(function () { lock = false; }, 650);
  }

  prev.addEventListener('click', function () { go(cur - 1); });
  next.addEventListener('click', function () { go(cur + 1); });

  /* Teclado */
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].indexOf(k) > -1) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].indexOf(k) > -1) { e.preventDefault(); go(cur - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(total - 1); }
    else if (k === 'f' || k === 'F' || k === 'F11') { e.preventDefault(); toggleFS(); }
  });

  /* Rueda / trackpad: respeta el scroll interno si la diapositiva lo necesita */
  window.addEventListener('wheel', function (e) {
    var inn = slides[cur].querySelector('.inner');
    var dy = e.deltaY || e.deltaX;
    if (inn && inn.scrollHeight > inn.clientHeight + 4) {
      var atTop = inn.scrollTop <= 0, atBot = inn.scrollTop + inn.clientHeight >= inn.scrollHeight - 2;
      if ((dy > 0 && !atBot) || (dy < 0 && !atTop)) return;
    }
    if (lock || Math.abs(dy) < 18) return;
    go(cur + (dy > 0 ? 1 : -1));
  }, { passive: true });

  /* Deslizar (horizontal) en pantallas táctiles */
  var sx = 0, sy = 0;
  window.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* Pantalla completa */
  function toggleFS() {
    var d = document, el = d.documentElement;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d);
    }
  }
  fsBtn.addEventListener('click', toggleFS);
  window.toggleFS = toggleFS;

  /* Oculta los controles cuando el presentador no mueve el mouse */
  var idleT;
  function wake() {
    document.body.classList.remove('idle');
    clearTimeout(idleT);
    idleT = setTimeout(function () { document.body.classList.add('idle'); }, 2800);
  }
  ['mousemove', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, wake, { passive: true }); });

  /* Precarga de fondos para transiciones sin parpadeo */
  slides.forEach(function (s) {
    var bg = s.querySelector('.bg');
    if (!bg) return;
    var m = /url\(['"]?([^'")]+)/.exec(bg.style.backgroundImage);
    if (m) { var im = new Image(); im.src = m[1]; }
  });

  var start = parseInt((location.hash || '').slice(1), 10);
  go(isNaN(start) ? 0 : start - 1);
  wake();
})();
