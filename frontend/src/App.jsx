import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminNotifications from './pages/AdminNotifications';
import Clubs from './pages/Clubs';
import Events from './pages/Events';
import Notices from './pages/Notices';
import NotificationTest from './pages/NotificationTest';
import './index.css';

// Protected route component
const ProtectedRoute = ({ children, role }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }
  
  if (role) {
    // Check if role matches or user is admin
    if (role === 'admin' && currentUser.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    
    if (role === 'coordinator' && 
       currentUser.role !== 'coordinator' && 
       currentUser.role !== 'club-coordinator' && 
       currentUser.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/coordinator-dashboard" element={<ProtectedRoute role="coordinator"><CoordinatorDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin-notifications" element={<ProtectedRoute role="admin"><AdminNotifications /></ProtectedRoute>} />
          
          {/* Public routes */}
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/events" element={<Events />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/notification-test" element={<NotificationTest />} />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
