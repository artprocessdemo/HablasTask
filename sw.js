/**
 * HABLATASK — Service worker
 * 1. Permite instalar la app (requisito de Chrome).
 * 2. Recibe las notificaciones push de Firebase cuando la app está cerrada
 *    o en segundo plano, y las muestra en la barra del teléfono.
 * Nunca intercepta los pedidos a la API (Apps Script): esos van directo a internet.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD93mJi8-c6-coaFibNkdeis5HH2pWChU8',
  authDomain: 'hablatask.firebaseapp.com',
  projectId: 'hablatask',
  storageBucket: 'hablatask.firebasestorage.app',
  messagingSenderId: '201174154119',
  appId: '1:201174154119:web:e84a8723b459253a69f122'
});
// Al iniciar Messaging, el SDK muestra solo las notificaciones que llegan con la app cerrada
firebase.messaging();

const CACHE = 'hablatask-v2';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

// Red primero: cada cambio subido a GitHub se ve al reabrir la app
self.addEventListener('fetch', function (e) {
  const url = new URL(e.request.url);
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

// Al tocar una notificación, se abre (o se trae al frente) la app
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
