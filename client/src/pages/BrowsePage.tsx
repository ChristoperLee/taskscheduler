import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { fetchAllSchedulers } from '../store/slices/schedulerSlice';
import { Clock, User, Heart, Share2, Eye, Search, Filter, Edit } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const BrowsePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { schedulers, loading } = useSelector((state: RootState) => state.schedulers);
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    dispatch(fetchAllSchedulers({ limit: 50 }));
  }, [dispatch]);

  const filteredSchedulers = schedulers.filter(scheduler => {
    const matchesSearch = scheduler.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scheduler.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scheduler.creator_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || scheduler.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(schedulers.map(s => s.category))).filter(Boolean) as string[];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-primary-600 hover:text-primary-700">
          ← Back to Home
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Browse Schedules ({filteredSchedulers.length})
        </h1>
        
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search schedules, descriptions, or creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {(searchTerm || categoryFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {(searchTerm || categoryFilter) && (
          <div className="mb-6 text-gray-600">
            {searchTerm && (
              <span>Searching for "<strong>{searchTerm}</strong>"</span>
            )}
            {searchTerm && categoryFilter && <span> in </span>}
            {categoryFilter && (
              <span>Category: <strong>{categoryFilter}</strong></span>
            )}
            <span> • {filteredSchedulers.length} results found</span>
          </div>
        )}
      </div>

      {/* Schedulers Grid */}
      {filteredSchedulers.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || categoryFilter ? 'No schedules found' : 'No schedules available'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter 
              ? 'Try adjusting your search terms or filters'
              : 'Be the first to create a schedule!'
            }
          </p>
          {!(searchTerm || categoryFilter) && (
            <Link to="/create" className="btn btn-primary">
              Create First Schedule
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchedulers.map((scheduler) => (
            <div key={scheduler.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {scheduler.title}
                    </h3>
                    {scheduler.category && (
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        scheduler.category === 'work' 
                          ? 'bg-blue-100 text-blue-800'
                          : scheduler.category === 'fitness'
                          ? 'bg-green-100 text-green-800'
                          : scheduler.category === 'education'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {scheduler.category}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {scheduler.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{scheduler.creator_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(scheduler.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{scheduler.usage_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{scheduler.like_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4" />
                      <span>{scheduler.share_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link 
                      to={`/scheduler/${scheduler.id}`}
                      className="btn btn-primary text-sm"
                    >
                      View
                    </Link>
                    {user && user.role === 'admin' && (
                      <Link 
                        to={`/scheduler/${scheduler.id}/edit`}
                        className="btn btn-secondary text-sm"
                        title="Edit as Admin"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowsePage;