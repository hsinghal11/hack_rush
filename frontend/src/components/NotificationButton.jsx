import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bell, BellOff } from 'lucide-react';
import { NotificationService } from '../lib/NotificationService';

const NotificationButton = () => {
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = NotificationService.isSupported();
      setNotificationsSupported(supported);

      if (supported) {
        const subscribed = await NotificationService.isSubscribed();
        setIsSubscribed(subscribed);
      }
    };

    checkSupport();
  }, []);

  const handleSubscribeClick = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const success = await NotificationService.subscribeToPush();
      setIsSubscribed(success);
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!notificationsSupported) {
    return null; // Don't render anything if notifications aren't supported
  }

  return (
    <Button
      variant={isSubscribed ? "ghost" : "outline"}
      size="sm"
      className={`flex items-center gap-1 ${isSubscribed ? 'text-green-600' : ''}`}
      onClick={handleSubscribeClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
    </Button>
  );
};

export default NotificationButton; 