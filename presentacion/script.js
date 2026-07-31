/* ═══════════════════════════════════════════════
   FOTON PRESENTACIÓN · script.js
═══════════════════════════════════════════════ */
(function () {
    'use strict';

    const deck          = document.getElementById('deck');
    const slides        = document.querySelectorAll('.slide');
    const progressBar   = document.getElementById('progressBar');
    const currentSlide  = document.querySelector('.current-slide');
    const totalSlides   = slides.length;

    /* ── Update HUD ── */
    function updateHUD(index) {
        const n = index + 1;
        currentSlide.textContent = String(n).padStart(2, '0');
        progressBar.style.width  = ((n / totalSlides) * 100) + '%';
    }

    /* ── IntersectionObserver to activate slides ── */
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                const idx = Array.from(slides).indexOf(entry.target);
                updateHUD(idx);
            }
        });
    }, {
        root:      deck,
        threshold: 0.55
    });

    slides.forEach(function (slide) {
        observer.observe(slide);
    });

    /* Activate first slide immediately */
    if (slides.length) slides[0].classList.add('active');

    /* ── Keyboard Navigation ── */
    document.addEventListener('keydown', function (e) {
        const key = e.key;
        if (key === 'ArrowDown' || key === 'PageDown' || key === ' ') {
            e.preventDefault();
            const active = document.querySelector('.slide.active');
            const next   = active && active.nextElementSibling;
            if (next && next.classList.contains('slide')) next.scrollIntoView({ behavior: 'smooth' });
        }
        if (key === 'ArrowUp' || key === 'PageUp') {
            e.preventDefault();
            const active = document.querySelector('.slide.active');
            const prev   = active && active.previousElementSibling;
            if (prev && prev.classList.contains('slide')) prev.scrollIntoView({ behavior: 'smooth' });
        }
    });

    /* ── Particles.js ── */
    if (window.particlesJS) {
        particlesJS('particles-js', {
            particles: {
                number:    { value: 55, density: { enable: true, value_area: 900 } },
                color:     { value: '#00B4D8' },
                shape:     { type: 'circle' },
                opacity:   { value: 0.35, random: true, anim: { enable: true, speed: 0.8, opacity_min: 0.05 } },
                size:      { value: 2.5,  random: true },
                line_linked:{ enable: true, distance: 140, color: '#00B4D8', opacity: 0.12, width: 1 },
                move:      { enable: true, speed: 0.8, random: true, out_mode: 'out' }
            },
            interactivity: {
                detect_on: 'canvas',
                events:    { onhover: { enable: true, mode: 'grab' }, onclick: { enable: false } },
                modes:     { grab: { distance: 160, line_linked: { opacity: 0.3 } } }
            },
            retina_detect: true
        });
    }

})();
