// Custom service worker to handle push notifications

self.addEventListener('push', event => {
  try {
    const data = event.data.json();
    console.log('Push received:', data);
  
    const title = data.title || 'New Notification';
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/favicon.svg',
      badge: data.badge || '/favicon.svg',
      tag: data.tag || 'default', // Added tag for notification grouping
      timestamp: data.timestamp || Date.now(), // Add timestamp for notification ordering
      data: {
        url: data.url || '/',
        notificationId: data.notificationId || `notif-${Date.now()}`, // Added unique ID for tracking
        ...data.data
      },
      actions: data.actions || [],
      silent: data.silent || false,
      requireInteraction: data.requireInteraction || false,
      renotify: data.renotify || false, // Controls whether a notification should vibrate if tag is reused
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
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
    
    // Handle custom actions here if needed
    const actionHandlers = {
      'action1': () => handleAction1(notificationData),
      'action2': () => handleAction2(notificationData),
      // Add more action handlers as needed
    };
    
    if (actionHandlers[action]) {
      event.waitUntil(actionHandlers[action]());
      return;
    }
  }
  
  // Default behavior is to open the URL
  const urlToOpen = notificationData.url || '/';
  
  // Try to track notification interaction if possible
  try {
    const trackingPromise = fetch('/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: notificationData.notificationId,
        action: action || 'click',
        timestamp: Date.now()
      })
    }).catch(err => console.error('Failed to track notification click:', err));
    
    // Open the URL in the existing window/tab if possible
    const clientPromise = clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if we have a window/tab to focus
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            return client.navigate(urlToOpen);
          }
        }
        // Otherwise open a new window/tab
        return clients.openWindow(urlToOpen);
      });
      
    event.waitUntil(Promise.all([trackingPromise, clientPromise]));
  } catch (err) {
    console.error('Error handling notification click:', err);
    
    // Fallback to just opening the URL
    event.waitUntil(clients.openWindow(urlToOpen));
  }
});

// Handle notification close event (user dismissed notification)
self.addEventListener('notificationclose', event => {
  const notification = event.notification;
  const notificationData = notification.data || {};
  
  console.log('Notification closed without clicking:', notification);
  
  // Track notification dismissal if needed
  try {
    event.waitUntil(
      fetch('/notifications/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: notificationData.notificationId,
          action: 'dismiss',
          timestamp: Date.now()
        })
      }).catch(err => console.error('Failed to track notification dismissal:', err))
    );
  } catch (err) {
    console.error('Error tracking notification dismissal:', err);
  }
});

// Helper functions for action handlers
function handleAction1(data) {
  console.log('Handling action1 with data:', data);
  // Implement specific action behavior
  return Promise.resolve();
}

function handleAction2(data) {
  console.log('Handling action2 with data:', data);
  // Implement specific action behavior
  return Promise.resolve();
} 