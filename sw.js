const CACHE = 'social-hub-v1';
const ASSETS = [
  '/Social_Hub/',
  '/Social_Hub/index.html',
  '/Social_Hub/resources/app/style.css',
  '/Social_Hub/resources/app/app.js',
  '/Social_Hub/manifest.json',
  '/Social_Hub/icon-192.png',
  '/Social_Hub/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
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
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
