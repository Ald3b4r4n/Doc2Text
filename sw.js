// Define o nome e a versão do cache
const CACHE_NAME = 'doc2text-cache-v2.4'; // Versão atualizada de 2.3 para 2.4

// Lista de arquivos essenciais para o app funcionar offline
// Usando caminhos relativos para funcionar em subdiretórios
const URLS_TO_CACHE = [
  '/index.html',
  '/app.html',
  '/index.css',
  '/app.css',
  '/index.js',
  '/app.js',
  '/manifest.json',
  '/icon-72x72.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
  // NOVO: Adicionar os scripts do Firebase e Firebase UI
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/ui/6.0.1/firebase-ui-auth.js' // Adicionado para a tela de login
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
