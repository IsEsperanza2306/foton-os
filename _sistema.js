/* Foton OS — Sistema
   Un solo catálogo de herramientas para todo el sitio.
   - En las páginas de inicio (index.html, distribuidores/, asesores/, interno/)
     dibuja las puertas y las tarjetas: FotonSistema.hub('asesores').
   - En cualquier otra página agrega el botón "Foton OS" para moverse
     entre las herramientas de su área.
   Uso en una herramienta: <script src="_sistema.js" defer></script>
   (data-offset="72" en el script si la página ya tiene una barra fija abajo). */

(function () {
  'use strict';

  const SCRIPT = document.currentScript;
  const BASE = new URL('.', SCRIPT ? SCRIPT.src : location.href);
  const OFFSET = SCRIPT && SCRIPT.dataset.offset ? +SCRIPT.dataset.offset : 0;

  const ICONS = {
    store:    '<path d="M3 9.5l1.2-5h15.6l1.2 5"/><path d="M3 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"/><path d="M5 10v9.5h14V10"/><rect x="9.5" y="14" width="5" height="5.5"/>',
    user:     '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    shield:   '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    cart:     '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 7.5H6.3"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01"/><path d="M10 21v-3h4v3"/>',
    map:      '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>',
    gauge:    '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-5"/><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
    clipboard:'<rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2.5" width="6" height="3" rx="1"/><path d="M9 12l2 2 4-4"/>',
    funnel:   '<path d="M3 4.5h18l-7 8.5v6l-4 2v-8z"/>',
    calc:     '<rect x="5" y="2.5" width="14" height="19" rx="2"/><line x1="8" y1="6.5" x2="16" y2="6.5"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M8 18h.01M12 18h.01"/><line x1="16" y1="14.5" x2="16" y2="18"/>',
    book:     '<path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 1 3 18.5z"/><path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5a2.5 2.5 0 0 0 2.5-2.5z"/>',
    search:   '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    target:   '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    check:    '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.3 2.3 4.7-5"/>',
    truck:    '<rect x="2" y="6" width="12" height="11" rx="1.5"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="6.5" cy="18.5" r="1.8"/><circle cx="16.5" cy="18.5" r="1.8"/>',
    traffic:  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="8" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none"/>',
    archive:  '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><line x1="10" y1="13" x2="14" y2="13"/>',
    award:    '<circle cx="12" cy="9" r="6"/><path d="M9 14l-1.5 7 4.5-2.5 4.5 2.5-1.5-7"/>',
    compass:  '<circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5"/>',
    pin:      '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/>',
    trend:    '<polyline points="3 17 9 11 13 15 21 6"/><polyline points="15 6 21 6 21 12"/>',
    home:     '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    grid:     '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    arrow:    '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    ext:      '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    close:    '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>'
  };

  // Tipos de acceso
  const ACCESS = {
    pin:     { label: 'Con tu cuenta', tone: 'purple' },
    invpin:  { label: 'Con tu cuenta', tone: 'purple' },
    login:   { label: 'Con tu cuenta', tone: 'blue' },
    open:    { label: 'Acceso libre', tone: 'gray' },
    ext:     { label: 'Sitio aparte', tone: 'gray' }
  };

  const AREAS = [
    {
      id: 'distribuidores', label: 'Distribuidores', icon: 'store', tone: 'purple',
      who: 'Dueños y gerencia de cada distribuidor',
      desc: 'Cobertura, cobranza, back order, inventario, pedidos y tu equipo comercial, con el PIN de tu distribuidor.'
    },
    {
      id: 'asesores', label: 'Asesores', icon: 'user', tone: 'orange',
      who: 'Vendedores especialistas MDT / LDT',
      desc: 'Tu app de campo con el comparativo contra la competencia, más tu avance, reporte, pipeline, guía y capacitación.',
      note: 'Empieza en la app Foton Dealer. Desde ahí llegas a Mi día (avance, pipeline y reporte de campo) con el PIN de tu distribuidor, una sola vez.'
    },
    {
      id: 'interno', label: 'Interno Foton', icon: 'shield', tone: 'blue',
      who: 'Equipo Foton México',
      desc: 'Control de la red: cobranza, inventario, seguimiento de asesores, pipeline regional y dirección.'
    }
  ];

  // path: relativo a la raíz del sitio. alias: otras URLs que abren la misma herramienta.
  const TOOLS = [
    // ── Distribuidores
    { id: 'dealer', area: 'distribuidores', group: 'Mi distribuidor', icon: 'store', title: 'Portal de Distribuidores',
      desc: 'Cobertura por modelo, cobranza, back order, inventario y ventas retail.', path: 'dealer.html', access: 'pin', hero: true },
    { id: 'pedidos', area: 'distribuidores', group: 'Mi distribuidor', icon: 'cart', title: 'Pedidos de unidades',
      desc: 'Arma, imprime y envía tu pedido con la lista de precios vigente.', path: 'dealer.html?tab=pedidos', access: 'pin',
      alias: ['pedido.html', 'pedido/', 'pedido-modulo.html'] },
    { id: 'equipo', area: 'distribuidores', group: 'Mi distribuidor', icon: 'user', title: 'Equipo comercial',
      desc: 'Tu vendedor especialista, pipeline, pendientes, reporte de campo, avance del asesor y cotizador.', path: 'dealer.html?tab=equipo', access: 'pin' },
    { id: 'presentacion', area: 'distribuidores', also: ['asesores'], group: 'Material Foton', icon: 'building', title: 'Presentación Corporativa',
      desc: 'Foton, BAIC y la red en México: respaldo, planta, postventa y alianzas.', path: 'presentacion/', access: 'open' },
    { id: 'red', area: 'distribuidores', also: ['asesores', 'interno'], group: 'Material Foton', icon: 'map', title: 'Mapa de la red',
      desc: 'Distribuidores y talleres aliados con contacto y ruta en Google Maps.', path: 'mapa-red-nacional.html', access: 'open',
      alias: ['mapa-red-nacional/'] },

    // ── Asesores
    { id: 'comparativo', area: 'asesores', group: 'Mi app', icon: 'search', title: 'Foton Dealer · Inteligencia Competitiva',
      desc: 'La app del asesor: comparativo contra la competencia, gama, mapa de la red y cotizador. Instálala en el teléfono.', url: 'https://foton-dealer-os-git-master-isesperanza2306s-projects.vercel.app', access: 'ext', hero: true },
    { id: 'mi-panel', area: 'asesores', group: 'También en la web', icon: 'gauge', title: 'Mi Panel',
      desc: 'Tu avance de la semana, pendientes y ruta de desarrollo.', path: 'panel-asesor.html', access: 'pin',
      alias: ['panel-seguimiento/asesor/'] },
    { id: 'reporte', area: 'asesores', group: 'También en la web', icon: 'clipboard', title: 'Reporte de Campo',
      desc: 'Registra pendientes del Día 1 y la visita del Día 2.', path: 'reporte-campo.html', access: 'pin',
      alias: ['panel-seguimiento/reporte/'] },
    { id: 'pipeline', area: 'asesores', group: 'También en la web', icon: 'funnel', title: 'Mi Pipeline',
      desc: 'Prospectos y oportunidades con su siguiente paso.', path: 'pipeline-asesor.html', access: 'pin',
      alias: ['pipeline-asesor/'] },
    { id: 'cotizador', area: 'asesores', group: 'También en la web', icon: 'calc', title: 'Cotizador',
      desc: 'Cotización formal MDT / LDT lista para imprimir o enviar en PDF.', path: 'cotizacion.html', access: 'open',
      alias: ['cotizacion/'] },
    { id: 'guia', area: 'asesores', group: 'Para vender', icon: 'book', title: 'Guía de Ventajas Competitivas',
      desc: 'Portafolio S3 a S12 y cómo posicionarlo frente a la competencia.', path: 'informativo.html', access: 'open' },
    { id: 'sales-machine', area: 'asesores', group: 'Capacitación', icon: 'target', title: 'Foton Sales Machine',
      desc: 'Curso interactivo: BANT, SPIN, prospección, cierre y roleplay.', path: 'foton-sales-machine-v12.html', access: 'open', offset: 82 },
    { id: 'examen', area: 'asesores', group: 'Capacitación', icon: 'check', title: 'Evaluación de Producto',
      desc: 'Examen para certificarte en el portafolio Foton.', path: 'foton_examen.html', access: 'open' },
    { id: 'master-driver', area: 'asesores', group: 'Capacitación', icon: 'truck', title: 'Master Driver',
      desc: 'Curso para operadores: portafolio S3 a S12, caja AMT, Euro VI y DPF / urea.', url: 'https://isesperanza2306.github.io/foton-master-driver/', access: 'ext' },

    // ── Interno
    { id: 'panel', area: 'interno', group: 'Operación diaria', icon: 'traffic', title: 'Panel Operativo',
      desc: 'Cobranza, back order y entregas por región. El tablero que abres primero cada día.', path: 'panel.html', access: 'open', hero: true },
    { id: 'leads', area: 'interno', group: 'Operación diaria', icon: 'funnel', title: 'Control de Leads',
      desc: 'Carga leads, asígnalos a distribuidores y vigila alertas de seguimiento.', path: 'control-leads/', access: 'login' },
    { id: 'inventario', area: 'interno', group: 'Operación diaria', icon: 'archive', title: 'Inventario',
      desc: 'Unidades por modelo y ubicación, llegadas y pendientes.', path: 'inventario/', access: 'invpin' },
    { id: 'seguimiento', area: 'interno', group: 'Red y distribuidores', icon: 'user', title: 'Seguimiento de Asesores',
      desc: 'Semáforo Día 1 / Día 2 y vendedor especialista por distribuidor.', path: 'panel-seguimiento.html', access: 'open',
      alias: ['panel-seguimiento/'] },
    { id: 'pipeline-gr', area: 'interno', group: 'Red y distribuidores', icon: 'trend', title: 'Pipeline Regional',
      desc: 'Todas las oportunidades de los asesores, por región.', path: 'pipeline-gr.html', access: 'open',
      alias: ['pipeline-gr/'] },
    { id: 'resultados', area: 'interno', group: 'Red y distribuidores', icon: 'award', title: 'Resultados de Evaluación',
      desc: 'Ranking de la red, certificados y brechas por modelo.', path: 'foton_admin.html', access: 'open' },
    { id: 'direccion', area: 'interno', group: 'Dirección y plan', icon: 'compass', title: 'Dirección',
      desc: 'Vista consolidada de visitas, acuerdos y facturación.', path: 'direccion.html', access: 'login' },
    { id: 'visita', area: 'interno', group: 'Red y distribuidores', icon: 'pin', title: 'Registro de Visita',
      desc: 'Bitácora de visitas con minuta, fotos y acuerdos.', path: 'field-app.html', access: 'login', offset: 72 },
    { id: 'bp', area: 'interno', group: 'Dirección y plan', icon: 'trend', title: 'BP Tracker',
      desc: 'Business plan contra facturado por distribuidor y modelo.', path: 'bp-tracker.html', access: 'login' },
  ];

  const HUB_PATHS = { '': null, 'index.html': null, 'distribuidores/': 'distribuidores', 'asesores/': 'asesores', 'interno/': 'interno' };

  const href = t => t.url || new URL(t.path, BASE).href;
  const hubHref = id => new URL(id ? id + '/' : './', BASE).href;
  const svg = (name, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  const inArea = (t, a) => t.area === a || (t.also || []).includes(a);
  // Herramientas propias del área primero; las compartidas con otra área al final
  const toolsOf = a => TOOLS.filter(t => t.area === a).concat(TOOLS.filter(t => t.area !== a && (t.also || []).includes(a)));
  const areaOf = id => AREAS.find(a => a.id === id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Ruta de esta página relativa a la raíz del sitio, sin index.html
  function currentPath() {
    let p = decodeURIComponent(location.pathname);
    const base = decodeURIComponent(BASE.pathname);
    if (p.startsWith(base)) p = p.slice(base.length);
    return p.replace(/index\.html$/, '');
  }

  function currentTool() {
    const p = currentPath();
    const tab = new URLSearchParams(location.search).get('tab');
    if (p === 'dealer.html' && tab) {
      const t = TOOLS.find(x => x.path === 'dealer.html?tab=' + tab);
      if (t) return t;
    }
    return TOOLS.find(t => t.path && !t.path.includes('?') && (t.path === p || (t.alias || []).includes(p)));
  }

  const STORE_KEY = 'foton_area';
  function rememberArea(id) { try { sessionStorage.setItem(STORE_KEY, id); } catch (e) {} }
  function rememberedArea() { try { return sessionStorage.getItem(STORE_KEY); } catch (e) { return null; } }

  /* ───────────────────────── Botón y hoja en cada herramienta ───────────────────────── */

  const LAUNCHER_CSS = `
  :host{all:initial;--fos-bg:rgba(250,250,252,.86);--fos-card:#fff;--fos-ink:#1D1D1F;--fos-sec:#6E6E73;--fos-sep:rgba(0,0,0,.08);--fos-fill:rgba(118,118,128,.12);--fos-accent:#1363D6;--fos-accentBg:rgba(10,100,216,.09);
    font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,system-ui,sans-serif;font-size:14px;line-height:1.35;letter-spacing:-.01em;-webkit-font-smoothing:antialiased;--fos-inv:1}
  @media (prefers-color-scheme:dark){:host{--fos-inv:0;--fos-bg:rgba(28,28,30,.86);--fos-card:#2C2C2E;--fos-ink:#F5F5F7;--fos-sec:#98989D;--fos-sep:rgba(255,255,255,.1);--fos-fill:rgba(118,118,128,.24);--fos-accent:#3B8EF5;--fos-accentBg:rgba(59,142,245,.16)}}
  *{box-sizing:border-box;margin:0}
  button{font:inherit;letter-spacing:inherit}
  #fos-btn{position:fixed;left:14px;bottom:calc(${14}px + var(--fos-off,0px) + env(safe-area-inset-bottom,0px));z-index:2147483000;
    display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px 0 6px;border-radius:20px;border:1px solid var(--fos-sep);
    background:var(--fos-bg);color:var(--fos-ink);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
    box-shadow:0 6px 24px rgba(0,0,0,.14);font-size:13px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .15s}
  #fos-btn:hover{transform:translateY(-1px)}
  #fos-btn:active{transform:scale(.96)}
  #fos-btn{background:linear-gradient(160deg,rgba(0,26,77,.95),rgba(10,47,110,.95));color:#fff;border-color:rgba(255,255,255,.14);max-width:min(78vw,340px)}
  #fos-btn .fos-mk{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex:none}
  #fos-btn .fos-mk img{width:24px;height:24px;object-fit:contain}
  #fos-btn .fos-lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fos-av{width:22px;height:22px;border-radius:50%;background:#1363D6;color:#fff;display:grid;place-items:center;font-size:11px;font-weight:700;flex:none}
  .fos-av[hidden]{display:none}
  #fos-sheet .fos-lg{height:22px;width:auto;filter:invert(var(--fos-inv,1))}
  #fos-sheet .fos-hd small{font-size:11px;font-weight:700;letter-spacing:.2em;color:var(--fos-accent)}
  #fos-sheet .fos-me{display:flex;align-items:center;gap:10px;margin:0 14px 10px;padding:10px 12px;border-radius:14px;background:var(--fos-fill)}
  #fos-sheet .fos-me .fos-av{width:30px;height:30px;font-size:13px}
  #fos-btn:focus-visible,#fos-sheet a:focus-visible,#fos-sheet button:focus-visible{outline:3px solid rgba(19,99,214,.5);outline-offset:2px}
  @media (max-width:560px){#fos-btn{padding:0 6px}#fos-btn .fos-lbl{display:none}}
  @media print{:host{display:none!important}}
  #fos-scrim{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.28);opacity:0;pointer-events:none;transition:opacity .2s}
  #fos-scrim.on{opacity:1;pointer-events:auto}
  #fos-sheet{position:fixed;z-index:2147483002;left:14px;bottom:calc(64px + var(--fos-off,0px) + env(safe-area-inset-bottom,0px));width:360px;max-height:min(640px,calc(100vh - 96px - var(--fos-off,0px)));
    display:flex;flex-direction:column;border-radius:20px;background:var(--fos-bg);color:var(--fos-ink);border:1px solid var(--fos-sep);
    backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);box-shadow:0 24px 60px rgba(0,0,0,.25);
    opacity:0;transform:translateY(8px) scale(.98);transform-origin:bottom left;pointer-events:none;transition:opacity .18s,transform .18s}
  #fos-sheet.on{opacity:1;transform:none;pointer-events:auto}
  @media (max-width:560px){#fos-sheet{left:0;right:0;bottom:0;width:auto;max-height:82vh;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px);transform:translateY(24px)}}
  #fos-sheet .fos-hd{display:flex;align-items:center;gap:10px;padding:14px 14px 10px 16px}
  #fos-sheet .fos-hd b{font-size:15px;font-weight:700;flex:1}
  #fos-sheet .fos-x{width:30px;height:30px;border-radius:50%;border:0;background:var(--fos-fill);color:var(--fos-sec);display:grid;place-items:center;cursor:pointer}
  #fos-sheet .fos-x svg{width:14px;height:14px}
  #fos-sheet .fos-seg{display:flex;gap:2px;margin:0 14px 8px;padding:2px;border-radius:10px;background:var(--fos-fill)}
  #fos-sheet .fos-seg button{flex:1;height:30px;border:0;border-radius:8px;background:transparent;color:var(--fos-ink);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}
  #fos-sheet .fos-seg button[aria-selected="true"]{background:var(--fos-card);box-shadow:0 1px 3px rgba(0,0,0,.12)}
  #fos-sheet .fos-list{overflow-y:auto;padding:0 8px 8px;overscroll-behavior:contain}
  #fos-sheet .fos-g{font-size:11px;font-weight:600;color:var(--fos-sec);text-transform:uppercase;letter-spacing:.06em;padding:12px 10px 4px}
  #fos-sheet a.fos-it{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:12px;color:inherit;text-decoration:none}
  #fos-sheet a.fos-it:hover{background:var(--fos-fill)}
  #fos-sheet a.fos-it[aria-current="page"]{background:var(--fos-accentBg);color:var(--fos-accent)}
  #fos-sheet .fos-ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--fos-fill);flex-shrink:0}
  #fos-sheet a[aria-current="page"] .fos-ic{background:var(--fos-accent);color:#fff}
  #fos-sheet .fos-ic svg{width:17px;height:17px}
  #fos-sheet .fos-t{font-size:14px;font-weight:600;line-height:1.25}
  #fos-sheet .fos-s{font-size:11.5px;color:var(--fos-sec);margin-top:1px}
  #fos-sheet .fos-ext{width:13px;height:13px;margin-left:auto;color:var(--fos-sec);flex-shrink:0}
  #fos-sheet .fos-ft{border-top:1px solid var(--fos-sep);padding:8px}
  `;

  // Qué portal le toca a cada área del catálogo (nombres de _acceso.js)
  const AREA_ACCESO = { distribuidores: 'dealer', asesores: 'asesor', interno: 'interno' };
  const puedeArea = (perfil, areaId) => !perfil || !window.FotonAcceso || FotonAcceso.puede(perfil, AREA_ACCESO[areaId]);
  const miPortal = perfil => perfil && window.FotonAcceso ? { dealer: 'distribuidores', asesor: 'asesores', interno: 'interno' }[FotonAcceso.portalDe(perfil)] : null;

  function launcher() {
    if (window.top !== window.self || /[?&]embed=1\b/.test(location.search)) return;
    const here = currentTool();
    const offset = OFFSET || (here && here.offset) || 0;
    let area = here ? here.area : 'interno';
    const saved = rememberedArea();
    if (here && saved && inArea(here, saved)) area = saved;

    // Todo vive dentro de un shadow root para que los estilos de cada página no lo alteren
    const host = document.createElement('div');
    host.id = 'foton-os';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = LAUNCHER_CSS;
    shadow.appendChild(style);

    const simbolo = new URL('assets/logo-foton-simbolo.png', BASE).href;
    const logo = new URL('assets/logo-foton-blanco.png', BASE).href;
    const btn = document.createElement('button');
    btn.id = 'fos-btn';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú de Foton OS');
    btn.innerHTML = `<span class="fos-mk"><img src="${simbolo}" alt="Foton"></span><span class="fos-lbl">${esc(here ? here.title : 'Foton OS')}</span><span class="fos-av" hidden></span>`;

    const scrim = document.createElement('div');
    scrim.id = 'fos-scrim';

    const sheet = document.createElement('div');
    sheet.id = 'fos-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', 'Herramientas de Foton OS');

    [btn, sheet].forEach(el => el.style.setProperty('--fos-off', offset + 'px'));

    const perfil = () => window.FOTON_PERFIL || null;
    const areas = () => AREAS.filter(a => puedeArea(perfil(), a.id));

    function list(areaId) {
      const tools = toolsOf(areaId).filter(t => !t.old && (!perfil() || !window.FotonAcceso || FotonAcceso.veHerramienta(t, perfil())));
      const groups = [];
      tools.forEach(t => {
        const g = t.area === areaId ? t.group : 'Material Foton';
        let e = groups.find(x => x.g === g);
        if (!e) groups.push(e = { g, items: [] });
        e.items.push(t);
      });
      let html = '';
      groups.forEach(({ g, items }) => {
        html += `<div class="fos-g">${esc(g)}</div>`;
        items.forEach(t => {
          const cur = here && here.id === t.id;
          html += `<a class="fos-it" href="${href(t)}"${cur ? ' aria-current="page"' : ''}${t.url ? ' target="_blank" rel="noopener"' : ''}>
          <span class="fos-ic">${svg(t.icon)}</span>
          <span><div class="fos-t">${esc(t.title)}</div><div class="fos-s">${esc(t.desc.split('. ')[0].replace(/\.$/, ''))}</div></span>
          ${t.url ? svg('ext', 'fos-ext') : ''}</a>`;
        });
      });
      return html;
    }

    function paint() {
      const p = perfil();
      const av = btn.querySelector('.fos-av');
      if (p) { av.textContent = (p.nombre || p.email || '?').trim()[0].toUpperCase(); av.hidden = false; }
    }

    function draw() {
      const p = perfil(), as = areas();
      if (!as.some(a => a.id === area)) area = (as[0] || AREAS[0]).id;
      const quien = p ? `<div class="fos-me"><span class="fos-av">${esc((p.nombre || p.email || '?').trim()[0].toUpperCase())}</span><span><div class="fos-t">${esc(p.nombre || p.email)}</div><div class="fos-s">${esc(window.FotonAcceso ? (FotonAcceso.esMaster(p.email) ? 'Master' : FotonAcceso.ROL[p.rol] || p.rol) : p.rol)}${p.distribuidor ? ' · ' + esc(p.distribuidor) : ''}</div></span></div>` : '';
      sheet.innerHTML = `
        <div class="fos-hd"><img class="fos-lg" src="${logo}" alt="Foton"><small>OS</small><span style="flex:1"></span><button class="fos-x" type="button" aria-label="Cerrar">${svg('close')}</button></div>
        ${quien}
        ${as.length > 1 ? `<div class="fos-seg" role="tablist">${as.map(a => `<button type="button" role="tab" data-a="${a.id}" aria-selected="${a.id === area}">${esc(a.id === 'interno' ? 'Interno' : a.label)}</button>`).join('')}</div>` : ''}
        <div class="fos-list">${list(area)}</div>
        <div class="fos-ft">
          <a class="fos-it" href="${hubHref(area)}"><span class="fos-ic">${svg('home')}</span><span><div class="fos-t">Inicio de ${esc(areaOf(area).id === 'interno' ? 'Interno' : areaOf(area).label)}</div><div class="fos-s">Todas tus herramientas</div></span></a>
          ${p && window.FotonAcceso && (area === 'distribuidores' || area === 'asesores') && !p.distribuidor_id ? `<a class="fos-it" href="#" data-cambiar><span class="fos-ic">${svg('store')}</span><span><div class="fos-t">Cambiar distribuidor</div><div class="fos-s">Ver otro distribuidor</div></span></a>` : ''}
          ${p ? `<a class="fos-it" href="#" data-salir><span class="fos-ic">${svg('close')}</span><span><div class="fos-t">Cerrar sesión</div></span></a>` : `<a class="fos-it" href="${new URL('login.html', BASE).href}?next=${encodeURIComponent(currentPath())}"><span class="fos-ic">${svg('user')}</span><span><div class="fos-t">Entrar</div><div class="fos-s">Con tu correo o Google</div></span></a>`}
        </div>`;
      sheet.querySelector('.fos-x').onclick = close;
      sheet.querySelectorAll('.fos-seg button').forEach(b => b.onclick = () => { area = b.dataset.a; rememberArea(area); draw(); });
      sheet.querySelectorAll('a.fos-it').forEach(a => a.addEventListener('click', () => rememberArea(area)));
      const out = sheet.querySelector('[data-salir]'); if (out) out.onclick = e => { e.preventDefault(); FotonAcceso.salir(); };
      const cam = sheet.querySelector('[data-cambiar]'); if (cam) cam.onclick = e => { e.preventDefault(); ['foton_pin', 'foton_dealer', 'foton_via_email', 'foton_dist_sel'].forEach(k => { try { sessionStorage.removeItem(k); } catch (x) {} }); location.reload(); };
    }

    function open() { draw(); sheet.classList.add('on'); scrim.classList.add('on'); btn.setAttribute('aria-expanded', 'true'); const f = sheet.querySelector('[aria-current]') || sheet.querySelector('a'); f && f.focus({ preventScroll: true }); }
    function close() { sheet.classList.remove('on'); scrim.classList.remove('on'); btn.setAttribute('aria-expanded', 'false'); }

    btn.onclick = () => sheet.classList.contains('on') ? close() : open();
    scrim.onclick = close;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('on')) { close(); btn.focus(); } });
    window.addEventListener('FotonAccesoListo', paint);

    shadow.append(btn, scrim, sheet);
    document.body.appendChild(host);
    paint();

    // En páginas abiertas (sin guardia) también reconoce a quien ya entró
    if (!window.FOTON_PERFIL) {
      const quien = () => FotonAcceso.perfilActual().then(({ perfil }) => { if (perfil) { window.FOTON_PERFIL = perfil; paint(); } }).catch(() => {});
      if (window.FotonAcceso) quien();
      else { const sc = document.createElement('script'); sc.src = new URL('_acceso.js', BASE).href; sc.onload = () => window.FotonAcceso && quien(); document.head.appendChild(sc); }
    }
  }

  /* ───────────────────────── Páginas de inicio ───────────────────────── */

  function hub(areaId) {
    const root = document.getElementById('app');
    const area = areaId ? areaOf(areaId) : null;
    if (area) rememberArea(area.id);

    const nav = `
      <header class="hdr"><div class="wrap">
        <a class="logo" href="${hubHref(null)}"><img src="${new URL('assets/logo-foton-blanco.png', BASE).href}" alt="Foton"><small>OS</small></a>
        <nav class="seg" aria-label="Áreas">${AREAS.filter(a => puedeArea(window.FOTON_PERFIL, a.id)).map(a => `<a href="${hubHref(a.id)}"${area && a.id === area.id ? ' aria-current="page"' : ''}>${esc(a.label)}</a>`).join('')}</nav>
        ${window.FOTON_PERFIL ? `<span class="who"><span>${esc((FOTON_PERFIL.nombre || FOTON_PERFIL.email || '').split(' ')[0])}</span><button type="button" onclick="FotonAcceso.salir()">Salir</button></span>` : ''}
      </div></header>`;

    if (!area) {
      // Con sesión no hay nada que elegir: cada quien entra directo a su portal
      if (window.FotonAcceso && !window.FOTON_PERFIL && !hub.yaRevisado) {
        hub.yaRevisado = true;
        FotonAcceso.perfilActual().then(({ perfil }) => { if (perfil) { window.FOTON_PERFIL = perfil; location.replace(hubHref(miPortal(perfil))); } }).catch(() => {});
      }
      root.innerHTML = `
        <section class="hero">${nav}
          <div class="wrap hin">
            <div class="eyebrow">Foton México · Red de distribuidores</div>
            <h1>Foton OS</h1>
            <p class="lede">Todas las herramientas de la red en un solo lugar. Entra con tu correo y te llevamos a tu espacio.</p>
            ${window.FOTON_PERFIL ? '' : `<a class="cta" href="${new URL('login.html', BASE).href}">Entrar con mi cuenta</a>`}
            <div class="doors">${AREAS.filter(a => puedeArea(window.FOTON_PERFIL, a.id)).map(a => {
              const n = TOOLS.filter(t => inArea(t, a.id) && !t.old).length;
              return `<a class="door" href="${hubHref(a.id)}" data-tone="${a.tone}">
                <span class="dic">${svg(a.icon)}</span>
                <span class="dt">${esc(a.label)}</span>
                <span class="dw">${esc(a.who)}</span>
                <span class="dd">${esc(a.desc)}</span>
                <span class="dn">${n} herramientas ${svg('arrow')}</span>
              </a>`; }).join('')}
            </div>
          </div>
        </section>
        <main class="wrap">
          <div class="shead"><h2>Accesos directos</h2><p>Lo que más se usa en cada área</p></div>
          <div class="grid">${TOOLS.filter(t => t.hero).map(card).join('')}</div>
        </main>
        <footer class="wrap">Foton OS · Foton México</footer>`;
      return;
    }

    const tools = toolsOf(area.id).filter(t => !window.FotonAcceso || FotonAcceso.veHerramienta(t));
    const groups = [];
    tools.forEach(t => {
      const g = t.area === area.id ? t.group : 'Material Foton';
      let e = groups.find(x => x.g === g);
      if (!e) groups.push(e = { g, items: [] });
      e.items.push(t);
    });

    root.innerHTML = `
      <section class="hero hero-sm" data-tone="${area.tone}">${nav}
        <div class="wrap hin">
          <div class="eyebrow">${esc(area.who)}</div>
          <h1>${esc(area.label)}</h1>
          <p class="lede">${esc(area.desc)}</p>
          ${area.note ? `<p class="note">${svg('shield')}<span>${esc(area.note)}</span></p>` : ''}
        </div>
      </section>
      <main class="wrap">
        ${groups.map(({ g, items }) => {
          const old = items.every(t => t.old);
          const body = `<div class="grid">${items.map(card).join('')}</div>`;
          return old
            ? `<details class="old"><summary>${esc(g)} · ${items.length}</summary><p class="oldp">Se conservan para consulta. Usa las versiones de arriba.</p>${body}</details>`
            : `<div class="shead"><h2>${esc(g)}</h2></div>${body}`;
        }).join('')}
      </main>
      <footer class="wrap"><a href="${hubHref(null)}">Foton OS</a> · ${esc(area.label)}</footer>`;
  }

  function card(t, i) {
    const a = ACCESS[t.access];
    const area = areaOf(t.area);
    return `<a class="card${t.old ? ' is-old' : ''}" href="${href(t)}"${t.url ? ' target="_blank" rel="noopener"' : ''} style="animation-delay:${(i || 0) * 30}ms" data-tone="${area.tone}">
      <div class="ctop"><span class="cic">${svg(t.icon)}</span><span class="pill" data-tone="${a.tone}">${esc(a.label)}</span></div>
      <div class="ct">${esc(t.title)}${t.url ? svg('ext', 'cext') : ''}</div>
      <div class="cd">${esc(t.desc)}</div>
      <div class="cf">${esc(area.label)}</div>
    </a>`;
  }

  window.FotonSistema = { AREAS, TOOLS, hub };

  function boot() {
    if (document.body.dataset.fotonHub !== undefined) return; // las páginas de inicio llaman hub() ellas mismas
    const p = currentPath();
    if (p in HUB_PATHS) return;
    launcher();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
