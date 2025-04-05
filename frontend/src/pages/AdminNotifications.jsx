import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { sendPushNotification } from '../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useNavigate } from 'react-router-dom';

const AdminNotifications = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    icon: '/favicon.svg',
    url: '/',
  });

  // Redirect non-admin users
  if (currentUser?.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      await sendPushNotification(
        formData.title,
        formData.body,
        {
          icon: formData.icon,
          url: formData.url
        }
      );
      
      alert('Notification sent successfully!');
      
      // Reset form except icon and url
      setFormData(prev => ({
        ...prev,
        title: '',
        body: '',
      }));
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(`Failed to send notification: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 mt-8">
      <h1 className="text-2xl font-bold mb-6">Send Push Notifications</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
          <CardDescription>
            Send a push notification to all subscribed users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="title">
                Notification Title*
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter notification title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="body">
                Notification Body*
              </label>
              <Textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Enter notification message"
                rows={3}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="icon">
                Icon URL (optional)
              </label>
              <Input
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="/favicon.svg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="url">
                Click URL (optional)
              </label>
              <Input
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="/"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Notification'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 bg-gray-50">
          <p className="text-sm text-gray-500">
            Only users who have subscribed to notifications will receive these messages.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminNotifications; 