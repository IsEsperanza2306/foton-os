/* Foton OS — Shared auth guard + tab navigation
   Usage: set window.NAV_ACTIVE_TAB BEFORE loading this script
   Load order: _config.js → supabase CDN → _nav.js (end of <body>) */

(function () {
  'use strict';

  const PAGE = (window.NAV_ACTIVE_TAB || '').toLowerCase();
  const IS_LOGIN = PAGE === 'login';

  // Prevent flash of protected content while checking session
  if (!IS_LOGIN) {
    document.documentElement.style.visibility = 'hidden';
  }

  const TABS = [
    {
      id: 'mapa',
      label: 'Mapa',
      href: './mapa.html',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>'
    },
    {
      id: 'visita',
      label: 'Registro de Visita',
      href: './field-app.html',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
    },
    {
      id: 'tracker',
      label: 'BP Tracker',
      href: './bp-tracker.html',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
    },
    {
      id: 'panel',
      label: 'Panel',
      href: './panel.html',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
    },
    {
      id: 'direccion',
      label: 'Dirección',
      href: './direccion.html',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
    }
  ];

  const NAV_H = 60;

  function buildCSS() {
    return `
      body { padding-bottom: ${NAV_H}px !important; }

      #_foton-nav {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: ${NAV_H}px;
        background: #ffffff;
        border-top: 1.5px solid #F0F0F5;
        display: flex;
        z-index: 400;
        padding-bottom: env(safe-area-inset-bottom, 0px);
        box-shadow: 0 -2px 16px rgba(0,0,0,0.06);
      }
      ._fnav-tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        text-decoration: none;
        color: #C4C4D0;
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.1px;
        transition: color .15s;
        padding: 6px 2px 4px;
        position: relative;
        -webkit-tap-highlight-color: transparent;
      }
      ._fnav-tab svg {
        width: 22px; height: 22px;
        flex-shrink: 0;
        transition: stroke .15s;
      }
      ._fnav-tab:hover { color: #185FA5; }
      ._fnav-tab._active {
        color: #185FA5;
      }
      ._fnav-tab._active::after {
        content: '';
        position: absolute;
        top: 0; left: 15%; right: 15%;
        height: 2.5px;
        background: #185FA5;
        border-radius: 0 0 3px 3px;
      }
      ._fnav-label {
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }
      @media (min-width: 768px) {
        ._fnav-label { font-size: 10px; }
      }
    `;
  }

  function buildNavHTML() {
    return TABS.map(t => {
      const isActive = PAGE === t.id;
      return `<a href="${t.href}" class="_fnav-tab${isActive ? ' _active' : ''}" title="${t.label}" aria-label="${t.label}" aria-current="${isActive ? 'page' : 'false'}">
        ${t.icon}
        <span class="_fnav-label">${t.label}</span>
      </a>`;
    }).join('');
  }

  function injectNav() {
    const style = document.createElement('style');
    style.id = '_foton-nav-style';
    style.textContent = buildCSS();
    document.head.appendChild(style);

    const nav = document.createElement('nav');
    nav.id = '_foton-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navegación principal');
    nav.innerHTML = buildNavHTML();
    document.body.appendChild(nav);
  }

  async function init() {
    try {
      if (typeof supabase === 'undefined' || !window.FOTON_CONFIG) {
        throw new Error('Supabase no disponible');
      }

      const db = supabase.createClient(
        window.FOTON_CONFIG.SUPABASE_URL,
        window.FOTON_CONFIG.SUPABASE_ANON_KEY
      );

      const { data: { session }, error } = await db.auth.getSession();

      if (error) throw error;

      if (!session && !IS_LOGIN) {
        location.replace('./login.html');
        return;
      }

      if (session && IS_LOGIN) {
        location.replace('./mapa.html');
        return;
      }

      if (session) {
        window.FOTON_USER = session.user;
        window.FOTON_DB = db;
        window.FOTON_EMAIL = session.user.email;

        // Fetch user profile to get role, segment, and dealer assignment
        const { data: profileRows } = await db
          .from('usuarios')
          .select('rol, distribuidor_id, segmento_id')
          .eq('id', session.user.id)
          .limit(1);

        const userProfile = profileRows?.[0] || null;

        window.FOTON_ROL = userProfile?.rol || 'regional';
        window.FOTON_DISTRIBUIDOR_ID = userProfile?.distribuidor_id || null;
        window.FOTON_SEGMENTO = userProfile?.segmento_id || null;

        // Dealer users go to dealer-portal, not mapa
        if (userProfile?.rol === 'dealer' && !PAGE.includes('dealer-portal')) {
          location.replace('./dealer-portal.html');
          return;
        }

        // Non-dealer users trying to access dealer-portal get redirected
        if (userProfile?.rol !== 'dealer' && PAGE.includes('dealer-portal')) {
          location.replace('./mapa.html');
          return;
        }

        // Regional and director users go to panel (not mapa) after login
        const PANEL_ROLES = ['regional', 'director', 'direccion', 'admin'];
        if (PANEL_ROLES.includes(userProfile?.rol) && PAGE === 'login') {
          location.replace('./panel.html');
          return;
        }
      }

    } catch (e) {
      if (!IS_LOGIN) {
        location.replace('./login.html');
        return;
      }
    }

    // Reveal page (remove auth gate)
    document.documentElement.style.visibility = '';

    if (IS_LOGIN) return;

    // Dealer portal has its own tab bar — don't inject plant nav
    if (window.FOTON_ROL !== 'dealer') {
      injectNav();
    }

    // Signal pages that auth is confirmed and FOTON_USER is set
    window.dispatchEvent(new CustomEvent('FotonAuthReady', { detail: { user: window.FOTON_USER } }));
  }

  // Failsafe: if auth check takes >5s, redirect to login (never reveal unauth content)
  var _failsafe = setTimeout(function () {
    if (!window.FOTON_USER && !IS_LOGIN) {
      location.replace('./login.html');
    }
  }, 5000);

  init();
})();
