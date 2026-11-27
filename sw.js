/* Glow by Caty: funciona sin conexión.
   Sube la versión cada vez que cambies la app para que todas reciban la nueva. */
const VERSION = 'glow-v1.2.0';
const SHELL = [
  './', 'index.html', 'manifest.json',
  'assets/icon-180.png', 'assets/icon-512.png',
  'datos/catalogo.json', 'datos/cuestionario.json', 'datos/evidencia.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Primero lo guardado (rápido y sin conexión); en segundo plano se actualiza. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true});
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net;
    return r || (req.mode === 'navigate' ? c.match('index.html') : Response.error());
  }));
});
