const CACHE_NAME = 'liturgia-catolica-v1';

const ASSETS_TO_CACHE = [
  './',
  './Index.html',
  './SantaMissa.html',
  './TeologiaConsagracao.html',
  './Confissao.html',
  './AnoLiturgico.html',
  './Indulgencias.html',
  './TercoMariano.html',
  './TercoMisericordia.html',
  './ViaSacra.html',
  './SaoMiguel.html',
  './Comunhao.html',
  './OracoesCatolicas.html',
  './OracaoPeloPapa.html',
  './manifest.json',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

// Instalação do Service Worker e pré-cache de todos os arquivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estratégia de requisição: Cache First com fallback para Network (funciona 100% offline)
self.addEventListener('fetch', (event) => {
  // Apenas métodos GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Atualiza o cache em segundo plano (stale-while-revalidate simplificado)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Ignora falha de rede se já estiver offline
        });
        return cachedResponse;
      }

      // Se não estiver em cache, busca na rede e guarda
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback para a página principal se for navegação
        if (event.request.mode === 'navigate') {
          return caches.match('./Index.html');
        }
      });
    })
  );
});

