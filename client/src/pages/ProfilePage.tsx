import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { deleteScheduler } from '../store/slices/schedulerSlice';
import { Plus, Calendar, Clock, User, Heart, Share2, Eye, Edit, Trash2, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiService } from '../services/api';
import { Scheduler } from '../types';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [mySchedulers, setMySchedulers] = useState<Scheduler[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0
  });

  useEffect(() => {
    fetchMySchedulers();
  }, []);

  const fetchMySchedulers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<Scheduler[]>('/schedulers/my') as { data: Scheduler[]; pagination: any };
      setMySchedulers(response.data);
      
      // Calculate stats
      const totalViews = response.data.reduce((sum, s) => sum + parseInt(String(s.usage_count)), 0);
      const totalLikes = response.data.reduce((sum, s) => sum + parseInt(String(s.like_count)), 0);
      const totalShares = response.data.reduce((sum, s) => sum + parseInt(String(s.share_count)), 0);
      const publicCount = response.data.filter(s => s.is_public).length;
      
      setStats({
        total: response.data.length,
        public: publicCount,
        private: response.data.length - publicCount,
        totalViews,
        totalLikes,
        totalShares
      });
    } catch (error) {
      console.error('Failed to fetch my schedulers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScheduler = async (schedulerId: number, schedulerTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${schedulerTitle}"?\n\nThis action cannot be undone and will permanently remove the schedule and all its items.`
    );
    
    if (!confirmed) return;

    try {
      setDeleteLoading(schedulerId);
      await dispatch(deleteScheduler(schedulerId.toString())).unwrap();
      
      // Remove from local state and recalculate stats
      const updatedSchedulers = mySchedulers.filter(s => s.id !== schedulerId);
      setMySchedulers(updatedSchedulers);
      
      // Recalculate stats
      const totalViews = updatedSchedulers.reduce((sum, s) => sum + parseInt(String(s.usage_count)), 0);
      const totalLikes = updatedSchedulers.reduce((sum, s) => sum + parseInt(String(s.like_count)), 0);
      const totalShares = updatedSchedulers.reduce((sum, s) => sum + parseInt(String(s.share_count)), 0);
      const publicCount = updatedSchedulers.filter(s => s.is_public).length;
      
      setStats({
        total: updatedSchedulers.length,
        public: publicCount,
        private: updatedSchedulers.length - publicCount,
        totalViews,
        totalLikes,
        totalShares
      });
      
    } catch (error: any) {
      alert(`Failed to delete scheduler: ${error.message || 'Unknown error'}`);
    } finally {
      setDeleteLoading(null);
    }
  };

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

      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedules</h1>
            <div className="flex items-center space-x-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.username}</span>
              <span>•</span>
              <span>{user?.email}</span>
            </div>
          </div>
          <Link to="/create" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create New Schedule
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Schedules</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Views</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-pink-50 rounded-lg p-4">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-pink-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-pink-600">Total Likes</p>
                <p className="text-2xl font-bold text-pink-900">{stats.totalLikes}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Share2 className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Total Shares</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalShares}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Public Schedules</p>
              <p className="text-xl font-bold text-gray-900">{stats.public}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Eye className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Private Schedules</p>
              <p className="text-xl font-bold text-gray-900">{stats.private}</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.total > 0 ? Math.round((stats.totalViews + stats.totalLikes) / stats.total) : 0}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Schedules</h2>
        </div>

        {mySchedulers.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules yet</h3>
            <p className="text-gray-600 mb-4">Create your first schedule to get started!</p>
            <Link to="/create" className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Schedule
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {mySchedulers.map((scheduler) => (
              <div key={scheduler.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {scheduler.title}
                      </h3>
                      <span className={`badge badge-${scheduler.category === 'work' ? 'primary' : 'secondary'}`}>
                        {scheduler.category}
                      </span>
                      {scheduler.is_public ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Private
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{scheduler.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(scheduler.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{scheduler.usage_count} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{scheduler.like_count} likes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Share2 className="w-4 h-4" />
                        <span>{scheduler.share_count} shares</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link 
                      to={`/scheduler/${scheduler.id}`}
                      className="btn btn-secondary text-sm"
                    >
                      View
                    </Link>
                    <Link 
                      to={`/scheduler/${scheduler.id}/edit`}
                      className="btn btn-secondary text-sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDeleteScheduler(scheduler.id, scheduler.title)}
                      disabled={deleteLoading === scheduler.id}
                      className="btn btn-secondary text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading === scheduler.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 