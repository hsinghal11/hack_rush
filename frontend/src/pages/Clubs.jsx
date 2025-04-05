import { useState, useEffect } from 'react';
import { getAllClubs, getUserClubs } from '../lib/api';
import ClubCard from '../components/ClubCard';
import { Input } from '../components/ui/input';
import { useAuth } from '../lib/AuthContext';

const Clubs = () => {
  const { currentUser } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [userClubs, setUserClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const [allClubs, userClubsData] = await Promise.all([
          getAllClubs(),
          currentUser ? getUserClubs() : []
        ]);
        
        // Get arrays or default to empty arrays if undefined
        const clubsArray = Array.isArray(allClubs) ? allClubs : [];
        const userClubsArray = Array.isArray(userClubsData) ? userClubsData : [];
        
        // Store user clubs for reference
        setUserClubs(userClubsArray);
        
        // Mark clubs the user has already joined or requested to join
        const processedClubs = clubsArray.map(club => {
          // Check if user is a member of this club
          const isMember = userClubsArray.some(
            userClub => userClub._id === club._id
          );
          
          // Check if user has a pending request for this club
          const membershipRequested = club.membershipRequests?.some(
            request => request.user?._id === currentUser?._id && request.status === 'pending'
          ) || false;
          
          return {
            ...club,
            isMember,
            membershipRequested
          };
        });
        
        setClubs(processedClubs);
      } catch (err) {
        console.error('Error fetching clubs:', err);
        setError('Failed to load clubs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [currentUser]);

  // Filter clubs based on search term
  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (club.description && club.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (club.tags && club.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Clubs</h1>
        <div className="w-full sm:w-1/3">
          <Input 
            placeholder="Search clubs..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No clubs found matching your search.' : 'No clubs available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <ClubCard key={club._id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Clubs; 