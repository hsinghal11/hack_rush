import express from 'express';
import webpush from 'web-push';

const router = express.Router();

// Set VAPID keys - these should match what you're using on the frontend
const publicVapidKey = 'BPnYZ68ygMHPqSg3UDKn5aVcNBc4e53BJzSMd-txDxLNbiY1xDETIXiCr5xSAaqR2lLYQWIIEm3SwaFBk9gW6dM';
const privateVapidKey = 'Y2cC-uIbiTYHLvjC9qPl_pYj3tUXyRbopzgNYDcqnc4';

// Use environment variables for production
const contactEmail = process.env.VAPID_CONTACT_EMAIL || 'webmaster@yourdomain.com';

webpush.setVapidDetails(
  `mailto:${contactEmail}`,
  publicVapidKey,
  privateVapidKey
);

// Configure timeout for web push
webpush.setGCMAPIKey(process.env.GCM_API_KEY || null);

// Store subscriptions in memory (in production, you'd store these in a database)
const subscriptions = [];

// Route to subscribe to push notifications
router.post('/subscribe', (req, res) => {
  try {
    const subscription = req.body;
    
    // Validate subscription object
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid subscription object' 
      });
    }
    
    // Add to subscriptions if not already present
    const exists = subscriptions.some(
      sub => sub.endpoint === subscription.endpoint
    );
    
    if (!exists) {
      subscriptions.push(subscription);
      console.log(`New subscription added. Total: ${subscriptions.length}`);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });
  } catch (error) {
    console.error('Error in subscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing subscription' 
    });
  }
});

// Route to unsubscribe from push notifications
router.post('/unsubscribe', (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Endpoint is required' 
      });
    }
    
    // Find and remove the subscription
    const index = subscriptions.findIndex(sub => sub.endpoint === endpoint);
    
    if (index !== -1) {
      subscriptions.splice(index, 1);
      console.log(`Subscription removed. Remaining: ${subscriptions.length}`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Successfully unsubscribed' 
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }
  } catch (error) {
    console.error('Error in unsubscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing unsubscription' 
    });
  }
});

// Route to send notification to all subscribers
router.post('/send', async (req, res) => {
  try {
    // Check if there are any subscriptions
    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No subscriptions found' 
      });
    }
    
    const { title, body, ...options } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and body are required' 
      });
    }
    
    // Prepare the notification payload
    const payload = JSON.stringify({
      title,
      body,
      ...options
    });
    
    console.log(`Sending notification to ${subscriptions.length} subscribers`);
    
    // Send notifications to all subscribers
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, payload);
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error('Error sending notification:', error);
          
          // Remove failed subscriptions (they might be expired)
          if (error.statusCode === 404 || error.statusCode === 410) {
            const index = subscriptions.findIndex(
              sub => sub.endpoint === subscription.endpoint
            );
            if (index !== -1) {
              subscriptions.splice(index, 1);
              console.log(`Removed expired subscription. Remaining: ${subscriptions.length}`);
            }
          }
          
          return { 
            success: false, 
            endpoint: subscription.endpoint, 
            error: error.message 
          };
        }
      })
    );
    
    res.status(200).json({ 
      success: true, 
      message: `Notifications sent to ${subscriptions.length} subscribers`,
      results
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while sending notifications'
    });
  }
});

// Route to track notification interactions
router.post('/track', (req, res) => {
  try {
    const { notificationId, action, timestamp } = req.body;
    
    if (!notificationId || !action) {
      return res.status(400).json({
        success: false,
        message: 'NotificationId and action are required'
      });
    }
    
    // In a production environment, you would store this data in a database
    console.log(`Notification interaction tracked: ${notificationId}, Action: ${action}, Time: ${new Date(timestamp).toISOString()}`);
    
    // Here you would implement your analytics logic
    // Example: 
    // - Store in database
    // - Update engagement metrics
    // - Trigger follow-up actions based on user interaction
    
    res.status(200).json({
      success: true,
      message: 'Notification interaction tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking notification interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking notification interaction'
    });
  }
});

export default router;