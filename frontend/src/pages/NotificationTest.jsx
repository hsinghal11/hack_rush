import React, { useState, useEffect } from 'react';
import NotificationService from '../lib/NotificationService';
import { sendPushNotification } from '../lib/api';

const NotificationTest = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [status, setStatus] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('Test Notification');
  const [notificationBody, setNotificationBody] = useState('This is a test notification');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    permission: 'unknown',
    serviceWorker: false,
    registration: null,
    pushManager: false
  });

  useEffect(() => {
    // Check if push notifications are supported
    const supported = NotificationService.isSupported();
    setIsSupported(supported);

    // Check current permission
    if (supported) {
      setDebugInfo(prev => ({
        ...prev,
        permission: Notification.permission
      }));

      // Check service worker registration
      checkServiceWorker();
      
      // Check subscription status
      checkSubscriptionStatus();
    }
  }, []);

  const checkServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        if (registrations.length > 0) {
          setDebugInfo(prev => ({
            ...prev,
            serviceWorker: true,
            registration: {
              scope: registrations[0].scope,
              active: !!registrations[0].active,
              waiting: !!registrations[0].waiting,
              installing: !!registrations[0].installing
            },
            pushManager: true
          }));
          
          // Log registration details
          console.log('Service worker registrations:', registrations);
        } else {
          setDebugInfo(prev => ({
            ...prev,
            serviceWorker: false,
            registration: null
          }));
        }
      }
    } catch (error) {
      console.error('Error checking service worker:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const subscribed = await NotificationService.isSubscribed();
      setIsSubscribed(subscribed);
      setStatus(subscribed ? 'Subscribed to notifications' : 'Not subscribed');
    } catch (error) {
      setStatus(`Error checking subscription: ${error.message}`);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setStatus('Requesting permission...');
      
      // Request permission and subscribe
      const result = await NotificationService.subscribeToPush();
      
      if (result) {
        setStatus('Successfully subscribed to push notifications!');
        setIsSubscribed(true);
        
        // Update debug info after subscription
        setDebugInfo(prev => ({
          ...prev,
          permission: Notification.permission
        }));
        
        checkServiceWorker();
      } else {
        setStatus('Failed to subscribe. Permission might be denied.');
      }
    } catch (error) {
      setStatus(`Error subscribing: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      setStatus('Unsubscribing...');
      
      const result = await NotificationService.unsubscribeFromPush();
      
      if (result) {
        setStatus('Successfully unsubscribed from push notifications');
        setIsSubscribed(false);
      } else {
        setStatus('Failed to unsubscribe');
      }
    } catch (error) {
      setStatus(`Error unsubscribing: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    try {
      setIsLoading(true);
      setStatus('Sending notification...');
      
      await sendPushNotification(notificationTitle, notificationBody, {
        icon: '/favicon.svg',
        tag: 'test-notification',
        requireInteraction: true,
        data: {
          url: '/notification-test',
          notificationId: `test-${Date.now()}`
        },
        actions: [
          {
            action: 'action1',
            title: 'Action 1'
          },
          {
            action: 'action2',
            title: 'Action 2'
          }
        ]
      });
      
      setStatus('Notification sent successfully!');
    } catch (error) {
      setStatus(`Error sending notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectNotification = () => {
    try {
      // This is for testing the browser's notification API directly
      if (Notification.permission === 'granted') {
        new Notification(notificationTitle, {
          body: notificationBody,
          icon: '/favicon.svg'
        });
        setStatus('Direct notification displayed successfully!');
      } else {
        setStatus('Permission not granted for direct notifications');
      }
    } catch (error) {
      setStatus(`Error showing direct notification: ${error.message}`);
    }
  };

  if (!isSupported) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-xl font-bold mb-4">Push Notification Test</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Push notifications are not supported in this browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-xl font-bold mb-4">Push Notification Test</h1>
      
      <div className="mb-6">
        <p className="mb-2"><strong>Status:</strong> {isSubscribed ? 'Subscribed ✅' : 'Not Subscribed ❌'}</p>
        <p className="text-sm text-gray-600">{status}</p>
      </div>
      
      <div className="mb-6">
        {!isSubscribed ? (
          <button 
            onClick={handleSubscribe} 
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Subscribe to Notifications'}
          </button>
        ) : (
          <button 
            onClick={handleUnsubscribe} 
            disabled={isLoading}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Unsubscribe from Notifications'}
          </button>
        )}
      </div>
      
      {isSubscribed && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Send Test Notification</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Notification Title
            </label>
            <input
              type="text"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Notification Body
            </label>
            <textarea
              value={notificationBody}
              onChange={(e) => setNotificationBody(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button 
              onClick={handleSendNotification} 
              disabled={isLoading || !notificationTitle || !notificationBody}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Push Notification'}
            </button>
            
            <button 
              onClick={handleDirectNotification}
              disabled={isLoading || !notificationTitle || !notificationBody}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              Send Direct Notification
            </button>
          </div>
        </div>
      )}
      
      {/* Debug Information Section */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        <div className="bg-gray-100 p-4 rounded text-sm font-mono overflow-x-auto">
          <p><strong>Notification Permission:</strong> {debugInfo.permission}</p>
          <p><strong>Service Worker:</strong> {debugInfo.serviceWorker ? 'Registered ✅' : 'Not Registered ❌'}</p>
          
          {debugInfo.registration && (
            <>
              <p><strong>Service Worker Scope:</strong> {debugInfo.registration.scope}</p>
              <p><strong>Service Worker Status:</strong> 
                {debugInfo.registration.active ? 'Active ✅' : ''} 
                {debugInfo.registration.waiting ? 'Waiting ⏳' : ''} 
                {debugInfo.registration.installing ? 'Installing ⚙️' : ''}
              </p>
            </>
          )}
          
          <p><strong>Push Manager:</strong> {debugInfo.pushManager ? 'Available ✅' : 'Not Available ❌'}</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest; 