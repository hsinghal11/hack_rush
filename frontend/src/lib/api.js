import axios from 'axios';

const API_URL = 'https://hack-rush.onrender.com/api';
// const API_URL = 'http://localhost:8000/api';


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
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log('No user data found in localStorage');
        return config;
      }
      
      let user;
      try {
        user = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        return config;
      }
      
      // Get the token from user object
      const token = user.accessToken;
      
      if (token) {
        // Make sure the token is properly formatted
        if (typeof token === 'string' && token.trim() !== '') {
          // Check if token looks like a JWT (has two dots)
          if (!token.includes('.') || token.split('.').length !== 3) {
            console.error('Token does not appear to be a valid JWT, clearing user data', token);
            localStorage.removeItem('user');
            return config;
          }
          
          // Remove any "Bearer " prefix if it already exists
          const cleanToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token.trim();
          
          console.log('Adding auth token to request, length:', cleanToken.length);
          // Use consistent header format with Bearer prefix
          config.headers.Authorization = `Bearer ${cleanToken}`;
        } else {
          console.warn('Invalid token format in user object:', typeof token);
          localStorage.removeItem('user'); // Clear invalid token
        }
      } else {
        console.warn('No token found in user object');
      }
    } catch (error) {
      console.error('Error adding auth token to request:', error);
      // Clear broken user data
      localStorage.removeItem('user');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config.url,
        method: error.config.method
      });
      
      // Handle authentication errors
      if (error.response.status === 401) {
        console.log('Authentication error detected:', error.response.data);
        // Only clear storage if token is explicitly invalid/expired
        if (error.response.data.message?.includes('Invalid access token') || 
            error.response.data.message?.includes('expired')) {
          console.log('Clearing local storage due to invalid token');
          localStorage.removeItem('user');
        }
      }
    } else {
      console.error('API Error (no response):', error.message);
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API calls
export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email });
    const response = await api.post('/users/login', { email, password });
    console.log('Login response:', response.data);
    
    // Extract data from the response
    const { success, user, accessToken, refreshToken } = response.data;
    
    if (success && user && accessToken) {
      // Return properly formatted data with the token at root level
      return {
        user,
        accessToken,
        refreshToken
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
    console.log('User clubs response:', response.data);
    
    // Check for the expected format
    if (response.data.success && response.data.clubMemberships) {
      return response.data.clubMemberships || [];
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching user clubs:', error.response?.data || error.message);
    return [];  // Return empty array instead of throwing
  }
};

export const requestClubMembership = async (clubId) => {
  try {
    console.log(`Requesting membership for club: ${clubId}`);
    const response = await api.post(`/clubs/${clubId}/request-membership`);
    console.log('Club membership request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Club membership request failed:', error.response?.data || error.message);
    
    // Handle token expiration
    if (error.response?.status === 401 || 
        error.message?.includes('JWT') || 
        error.message?.includes('token')) {
      console.log('Authentication error detected, clearing user data');
      localStorage.removeItem('user');
    }
    
    throw error.response?.data || { message: `Failed to request club membership: ${error.message}` };
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
    console.log('User events response:', response.data);
    
    // Check for the expected format
    if (response.data.success && response.data.registeredEvents) {
      // Return registered events
      const registeredEvents = response.data.registeredEvents.map(event => ({
        ...event,
        isRegistered: true
      }));
      
      // Also get bookmarked events
      const bookmarkResponse = await api.get('/user/bookmarks');
      console.log('User bookmarks response:', bookmarkResponse.data);
      
      let bookmarkedEvents = [];
      if (bookmarkResponse.data.success && bookmarkResponse.data.bookmarks && 
          bookmarkResponse.data.bookmarks.events) {
        bookmarkedEvents = bookmarkResponse.data.bookmarks.events.map(event => ({
          ...event,
          isBookmarked: true
        }));
      }
      
      // Combine both types of events
      return [...registeredEvents, ...bookmarkedEvents];
    }
    
    return response.data || [];
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
    console.log('User notices response:', response.data);
    
    // Check for the expected format
    if (response.data.success && response.data.savedNotices) {
      return response.data.savedNotices.map(notice => ({
        ...notice,
        isSaved: true
      }));
    }
    
    return response.data || [];
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
    console.log(`Fetching membership requests for club ${clubId}`);
    const response = await api.get(`/coordinator/clubs/${clubId}/membership-requests`);
    console.log('Membership requests response:', response.data);
    
    // Check response format and return appropriate data
    if (response.data.success && response.data.requests) {
      // If the backend returns the expected format with requests array
      return response.data.requests.map(req => ({
        _id: req._id,
        name: req.user?.name || 'Unknown User',
        email: req.user?.email || 'No Email',
        status: req.status,
        requestDate: req.requestDate
      }));
    } else if (Array.isArray(response.data)) {
      // If the backend returns an array directly
      return response.data;
    }
    
    // Return empty array if data format is unexpected
    return [];
  } catch (error) {
    console.error('Error fetching membership requests:', error.response?.data || error.message);
    return []; // Return empty array instead of throwing
  }
};

export const respondToMembershipRequest = async (clubId, requestId, status) => {
  try {
    console.log(`Responding to membership request for club ${clubId}, requestId: ${requestId}, status: ${status}`);
    const response = await api.post('/coordinator/clubs/membership-response', {
      clubId,
      requestId,
      status // 'accepted' or 'rejected'
    });
    console.log('Membership response API result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error responding to membership request:', error.response?.data || error.message);
    throw error.response?.data || { message: `Failed to ${status} membership request: ${error.message}` };
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
    
    // Determine if we should use the admin endpoint
    const isAdminNotice = noticeData.isAdminNotice || false;
    
    // Use admin endpoint if it's an admin notice
    const endpoint = isAdminNotice ? '/admin/notices' : '/coordinator/notices';
    
    const response = await api.post(endpoint, noticeData);
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
    console.log('Creating club with data:', clubData);
    const response = await api.post('/admin/clubs/create', clubData);
    console.log('Create club response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating club:', error.response?.data || error.message);
    throw error.response?.data || { message: `Failed to create club: ${error.message}` };
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    console.log(`Updating user ${userId} role to ${role}`);
    // Fix the endpoint and payload to match backend expectations
    const response = await api.post(`/admin/users/role`, { 
      userId, 
      role: convertRole(role) 
    });
    console.log('User role update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error.response?.data || error.message);
    throw error.response?.data || { message: `Failed to update user role: ${error.message}` };
  }
};

// Helper function to convert frontend role names to backend role names
function convertRole(frontendRole) {
  const roleMap = {
    'user': 'student',
    'coordinator': 'club-coordinator',
    'admin': 'admin'
  };
  return roleMap[frontendRole] || frontendRole;
}

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

export const editNotice = async (noticeId, noticeData) => {
  try {
    console.log(`Editing notice ${noticeId} with data:`, noticeData);
    const response = await api.put(`/admin/notices/${noticeId}`, noticeData);
    console.log('Edit notice response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error editing notice:', error.response?.data || error.message);
    throw error.response ? error.response.data : { message: `Failed to edit notice: ${error.message}` };
  }
};

export const removeNotice = async (noticeId) => {
  try {
    console.log(`Removing notice ${noticeId}`);
    const response = await api.delete(`/admin/notices/${noticeId}`);
    console.log('Remove notice response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error removing notice:', error.response?.data || error.message);
    throw error.response ? error.response.data : { message: `Failed to remove notice: ${error.message}` };
  }
};

export default api; 