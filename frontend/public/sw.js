console.log('Service worker loaded');

self.addEventListener('install', event => {
  console.log('Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', event => {
  console.log('Push event received', event);
  
  try {
    if (!event.data) {
      console.warn('Push event has no data');
      return;
    }
    
    const data = event.data.json();
    console.log('Push data received:', data);
  
    const title = data.title || 'New Notification';
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/favicon.svg',
      badge: data.badge || '/favicon.svg',
      tag: data.tag || 'default',
      timestamp: data.timestamp || Date.now(),
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        notificationId: data.notificationId || `notif-${Date.now()}`,
        ...data.data
      },
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
    };
  
    console.log('Showing notification with options:', options);
    
    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => console.log('Notification shown successfully'))
        .catch(error => console.error('Error showing notification:', error))
    );
  } catch (err) {
    console.error('Error processing push notification:', err);
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const notificationData = notification.data || {};
  
  // Close the notification
  notification.close();
  
  // Handle different actions if specified
  if (action) {
    console.log(`User clicked notification action: ${action}`);
  }
  
  // Default behavior is to open the URL
  const urlToOpen = notificationData.url || '/';
  console.log(`Opening URL: ${urlToOpen}`);
  
  // Open the URL in the existing window/tab if possible
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            return client.navigate(urlToOpen);
          }
        }
        // Otherwise open a new window/tab
        return clients.openWindow(urlToOpen);
      })
      .catch(error => {
        console.error('Error opening window/tab:', error);
      })
  );
});

// Handle notification close event (user dismissed notification)
self.addEventListener('notificationclose', event => {
  const notification = event.notification;
  console.log('Notification closed without clicking:', notification);
});

// Helper functions for action handlers
function handleAction1(data) {
  console.log('Handling action1 with data:', data);
  return Promise.resolve();
}

function handleAction2(data) {
  console.log('Handling action2 with data:', data);
  return Promise.resolve();
}
  