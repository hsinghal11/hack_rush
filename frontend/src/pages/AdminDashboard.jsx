import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
  getAllUsers, 
  getAdminPendingEvents, 
  approveEvent, 
  createClub,
  getAllClubs,
  updateUserRole,
  createEvent,
  createNotice
} from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Link } from 'react-router-dom';
import { Textarea } from '../components/ui/textarea';

const AdminDashboard = () => {
  console.log('Rendering AdminDashboard component');
  const { currentUser } = useAuth();
  console.log('Current user:', currentUser);
  
  const [users, setUsers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for creating a new club
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [selectedCoordinator, setSelectedCoordinator] = useState('');

  // State for editing user
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserRole, setNewUserRole] = useState('');
  
  // State for creating an event
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    date: '',
    venue: '',
    club: '',
    category: 'general'
  });

  // State for creating a notice
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);
  const [noticeData, setNoticeData] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  // Get all data for admin dashboard
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        console.log('Fetching admin dashboard data...');
        
        // Fetch each piece of data separately with error handling
        let usersData = [];
        try {
          usersData = await getAllUsers();
          console.log('Users data:', usersData);
        } catch (err) {
          console.error('Error fetching users:', err);
        }
        
        let eventsData = [];
        try {
          eventsData = await getAdminPendingEvents();
          console.log('Pending events data:', eventsData);
        } catch (err) {
          console.error('Error fetching pending events:', err);
        }
        
        let clubsData = [];
        try {
          clubsData = await getAllClubs();
          console.log('Clubs data:', clubsData);
        } catch (err) {
          console.error('Error fetching clubs:', err);
        }
        
        setUsers(usersData || []);
        setPendingEvents(eventsData || []);
        setClubs(clubsData || []);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    console.log('Checking currentUser in useEffect:', currentUser);
    if (currentUser) {
      fetchAdminData();
    } else {
      console.log('No current user, skipping data fetch');
      setLoading(false);
    }
  }, [currentUser]);

  const handleEventApproval = async (eventId, approval) => {
    if (!eventId) {
      console.error('No event ID provided for approval');
      alert('Cannot approve/reject event: No event ID provided');
      return;
    }
    
    try {
      console.log(`Attempting to ${approval ? 'approve' : 'reject'} event ${eventId}`);
      await approveEvent(eventId, approval);
      console.log(`Event ${eventId} successfully ${approval ? 'approved' : 'rejected'}`);
      
      // Show success message
      alert(`Event ${approval ? 'approved' : 'rejected'} successfully`);
      
      // Update the events list
      setPendingEvents(prevEvents => 
        prevEvents.filter(event => event._id !== eventId)
      );
    } catch (err) {
      console.error('Error updating event status:', err);
      alert(`Failed to ${approval ? 'approve' : 'reject'} the event: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    
    try {
      if (!clubName || !clubDescription || !selectedCoordinator) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Find the selected user to get their email
      const selectedUser = users.find(user => user._id === selectedCoordinator);
      
      if (!selectedUser) {
        alert('Selected coordinator not found in users list');
        return;
      }
      
      const clubData = {
        name: clubName,
        description: clubDescription,
        coordinatorId: selectedCoordinator,
        coordinatorEmail: selectedUser.email // Include email as well
      };
      
      console.log('Creating club with data:', clubData);
      await createClub(clubData);
      alert('Club created successfully!');
      
      // Reset form
      setClubName('');
      setClubDescription('');
      setSelectedCoordinator('');
      
      // Refresh clubs data
      const updatedClubs = await getAllClubs();
      setClubs(updatedClubs);
    } catch (err) {
      console.error('Error creating club:', err);
      alert('Failed to create club: ' + (err.message || 'Please try again.'));
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUserRole(user.role);
    setIsEditingUser(true);
  };

  const handleSaveUserEdit = async () => {
    try {
      if (!editingUser || !newUserRole) {
        alert('Please select a role for the user');
        return;
      }

      await updateUserRole(editingUser._id, newUserRole);
      
      // Update the users list
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
      
      // Close the dialog
      setIsEditingUser(false);
      setEditingUser(null);
      setNewUserRole('');
      
      alert('User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEventDataChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNoticeDataChange = (e) => {
    const { name, value } = e.target;
    setNoticeData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!eventData.name || !eventData.description || !eventData.date || !eventData.venue) {
        alert('Please fill in all required fields');
        return;
      }
      
      console.log('Creating event with data:', eventData);
      await createEvent(eventData);
      alert('Event created successfully!');
      
      // Reset form
      setEventData({
        name: '',
        description: '',
        date: '',
        venue: '',
        club: '',
        category: 'general'
      });
      
      // Close dialog
      setIsCreatingEvent(false);
      
      // Refresh events data
      const updatedEvents = await getAdminPendingEvents();
      setPendingEvents(updatedEvents);
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to create event: ' + (err.message || 'Please try again.'));
    }
  };
  
  const handleCreateNoticeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!noticeData.title || !noticeData.content) {
        alert('Please fill in all required fields');
        return;
      }
      
      console.log('Creating notice with data:', noticeData);
      await createNotice(noticeData);
      alert('Notice created successfully!');
      
      // Reset form
      setNoticeData({
        title: '',
        content: '',
        category: 'general'
      });
      
      // Close dialog
      setIsCreatingNotice(false);
    } catch (err) {
      console.error('Error creating notice:', err);
      alert('Failed to create notice: ' + (err.message || 'Please try again.'));
    }
  };

  // Wrap render in try-catch to debug render errors
  try {
    console.log('About to render AdminDashboard');
    console.log('State values:', { 
      usersLength: Array.isArray(users) ? users.length : 'not an array', 
      pendingEventsLength: Array.isArray(pendingEvents) ? pendingEvents.length : 'not an array',
      clubsLength: Array.isArray(clubs) ? clubs.length : 'not an array',
      loading,
      error
    });
    
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex space-x-2">
            <Link to="/admin-notifications">
              <Button variant="outline" className="mr-2">Manage Notifications</Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="mr-2">Create Event</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new event.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEventSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="eventName" className="text-right">Name</label>
                      <Input 
                        id="eventName" 
                        name="name"
                        placeholder="Event name" 
                        className="col-span-3"
                        value={eventData.name}
                        onChange={handleEventDataChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="eventDescription" className="text-right">Description</label>
                      <Textarea 
                        id="eventDescription" 
                        name="description"
                        placeholder="Event description" 
                        className="col-span-3"
                        value={eventData.description}
                        onChange={handleEventDataChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="eventDate" className="text-right">Date</label>
                      <Input 
                        id="eventDate" 
                        name="date"
                        type="datetime-local" 
                        className="col-span-3"
                        value={eventData.date}
                        onChange={handleEventDataChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="eventVenue" className="text-right">Venue</label>
                      <Input 
                        id="eventVenue" 
                        name="venue"
                        placeholder="Event venue" 
                        className="col-span-3"
                        value={eventData.venue}
                        onChange={handleEventDataChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="eventCategory" className="text-right">Category</label>
                      <select
                        id="eventCategory"
                        name="category"
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                        value={eventData.category}
                        onChange={handleEventDataChange}
                        required
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="cultural">Cultural</option>
                        <option value="sports">Sports</option>
                        <option value="academic">Academic</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="eventClub" className="text-right">Club (Optional)</label>
                      <select
                        id="eventClub"
                        name="club"
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                        value={eventData.club}
                        onChange={handleEventDataChange}
                      >
                        <option value="">Select a club (optional)</option>
                        {clubs && Array.isArray(clubs) && clubs.map(club => (
                          <option key={club._id} value={club._id}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Event</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="mr-2">Create Notice</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Notice</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new notice.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateNoticeSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="noticeTitle" className="text-right">Title</label>
                      <Input 
                        id="noticeTitle" 
                        name="title"
                        placeholder="Notice title" 
                        className="col-span-3"
                        value={noticeData.title}
                        onChange={handleNoticeDataChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="noticeContent" className="text-right">Content</label>
                      <Textarea 
                        id="noticeContent" 
                        name="content"
                        placeholder="Notice content" 
                        className="col-span-3"
                        value={noticeData.content}
                        onChange={handleNoticeDataChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="noticeCategory" className="text-right">Category</label>
                      <select
                        id="noticeCategory"
                        name="category"
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                        value={noticeData.category}
                        onChange={handleNoticeDataChange}
                        required
                      >
                        <option value="general">General</option>
                        <option value="academic">Academic</option>
                        <option value="fee">Fee</option>
                        <option value="club">Club</option>
                        <option value="campus">Campus</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Notice</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create Club</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Club</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new club and assign a coordinator.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateClub}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="clubName" className="text-right">
                        Name
                      </label>
                      <Input 
                        id="clubName" 
                        placeholder="Club name" 
                        className="col-span-3"
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="description" className="text-right">
                        Description
                      </label>
                      <Input 
                        id="description" 
                        placeholder="Club description" 
                        className="col-span-3"
                        value={clubDescription}
                        onChange={(e) => setClubDescription(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="coordinator" className="text-right">
                        Coordinator
                      </label>
                      <select
                        id="coordinator"
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                        value={selectedCoordinator}
                        onChange={(e) => setSelectedCoordinator(e.target.value)}
                        required
                      >
                        <option value="">Select a coordinator</option>
                        {users && Array.isArray(users) && users
                          // Show all users for now, don't filter by role
                          .map(user => (
                            <option key={user._id} value={user._id}>
                              {user.name} ({user.email}) - {user.role || 'Unknown role'}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Club</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>
        )}

        {!currentUser && (
          <div className="bg-orange-50 text-orange-600 p-4 rounded-md mb-6">
            You need to be logged in as an admin to view this page.
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Total registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{Array.isArray(users) ? users.length : 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Clubs</CardTitle>
                <CardDescription>Total active clubs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{Array.isArray(clubs) ? clubs.length : 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending Events</CardTitle>
                <CardDescription>Events awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{Array.isArray(pendingEvents) ? pendingEvents.length : 0}</p>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="events" className="mb-8">
            <TabsList className="mb-6">
              <TabsTrigger value="events">Pending Events</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="clubs">Clubs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Events</CardTitle>
                  <CardDescription>Review and manage event approval requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(pendingEvents) && pendingEvents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Name</th>
                            <th className="text-left py-3 px-4">Description</th>
                            <th className="text-left py-3 px-4">Club</th>
                            <th className="text-left py-3 px-4">Date</th>
                            <th className="text-right py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingEvents.map((event) => (
                            <tr key={event._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{event.name || 'No name'}</td>
                              <td className="py-3 px-4">{event.description || 'No description'}</td>
                              <td className="py-3 px-4">
                                {event.club?.name || (typeof event.club === 'string' ? event.club : 'Unknown club')}
                              </td>
                              <td className="py-3 px-4">{event.date ? new Date(event.date).toLocaleDateString() : 'No date'}</td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleEventApproval(event._id, true)}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleEventApproval(event._id, false)}
                                >
                                  Reject
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No pending events</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(users) && users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Name</th>
                            <th className="text-left py-3 px-4">Email</th>
                            <th className="text-left py-3 px-4">Role</th>
                            <th className="text-right py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{user.name || 'No name'}</td>
                              <td className="py-3 px-4">{user.email || 'No email'}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : user.role === 'coordinator' || user.role === 'club-coordinator'
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.role || 'Unknown role'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No users found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="clubs">
              <Card>
                <CardHeader>
                  <CardTitle>Clubs</CardTitle>
                  <CardDescription>Manage clubs and their coordinators</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(clubs) && clubs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Name</th>
                            <th className="text-left py-3 px-4">Description</th>
                            <th className="text-left py-3 px-4">Coordinator</th>
                            <th className="text-left py-3 px-4">Members</th>
                            <th className="text-right py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clubs.map((club) => (
                            <tr key={club._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{club.name || 'No name'}</td>
                              <td className="py-3 px-4">{club.description || 'No description'}</td>
                              <td className="py-3 px-4">{club.coordinator?.name || 'No coordinator'}</td>
                              <td className="py-3 px-4">{Array.isArray(club.members) ? club.members.length : 0}</td>
                              <td className="py-3 px-4 text-right">
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No clubs found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* User Edit Dialog */}
          {isEditingUser && (
            <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit User Role</DialogTitle>
                  <DialogDescription>
                    Change the role of {editingUser?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="userRole" className="text-right">
                      Role
                    </label>
                    <select
                      id="userRole"
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      required
                    >
                      <option value="">Select a role</option>
                      <option value="user">Student</option>
                      <option value="coordinator">Club Coordinator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleSaveUserEdit}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          </>
        )}
      </div>
    );
  } catch (err) {
    console.error('Error rendering AdminDashboard:', err);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-2">Error rendering Admin Dashboard</h2>
          <p>{err.message || 'An unknown error occurred'}</p>
        </div>
      </div>
    );
  }
};

export default AdminDashboard; 