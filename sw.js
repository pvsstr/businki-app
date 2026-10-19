const CACHE = 'bawi-v18';
const PRECACHE = ['./', './index.html', './manifest.json', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(PRECACHE.map(function (u) { return c.add(u).catch(function () {}); }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('bawi-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (resp) {
        const copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); }).catch(function () {});
        return resp;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) { return r || Response.error(); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return resp;
      });
    }).catch(function () {
      return Response.error();
    })
  );
});
