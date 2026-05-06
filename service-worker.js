const CACHE_NAME = 'driver-finance-v5';
const urlsToCache = [
  './',
  './index.html',
  './app-new.js',
  './manifest.json',
  './img/logotipo.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando nova versão...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Instalado com sucesso');
        return self.skipWaiting(); // Força ativação imediata
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Ativado');
      return self.clients.claim(); // Assume controle imediatamente
    })
  );
});

// Interceptar requisições - Network First Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se conseguiu da rede, atualiza o cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se falhou, tenta do cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Se não tem no cache, retorna erro
            return new Response('Offline - Conteúdo não disponível', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Notificações Push
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação!',
    icon: './img/logotipo.png',
    badge: './img/logotipo.png',
    vibrate: [200, 100, 200],
    tag: 'driver-finance',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Driver Finance', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Mensagem para pular espera
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Pulando espera...');
    self.skipWaiting();
  }
});


// ========== PROCESSAR AÇÕES DA NOTIFICAÇÃO ==========

// Quando o usuário clica nos botões da notificação
self.addEventListener('notificationclick', event => {
  console.log('🔔 Clique na notificação:', event.action);
  
  event.notification.close();
  
  // Processar ação
  if (event.action === 'add-15') {
    handleQuickAdd(15);
  } else if (event.action === 'add-25') {
    handleQuickAdd(25);
  } else if (event.action === 'add-30') {
    handleQuickAdd(30);
  } else {
    // Clique no corpo da notificação - abrir app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Adicionar receita rápida via notificação
async function handleQuickAdd(amount) {
  console.log(`💰 Adicionando R$ ${amount} via notificação`);
  
  try {
    // Abrir ou focar na janela do app
    const windowClients = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    
    let appClient = null;
    
    // Procurar janela já aberta
    for (const client of windowClients) {
      if (client.url.includes(self.location.origin)) {
        appClient = client;
        break;
      }
    }
    
    if (appClient) {
      // App já está aberto - enviar mensagem
      appClient.focus();
      appClient.postMessage({
        type: 'QUICK_ADD',
        amount: amount
      });
    } else {
      // App não está aberto - abrir com parâmetro
      await clients.openWindow(`/?quick=${amount}`);
    }
    
    // Mostrar notificação de confirmação
    await self.registration.showNotification('✅ Receita Adicionada!', {
      body: `+ R$ ${amount.toFixed(2)}`,
      icon: './img/logotipo.png',
      tag: 'quick-add-confirmation',
      requireInteraction: false,
      silent: false,
      vibrate: [100, 50, 100]
    });
    
    // Fechar notificação de confirmação após 2 segundos
    setTimeout(async () => {
      const notifications = await self.registration.getNotifications({ tag: 'quick-add-confirmation' });
      notifications.forEach(n => n.close());
    }, 2000);
    
    // Recriar notificação do Modo Motorista
    setTimeout(async () => {
      await self.registration.showNotification('🚗 Modo Motorista Ativo', {
        body: 'Toque nos botões para adicionar corridas rapidamente',
        icon: './img/logotipo.png',
        tag: 'driver-mode',
        requireInteraction: true,
        silent: true,
        actions: [
          { action: 'add-15', title: '+ R$ 15' },
          { action: 'add-25', title: '+ R$ 25' },
          { action: 'add-30', title: '+ R$ 30' }
        ]
      });
    }, 2500);
    
  } catch (error) {
    console.error('❌ Erro ao processar adição rápida:', error);
  }
}

console.log('🔔 Handler de notificações carregado');
