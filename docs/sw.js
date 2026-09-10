const CACHE = 'hogar-public-62b2d4e009b7406d';
const PUBLIC_ASSETS = ["./assets/browser-CqDbEFy1.js","./assets/index-C6yxLjRM.css","./assets/index-CNlH2Ut0.js","./assets/index-D9std1Z8.js","./assets/index-iPjrJSYw.js","./assets/index.esm-DzwZMTTC.js"];
const base = new URL('./', self.location);
const shell = new URL('./index.html', base).href;
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([shell, './icon-192.png', './icon-512.png', './person.jpg', ...PUBLIC_ASSETS]))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith('hogar-public-') && name !== CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(shell)));
    return;
  }
  // Only Vite's fingerprinted public JS/CSS and our bundled icons are cacheable.
  const path = url.pathname.slice(base.pathname.length);
  if ((!PUBLIC_ASSETS.includes('./' + path) && !/^(icon-(192|512)\.png|person\.jpg)$/.test(path)) || url.search) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE), cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && !response.headers.has('set-cookie')) await cache.put(request, response.clone());
    return response;
  })());
});
self.addEventListener('push', event => {
  let payload;
  try { payload = event.data?.json()?.data; } catch { return; }
  if (!payload?.id || !payload.url) return;
  let url;
  try { url = new URL(payload.url); } catch { return; }
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || !url.hash.startsWith('#/pupils/')) return;
  event.waitUntil((async () => {
    await self.registration.showNotification(payload.title || 'Hogar escuelaRD', {
      body: payload.body, icon: new URL('icon-192.png', base).href,
      tag: `hogar-${payload.id}`, renotify: true, data: { url: url.href, revision: payload.revision },
    });
    for (const client of await self.clients.matchAll({type:'window'})) {
      if (client.url.startsWith(base.href)) client.postMessage({type:'hogar-notice'});
    }
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || base.href);
  if (url.origin !== base.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const window = windows.find(client => client.url.startsWith(base.href));
    if (window) { await window.navigate(url.href); return window.focus(); }
    return self.clients.openWindow(url.href);
  })());
});
