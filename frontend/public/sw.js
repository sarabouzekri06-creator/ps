// public/sw.js

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
});

self.addEventListener('push', function(e) {
  var data = e.data.json();

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon || '/logo192.png',
      image: data.image || null,
      data:  { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();

  var url = e.notification.data.url || '/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Envoyer message au site ouvert
          client.postMessage({ type: 'NOTIF_CLICK', url: url });
          return client.focus();
        }
      }
      // Site fermé → ouvrir avec URL
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});