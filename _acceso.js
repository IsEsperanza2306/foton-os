/* Foton OS · Acceso único
   Una sola sesión (correo o Google) para toda la plataforma. El rol sale de la tabla `usuarios`.
   Uso: <script src="_acceso.js" data-area="interno"></script> lo más arriba posible en <head>.
   Áreas: interno | dealer | asesor. Sin data-area solo expone FotonAcceso (p. ej. el login). */
(function () {
  'use strict';
  const SCRIPT = document.currentScript;
  const BASE = new URL('.', SCRIPT.src);
  const AREA = SCRIPT.dataset.area || '';

  // Quién entra a cada portal. Los correos MASTER entran a todo (para soporte y pruebas).
  const PLANTA = ['regional', 'admin', 'direccion', 'director'];
  const ACCESO = { interno: PLANTA, dealer: ['gerente'], asesor: ['asesor', 'gerente'] };
  const MASTER = ['israel.esperanza.h@gmail.com', 'israel.esperanza@ldrsolutions.com.mx'];
  // Dentro de Interno, cada herramienta tiene sus roles (clave = archivo). Master entra a todas.
  //   dir = direccion/director · adm = admin (Administración) · reg = regional (Gerente Regional)
  const G = { dir: ['direccion', 'director'], adm: ['admin'], reg: ['regional'] };
  const DA = [...G.dir, ...G.adm], DR = [...G.dir, ...G.reg], TODOS = [...G.dir, ...G.adm, ...G.reg];
  const HERRAMIENTAS = {
    'panel.html': TODOS, 'panel-seguimiento.html': TODOS, 'pipeline-gr.html': TODOS,
    'control-leads/': DA, 'inventario/': DA, 'foton_admin.html': DA,
    'bp-tracker.html': TODOS, 'direccion.html': G.dir, 'field-app.html': DR, 'mapa.html': DR,
    'foton-field-app.html': DA, 'foton_bp_tracker.html': DA
  };
  const clave = p => String(p || '').split(/[?#]/)[0].replace(/index\.html$/, '');
  const veHerramienta = (t, perfil) => {
    perfil = perfil || window.FOTON_PERFIL;
    if (!perfil || !t || t.area !== 'interno' || !t.path) return true;
    const roles = HERRAMIENTAS[clave(t.path)];
    return esMaster(perfil.email) || !roles || roles.includes(perfil.rol);
  };
  const paginaActual = () => clave(location.pathname.replace(BASE.pathname, ''));
  const HOME = { interno: 'interno/', dealer: 'distribuidores/', asesor: 'asesores/' };
  const NOMBRE = { interno: 'Foton Interno', dealer: 'Foton Dealer', asesor: 'Foton Asesor' };
  const ROL = { regional: 'Regional', admin: 'Administrador', direccion: 'Dirección', director: 'Director', gerente: 'Gerente', asesor: 'Asesor' };

  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const url = p => new URL(p, BASE).href;
  const esMaster = email => MASTER.includes(String(email || '').toLowerCase());
  const puede = (perfil, area) => !!perfil && (esMaster(perfil.email) || (ACCESO[area] || []).includes(perfil.rol));
  const portalDe = perfil => esMaster(perfil.email) || PLANTA.includes(perfil.rol) ? 'interno' : perfil.rol === 'gerente' ? 'dealer' : 'asesor';
  const portalesDe = perfil => Object.keys(ACCESO).filter(a => puede(perfil, a));

  const cargar = src => new Promise((ok, err) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => err(new Error(src)); document.head.appendChild(s); });
  let dbP;
  function cliente() {
    return dbP || (dbP = (async () => {
      if (!window.FOTON_CONFIG) await cargar(url('_config.js'));
      if (!window.supabase) await cargar('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
      return (window.FOTON_DB = window.FOTON_DB || window.supabase.createClient(FOTON_CONFIG.SUPABASE_URL, FOTON_CONFIG.SUPABASE_ANON_KEY));
    })());
  }

  // Las páginas que consultan la base con fetch y la llave pública reciben aquí el token de la sesión:
  // así la base las reconoce como el usuario (y aplica su región o distribuidor) sin tocar cada página.
  const fetch0 = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    try {
      const u = typeof input === 'string' ? input : (input && input.url) || '';
      const h = init && init.headers;
      if (/\.supabase\.co\/rest\/v1\//.test(u) && h && !(h instanceof Headers) && !Array.isArray(h) && h.apikey && h.Authorization === 'Bearer ' + h.apikey) {
        const { data } = await (await cliente()).auth.getSession();
        if (data.session) init = Object.assign({}, init, { headers: Object.assign({}, h, { Authorization: 'Bearer ' + data.session.access_token }) });
      }
    } catch (e) { /* si algo falla se usa la llave pública como antes */ }
    return fetch0(input, init);
  };

  async function perfilActual() {
    const db = await cliente();
    const { data } = await db.auth.getSession();
    if (!data.session) return { sesion: null, perfil: null };
    let perfil = null;
    try { const r = await db.rpc('fn_mi_perfil'); perfil = r.data || null; } catch (e) { /* sin perfil */ }
    return { sesion: data.session, perfil };
  }

  const aLogin = () => location.replace(url('login.html') + '?next=' + encodeURIComponent(location.pathname.replace(BASE.pathname, '') + location.search + location.hash));

  function pantalla(titulo, texto, botones) {
    document.documentElement.style.visibility = '';
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:#F5F5F7;font:15px/1.5 Inter,-apple-system,system-ui,sans-serif;color:#1D1D1F';
    d.innerHTML = `<div style="max-width:440px;background:#fff;border-radius:22px;padding:28px;box-shadow:0 6px 28px rgba(0,0,0,.08)"><div style="font:800 22px Archivo,Inter,sans-serif;letter-spacing:-.02em;margin-bottom:6px">${titulo}</div><p style="margin:0 0 18px;color:#6E6E73">${texto}</p><div style="display:flex;gap:8px;flex-wrap:wrap">${botones.map((b, i) => `<a href="${b.href}" ${b.salir ? 'data-salir' : ''} style="text-decoration:none;padding:10px 16px;border-radius:12px;font-weight:600;font-size:14px;${i ? 'background:#E9E9EE;color:#1D1D1F' : 'background:#1363D6;color:#fff'}">${b.t}</a>`).join('')}</div></div>`;
    document.body ? document.body.appendChild(d) : document.addEventListener('DOMContentLoaded', () => document.body.appendChild(d));
    d.querySelector('[data-salir]')?.addEventListener('click', async e => { e.preventDefault(); await salir(); });
  }

  async function salir() {
    const db = await cliente();
    try { await db.auth.signOut(); } catch (e) { /* ya salió */ }
    try { ['foton_pin', 'foton_dealer', 'foton-inv-pin', 'foton_via_email', 'foton_dist_sel'].forEach(k => sessionStorage.removeItem(k)); localStorage.removeItem('foton_dist_pin'); } catch (e) { /* sin storage */ }
    location.replace(url('login.html'));
  }

  // Chip de usuario (nombre, rol, portales, salir) abajo a la derecha
  function chip(perfil) {
    const portales = portalesDe(perfil);
    const d = document.createElement('div');
    d.id = 'fos-chip';
    d.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147482000;font:600 12px Inter,-apple-system,system-ui,sans-serif;color:#1D1D1F';
    d.innerHTML = `<button style="display:flex;align-items:center;gap:8px;border:0;border-radius:980px;padding:7px 12px 7px 8px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.18);cursor:pointer;font:inherit;color:inherit" aria-haspopup="true"><span style="width:22px;height:22px;border-radius:50%;background:#1363D6;color:#fff;display:grid;place-items:center;font-size:11px">${(perfil.nombre || '?').trim()[0].toUpperCase()}</span>${(perfil.nombre || '').split(' ')[0]}</button>
    <div hidden style="position:absolute;right:0;bottom:44px;min-width:210px;background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.2);padding:8px">
      <div style="padding:8px 10px;color:#6E6E73;font-weight:500">${perfil.email}<br><b style="color:#1D1D1F">${esMaster(perfil.email) ? 'Master' : ROL[perfil.rol] || perfil.rol}</b>${perfil.distribuidor ? ' · ' + perfil.distribuidor : ''}</div>
      ${portales.map(a => `<a href="${url(HOME[a])}" style="display:block;padding:8px 10px;border-radius:10px;color:#1D1D1F;text-decoration:none">${NOMBRE[a]}</a>`).join('')}
      ${(AREA === 'dealer' || AREA === 'asesor') && !perfil.distribuidor_id ? '<a href="#" data-cambiar style="display:block;padding:8px 10px;border-radius:10px;color:#1D1D1F;text-decoration:none">Cambiar distribuidor</a>' : ''}
      <a href="#" data-out style="display:block;padding:8px 10px;border-radius:10px;color:#C25E00;text-decoration:none">Cerrar sesión</a></div>`;
    const [b, m] = d.children;
    b.onclick = () => { m.hidden = !m.hidden; };
    const cam = d.querySelector('[data-cambiar]'); if (cam) cam.onclick = e => { e.preventDefault(); PIN_KEYS.forEach(ss.del); location.reload(); };
    d.querySelector('[data-out]').onclick = async e => { e.preventDefault(); await salir(); };
    const poner = () => document.body.appendChild(d);
    document.body ? poner() : document.addEventListener('DOMContentLoaded', poner);
  }

  // Dealer y Asesor: con sesión de correo se entra al distribuidor sin teclear PIN.
  // La base entrega el PIN de tu distribuidor (fn_pin_acceso); planta y master eligen cuál ver.
  const PIN_KEYS = ['foton_pin', 'foton_dealer', 'foton_via_email', 'foton_dist_sel'];
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* sin storage */ } }, del: k => { try { sessionStorage.removeItem(k); } catch (e) { /* sin storage */ } } };

  function elegirDistribuidor(db) {
    return new Promise(async ok => {
      const { data } = await db.from('distribuidores').select('id,nombre').order('nombre');
      document.documentElement.style.visibility = '';
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:#F5F5F7;font:15px/1.5 Inter,-apple-system,system-ui,sans-serif;color:#1D1D1F';
      d.innerHTML = `<div style="max-width:440px;width:100%;background:#fff;border-radius:22px;padding:28px;box-shadow:0 6px 28px rgba(0,0,0,.08)"><div style="font:800 22px Archivo,Inter,sans-serif;letter-spacing:-.02em;margin-bottom:6px">¿Qué distribuidor quieres ver?</div><p style="margin:0 0 16px;color:#6E6E73">Entras como ${esc(window.FOTON_PERFIL.nombre)}. Elige el distribuidor para abrir su vista.</p><select style="width:100%;padding:11px 12px;border-radius:12px;border:1px solid #D2D2D7;font:inherit;margin-bottom:14px">${(data || []).map(x => `<option value="${esc(x.id)}">${esc(x.nombre)}</option>`).join('')}</select><button style="border:0;border-radius:12px;padding:11px 18px;background:#1363D6;color:#fff;font:600 14px inherit;cursor:pointer">Abrir</button></div>`;
      document.body.appendChild(d);
      d.querySelector('button').onclick = () => { const v = d.querySelector('select').value; d.remove(); ok(v || null); };
    });
  }

  // true = la página ya puede seguir; false = se recarga o se mostró un aviso
  async function puente(perfil) {
    const db = await cliente();
    let dist = perfil.distribuidor_id;
    if (!dist) {
      dist = ss.get('foton_dist_sel');
      if (!dist) { dist = await elegirDistribuidor(db); if (!dist) return false; ss.set('foton_dist_sel', dist); }
    }
    if (ss.get('foton_via_email') === dist && ss.get('foton_pin')) return true;
    const { data, error } = await db.rpc('fn_pin_acceso', { p_dist: dist });
    if (error || !data) { pantalla('No se pudo abrir tu distribuidor', 'Tu cuenta no tiene un distribuidor con acceso asignado. Avisa a Foton México.', [{ t: 'Cerrar sesión', href: '#', salir: true }]); return false; }
    ss.set('foton_pin', data); ss.set('foton_via_email', dist); ss.del('foton_dealer');
    location.reload();
    return false;
  }

  async function guardia(area) {
    document.documentElement.style.visibility = 'hidden';
    const falla = setTimeout(() => pantalla('No se pudo verificar tu acceso', 'Revisa tu conexión e inténtalo de nuevo.', [{ t: 'Reintentar', href: location.href }]), 8000);
    try {
      const { sesion, perfil } = await perfilActual();
      clearTimeout(falla);
      if (!sesion) return aLogin();
      if (!perfil) return pantalla('Tu correo aún no tiene acceso', `${sesion.user.email} no está dado de alta en Foton OS. Pide a tu gerente o a Foton México que te den de alta.`, [{ t: 'Usar otra cuenta', href: '#', salir: true }]);
      window.FOTON_PERFIL = perfil;
      if (!puede(perfil, area)) return pantalla('Esta sección no es para tu perfil', `${NOMBRE[area]} es para ${area === 'interno' ? 'el equipo de Foton México' : area === 'dealer' ? 'gerentes de distribuidor' : 'asesores'}. Tu perfil es ${ROL[perfil.rol] || perfil.rol}.`, [{ t: 'Ir a mi portal', href: url(HOME[portalDe(perfil)]) }, { t: 'Cerrar sesión', href: '#', salir: true }]);
      const rolesPag = HERRAMIENTAS[paginaActual()];
      if (area === 'interno' && rolesPag && !esMaster(perfil.email) && !rolesPag.includes(perfil.rol)) return pantalla('Esta herramienta no es para tu rol', `Tu perfil (${ROL[perfil.rol] || perfil.rol}) no tiene esta herramienta en Foton Interno.`, [{ t: 'Ir a Foton Interno', href: url(HOME.interno) }, { t: 'Cerrar sesión', href: '#', salir: true }]);
      if ((area === 'dealer' || area === 'asesor') && !(await puente(perfil))) return;
      document.documentElement.style.visibility = '';
      chip(perfil);
      window.dispatchEvent(new CustomEvent('FotonAccesoListo', { detail: { perfil } }));
    } catch (e) {
      clearTimeout(falla);
      pantalla('No se pudo verificar tu acceso', 'Revisa tu conexión e inténtalo de nuevo.', [{ t: 'Reintentar', href: location.href }]);
    }
  }

  window.FotonAcceso = { HERRAMIENTAS, veHerramienta, ACCESO, HOME, NOMBRE, ROL, MASTER, url, esMaster, puede, portalDe, portalesDe, cliente, perfilActual, salir, chip };
  const pinHeredado = () => /[#&]pin=\d{6}/.test(location.hash) || (!!ss.get('foton_pin') && !ss.get('foton_via_email'));
  if (AREA && !(SCRIPT.hasAttribute('data-pin-ok') && pinHeredado())) guardia(AREA);
})();
