import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getUserProfile, getUserClubs, getUserEvents, getUserNotices } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import EventCard from '../components/EventCard';
import ClubCard from '../components/ClubCard';
import NoticeCard from '../components/NoticeCard';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [myClubs, setMyClubs] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [mySavedNotices, setMySavedNotices] = useState([]);
  const [myBookmarkedEvents, setMyBookmarkedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Special handling for test user
        if (currentUser?.email === 'sample_student@gmail.com' && currentUser?.accessToken === 'test-token') {
          console.log('Using mock data for test user');
          // Mock data for test user
          setUserProfile({
            _id: 'test-user-id',
            name: 'Test Student',
            email: 'sample_student@gmail.com',
            role: 'student',
            clubAffiliation: 'Coding Club'
          });
          setMyClubs([
            {
              _id: 'test-club-1',
              name: 'Coding Club',
              description: 'A club for programming enthusiasts',
              isMember: true
            }
          ]);
          setMyEvents([
            {
              _id: 'test-event-1',
              name: 'Hackathon 2025',
              description: 'A 24-hour coding competition',
              date: new Date().toISOString(),
              isRegistered: true
            }
          ]);
          setMySavedNotices([
            {
              _id: 'test-notice-1',
              title: 'Important Announcement',
              description: 'This is a test notice',
              category: 'Announcement',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              isSaved: true
            }
          ]);
          setMyBookmarkedEvents([
            {
              _id: 'test-event-2',
              name: 'Workshop 2025',
              description: 'A learning workshop',
              date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              isBookmarked: true
            }
          ]);
          setLoading(false);
          return;
        }
        
        const [profileData, clubsData, eventsData, noticesData] = await Promise.all([
          getUserProfile(currentUser?.email),
          getUserClubs(),
          getUserEvents(),
          getUserNotices()
        ]);
        
        console.log('Fetched user data:', { profileData, clubsData, eventsData, noticesData });
        
        // Set user profile
        setUserProfile(profileData);
        
        // Process clubs data
        if (Array.isArray(clubsData)) {
          console.log('Setting clubs:', clubsData);
          setMyClubs(clubsData.map(club => ({
            ...club,
            isMember: true
          })));
        } else {
          console.warn('Unexpected clubs data format:', clubsData);
          setMyClubs([]);
        }
        
        // Process events data (separating registered vs bookmarked)
        if (Array.isArray(eventsData)) {
          console.log('Processing events data:', eventsData);
          const registered = eventsData.filter(event => event.isRegistered);
          const bookmarked = eventsData.filter(event => event.isBookmarked && !event.isRegistered);
          
          console.log('Setting events - registered:', registered, 'bookmarked:', bookmarked);
          setMyEvents(registered);
          setMyBookmarkedEvents(bookmarked);
        } else {
          console.warn('Unexpected events data format:', eventsData);
          setMyEvents([]);
          setMyBookmarkedEvents([]);
        }
        
        // Process notices data
        if (Array.isArray(noticesData)) {
          console.log('Setting notices:', noticesData);
          setMySavedNotices(noticesData);
        } else {
          console.warn('Unexpected notices data format:', noticesData);
          setMySavedNotices([]);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>My Clubs</CardTitle>
                <CardDescription>{myClubs.length} joined clubs</CardDescription>
              </CardHeader>
              <CardContent>
                {myClubs.length > 0 ? (
                  <ul className="space-y-2">
                    {myClubs.map((club) => (
                      <li key={club._id} className="mb-1 flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        <span>{club.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">You haven't joined any clubs yet</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>My Events</CardTitle>
                <CardDescription>{myEvents.length} registered events</CardDescription>
              </CardHeader>
              <CardContent>
                {myEvents.length > 0 ? (
                  <ul className="space-y-2">
                    {myEvents.map((event) => (
                      <li key={event._id} className="mb-1 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <div>
                          <div>{event.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleDateString()}
                            {event.club?.name && ` • ${event.club.name}`}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">You haven't registered for any events yet</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>My Bookmarks</CardTitle>
                <CardDescription>{myBookmarkedEvents.length} bookmarked events</CardDescription>
              </CardHeader>
              <CardContent>
                {myBookmarkedEvents.length > 0 ? (
                  <ul className="space-y-2">
                    {myBookmarkedEvents.map((event) => (
                      <li key={event._id} className="mb-1 flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        <div>
                          <div>{event.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleDateString()}
                            {event.club?.name && ` • ${event.club.name}`}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">You haven't bookmarked any events</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for different sections */}
          <Tabs defaultValue="clubs" className="mb-8">
            <TabsList className="mb-6">
              <TabsTrigger value="clubs">My Clubs</TabsTrigger>
              <TabsTrigger value="events">My Events</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarked Events</TabsTrigger>
              <TabsTrigger value="notices">Saved Notices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="clubs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myClubs.length > 0 ? (
                  myClubs.map((club) => (
                    <ClubCard key={club._id} club={club} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-gray-500">You haven't joined any clubs yet</p>
                    <a href="/clubs" className="inline-block mt-4 text-purple-600 hover:underline">
                      Browse available clubs
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="events">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEvents.length > 0 ? (
                  myEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-gray-500">You haven't registered for any events yet</p>
                    <a href="/events" className="inline-block mt-4 text-purple-600 hover:underline">
                      Browse upcoming events
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="bookmarks">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBookmarkedEvents.length > 0 ? (
                  myBookmarkedEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-gray-500">You haven't bookmarked any events yet</p>
                    <a href="/events" className="inline-block mt-4 text-purple-600 hover:underline">
                      Browse upcoming events
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="notices">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySavedNotices.length > 0 ? (
                  mySavedNotices.map((notice) => (
                    <NoticeCard key={notice._id} notice={notice} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-gray-500">You haven't saved any notices yet</p>
                    <a href="/notices" className="inline-block mt-4 text-purple-600 hover:underline">
                      Browse latest notices
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default StudentDashboard; 