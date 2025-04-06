// Handle push notifications in the app

// Request push notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Display a notification using the Notifications API
export const showNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  try {
    const defaultOptions = {
      body: 'You have a new notification',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'default',
      requireInteraction: false,
      silent: false,
      data: {
        url: '/',
        timestamp: Date.now()
      }
    };

    // Merge default options with provided options
    const notificationOptions = { ...defaultOptions, ...options };
    
    // Create and show the notification
    const notification = new Notification(title, notificationOptions);
    
    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      const data = notification.data || {};
      const url = data.url || '/';
      
      // Focus on existing window if possible, otherwise open new one
      if (window.focus) {
        window.focus();
      }
      
      // Navigate to the specified URL
      window.location.href = url;
      
      // Close the notification
      notification.close();
    };
    
    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

// Register for push notifications
export const registerForPushNotifications = async (subscribeCallback) => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }
    
    const permission = await requestNotificationPermission();
    if (!permission) {
      console.log('Notification permission denied');
      return false;
    }
    
    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM'
      )
    });
    
    console.log('Push notification subscription:', subscription);
    
    // Send the subscription to the server
    if (subscribeCallback && typeof subscribeCallback === 'function') {
      await subscribeCallback(subscription);
    }
    
    return true;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return false;
  }
};

// Convert base64 to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
} 