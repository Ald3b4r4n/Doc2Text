// Configurações do Service Worker
const CACHE_NAME = 'doc2text-cache-v1.8';
const OFFLINE_PAGE = 'offline.html';

// Arquivos essenciais para cache
const URLS_TO_CACHE = [
  '/',
  'login.html',
  'app.html',
  'styles/login.css',
  'styles/app.css',
  'scripts/login.js',
  'scripts/app.js',
  'manifest.json',
  // Ícones disponíveis
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  // Dependências externas
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth-compat.js'
];

// Evento de Instalação
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto, adicionando recursos...');
        return cache.addAll(URLS_TO_CACHE)
          .then(() => {
            console.log('[Service Worker] Todos os recursos foram cacheados');
            return self.skipWaiting();
          })
          .catch((error) => {
            console.error('[Service Worker] Falha ao adicionar recursos ao cache:', error);
            throw error;
          });
      })
  );
});

// Evento de Ativação
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Ativado e pronto para controlar clientes');
      return self.clients.claim();
    })
  );
});

// Evento Fetch - Estratégia Cache First com fallback para rede
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Tratamento especial para navegação (páginas HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('offline.html'))
    );
    return;
  }

  // Para outros recursos
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Retorna do cache se disponível
        if (cachedResponse) {
          console.log(`[Service Worker] Retornando do cache: ${event.request.url}`);
          return cachedResponse;
        }

        // Busca na rede
        return fetch(event.request)
          .then((networkResponse) => {
            // Se for uma requisição de nossa origem, adiciona ao cache dinamicamente
            if (event.request.url.startsWith(self.location.origin)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseToCache))
                .catch((error) => {
                  console.error(`[Service Worker] Erro ao cachear ${event.request.url}:`, error);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error(`[Service Worker] Falha na requisição: ${event.request.url}`, error);
            // Pode retornar um fallback específico para o tipo de recurso aqui
            return new Response('Offline - Recurso não disponível', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({'Content-Type': 'text/plain'})
            });
          });
      })
  );
});

// Evento para atualizações em segundo plano
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
