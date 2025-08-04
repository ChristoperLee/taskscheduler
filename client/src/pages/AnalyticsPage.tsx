import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, Calendar, Heart, Eye, Share2, Clock, Filter, Award } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiService } from '../services/api';

interface PlatformOverview {
  overview: {
    total_users: number;
    total_schedulers: number;
    total_scheduler_items: number;
    total_interactions: number;
  };
  recent_activity: {
    new_users: number;
    new_schedulers: number;
    new_interactions: number;
  };
  top_categories: Array<{
    category: string;
    scheduler_count: number;
  }>;
}

interface PopularScheduler {
  id: number;
  title: string;
  description: string;
  category: string;
  creator_name: string;
  usage_count: number;
  like_count: number;
  share_count: number;
  popularity_score: number;
  created_at: string;
}

interface TrendingScheduler {
  id: number;
  title: string;
  description: string;
  category: string;
  creator_name: string;
  recent_usage: number;
  recent_likes: number;
  recent_shares: number;
  total_recent_activity: number;
  created_at: string;
}

interface CategoryStats {
  category: string;
  scheduler_count: number;
  total_usage: number;
  total_likes: number;
  total_shares: number;
}

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'popular' | 'trending' | 'categories'>('overview');
  const [timeframe, setTimeframe] = useState('month');
  
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [popularSchedulers, setPopularSchedulers] = useState<PopularScheduler[]>([]);
  const [trendingSchedulers, setTrendingSchedulers] = useState<TrendingScheduler[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'popular') {
      fetchPopularSchedulers();
    } else if (activeTab === 'trending') {
      fetchTrendingSchedulers();
    } else if (activeTab === 'categories') {
      fetchCategoryStats();
    }
  }, [activeTab, timeframe]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PlatformOverview>('/analytics/overview');
      if (response.data) {
        setOverview(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularSchedulers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PopularScheduler[]>(`/analytics/popular?timeframe=${timeframe}&limit=10`);
      if (response.data) {
        setPopularSchedulers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch popular schedulers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingSchedulers = async () => {
    try {
      setLoading(true);
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 7;
      const response = await apiService.get<TrendingScheduler[]>(`/analytics/trending?days=${days}&limit=10`);
      if (response.data) {
        setTrendingSchedulers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch trending schedulers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<CategoryStats[]>('/analytics/categories');
      if (response.data) {
        setCategoryStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch category stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Analytics</h1>
            <p className="text-gray-600">Insights and trends from TaskScheduler community</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <BarChart3 className="w-4 h-4" />
            <span>Real-time Data</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'popular'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Award className="w-4 h-4 inline mr-2" />
              Popular
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trending'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Trending
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Categories
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Timeframe Filter for Popular and Trending */}
          {(activeTab === 'popular' || activeTab === 'trending') && (
            <div className="mb-6 flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Time Period:</span>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && overview && (
                <div className="space-y-6">
                  {/* Platform Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {formatNumber(overview.overview.total_users)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="w-8 h-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Total Schedulers</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatNumber(overview.overview.total_schedulers)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="w-8 h-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">Schedule Items</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {formatNumber(overview.overview.total_scheduler_items)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Heart className="w-8 h-8 text-orange-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-orange-600">Total Interactions</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {formatNumber(overview.overview.total_interactions)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity (Past 30 Days)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {overview.recent_activity.new_users}
                        </div>
                        <div className="text-sm text-gray-600">New Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {overview.recent_activity.new_schedulers}
                        </div>
                        <div className="text-sm text-gray-600">New Schedulers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {overview.recent_activity.new_interactions}
                        </div>
                        <div className="text-sm text-gray-600">New Interactions</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Categories */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
                    <div className="space-y-3">
                      {overview.top_categories.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                              {index + 1}
                            </div>
                            <span className="font-medium capitalize">{category.category}</span>
                          </div>
                          <span className="text-gray-600">{category.scheduler_count} schedulers</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Popular Tab */}
              {activeTab === 'popular' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Most Popular Schedulers {timeframe !== 'all' && `(${timeframe === 'week' ? 'Past Week' : timeframe === 'month' ? 'Past Month' : 'Past Year'})`}
                  </h3>
                  {popularSchedulers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No popular schedulers found for this time period.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {popularSchedulers.map((scheduler, index) => (
                        <div key={scheduler.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">{scheduler.title}</h4>
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {scheduler.category}
                                  </span>
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    Score: {scheduler.popularity_score}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">{scheduler.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>By {scheduler.creator_name}</span>
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
                              </div>
                            </div>
                            <Link
                              to={`/scheduler/${scheduler.id}`}
                              className="btn btn-secondary text-sm ml-4"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Trending Tab */}
              {activeTab === 'trending' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Trending Schedulers ({timeframe === 'week' ? 'Past 7 Days' : 'Past 30 Days'})
                  </h3>
                  {trendingSchedulers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No trending schedulers found for this time period.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trendingSchedulers.map((scheduler, index) => (
                        <div key={scheduler.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-orange-600">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">{scheduler.title}</h4>
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {scheduler.category}
                                  </span>
                                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                    {scheduler.total_recent_activity} recent activity
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">{scheduler.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>By {scheduler.creator_name}</span>
                                  <div className="flex items-center space-x-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{scheduler.recent_usage} recent</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Heart className="w-4 h-4" />
                                    <span>{scheduler.recent_likes} recent</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Share2 className="w-4 h-4" />
                                    <span>{scheduler.recent_shares} recent</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Link
                              to={`/scheduler/${scheduler.id}`}
                              className="btn btn-secondary text-sm ml-4"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Category Performance</h3>
                  {categoryStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No category data available.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categoryStats.map((category, index) => (
                        <div key={category.category} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                                {index + 1}
                              </div>
                              <h4 className="font-semibold text-gray-900 capitalize">{category.category}</h4>
                            </div>
                            <span className="text-sm text-gray-500">{category.scheduler_count} schedulers</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-bold text-blue-600">{category.total_usage}</div>
                              <div className="text-xs text-gray-500">Total Uses</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-red-600">{category.total_likes}</div>
                              <div className="text-xs text-gray-500">Total Likes</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-green-600">{category.total_shares}</div>
                              <div className="text-xs text-gray-500">Total Shares</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;