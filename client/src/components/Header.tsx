import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { Calendar, Plus, User, BarChart3, LogOut, Menu, X, Shield, Search } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">TaskScheduler</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link 
                  to="/create" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                </Link>
                <Link 
                  to="/browse" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Browse</span>
                </Link>
                <Link 
                  to="/analytics" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    to="/create" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Scheduler</span>
                  </Link>
                  <Link 
                    to="/browse" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Search className="w-4 h-4" />
                    <span>Browse</span>
                  </Link>
                  <Link 
                    to="/analytics" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <div className="flex flex-col space-y-2">
                  <Link 
                    to="/login" 
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn btn-primary w-full text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 