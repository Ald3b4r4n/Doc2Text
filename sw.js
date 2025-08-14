// Define o nome e a versão do cache
const CACHE_NAME = 'doc2text-cache-v1.6'; // Incremente a versão para forçar a atualização do cache

// Lista de arquivos essenciais para o app funcionar offline
const URLS_TO_CACHE = [
  'login.html',
  'app.html',
  'styles/login.css',
  'styles/app.css',
  'scripts/login.js',
  'scripts/app.js',
  'manifest.json',
  // Adicione os caminhos para seus ícones aqui
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  // Adicione os links de CDNs que são cruciais
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/ui/6.0.1/firebase-ui-auth.js',
  'https://www.gstatic.com/firebasejs/ui/6.0.1/firebase-ui-auth.css'
];

// Evento de Instalação: Salva os arquivos essenciais no cache
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto, adicionando arquivos essenciais.');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker: Todos os arquivos foram cacheados com sucesso.');
        return self.skipWaiting(); // Força o novo SW a se tornar ativo
      })
      .catch(error => {
        console.error('Service Worker: Falha ao cachear arquivos durante a instalação.', error);
      })
  );
});

// Evento de Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Ativado e pronto para controlar a página.');
        return self.clients.claim(); // Torna-se o controlador para clientes abertos
    })
  );
});

// Evento Fetch: Intercepta requisições e serve do cache se disponível
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET (como POST para APIs)
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estratégia: Cache, caindo para a rede (Cache falling back to network)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Se encontrou no cache, retorna a resposta do cache
          // console.log(`Service Worker: Servindo do cache: ${event.request.url}`);
          return response;
        }
        
        // Se não encontrou, busca na rede
        // console.log(`Service Worker: Buscando na rede: ${event.request.url}`);
        return fetch(event.request).then((networkResponse) => {
            // Opcional: Adicionar a nova requisição ao cache dinamicamente
            // Cuidado ao cachear tudo, pode encher o armazenamento.
            return networkResponse;
        });
      })
      .catch(error => {
        console.error(`Service Worker: Erro ao buscar: ${event.request.url}`, error);
        // Você pode retornar uma página de fallback offline aqui se desejar
      })
  );
});


