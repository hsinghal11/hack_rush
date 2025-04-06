import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { login } from '../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Remove special handling for test credentials as it's causing issues
      // Instead, always use the real API login
      
      console.log('Submitting login form with:', { email, password: '********' });
      const response = await login(email, password);
      
      // Debug the response structure
      console.log('Login successful, response structure:', JSON.stringify(response, null, 2));
      
      if (!response.accessToken) {
        console.error('Invalid response format - missing token:', response);
        throw new Error('Login successful but no access token received');
      }
      
      // Make sure user data exists
      if (!response.user) {
        console.error('Invalid response format - missing user:', response);
        throw new Error('Login successful but no user data received');
      }
      
      // Create user object with all necessary data
      // Make sure to override any null accessToken in the user object
      const userData = {
        ...response.user,
        accessToken: response.accessToken // Override with the token from the response root
      };
      
      if (response.refreshToken) {
        userData.refreshToken = response.refreshToken;
      }
      
      console.log('Storing user data:', {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        hasToken: !!userData.accessToken,
        tokenLength: userData.accessToken ? userData.accessToken.length : 0
      });
      
      // Store user data in auth context
      const loginSuccess = authLogin(userData);
      
      if (!loginSuccess) {
        throw new Error('Invalid token format. Please contact support.');
      }
      
      // Redirect based on user role
      const role = userData.role;
      console.log('Redirecting based on role:', role);
      
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'coordinator' || role === 'club-coordinator') {
        navigate('/coordinator-dashboard');
      } else {
        // Default for 'student' or any other role
        navigate('/student-dashboard');
      }
    } catch (err) {
      console.error('Login error details:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login to Campus Unified</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-600 hover:text-purple-500 font-medium">
              Register here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login; 