import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoomsPage from './pages/RoomsPage';
import RoomPage from './pages/RoomPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import UserProfilePage from './pages/UserProfilePage';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Router>
        {user && <Navbar />}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={!user ? <HomePage /> : <Navigate to="/rooms" />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/login" />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/login" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/user/:email" element={<UserProfilePage />} />
          
          {/* Protected Routes */}
          <Route path="/rooms" element={user ? <RoomsPage /> : <Navigate to="/login" />} />
          <Route path="/room/:roomId" element={user ? <RoomPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

