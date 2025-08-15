import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { fetchPopularSchedulers } from '../store/slices/schedulerSlice';
import { Calendar, Clock, User, Heart, Share2, Eye, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { schedulers, loading } = useSelector((state: RootState) => state.schedulers);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPopularSchedulers(6))
      .unwrap()
      .catch((error) => {
        console.error('Failed to fetch schedulers:', error);
        setLoadError('Unable to load schedulers. Please try again later.');
      });
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-64 space-y-4">
        <p className="text-red-600">{loadError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Schedule Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create, manage, and share custom schedulers. Discover popular routines and boost your productivity with our intelligent scheduling platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/create" className="btn btn-primary text-lg px-8 py-3">
                Create New Scheduler
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Popular Schedulers Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Popular Schedulers
            </h2>
            <Link to="/analytics" className="text-primary-600 hover:text-primary-700 font-medium">
              View All Schedules →
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedulers.map((scheduler) => (
              <div key={scheduler.id} className="card hover:shadow-md transition-shadow">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 break-words">
                        {scheduler.title}
                      </h3>
                    </div>
                    <span className={`badge badge-${scheduler.category === 'work' ? 'primary' : 'secondary'}`}>
                      {scheduler.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 break-words">
                    {scheduler.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{scheduler.creator_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {scheduler.created_at 
                          ? new Date(scheduler.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4 flex-shrink-0" />
                        <span>{scheduler.usage_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4 flex-shrink-0" />
                        <span>{scheduler.like_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Share2 className="w-4 h-4 flex-shrink-0" />
                        <span>{scheduler.share_count || 0}</span>
                      </div>
                    </div>
                    
                    <Link 
                      to={`/scheduler/${scheduler.id}`}
                      className="btn btn-primary text-sm"
                    >
                      View Schedule
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white rounded-lg shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose TaskScheduler?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple View Modes</h3>
              <p className="text-gray-600">
                View your schedules in daily, weekly, monthly, or list formats for maximum flexibility.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share & Discover</h3>
              <p className="text-gray-600">
                Share your schedules with others and discover popular routines from the community.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-gray-600">
                Track your productivity and get insights into your scheduling patterns.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 