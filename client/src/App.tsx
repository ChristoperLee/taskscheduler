import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import { initializeCompatibility } from './utils/browserCompat';

// Components
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SchedulerDetailPage from './pages/SchedulerDetailPage';
import CreateSchedulerPage from './pages/CreateSchedulerPage';
import EditSchedulerPage from './pages/EditSchedulerPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import BrowsePage from './pages/BrowsePage';
import AdminPage from './pages/AdminPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Initialize browser compatibility checks
    initializeCompatibility();
    
    // Check if user is authenticated on app load
    if (isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/scheduler/:id" element={<SchedulerDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/create" 
            element={
              <ProtectedRoute>
                <CreateSchedulerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scheduler/:id/edit" 
            element={
              <ProtectedRoute>
                <EditSchedulerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App; 