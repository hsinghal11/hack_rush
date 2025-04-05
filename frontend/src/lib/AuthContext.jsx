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

  // Login function
  const login = (userData) => {
    // Ensure the accessToken is at the top level for easy access
    const userToStore = {
      ...userData,
      accessToken: userData.accessToken
    };
    
    // Log the structure we're storing to debug token issues
    console.log("Storing user data with token:", 
      userToStore.accessToken ? `${userToStore.accessToken.substring(0, 15)}...` : "No token"
    );
    
    // Store user data in localStorage
    localStorage.setItem("user", JSON.stringify(userToStore));
    setCurrentUser(userToStore);
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
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 