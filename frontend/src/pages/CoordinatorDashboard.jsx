import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
  getCoordinatorClub, 
  getCoordinatorMembershipRequests, 
  respondToMembershipRequest,
  createEvent,
  createNotice,
  updateClub,
  getCoordinatorAllEvents,
  getCoordinatorAllNotices
} from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

const CoordinatorDashboard = () => {
  const { currentUser } = useAuth();
  const [club, setClub] = useState(null);
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [allNotices, setAllNotices] = useState([]);

  // Dialog open states
  const [editClubOpen, setEditClubOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createNoticeOpen, setCreateNoticeOpen] = useState(false);

  // Form states for club edit
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');

  // Form states for event creation
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  
  // Form states for notice creation
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('');
  const [noticeDescription, setNoticeDescription] = useState('');
  const [noticeDueDate, setNoticeDueDate] = useState('');

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        
        if (!currentUser) {
          console.error('No user data found');
          setError('Not logged in. Please login first.');
          setLoading(false);
          return;
        }
        
        console.log('Current user role:', currentUser.role);
        
        const clubData = await getCoordinatorClub();
        console.log('Club data received:', clubData);
        
        if (!clubData) {
          setError('You are not assigned to any club. Please contact an administrator.');
          setLoading(false);
          return;
        }
        
        setClub(clubData);
        
        // Initialize club edit form fields
        if (clubData) {
          setClubName(clubData.name || '');
          setClubDescription(clubData.description || '');
        }
        
        if (clubData && clubData._id) {
          // Fetch membership requests
          const requests = await getCoordinatorMembershipRequests(clubData._id);
          setMembershipRequests(requests);
          
          // Fetch all events including pending and rejected
          const events = await getCoordinatorAllEvents(clubData._id);
          console.log('All events fetched:', events);
          setAllEvents(events);
          
          // Fetch all notices including pending and rejected
          const notices = await getCoordinatorAllNotices(clubData._id);
          console.log('All notices fetched:', notices);
          setAllNotices(notices);
        } else {
          console.error('Club data missing _id field:', clubData);
        }
      } catch (err) {
        console.error('Error fetching club data:', err);
        setError('Failed to load your club data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchClubData();
    } else {
      setError('Not logged in. Please login first.');
    }
  }, [currentUser]);

  const handleMembershipResponse = async (requestId, status) => {
    if (!club || !club._id) return;
    
    try {
      await respondToMembershipRequest(club._id, requestId, status);
      
      // Update local state to reflect the change
      setMembershipRequests(prevRequests => 
        prevRequests.filter(request => request._id !== requestId)
      );
    } catch (err) {
      console.error('Error responding to membership request:', err);
      alert(`Failed to ${status} the membership request.`);
    }
  };

  const handleSaveClub = async (e) => {
    e.preventDefault();
    console.log('Form submitted: handleSaveClub');
    
    console.log('handleSaveClub called', { clubName, clubDescription });
    if (!club || !club._id) {
      console.error('No club or club ID found');
      alert('No club data available');
      return;
    }
    
    try {
      const clubData = {
        name: clubName,
        description: clubDescription
      };
      
      console.log('Calling updateClub with:', club._id, clubData);
      await updateClub(club._id, clubData);
      alert('Club information updated successfully');
      
      // Update local state
      setClub({
        ...club,
        ...clubData
      });
      
      // Close the dialog
      setEditClubOpen(false);
    } catch (err) {
      console.error('Error updating club:', err);
      alert('Failed to update club information. Please try again.');
      // Close the dialog even if there's an error
      setEditClubOpen(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    console.log('Form submitted: handleCreateEvent');
    
    console.log('handleCreateEvent called', { eventName, eventDescription, eventDate, eventTime, eventLocation });
    if (!club) {
      console.error('No club found');
      alert('No club data available. Please refresh the page or contact an administrator.');
      return;
    }
    
    if (!club._id) {
      console.error('Club data missing _id field:', club);
      alert('Club data incomplete. Please refresh the page or contact an administrator.');
      return;
    }
    
    try {
      const eventData = {
        name: eventName,
        description: eventDescription,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        clubId: club._id
      };
      
      console.log('Creating event with data:', eventData);
      await createEvent(eventData);
      alert('Event submitted for approval');
      
      // Reset form
      setEventName('');
      setEventDescription('');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      
      // Close the dialog
      setCreateEventOpen(false);
      
      // Refresh club data to include the new event
      const updatedClub = await getCoordinatorClub();
      setClub(updatedClub);
      
      // Also refresh all events to include the pending event
      const events = await getCoordinatorAllEvents(club._id);
      setAllEvents(events);
    } catch (err) {
      console.error('Error creating event:', err);
      alert(`Failed to create event: ${err.message || 'Unknown error'}`);
      // Close the dialog even if there's an error
      setCreateEventOpen(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    console.log('Form submitted: handleCreateNotice');
    
    console.log('handleCreateNotice called', { noticeTitle, noticeCategory, noticeDescription, noticeDueDate });
    if (!club) {
      console.error('No club found');
      alert('No club data available. Please refresh the page or contact an administrator.');
      return;
    }
    
    if (!club._id) {
      console.error('Club data missing _id field:', club);
      alert('Club data incomplete. Please refresh the page or contact an administrator.');
      return;
    }
    
    try {
      const noticeData = {
        title: noticeTitle,
        description: noticeDescription,
        category: noticeCategory,
        dueDate: noticeDueDate,
        clubId: club._id
      };
      
      console.log('Creating notice with data:', noticeData);
      await createNotice(noticeData);
      alert('Notice submitted for approval');
      
      // Reset form
      setNoticeTitle('');
      setNoticeCategory('');
      setNoticeDescription('');
      setNoticeDueDate('');
      
      // Close the dialog
      setCreateNoticeOpen(false);
      
      // Refresh club data to include the new notice
      const updatedClub = await getCoordinatorClub();
      setClub(updatedClub);
      
      // Also refresh all notices to include the pending notice
      const notices = await getCoordinatorAllNotices(club._id);
      setAllNotices(notices);
    } catch (err) {
      console.error('Error creating notice:', err);
      alert(`Failed to create notice: ${err.message || 'Unknown error'}`);
      // Close the dialog even if there's an error
      setCreateNoticeOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Coordinator Dashboard</h1>
        <div>
          <Dialog open={editClubOpen} onOpenChange={setEditClubOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mr-2">Edit Club</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Club Information</DialogTitle>
                <DialogDescription>
                  Make changes to your club details here.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveClub}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="clubName" className="text-right">
                      Name
                    </label>
                    <Input 
                      id="clubName" 
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      className="col-span-3" 
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="description" className="text-right">
                      Description
                    </label>
                    <Input 
                      id="description" 
                      value={clubDescription}
                      onChange={(e) => setClubDescription(e.target.value)}
                      className="col-span-3" 
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditClubOpen(false)} className="mr-2">
                    Cancel
                  </Button>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
            <DialogTrigger asChild>
              <Button>Create Event</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new event.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="eventName" className="text-right">
                      Name
                    </label>
                    <Input 
                      id="eventName" 
                      placeholder="Event name" 
                      className="col-span-3"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="eventDescription" className="text-right">
                      Description
                    </label>
                    <Input 
                      id="eventDescription" 
                      placeholder="Event description" 
                      className="col-span-3"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="eventDate" className="text-right">
                      Date
                    </label>
                    <Input 
                      id="eventDate" 
                      type="date" 
                      className="col-span-3"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="eventTime" className="text-right">
                      Time
                    </label>
                    <Input 
                      id="eventTime" 
                      type="time" 
                      className="col-span-3"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="eventLocation" className="text-right">
                      Location
                    </label>
                    <Input 
                      id="eventLocation" 
                      placeholder="Event location" 
                      className="col-span-3"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateEventOpen(false)} className="mr-2">
                    Cancel
                  </Button>
                  <Button type="submit">Create Event</Button>
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
          Not logged in. Please <a href="/login" className="underline">login</a> to access this page.
        </div>
      )}
      
      {currentUser && (
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <div className="flex flex-col gap-2">
            <div>
              <div className="font-bold text-black">Name</div>
              <div className="text-black">{currentUser.name}</div>
            </div>
            <div>
              <div className="font-bold text-black">Email</div>
              <div className="text-black">{currentUser.email}</div>
            </div>
            <div>
              <div className="font-bold text-black">Role</div>
              <div className="text-black">{currentUser.role}</div>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : !club ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No club found. Please contact an administrator.</p>
        </div>
      ) : (
        <>
          {/* Club Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{club.name}</CardTitle>
              <CardDescription>Club Overview</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{club.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">MEMBERS</h3>
                  <p className="text-2xl font-bold">{club.members?.length || 0}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">PENDING REQUESTS</h3>
                  <p className="text-2xl font-bold">{membershipRequests?.length || 0}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">EVENTS</h3>
                  <p className="text-2xl font-bold">{club.events?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs for different sections */}
          <Tabs defaultValue="members" className="mb-8">
            <TabsList className="mb-6">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="requests">Membership Requests</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Club Members</CardTitle>
                  <CardDescription>Manage your club members</CardDescription>
                </CardHeader>
                <CardContent>
                  {club.members && club.members.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Name</th>
                            <th className="text-left py-3 px-4">Email</th>
                            <th className="text-right py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {club.members.map((member) => (
                            <tr key={member._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{member.name}</td>
                              <td className="py-3 px-4">{member.email}</td>
                              <td className="py-3 px-4 text-right">
                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No members in the club yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Membership Requests</CardTitle>
                  <CardDescription>Approve or reject membership requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {membershipRequests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Name</th>
                            <th className="text-left py-3 px-4">Email</th>
                            <th className="text-right py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {membershipRequests.map((request) => (
                            <tr key={request._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{request.name}</td>
                              <td className="py-3 px-4">{request.email}</td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleMembershipResponse(request._id, 'accepted')}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleMembershipResponse(request._id, 'rejected')}
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
                      <p className="text-gray-500">No pending membership requests</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Club Events</CardTitle>
                  <CardDescription>Manage your club events</CardDescription>
                </CardHeader>
                <CardContent>
                  {allEvents && allEvents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="mb-4">
                        <div className="flex gap-2 items-center text-sm text-gray-500 mb-1">
                          <span>Status Legend:</span>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Approved</span>
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Rejected</span>
                        </div>
                      </div>

                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Name</th>
                            <th className="text-left py-3 px-4">Description</th>
                            <th className="text-left py-3 px-4">Date</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-right py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allEvents.map((event) => (
                            <tr key={event._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{event.name}</td>
                              <td className="py-3 px-4">{event.description}</td>
                              <td className="py-3 px-4">{new Date(event.date).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  event.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {event.status}
                                </span>
                                {event.rejectionReason && (
                                  <div className="mt-1 text-xs text-red-600">
                                    Reason: {event.rejectionReason}
                                  </div>
                                )}
                              </td>
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
                      <p className="text-gray-500">No events for this club yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notices">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Club Notices</CardTitle>
                    <CardDescription>Manage your club notices</CardDescription>
                  </div>
                  <Dialog open={createNoticeOpen} onOpenChange={setCreateNoticeOpen}>
                    <DialogTrigger asChild>
                      <Button>Create Notice</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New Notice</DialogTitle>
                        <DialogDescription>
                          Fill in the details for your new notice.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateNotice}>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="noticeTitle" className="text-right">
                              Title
                            </label>
                            <Input 
                              id="noticeTitle" 
                              placeholder="Notice title" 
                              className="col-span-3"
                              value={noticeTitle}
                              onChange={(e) => setNoticeTitle(e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="noticeCategory" className="text-right">
                              Category
                            </label>
                            <Input 
                              id="noticeCategory" 
                              placeholder="Notice category" 
                              className="col-span-3"
                              value={noticeCategory}
                              onChange={(e) => setNoticeCategory(e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="noticeDescription" className="text-right">
                              Description
                            </label>
                            <Input 
                              id="noticeDescription" 
                              placeholder="Notice description" 
                              className="col-span-3"
                              value={noticeDescription}
                              onChange={(e) => setNoticeDescription(e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="noticeDueDate" className="text-right">
                              Due Date
                            </label>
                            <Input 
                              id="noticeDueDate" 
                              type="date" 
                              className="col-span-3"
                              value={noticeDueDate}
                              onChange={(e) => setNoticeDueDate(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setCreateNoticeOpen(false)} className="mr-2">
                            Cancel
                          </Button>
                          <Button type="submit">Create Notice</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {allNotices && allNotices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="mb-4">
                        <div className="flex gap-2 items-center text-sm text-gray-500 mb-1">
                          <span>Status Legend:</span>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Approved</span>
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Rejected</span>
                        </div>
                      </div>

                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Title</th>
                            <th className="text-left py-3 px-4">Description</th>
                            <th className="text-left py-3 px-4">Due Date</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-right py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allNotices.map((notice) => (
                            <tr key={notice._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{notice.title}</td>
                              <td className="py-3 px-4">{notice.description}</td>
                              <td className="py-3 px-4">{new Date(notice.dueDate).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  notice.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  notice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {notice.status}
                                </span>
                                {notice.rejectionReason && (
                                  <div className="mt-1 text-xs text-red-600">
                                    Reason: {notice.rejectionReason}
                                  </div>
                                )}
                              </td>
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
                      <p className="text-gray-500">No notices for this club yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CoordinatorDashboard; 