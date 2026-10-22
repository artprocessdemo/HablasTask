/**
 * HABLATASK — Service worker
 * Requisito de Chrome para instalar la app. Guarda la "cáscara" de la app
 * (HTML, íconos) para que abra rápido, pero:
 *  - Siempre intenta descargar primero la versión más nueva (red primero),
 *    así cada cambio subido a GitHub se ve al recargar.
 *  - NUNCA toca los pedidos a la API (Apps Script / Gemini): esos van directo a internet.
 */
const CACHE = 'hablatask-v1';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  // Borra cachés de versiones anteriores
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  const url = new URL(e.request.url);
  // Solo archivos propios y de lectura; la API y todo lo externo no se interceptan
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(function (r) {
        const copia = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
        return r;
      })
      .catch(function () { return caches.match(e.request); })
  );
});
