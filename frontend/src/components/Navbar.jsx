import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import NotificationButton from './NotificationButton';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    
    switch (currentUser.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'club-coordinator':
        return '/coordinator-dashboard';
      default:
        return '/student-dashboard';
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-purple-600">Campus Unified</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link to="/">Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link to="/clubs">Clubs</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link to="/events">Events</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link to="/notices">Notices</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link to="/notification-test">Test Push</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {currentUser ? (
              <div className="flex items-center ml-4 space-x-2">
                <Link to={getDashboardLink()}>
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <NotificationButton />
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={currentUser.avatarUrl} />
                    <AvatarFallback>{getInitials(currentUser.name || 'User')}</AvatarFallback>
                  </Avatar>
                  <Button variant="ghost" onClick={logout}>Logout</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center ml-4 space-x-2">
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600">
              Home
            </Link>
            <Link to="/clubs" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600">
              Clubs
            </Link>
            <Link to="/events" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600">
              Events
            </Link>
            <Link to="/notices" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600">
              Notices
            </Link>
            <Link to="/notification-test" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600">
              Test Push
            </Link>
            {currentUser ? (
              <>
                <Link to={getDashboardLink()} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600">
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600">
                  Login
                </Link>
                <Link to="/register" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar; 