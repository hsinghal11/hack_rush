import { useState, useEffect } from 'react';
import { getAllNotices, getUserNotices } from '../lib/api';
import NoticeCard from '../components/NoticeCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/AuthContext';

const Notices = () => {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState([]);
  const [userNotices, setUserNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const [allNotices, userNoticesData] = await Promise.all([
          getAllNotices(),
          currentUser ? getUserNotices() : []
        ]);
        
        // Get arrays or default to empty arrays if undefined
        const noticesArray = Array.isArray(allNotices) ? allNotices : [];
        const userNoticesArray = Array.isArray(userNoticesData) ? userNoticesData : [];
        
        // Store user notices for reference
        setUserNotices(userNoticesArray);
        
        // Mark notices the user has already saved
        const processedNotices = noticesArray.map(notice => {
          // Check if user has saved this notice
          const isSaved = userNoticesArray.some(
            userNotice => userNotice._id === notice._id
          );
          
          return {
            ...notice,
            isSaved
          };
        });
        
        setNotices(processedNotices);
      } catch (err) {
        console.error('Error fetching notices:', err);
        setError('Failed to load notices. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [currentUser]);

  // Categories for filtering
  const categories = ['all', 'academic', 'announcement', 'workshop', 'meeting', 'deadline', 'event'];

  // Filter notices based on search term and category
  const filteredNotices = notices
    .filter(notice => 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notice.description && notice.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (notice.club && notice.club.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(notice => 
      selectedCategory === 'all' || 
      (notice.category && notice.category.toLowerCase() === selectedCategory.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by due date (most urgent first)
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Notices</h1>
        <div className="w-full sm:w-1/3">
          <Input 
            placeholder="Search notices..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

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

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm || selectedCategory !== 'all' 
              ? 'No notices found matching your search criteria.' 
              : 'No notices available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotices.map((notice) => (
            <NoticeCard key={notice._id} notice={notice} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notices; 