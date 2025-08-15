// Define o nome e a versão do cache
const CACHE_NAME = 'doc2text-cache-v2.4'; // Versão atualizada

// O nome do seu repositório/subdiretório
const REPO_PREFIX = '/';

// Lista de arquivos essenciais para o app funcionar offline
const URLS_TO_CACHE = [
  `${REPO_PREFIX}/`,
  `${REPO_PREFIX}/login.html`,
  `${REPO_PREFIX}/app.html`,
  `${REPO_PREFIX}/styles/login.css`,
  `${REPO_PREFIX}/styles/app.css`,
  `${REPO_PREFIX}/scripts/login.js`,
  `${REPO_PREFIX}/scripts/app.js`,
  `${REPO_PREFIX}/manifest.json`,
  `${REPO_PREFIX}/icons/icon-72x72.png`,
  `${REPO_PREFIX}/icons/icon-192x192.png`,
  `${REPO_PREFIX}/icons/icon-512x512.png`,
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css'
];

// Evento de Instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Evento de Ativação
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento Fetch
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});