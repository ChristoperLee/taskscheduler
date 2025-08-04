import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Users, Calendar, BarChart3, Shield, Trash2, Edit, Search, Filter } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiService } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  scheduler_count: number;
  total_views: number;
  total_likes: number;
}

interface Scheduler {
  id: number;
  title: string;
  description: string;
  category: string;
  is_public: boolean;
  creator_name: string;
  usage_count: number;
  like_count: number;
  created_at: string;
}

interface AdminStats {
  users: {
    total_users: number;
    admin_users: number;
    new_users_30d: number;
  };
  schedulers: {
    total_schedulers: number;
    public_schedulers: number;
    new_schedulers_30d: number;
    avg_usage_count: number;
  };
  interactions: {
    total_interactions: number;
    total_likes: number;
    total_uses: number;
    total_shares: number;
    interactions_30d: number;
  };
  categories: Array<{ category: string; count: number }>;
}

const AdminPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'schedulers'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [schedulerSearch, setSchedulerSearch] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }
    
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'schedulers') {
      fetchSchedulers();
    }
  }, [activeTab, user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<AdminStats>('/admin/stats');
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = userSearch ? `?search=${encodeURIComponent(userSearch)}` : '';
      const response = await apiService.get<User[]>(`/admin/users${params}`);
      if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulers = async () => {
    try {
      setLoading(true);
      const params = schedulerSearch ? `?search=${encodeURIComponent(schedulerSearch)}` : '';
      const response = await apiService.get<Scheduler[]>(`/admin/schedulers${params}`);
      if (response.data) {
        setSchedulers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedulers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      await apiService.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${username}"?\n\nThis will permanently delete the user and all their schedulers.`
    );
    
    if (!confirmed) return;

    try {
      setDeleteLoading(userId);
      await apiService.delete(`/admin/users/${userId}`);
      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteScheduler = async (schedulerId: number, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete scheduler "${title}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setDeleteLoading(schedulerId);
      await apiService.delete(`/admin/schedulers/${schedulerId}`);
      fetchSchedulers(); // Refresh schedulers list
    } catch (error) {
      console.error('Failed to delete scheduler:', error);
      alert('Failed to delete scheduler');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-primary-600 hover:text-primary-700">
          ← Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, schedulers, and platform settings</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Admin Access</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('schedulers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedulers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Schedulers
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{stats.users.total_users}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="w-8 h-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Total Schedulers</p>
                          <p className="text-2xl font-bold text-green-900">{stats.schedulers.total_schedulers}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <BarChart3 className="w-8 h-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">Total Interactions</p>
                          <p className="text-2xl font-bold text-purple-900">{stats.interactions.total_interactions}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Shield className="w-8 h-8 text-orange-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-orange-600">Admin Users</p>
                          <p className="text-2xl font-bold text-orange-900">{stats.users.admin_users}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Recent Activity (30 days)</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">New Users:</span>
                          <span className="font-semibold">{stats.users.new_users_30d}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">New Schedulers:</span>
                          <span className="font-semibold">{stats.schedulers.new_schedulers_30d}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interactions:</span>
                          <span className="font-semibold">{stats.interactions.interactions_30d}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
                      <div className="space-y-2">
                        {stats.categories.slice(0, 5).map((cat, index) => (
                          <div key={cat.category} className="flex justify-between items-center">
                            <span className="text-gray-600">{cat.category}</span>
                            <span className="font-semibold">{cat.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full"
                      />
                    </div>
                    <button
                      onClick={fetchUsers}
                      className="btn btn-secondary"
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Schedulers
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stats
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((userItem) => (
                          <tr key={userItem.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{userItem.username}</div>
                                <div className="text-sm text-gray-500">{userItem.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={userItem.role}
                                onChange={(e) => handleUpdateUserRole(userItem.id, e.target.value)}
                                className={`text-sm rounded-full px-3 py-1 font-semibold ${
                                  userItem.role === 'admin'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {userItem.scheduler_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>{userItem.total_views} views</div>
                              <div>{userItem.total_likes} likes</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(userItem.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                                disabled={deleteLoading === userItem.id || userItem.id === user?.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deleteLoading === userItem.id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Schedulers Tab */}
              {activeTab === 'schedulers' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search schedulers..."
                        value={schedulerSearch}
                        onChange={(e) => setSchedulerSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full"
                      />
                    </div>
                    <button
                      onClick={fetchSchedulers}
                      className="btn btn-secondary"
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {schedulers.map((scheduler) => (
                      <div key={scheduler.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{scheduler.title}</h3>
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
                            <p className="text-gray-600 mb-2">{scheduler.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>By {scheduler.creator_name}</span>
                              <span>{scheduler.usage_count} views</span>
                              <span>{scheduler.like_count} likes</span>
                              <span>{new Date(scheduler.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Link
                              to={`/scheduler/${scheduler.id}`}
                              className="btn btn-secondary text-sm"
                            >
                              View
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;