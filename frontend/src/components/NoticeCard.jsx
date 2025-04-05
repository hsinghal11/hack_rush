import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { saveNotice } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

const NoticeCard = ({ notice }) => {
  const { currentUser } = useAuth();
  const [isSaved, setIsSaved] = useState(notice.isSaved || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveNotice = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      await saveNotice(notice._id);
      setIsSaved(true);
    } catch (err) {
      console.error('Error saving notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate remaining days
  const daysRemaining = notice.dueDate ? Math.ceil((new Date(notice.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  
  // Determine urgency for styling
  const getUrgencyClass = () => {
    if (!daysRemaining || daysRemaining < 0) return '';
    if (daysRemaining <= 1) return 'bg-red-50 border-red-200';
    if (daysRemaining <= 3) return 'bg-orange-50 border-orange-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${getUrgencyClass()}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg">{notice.title}</CardTitle>
            <CardDescription>
              By {notice.club?.name || 'Unknown club'}
            </CardDescription>
          </div>
          <div className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 flex items-center">
            {notice.category}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">{notice.description}</p>
        {daysRemaining !== null && (
          <div className="mt-3">
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              daysRemaining <= 1 ? 'bg-red-100 text-red-800' :
              daysRemaining <= 3 ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {daysRemaining < 0 
                ? 'Expired' 
                : daysRemaining === 0 
                ? 'Due today!' 
                : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {notice.dueDate && `Due: ${new Date(notice.dueDate).toLocaleDateString()}`}
        </div>
        {currentUser && (
          <Button 
            variant={isSaved ? "default" : "outline"}
            size="sm"
            onClick={handleSaveNotice}
            disabled={isLoading || isSaved}
          >
            {isLoading ? 'Saving...' : isSaved ? 'Saved' : 'Save Notice'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NoticeCard; 