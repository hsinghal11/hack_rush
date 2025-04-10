import { useState, useEffect } from 'react';
import { getAllEvents, getUserEvents } from '../lib/api';
import EventCard from '../components/EventCard';
import { Calendar } from '../components/Calendar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const Events = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const [allEvents, userEventsData] = await Promise.all([
          getAllEvents(),
          currentUser ? getUserEvents() : []
        ]);
        
        // Get arrays or default to empty arrays if undefined
        const eventsArray = Array.isArray(allEvents) ? allEvents : [];
        const userEventsArray = Array.isArray(userEventsData) ? userEventsData : [];
        
        // Store user events for reference
        setUserEvents(userEventsArray);
        
        // Mark events the user has already registered for or bookmarked
        const processedEvents = eventsArray.map(event => {
          // Check if user is registered for this event
          const isRegistered = userEventsArray.some(
            userEvent => userEvent._id === event._id && userEvent.isRegistered
          );
          
          // Check if user has bookmarked this event
          const isBookmarked = userEventsArray.some(
            userEvent => userEvent._id === event._id && userEvent.isBookmarked
          );
          
          return {
            ...event,
            isRegistered,
            isBookmarked
          };
        });
        
        setEvents(processedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentUser]);

  // Categories for filtering
  const categories = ['all', 'today', 'upcoming', 'past'];

  // Filter events based on search term and category
  const filteredEvents = events
    .filter(event => 
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.club && event.club.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(event => {
      if (selectedCategory === 'all') return true;
      
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (selectedCategory === 'today') {
        return eventDate >= today && eventDate < tomorrow;
      } else if (selectedCategory === 'upcoming') {
        return eventDate > today;
      } else if (selectedCategory === 'past') {
        return eventDate < today;
      }
      
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));  // Sort by date (most recent first)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Events</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="sm:w-48">
            <Input 
              placeholder="Search events..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button 
              variant={viewMode === 'calendar' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {viewMode === 'calendar' ? (
            <div className="mb-8">
              <Calendar events={filteredEvents} />
              
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-3">Upcoming Events</h3>
                <div className="space-y-3">
                  {filteredEvents
                    .filter(event => new Date(event.date) >= new Date())
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 5)
                    .map(event => (
                      <div key={event._id} className="flex items-center p-3 border rounded-md">
                        <div className="bg-primary/10 text-primary p-2 rounded-md mr-3 text-center min-w-16">
                          <div className="text-xs font-semibold">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                          <div className="text-xl font-bold">{new Date(event.date).getDate()}</div>
                        </div>
                        <div>
                          <h4 className="font-semibold">{event.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.location} • {event.time || '00:00'}
                            {event.club && ` • ${event.club.name}`}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No events found matching your search criteria.' 
                  : 'No events available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events; 