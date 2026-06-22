const CACHE = 'foton-os-v2';
const STATIC = [
  '/mapa.html', '/login.html', '/bp-tracker.html',
  '/field-app.html', '/direccion.html',
  '/_config.js?v=3', '/_nav.js?v=3',
  '/foton-logo-trans.png', '/foton-icon-trans.png',
  '/icon-192.png', '/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // No cachear requests de Supabase, Google, CDN externo
  if (url.includes('supabase.co') || url.includes('googleapis') ||
      url.includes('cdn.jsdelivr') || url.includes('fonts.g')) {
    return;
  }
  // Network-first: intenta red, cae a cache si falla
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
