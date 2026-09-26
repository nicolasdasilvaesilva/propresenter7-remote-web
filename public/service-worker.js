// Service Worker para o ProPresenter 7 Remote PWA
const CACHE_NAME = 'propresenter-remote-v3.3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/img/apple-touch-icon.png',
  '/img/logo.png',
  '/img/favicon.png'
];

// Instala e cacheia os arquivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Falha parcial ao cachear assets:', err);
        // Cache individual fallback - não quebra a instalação se um arquivo faltar
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(() => console.warn('Asset não encontrado:', url)))
        );
      });
    })
  );
  // Força ativação imediata sem esperar fechar as abas
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('Removendo cache antigo:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // Toma controle de todas as páginas abertas imediatamente
  self.clients.claim();
});

// Estratégia de fetch: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Requisições de API (/api/...) NUNCA devem ser cacheadas - tempo real obrigatório
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline - sem conexão com o ProPresenter' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Para arquivos estáticos: Network First → Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Atualiza o cache com a versão mais recente do servidor
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se offline, tenta servir do cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          // Fallback para a página principal se for uma navegação
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Escuta mensagem para forçar atualização do cache (skip waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    }).then(() => {
      // Re-cacheia os assets após limpar
      caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS));
    });
  }
});
