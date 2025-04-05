import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const Hero = () => {
  return (
    <div className="relative bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-700 overflow-hidden">
      <div className="absolute inset-0">
        <svg 
          className="absolute bottom-0 left-0 right-0 opacity-20" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 320"
        >
          <path 
            fill="#fff" 
            fillOpacity="1" 
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            <span className="block">Welcome to Campus Unified</span>
          </h1>
          <p className="text-xl md:text-2xl font-medium text-white opacity-90 mb-10 max-w-3xl mx-auto">
            Your central hub for campus clubs, events, and announcements.
            Discover, connect, and engage with the vibrant community.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/clubs">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100">
                Explore Clubs
              </Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline" className="text-black border-white hover:bg-white hover:text-purple-700">
                Upcoming Events
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero; 