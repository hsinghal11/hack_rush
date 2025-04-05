import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import ClubCard from '../components/ClubCard';
import EventCard from '../components/EventCard';
import NoticeCard from '../components/NoticeCard';
import { getAllClubs, getAllEvents, getAllNotices } from '../lib/api';

const Home = () => {
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        console.log('Fetching data for Home page...');
        const [clubsData, eventsData, noticesData] = await Promise.all([
          getAllClubs(),
          getAllEvents(),
          getAllNotices()
        ]);
        
        console.log('Home page data received:', {
          clubs: clubsData?.length || 0,
          events: eventsData?.length || 0,
          notices: noticesData?.length || 0
        });
        
        // Check if data is an array before using slice
        setClubs(Array.isArray(clubsData) ? clubsData.slice(0, 3) : []); // Show only 3 clubs
        setEvents(Array.isArray(eventsData) ? eventsData.slice(0, 3) : []); // Show only 3 events
        setNotices(Array.isArray(noticesData) ? noticesData.slice(0, 3) : []); // Show only 3 notices
      } catch (err) {
        console.error('Error fetching data for Home page:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Placeholder data for initial rendering
  const placeholderClubs = [
    {
      _id: '1',
      name: 'Coding Club',
      description: 'A club for programming enthusiasts to learn and collaborate on projects.',
      coordinatorEmail: 'coordinator@example.com'
    },
    {
      _id: '2',
      name: 'Photography Club',
      description: 'Capture moments and learn photography techniques with like-minded students.',
      coordinatorEmail: 'photo@example.com'
    },
    {
      _id: '3',
      name: 'Debate Club',
      description: 'Hone your public speaking and argumentation skills through structured debates.',
      coordinatorEmail: 'debate@example.com'
    }
  ];

  const placeholderEvents = [
    {
      _id: '1',
      name: 'Hackathon 2023',
      description: 'A 24-hour coding competition to build innovative solutions for real-world problems.',
      date: '2023-12-15',
      time: '10:00 AM',
      location: 'Main Auditorium'
    },
    {
      _id: '2',
      name: 'Photography Workshop',
      description: 'Learn advanced photography skills with professional photographers.',
      date: '2023-12-10',
      time: '2:00 PM',
      location: 'Arts Center'
    },
    {
      _id: '3',
      name: 'Inter-College Debate',
      description: 'Participate in the annual inter-college debate competition.',
      date: '2023-12-20',
      time: '11:00 AM',
      location: 'Conference Hall'
    }
  ];

  const placeholderNotices = [
    {
      _id: '1',
      title: 'Hackathon Registration Open',
      category: 'Event',
      description: 'Registration for the annual hackathon is now open. Form your teams and register before Dec 10.',
      dueDate: '2023-12-10'
    },
    {
      _id: '2',
      title: 'Photography Exhibition',
      category: 'Announcement',
      description: 'Submit your best photographs for the upcoming exhibition. Theme: Nature and Wildlife.',
      dueDate: '2023-12-05'
    },
    {
      _id: '3',
      title: 'Debate Club Meeting',
      category: 'Meeting',
      description: 'Important meeting for all Debate Club members to discuss the upcoming competition.',
      dueDate: '2023-12-01'
    }
  ];

  // Use placeholder data if API data is not available yet
  const displayClubs = clubs.length > 0 ? clubs : placeholderClubs;
  const displayEvents = events.length > 0 ? events : placeholderEvents;
  const displayNotices = notices.length > 0 ? notices : placeholderNotices;

  return (
    <div>
      <Hero />
      
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
        </div>
      )}
      
      {/* Clubs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Clubs</h2>
          <a href="/clubs" className="text-purple-600 hover:text-purple-700 font-medium">
            View All →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayClubs.map(club => (
            <ClubCard key={club._id} club={club} />
          ))}
        </div>
      </section>
      
      {/* Events Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <a href="/events" className="text-purple-600 hover:text-purple-700 font-medium">
              View All →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map(event => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Notices Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Recent Notices</h2>
          <a href="/notices" className="text-purple-600 hover:text-purple-700 font-medium">
            View All →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayNotices.map(notice => (
            <NoticeCard key={notice._id} notice={notice} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home; 