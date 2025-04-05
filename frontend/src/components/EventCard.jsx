import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { registerForEvent, bookmarkEvent } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

const EventCard = ({ event }) => {
  const { currentUser } = useAuth();
  const [isRegistered, setIsRegistered] = useState(event.isRegistered || false);
  const [isBookmarked, setIsBookmarked] = useState(event.isBookmarked || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      await registerForEvent(event._id);
      setIsRegistered(true);
    } catch (err) {
      console.error('Error registering for event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      await bookmarkEvent(event._id);
      setIsBookmarked(true);
    } catch (err) {
      console.error('Error bookmarking event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate if the event is upcoming, ongoing, or past
  const now = new Date();
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > now;
  const isPast = eventDate < now;
  
  // Format date and time
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg">{event.name}</CardTitle>
            <CardDescription>
              By {event.club?.name || 'Unknown club'}
            </CardDescription>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
            isPast ? 'bg-gray-100 text-gray-800' : 
            isUpcoming ? 'bg-green-100 text-green-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            {isPast ? 'Past' : isUpcoming ? 'Upcoming' : 'Ongoing'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 mb-3">{event.description}</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-start text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-700">{formatDate(event.date)}</span>
          </div>
          
          {event.time && (
            <div className="flex items-start text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">{event.time}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-start text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-700">{event.location}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        {currentUser && isUpcoming && (
          <Button 
            variant={isRegistered ? "default" : "outline"}
            size="sm"
            onClick={handleRegister}
            disabled={isLoading || isRegistered}
            className="flex-1 mr-2"
          >
            {isLoading ? 'Processing...' : isRegistered ? 'Registered' : 'Register'}
          </Button>
        )}
        {currentUser && (
          <Button 
            variant={isBookmarked ? "secondary" : "outline"}
            size="sm"
            onClick={handleBookmark}
            disabled={isLoading || isBookmarked}
            className={isUpcoming ? "flex-1" : "w-full"}
          >
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EventCard; 