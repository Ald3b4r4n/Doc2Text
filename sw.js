
const CACHE_NAME = 'doc2text-cache-v2.0';  // Mudei a versão para forçar atualização
const OFFLINE_PAGE = '/offline.html';  // Crie este arquivo se quiser suporte offline

// Lista de arquivos para cache (todos com / no início)
const URLS_TO_CACHE = [
  '/',
  '/login.html',
  '/app.html',
  '/styles/login.css',
  '/styles/app.css',
  '/scripts/login.js',
  '/scripts/app.js',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // CDNs (mantive apenas as essenciais)
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css'
];

// Evento de instalação (igual ao anterior)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Evento de fetch (modificado para GitHub Pages)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET ou são de outras origens
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Retorna do cache se existir
        if (cachedResponse) return cachedResponse;
        
        // Senão, busca na rede e cacheia dinamicamente
        return fetch(event.request)
          .then(response => {
            // Cacheia apenas recursos da mesma origem
            if (event.request.url.startsWith(self.location.origin)) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // Fallback para offline.html se a página não carregar
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            return new Response('Offline');
          });
      })
  );
});
