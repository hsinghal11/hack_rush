import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from './api';

// The public VAPID key must match the one on the server
const publicVapidKey = 'BPnYZ68ygMHPqSg3UDKn5aVcNBc4e53BJzSMd-txDxLNbiY1xDETIXiCr5xSAaqR2lLYQWIIEm3SwaFBk9gW6dM';

export const NotificationService = {
  /**
   * Check if the browser supports push notifications
   */
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Request notification permission
   * @returns {Promise<string>} - Returns 'granted', 'denied', or 'default'
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    console.log('Current notification permission:', Notification.permission);
    
    if (Notification.permission === 'denied') {
      console.warn('Notification permission was previously denied');
    }
    
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return Notification.permission;
    }
    
    try {
      const result = await Notification.requestPermission();
      console.log('Permission request result:', result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  },

  /**
   * Register the service worker and subscribe to push notifications
   * @returns {Promise<PushSubscription>} - Returns the subscription object
   */
  async registerServiceWorker() {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications are not supported in this browser');
      }

      console.log('Registering service worker...');
      
      // First, unregister any existing service workers to avoid conflicts
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length > 0) {
        console.log(`Found ${existingRegistrations.length} existing service worker registrations`);
        for (const reg of existingRegistrations) {
          console.log(`Unregistering service worker with scope: ${reg.scope}`);
          await reg.unregister();
        }
      }
      
      // Register a new service worker
      console.log('Registering new service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service worker registered successfully:', registration);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service worker is ready');
      
      return registration;
    } catch (error) {
      console.error('Error registering service worker:', error);
      throw error;
    }
  },

  /**
   * Subscribe to push notifications
   * @returns {Promise<boolean>} - Returns true if successful
   */
  async subscribeToPush() {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted:', permission);
        return false;
      }

      const registration = await this.registerServiceWorker();

      // Check if there's an existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Found existing push subscription:', existingSubscription);
        
        // Send the existing subscription to the server in case it wasn't registered
        try {
          await subscribeToPushNotifications(existingSubscription);
          console.log('Updated existing push subscription on server');
          localStorage.setItem('pushSubscription', JSON.stringify(existingSubscription));
          return true;
        } catch (error) {
          console.warn('Error updating existing subscription:', error);
          // Continue to try creating a new one
        }
      }

      // Create new subscription
      console.log('Creating push subscription...');
      const applicationServerKey = this.urlBase64ToUint8Array(publicVapidKey);
      console.log('Using application server key:', applicationServerKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // Always show notifications when received
        applicationServerKey: applicationServerKey
      });
      console.log('Push subscription created:', subscription);

      // Send the subscription to the server
      await subscribeToPushNotifications(subscription);
      console.log('Push subscription sent to server');

      // Store subscription in local storage for reference
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  },

  /**
   * Check if user is already subscribed to push notifications
   * @returns {Promise<boolean>}
   */
  async isSubscribed() {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  },

  /**
   * Convert a base64 string to a Uint8Array for the applicationServerKey
   * @param {string} base64String 
   * @returns {Uint8Array}
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  /**
   * Unsubscribe from push notifications
   * @returns {Promise<boolean>} - Returns true if successfully unsubscribed
   */
  async unsubscribeFromPush() {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('No subscription to unsubscribe from');
        return true;
      }

      // Get subscription endpoint for server-side removal
      const endpoint = subscription.endpoint;
      
      // Unsubscribe on the client
      const result = await subscription.unsubscribe();
      
      if (result) {
        console.log('Successfully unsubscribed on client');
        
        // Remove from server
        await unsubscribeFromPushNotifications(endpoint);
        
        // Remove from localStorage
        localStorage.removeItem('pushSubscription');
        
        return true;
      } else {
        console.error('Failed to unsubscribe on client');
        return false;
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }
};

export default NotificationService; 