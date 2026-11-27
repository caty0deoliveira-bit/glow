/* Glow by Caty: funciona sin conexión.
   Sube la versión cada vez que cambies la app para que todas reciban la nueva. */
const VERSION = 'glow-v1.3.0';
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

/* Avisos: el asistente, las respuestas de Caty y, en su panel, los mensajes nuevos */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Glow by Caty', {
    body: d.body || '', icon: 'assets/icon-180.png', badge: 'assets/icon-180.png',
    tag: d.tag || 'glow', renotify: true, data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.navigate(url); return c.focus(); }
    return clients.openWindow(url);
  }));
});
