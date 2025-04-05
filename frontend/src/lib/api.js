import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create an axios instance with baseURL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Get the token either from the top level or from user.accessToken
    const token = user.accessToken;
    
    if (token) {
      console.log('Adding auth token to request');
      config.headers.Authorization = `Bearer ${token}`;
      
      // Special handling for test token
      if (token === 'test-token') {
        console.log('Using test token in request');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error detected, clearing local storage');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email });
    const response = await api.post('/users/login', { email, password });
    console.log('Login response:', response.data);
    
    // Extract and restructure the data to match what our app expects
    const { success, user, accessToken, refreshToken } = response.data;
    
    if (success && user) {
      // Format the response to match what our application expects
      return {
        ...user,
        accessToken: accessToken // Make sure accessToken is available at the top level
      };
    }
    
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Login failed. Please check your credentials and try again.' };
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post('/users/register', { name, email, password, clubAffiliation: "None" });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Club API calls
export const getAllClubs = async () => {
  try {
    const response = await api.get('/clubs');
    console.log('Clubs response:', response.data);
    // Check for the expected format with 'clubs' array
    return response.data.clubs || response.data || [];
  } catch (error) {
    console.error('Error fetching clubs:', error.response?.data || error.message);
    return [];
  }
};

export const getUserClubs = async () => {
  try {
    const response = await api.get('/user/clubs');
    return response.data;
  } catch (error) {
    console.error('Error fetching user clubs:', error.response?.data || error.message);
    return [];  // Return empty array instead of throwing
  }
};

export const requestClubMembership = async (clubId) => {
  try {
    const response = await api.post(`/clubs/${clubId}/request-membership`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Event API calls
export const getAllEvents = async () => {
  try {
    const response = await api.get('/events');
    console.log('Events response:', response.data);
    // Check for the expected format with 'events' array
    return response.data.events || response.data || [];
  } catch (error) {
    console.error('Error fetching events:', error.response?.data || error.message);
    return [];
  }
};

export const getUserEvents = async () => {
  try {
    const response = await api.get('/user/events');
    return response.data;
  } catch (error) {
    console.error('Error fetching user events:', error.response?.data || error.message);
    return [];  // Return empty array instead of throwing
  }
};

export const registerForEvent = async (eventId) => {
  try {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const bookmarkEvent = async (eventId) => {
  try {
    const response = await api.post(`/events/${eventId}/bookmark`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Notice API calls
export const getAllNotices = async () => {
  try {
    const response = await api.get('/notices');
    console.log('Notices response:', response.data);
    // Check for the expected format with 'notices' array
    return response.data.notices || response.data || [];
  } catch (error) {
    console.error('Error fetching notices:', error.response?.data || error.message);
    return [];
  }
};

export const getUserNotices = async () => {
  try {
    const response = await api.get('/user/notices');
    return response.data;
  } catch (error) {
    console.error('Error fetching user notices:', error.response?.data || error.message);
    return [];  // Return empty array instead of throwing
  }
};

export const saveNotice = async (noticeId) => {
  try {
    const response = await api.post(`/notices/${noticeId}/save`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Dashboard API calls
export const getUserProfile = async (email) => {
  try {
    // If email is not provided, just return empty profile data
    if (!email) {
      console.warn('No email provided to getUserProfile');
      return {};
    }
    
    const response = await api.get(`/users/profile/${email}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    // Return empty object instead of throwing
    return {};
  }
};

export const getCoordinatorClub = async () => {
  try {
    console.log('Fetching coordinator club data');
    const response = await api.get('/coordinator/clubs');
    console.log('Coordinator club response:', response.data);
    
    // Extract the first club from the clubs array
    if (response.data.success && response.data.clubs && response.data.clubs.length > 0) {
      const club = response.data.clubs[0];
      
      // Debug: Log the events to check their status
      if (club.events) {
        console.log(`Club has ${club.events.length} events:`);
        club.events.forEach((event, index) => {
          console.log(`Event ${index + 1}: ${event.name} - Status: ${event.status}`);
        });
      } else {
        console.log('Club has no events array');
      }
      
      return club;
    }
    
    return null; // Return null if no clubs found
  } catch (error) {
    console.error('Error fetching coordinator club:', error.response?.data || error.message);
    throw error.response ? error.response.data : error;
  }
};

export const getCoordinatorMembershipRequests = async (clubId) => {
  try {
    const response = await api.get(`/coordinator/clubs/${clubId}/membership-requests`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const respondToMembershipRequest = async (clubId, requestId, status) => {
  try {
    const response = await api.post('/coordinator/clubs/membership-response', {
      clubId,
      requestId,
      status // 'accepted' or 'rejected'
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createEvent = async (eventData) => {
  try {
    console.log('Creating event with data:', eventData);
    const response = await api.post('/coordinator/events', eventData);
    console.log('Create event response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error.response?.data || error.message);
    throw error.response ? error.response.data : { message: `Failed to create event: ${error.message}` };
  }
};

export const createNotice = async (noticeData) => {
  try {
    console.log('Creating notice with data:', noticeData);
    const response = await api.post('/coordinator/notices', noticeData);
    console.log('Create notice response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating notice:', error.response?.data || error.message);
    throw error.response ? error.response.data : { message: `Failed to create notice: ${error.message}` };
  }
};

export const getAdminPendingEvents = async () => {
  try {
    console.log('Fetching pending events for admin');
    const response = await api.get('/admin/events/pending');
    console.log('Admin pending events response:', response.data);
    
    // Check response format and return appropriate data
    if (response.data.success && response.data.events) {
      return response.data.events;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching admin pending events:', error.response?.data || error.message);
    return []; // Return empty array instead of throwing
  }
};

export const getAdminPendingNotices = async () => {
  try {
    console.log('Fetching pending notices for admin');
    const response = await api.get('/admin/notices/pending');
    console.log('Admin pending notices response:', response.data);
    
    // Check response format and return appropriate data
    if (response.data.success && response.data.notices) {
      return response.data.notices;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching admin pending notices:', error.response?.data || error.message);
    return []; // Return empty array instead of throwing
  }
};

export const approveEvent = async (eventId, status, rejectionReason = null) => {
  try {
    console.log(`Approving event ${eventId} with status:`, status ? 'approved' : 'rejected');
    const payload = {
      eventId,
      status: status ? 'approved' : 'rejected',
      rejectionReason
    };
    console.log('Approval payload:', payload);
    
    const response = await api.post('/admin/events/approval', payload);
    console.log('Event approval response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error approving event:', error.response?.data || error.message);
    throw error.response ? error.response.data : { message: `Failed to approve event: ${error.message}` };
  }
};

export const approveNotice = async (noticeId, status, rejectionReason = null) => {
  try {
    const response = await api.post('/admin/notices/approval', {
      noticeId,
      status, // 'approved' or 'rejected'
      rejectionReason
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getAllUsers = async () => {
  try {
    console.log('Fetching all users for admin');
    const response = await api.get('/admin/users');
    console.log('Admin users response:', response.data);
    
    // Check response format and return appropriate data
    if (response.data.success && response.data.users) {
      return response.data.users;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Extract users from response if not in expected format
      return response.data.users || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all users:', error.response?.data || error.message);
    return []; // Return empty array instead of throwing
  }
};

export const createClub = async (clubData) => {
  try {
    const response = await api.post('/admin/clubs/create', clubData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateClub = async (clubId, clubData) => {
  try {
    console.log(`Updating club ${clubId} with data:`, clubData);
    const response = await api.put(`/coordinator/clubs/${clubId}`, clubData);
    console.log('Club update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating club:', error.response?.data || error.message);
    throw error.response ? error.response.data : { message: `Failed to update club: ${error.message}` };
  }
};

export const getCoordinatorAllEvents = async (clubId) => {
  try {
    console.log(`Fetching all events for club ${clubId}`);
    const response = await api.get(`/coordinator/clubs/${clubId}/events`);
    console.log('All events response:', response.data);
    
    // Check response format and return appropriate data
    if (response.data.success && response.data.events) {
      return response.data.events;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all events:', error.response?.data || error.message);
    return []; // Return empty array instead of throwing
  }
};

export const getCoordinatorAllNotices = async (clubId) => {
  try {
    console.log(`Fetching all notices for club ${clubId}`);
    const response = await api.get(`/coordinator/clubs/${clubId}/notices`);
    console.log('All notices response:', response.data);
    
    // Check response format and return appropriate data
    if (response.data.success && response.data.notices) {
      return response.data.notices;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all notices:', error.response?.data || error.message);
    return []; // Return empty array instead of throwing
  }
};

// Push Notification API calls
export const subscribeToPushNotifications = async (subscription) => {
  try {
    console.log('Subscribing to push notifications with:', subscription);
    const response = await api.post('/notifications/subscribe', subscription);
    console.log('Push subscription response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to subscribe to push notifications' };
  }
};

export const unsubscribeFromPushNotifications = async (endpoint) => {
  try {
    console.log('Unsubscribing from push notifications:', endpoint);
    const response = await api.post('/notifications/unsubscribe', { endpoint });
    console.log('Push unsubscription response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to unsubscribe from push notifications' };
  }
};

export const sendPushNotification = async (title, body, options = {}) => {
  try {
    console.log('Sending push notification');
    const payload = {
      title,
      body,
      ...options
    };
    const response = await api.post('/notifications/send', payload);
    console.log('Push notification sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending push notification:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to send push notification' };
  }
};

export default api; 