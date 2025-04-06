import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on page load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Ensure the parsed user has all required fields
        if (userData && userData.accessToken) {
          // Ensure the token is correctly formatted
          userData.accessToken = ensureValidTokenFormat(userData.accessToken);
          setCurrentUser(userData);
        } else {
          console.warn("Stored user data missing accessToken, clearing storage");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);
  
  // Function to ensure token is correctly formatted
  const ensureValidTokenFormat = (token) => {
    if (!token) return null;
    
    // If it's not a string, convert to string
    if (typeof token !== 'string') {
      console.warn('Token is not a string, converting', token);
      token = String(token);
    }
    
    // Remove any existing "Bearer " prefix
    if (token.startsWith('Bearer ')) {
      token = token.substring(7).trim();
    }
    
    // Check if token looks like a JWT (has two dots)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.warn('Token does not appear to be a valid JWT', token);
      return null;
    }
    
    console.log('Token validated and formatted');
    return token;
  };

  // Login function
  const login = (userData) => {
    // Ensure the token is valid and properly formatted
    const validToken = ensureValidTokenFormat(userData.accessToken);
    
    if (!validToken) {
      console.error('Invalid token format detected during login');
      return false;
    }
    
    // Ensure the accessToken is at the top level for easy access
    const userToStore = {
      ...userData,
      accessToken: validToken
    };
    
    // Log the structure we're storing to debug token issues
    console.log("Storing user data with token:", 
      userToStore.accessToken ? `${userToStore.accessToken.substring(0, 15)}...` : "No token"
    );
    
    // Store user data in localStorage
    localStorage.setItem("user", JSON.stringify(userToStore));
    setCurrentUser(userToStore);
    return true;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  // Check if token is valid
  const isAuthenticated = () => {
    return !!currentUser?.accessToken;
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
    isAuthenticated,
    ensureValidTokenFormat
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 