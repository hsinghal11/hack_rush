import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { requestClubMembership } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { Avatar } from './ui/avatar';
import { useNavigate } from 'react-router-dom';

const ClubCard = ({ club }) => {
  const { currentUser, logout, ensureValidTokenFormat } = useAuth();
  const navigate = useNavigate();
  const [isRequested, setIsRequested] = useState(club.membershipRequested || false);
  const [isMember, setIsMember] = useState(club.isMember || false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Ensure user token is set correctly
  useEffect(() => {
    // Log current user token for debugging
    if (currentUser) {
      console.log('Current user in ClubCard:', {
        name: currentUser.name,
        email: currentUser.email,
        hasToken: !!currentUser.accessToken,
        tokenLength: currentUser.accessToken ? currentUser.accessToken.length : 0
      });
    }
  }, [currentUser]);

  const handleRequestMembership = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    try {
      // Log token status for debugging
      console.log('Token info:', {
        hasToken: !!currentUser.accessToken,
        tokenType: typeof currentUser.accessToken,
        tokenLength: currentUser.accessToken ? currentUser.accessToken.length : 0
      });
      
      setIsLoading(true);
      setError(null);
      console.log('Requesting membership with clubId:', club._id);
      
      // Get a refreshed user from localStorage to ensure token is current
      try {
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          if (storedUser && storedUser.accessToken) {
            console.log('Using refreshed token from localStorage');
          }
        }
      } catch (e) {
        console.error('Error refreshing token from localStorage:', e);
      }
      
      await requestClubMembership(club._id);
      setIsRequested(true);
    } catch (err) {
      console.error('Error requesting club membership:', err);
      
      // Handle token issues
      if (err.message?.includes('JWT') || 
          err.message?.includes('token') || 
          err.message?.includes('Unauthorized') ||
          err.message?.includes('auth')) {
            
        setError('Your session has expired. Please log in again.');
        
        // Force user to re-login
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 1500);
      } else {
        setError(err.message || "Failed to request membership");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate initials for the avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 bg-primary text-primary-foreground">
            {getInitials(club.name)}
          </Avatar>
          <div>
            <CardTitle className="text-lg">{club.name}</CardTitle>
            <CardDescription>
              {club.members?.length || 0} members
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600">{club.description}</p>
        
        {club.tags && club.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {club.tags.map((tag, index) => (
              <span 
                key={index} 
                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {club.events && club.events.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-1">Upcoming Events</h4>
            <p className="text-xs text-gray-600">
              {club.events.length} event{club.events.length !== 1 ? 's' : ''} planned
            </p>
          </div>
        )}
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t">
        {currentUser && !isMember && (
          <Button 
            variant={isRequested ? "secondary" : "default"}
            size="sm"
            className="w-full"
            onClick={handleRequestMembership}
            disabled={isLoading || isRequested || isMember}
          >
            {isLoading ? 'Processing...' : 
             isRequested ? 'Membership Requested' : 
             'Join Club'}
          </Button>
        )}
        {currentUser && isMember && (
          <Button 
            variant="outline"
            size="sm"
            className="w-full"
            disabled={true}
          >
            Joined
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ClubCard; 