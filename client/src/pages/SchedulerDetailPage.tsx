import React, { useEffect, useState, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { fetchSchedulerById } from '../store/slices/schedulerSlice';
import { Calendar, User, Heart, Share2, Eye, ArrowLeft, CalendarDays, List, Grid, Clock, Edit, ChevronLeft, ChevronRight, CalendarCheck, X, Filter, ChevronDown } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import RecurrenceDisplay from '../components/RecurrenceDisplay';
import { SchedulerItem } from '../types';

// Helper function to get color classes with explicit class mapping
const getColorClasses = (color?: string) => {
  const colorToUse = color || 'blue';
  
  // Explicit mapping to ensure Tailwind includes these classes
  switch (colorToUse) {
    case 'blue':
      return { bgClass: 'bg-blue-100', textClass: 'text-blue-800', swatch: 'bg-blue-500' };
    case 'green':
      return { bgClass: 'bg-green-100', textClass: 'text-green-800', swatch: 'bg-green-500' };
    case 'red':
      return { bgClass: 'bg-red-100', textClass: 'text-red-800', swatch: 'bg-red-500' };
    case 'yellow':
      return { bgClass: 'bg-yellow-100', textClass: 'text-yellow-800', swatch: 'bg-yellow-500' };
    case 'purple':
      return { bgClass: 'bg-purple-100', textClass: 'text-purple-800', swatch: 'bg-purple-500' };
    case 'pink':
      return { bgClass: 'bg-pink-100', textClass: 'text-pink-800', swatch: 'bg-pink-500' };
    case 'indigo':
      return { bgClass: 'bg-indigo-100', textClass: 'text-indigo-800', swatch: 'bg-indigo-500' };
    case 'gray':
      return { bgClass: 'bg-gray-100', textClass: 'text-gray-800', swatch: 'bg-gray-500' };
    default:
      return { bgClass: 'bg-blue-100', textClass: 'text-blue-800', swatch: 'bg-blue-500' };
  }
};

const SchedulerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentScheduler, loading } = useSelector((state: RootState) => state.schedulers);
  const { user } = useSelector((state: RootState) => state.auth);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'list'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper function to format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Helper function to check if a recurring item occurs on a specific date
  const itemOccursOnDate = (item: SchedulerItem, targetDate: Date): boolean => {
    if (!item.recurrence_type || item.recurrence_type === 'one-time') {
      // One-time events: check if it matches the specific date
      if (item.start_date) {
        let itemDate: Date;
        if (typeof item.start_date === 'string' && item.start_date.includes('-') && (item.start_date.length === 10 || item.start_date.includes('T'))) {
          // Handle both YYYY-MM-DD and ISO timestamp formats to avoid timezone issues
          const dateOnly = item.start_date.split('T')[0]; // Extract date part from ISO timestamp
          const [year, month, day] = dateOnly.split('-').map(Number);
          itemDate = new Date(year, month - 1, day);
        } else {
          itemDate = new Date(item.start_date);
        }
        return itemDate.toDateString() === targetDate.toDateString();
      }
      return false;
    }

    // For recurring items, check if target date matches the day of week (except for daily)
    if (item.recurrence_type !== 'daily') {
      // Convert JavaScript day (0=Sunday, 1=Monday, ..., 6=Saturday) to our system (1=Monday, ..., 7=Sunday)
      const jsDay = targetDate.getDay();
      const targetDayOfWeek = jsDay === 0 ? 7 : jsDay; // Sunday (0) becomes 7, others stay same
      if (item.day_of_week !== targetDayOfWeek) {
        return false;
      }
    }

    // Get the start date for the recurring item 
    const startDateStr = item.item_start_date || item.start_date;
    if (!startDateStr) return false;
    
    // Parse date correctly to avoid timezone issues
    let startDate: Date;
    if (typeof startDateStr === 'string') {
      if (startDateStr.includes('-') && (startDateStr.length === 10 || startDateStr.includes('T'))) {
        // Handle both YYYY-MM-DD and ISO timestamp formats to avoid timezone issues
        const dateOnly = startDateStr.split('T')[0]; // Extract date part from ISO timestamp
        const [year, month, day] = dateOnly.split('-').map(Number);
        startDate = new Date(year, month - 1, day);
      } else {
        startDate = new Date(startDateStr);
      }
    } else {
      startDate = new Date(startDateStr);
    }
    
    // Normalize both dates to same timezone for consistent comparison
    // Create dates preserving the intended date without timezone shifts
    const normalizeDate = (date: Date): Date => {
      // Use the date components to create a local date without timezone conversion
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      return new Date(year, month, day);
    };
    
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedTargetDate = normalizeDate(targetDate);
    
    // Check if target date is before start date
    if (normalizedTargetDate < normalizedStartDate) {
      return false;
    }

    // Check if target date is after end date (if specified)
    if (item.item_end_date) {
      let endDate: Date;
      if (typeof item.item_end_date === 'string' && item.item_end_date.includes('-') && (item.item_end_date.length === 10 || item.item_end_date.includes('T'))) {
        // Handle both YYYY-MM-DD and ISO timestamp formats to avoid timezone issues
        const dateOnly = item.item_end_date.split('T')[0]; // Extract date part from ISO timestamp
        const [year, month, day] = dateOnly.split('-').map(Number);
        endDate = new Date(year, month - 1, day);
      } else {
        endDate = new Date(item.item_end_date);
      }
      const normalizedEndDate = normalizeDate(endDate);
      if (normalizedTargetDate > normalizedEndDate) {
        return false;
      }
    }

    // For weekly/bi-weekly items, find the actual first occurrence on the correct day of week
    let effectiveStartDate = normalizedStartDate;
    
    if (item.recurrence_type === 'weekly' || item.recurrence_type === 'bi-weekly') {
      // Convert JavaScript day to our system (Sunday 0 -> 7, others stay same)
      const jsStartDay = normalizedStartDate.getDay();
      const startDayOfWeek = jsStartDay === 0 ? 7 : jsStartDay;
      const itemDayOfWeek = item.day_of_week || 7;
      
      if (startDayOfWeek !== itemDayOfWeek) {
        // Adjust start date to the first occurrence of the correct day of week
        let daysToAdd = itemDayOfWeek - startDayOfWeek;
        if (daysToAdd < 0) daysToAdd += 7; // Handle week wrapping
        
        effectiveStartDate = new Date(normalizedStartDate.getFullYear(), normalizedStartDate.getMonth(), normalizedStartDate.getDate() + daysToAdd);
      }
    }
    
    // Calculate if this occurrence should happen based on recurrence type
    // Use date arithmetic to avoid timezone issues in millisecond calculations
    const daysDiff = Math.floor((normalizedTargetDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (item.recurrence_type) {
      case 'daily':
        return daysDiff >= 0;
      case 'weekly':
        return daysDiff >= 0 && daysDiff % 7 === 0;
      case 'bi-weekly':
        return daysDiff >= 0 && daysDiff % 14 === 0;
      case 'monthly':
        // For monthly, check if it's the same day of month and at least one month has passed
        const monthsDiffMonthly = (normalizedTargetDate.getFullYear() - normalizedStartDate.getFullYear()) * 12 + (normalizedTargetDate.getMonth() - normalizedStartDate.getMonth());
        return monthsDiffMonthly >= 0 && normalizedTargetDate.getDate() === normalizedStartDate.getDate();
      case 'quarterly':
        // For quarterly, check if it's the same day and month is 3 months apart
        const monthsDiff = (normalizedTargetDate.getFullYear() - normalizedStartDate.getFullYear()) * 12 + (normalizedTargetDate.getMonth() - normalizedStartDate.getMonth());
        return monthsDiff >= 0 && monthsDiff % 3 === 0 && normalizedTargetDate.getDate() === normalizedStartDate.getDate();
      default:
        return false;
    }
  };

  // Helper function to get items for a specific day (for day-of-week based views)
  const getItemsForDay = (dayOfWeek: number) => {
    return currentScheduler?.items?.filter(item => 
      item.day_of_week === dayOfWeek || item.recurrence_type === 'daily'
    ) || [];
  };

  // Helper function to get items for a specific date (for monthly view)
  const getItemsForDate = (date: Date) => {
    if (!currentScheduler?.items) {
      return [];
    }
    
    const items = currentScheduler.items.filter(item => itemOccursOnDate(item, date));
    
    
    return items;
  };

  // Helper function to parse time for sorting
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchSchedulerById(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentScheduler) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Scheduler Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The scheduler you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentScheduler.title}
              </h1>
              <p className="text-gray-600 mb-4">
                {currentScheduler.description}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{currentScheduler.creator_name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(currentScheduler.created_at).toLocaleDateString()}</span>
                </div>
                <span className={`badge badge-${currentScheduler.category === 'work' ? 'primary' : 'secondary'}`}>
                  {currentScheduler.category}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{currentScheduler.usage_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{currentScheduler.like_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Share2 className="w-4 h-4" />
                  <span>{currentScheduler.share_count}</span>
                </div>
              </div>
              
              {/* Edit button - show if user owns this scheduler or is admin */}
              {user && (currentScheduler.user_id === user.id || user.role === 'admin') && (
                <Link 
                  to={`/scheduler/${currentScheduler.id}/edit`}
                  className="btn btn-primary text-sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {user.role === 'admin' && currentScheduler.user_id !== user.id ? 'Edit (Admin)' : 'Edit'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'daily', label: 'Daily', icon: CalendarDays },
              { key: 'weekly', label: 'Weekly', icon: Grid },
              { key: 'monthly', label: 'Monthly', icon: Calendar },
              { key: 'list', label: 'List', icon: List }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  viewMode === key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* View Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {viewMode === 'daily' && (
          <DailyView 
            items={getItemsForDay(selectedDate.getDay() === 0 ? 7 : selectedDate.getDay())} 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            formatTime={formatTime}
            daysOfWeek={daysOfWeek}
          />
        )}
        
        {viewMode === 'weekly' && (
          <WeeklyView 
            scheduler={currentScheduler}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            formatTime={formatTime}
            daysOfWeek={daysOfWeek}
            getItemsForDay={getItemsForDay}
          />
        )}
        
        {viewMode === 'monthly' && (
          <MonthlyView 
            scheduler={currentScheduler}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            daysOfWeek={daysOfWeek}
            getItemsForDay={getItemsForDay}
            getItemsForDate={getItemsForDate}
            formatTime={formatTime}
            parseTime={parseTime}
          />
        )}
        
        {viewMode === 'list' && (
          <ListView 
            scheduler={currentScheduler}
            formatTime={formatTime}
            daysOfWeek={daysOfWeek}
            parseTime={parseTime}
          />
        )}
      </div>
    </div>
  );
};

// Daily View Component
const DailyView: React.FC<{
  items: SchedulerItem[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  formatTime: (time: string) => string;
  daysOfWeek: string[];
}> = ({ items, selectedDate, setSelectedDate, formatTime, daysOfWeek }) => {
  const currentDay = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay(); // Convert Sunday (0) to 7
  const sortedItems = items.sort((a, b) => {
    const timeA = a.start_time ? a.start_time.split(':').map(Number) : [0, 0];
    const timeB = b.start_time ? b.start_time.split(':').map(Number) : [0, 0];
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily View</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Navigation buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                setSelectedDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
              title="Go to today"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <select
            value={currentDay}
            onChange={(e) => {
              const newDay = parseInt(e.target.value);
              const newDate = new Date(selectedDate);
              const currentJsDay = newDate.getDay();
              const currentDay = currentJsDay === 0 ? 7 : currentJsDay;
              const diff = newDay - currentDay;
              newDate.setDate(newDate.getDate() + diff);
              setSelectedDate(newDate);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {daysOfWeek.map((day, index) => (
              <option key={index} value={index + 1}>{day}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No activities scheduled for {daysOfWeek[currentDay - 1]}</p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {item.start_time && formatTime(item.start_time)} - {item.end_time && formatTime(item.end_time)}
                      </span>
                    </div>
                    <span className={`badge badge-${item.priority === 1 ? 'primary' : item.priority === 2 ? 'secondary' : 'tertiary'}`}>
                      Priority {item.priority}
                    </span>
                    <RecurrenceDisplay recurrenceType={item.recurrence_type} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Weekly View Component  
const WeeklyView: React.FC<{
  scheduler: any;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  formatTime: (time: string) => string;
  daysOfWeek: string[];
  getItemsForDay: (day: number) => SchedulerItem[];
}> = ({ selectedDate, setSelectedDate, formatTime, daysOfWeek, getItemsForDay }) => {
  // Calculate week start and end dates
  const getWeekDates = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(d.setDate(diff + 6));
    return { monday, sunday };
  };

  const { monday, sunday } = getWeekDates(selectedDate);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly View</h2>
          <p className="text-sm text-gray-600 mt-1">
            {monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {sunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 7);
              setSelectedDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
            title="Go to current week"
          >
            This Week
          </button>
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 7);
              setSelectedDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {daysOfWeek.map((day, index) => {
          const dayNumber = index + 1;
          const currentDayDate = new Date(monday);
          currentDayDate.setDate(monday.getDate() + index);
          const isToday = currentDayDate.toDateString() === new Date().toDateString();
          
          const dayItems = getItemsForDay(dayNumber).sort((a, b) => {
            const timeA = a.start_time ? a.start_time.split(':').map(Number) : [0, 0];
            const timeB = b.start_time ? b.start_time.split(':').map(Number) : [0, 0];
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
          });

          return (
            <div key={day} className={`border rounded-lg p-3 ${isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
              <h3 className="text-center mb-3 pb-2 border-b">
                <div className="font-semibold text-gray-900">{day}</div>
                <div className="text-xs text-gray-600">{currentDayDate.getDate()}</div>
                {isToday && <div className="text-xs text-blue-600 font-medium mt-1">Today</div>}
              </h3>
              <div className="space-y-2">
                {dayItems.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No activities</p>
                ) : (
                  dayItems.map((item) => {
                    const colorClasses = getColorClasses(item.color);
                    return (
                      <div key={item.id} className={`${colorClasses.bgClass} border border-${item.color || 'blue'}-200 rounded p-2`}>
                        <div className="font-medium text-xs text-gray-900 mb-1">{item.title}</div>
                        <div className="text-xs text-gray-600 flex items-center mb-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.start_time && formatTime(item.start_time)}
                        </div>
                        <RecurrenceDisplay recurrenceType={item.recurrence_type} className="text-xs" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Monthly View Component
const MonthlyView: React.FC<{
  scheduler: any;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  daysOfWeek: string[];
  getItemsForDay: (day: number) => SchedulerItem[];
  getItemsForDate: (date: Date) => SchedulerItem[];
  formatTime: (time: string) => string;
  parseTime: (time: string) => number;
}> = ({ scheduler, selectedDate, setSelectedDate, daysOfWeek, getItemsForDate, formatTime, parseTime }) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  // State for expanded day view
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);
  const [expandedDayItems, setExpandedDayItems] = useState<SchedulerItem[]>([]);
  
  // Type for filters
  type FilterState = {
    colors: string[];
    priorities: number[];
    recurrenceTypes: string[];
  };

  // State for filters - with localStorage persistence
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(() => {
    // Load saved filters from localStorage
    const savedFilters = localStorage.getItem(`monthlyViewFilters_${scheduler?.id}`);
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.error('Error parsing saved filters:', e);
      }
    }
    return {
      colors: [],
      priorities: [],
      recurrenceTypes: []
    };
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (scheduler?.id) {
      localStorage.setItem(`monthlyViewFilters_${scheduler.id}`, JSON.stringify(activeFilters));
    }
  }, [activeFilters, scheduler?.id]);
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay(); // Convert Sunday (0) to 7

  const weeks = [];
  let currentWeek = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 1; i < startingDayOfWeek; i++) {
    currentWeek.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  
  // Add empty cells for remaining days
  while (currentWeek.length < 7) {
    currentWeek.push(null);
  }
  weeks.push(currentWeek);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get today's date for comparison
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };
  
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  
  // Filter options
  const colors = ['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'gray'];
  const priorities = [
    { value: 1, label: 'High', color: 'red' },
    { value: 2, label: 'Medium', color: 'yellow' },
    { value: 3, label: 'Low', color: 'green' }
  ];
  const recurrenceTypes = [
    { value: 'one-time', label: 'One-time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];
  
  // Filter function
  const filterItems = (items: SchedulerItem[]): SchedulerItem[] => {
    return items.filter(item => {
      // If no filters active, show all
      if (activeFilters.colors.length === 0 && 
          activeFilters.priorities.length === 0 && 
          activeFilters.recurrenceTypes.length === 0) {
        return true;
      }
      
      // Check each filter type
      const colorMatch = activeFilters.colors.length === 0 || 
        activeFilters.colors.includes(item.color || 'blue');
      const priorityMatch = activeFilters.priorities.length === 0 || 
        activeFilters.priorities.includes(item.priority || 1);
      const recurrenceMatch = activeFilters.recurrenceTypes.length === 0 || 
        activeFilters.recurrenceTypes.includes(item.recurrence_type || 'one-time');
      
      return colorMatch && priorityMatch && recurrenceMatch;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Monthly View</h2>
        <div className="flex items-center space-x-3">
          {/* Today Button */}
          {!isCurrentMonth && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
              title="Go to today"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Today</span>
            </button>
          )}
          
          {/* Month Navigation */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
            <button
              onClick={() => setSelectedDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Month/Year Display with Selectors */}
            <div className="px-4 py-1.5 min-w-[160px] text-center">
              <select
                value={month}
                onChange={(e) => setSelectedDate(new Date(year, parseInt(e.target.value), 1))}
                className="font-medium text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer hover:text-blue-600"
              >
                {monthNames.map((monthName, idx) => (
                  <option key={idx} value={idx}>{monthName}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setSelectedDate(new Date(parseInt(e.target.value), month, 1))}
                className="ml-1 font-medium text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer hover:text-blue-600"
              >
                {Array.from({ length: 10 }, (_, i) => year - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setSelectedDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            {Object.values(activeFilters).some((arr: any[]) => arr.length > 0) && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {Object.values(activeFilters).reduce((acc: number, arr: any[]) => acc + arr.length, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="mb-3">
            <p className="text-sm text-gray-600">
              Filter items in the calendar view. {Object.values(activeFilters).reduce((acc: number, arr: any[]) => acc + arr.length, 0)} filter{Object.values(activeFilters).reduce((acc: number, arr: any[]) => acc + arr.length, 0) !== 1 ? 's' : ''} active.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Color Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Colors</h3>
              <div className="space-y-1">
                {colors.map(color => {
                  const isActive = activeFilters.colors.includes(color);
                  const colorClasses = getColorClasses(color);
                  return (
                    <label key={color} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActiveFilters(prev => ({
                              ...prev,
                              colors: [...prev.colors, color]
                            }));
                          } else {
                            setActiveFilters(prev => ({
                              ...prev,
                              colors: prev.colors.filter(c => c !== color)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${colorClasses.swatch}`}></div>
                        <span className="text-sm text-gray-700 capitalize">{color}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Priority Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Priority</h3>
              <div className="space-y-1">
                {priorities.map(priority => {
                  const isActive = activeFilters.priorities.includes(priority.value);
                  return (
                    <label key={priority.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActiveFilters(prev => ({
                              ...prev,
                              priorities: [...prev.priorities, priority.value]
                            }));
                          } else {
                            setActiveFilters(prev => ({
                              ...prev,
                              priorities: prev.priorities.filter(p => p !== priority.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        priority.color === 'red' ? 'bg-red-100 text-red-700' :
                        priority.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {priority.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Recurrence Type Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recurrence</h3>
              <div className="space-y-1">
                {recurrenceTypes.map(type => {
                  const isActive = activeFilters.recurrenceTypes.includes(type.value);
                  return (
                    <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActiveFilters(prev => ({
                              ...prev,
                              recurrenceTypes: [...prev.recurrenceTypes, type.value]
                            }));
                          } else {
                            setActiveFilters(prev => ({
                              ...prev,
                              recurrenceTypes: prev.recurrenceTypes.filter(t => t !== type.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setActiveFilters({
                  colors: [],
                  priorities: [],
                  recurrenceTypes: []
                })}
                className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={Object.values(activeFilters).every((arr: any[]) => arr.length === 0)}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gradient-to-b from-gray-50 to-gray-100">
          {daysOfWeek.map((day, idx) => (
            <div 
              key={day} 
              className={`p-3 text-center font-medium border-r border-gray-200 last:border-r-0 ${
                idx >= 5 ? 'text-blue-700 bg-blue-50/50' : 'text-gray-700'
              }`}
            >
              {day.slice(0, 3)}
            </div>
          ))}
        </div>
        
        {/* Calendar weeks */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-t border-gray-200">
            {week.map((day, dayIndex) => {
              const currentDate = day ? new Date(year, month, day) : null;
              const unfilteredItems = currentDate ? getItemsForDate(currentDate) : [];
              const dayItems = filterItems(unfilteredItems);
              
              
              const isCurrentDay = currentDate && isToday(currentDate);
              const dayClasses = `min-h-24 p-2 border-r border-gray-200 last:border-r-0 cursor-pointer transition-all hover:bg-gray-50 ${
                isCurrentDay ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : ''
              }`;
              
              return (
                <div 
                  key={dayIndex} 
                  className={dayClasses}
                  onClick={() => {
                    if (day && currentDate && dayItems.length > 0) {
                      setExpandedDay(currentDate);
                      setExpandedDayItems(dayItems);
                    }
                  }}
                  onDoubleClick={() => {
                    if (day && currentDate) {
                      // Placeholder for quick add
                      console.log('Double-clicked for quick add:', currentDate);
                    }
                  }}
                  title={day ? `${dayItems.length} ${dayItems.length === 1 ? 'item' : 'items'}` : ''}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-700' : 'text-gray-900'}`}>
                        {day}
                        {isCurrentDay && <span className="ml-1 text-xs font-normal">(Today)</span>}
                      </div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 2).map((item) => {
                          const colorClasses = getColorClasses(item.color);
                          const finalClassName = `text-xs ${colorClasses.bgClass} ${colorClasses.textClass} px-1 py-0.5 rounded truncate flex items-center`;
                          return (
                            <div 
                              key={item.id} 
                              className={finalClassName}
                              title={`${item.title} (${item.start_time || 'All day'})`}
                            >
                              {item.start_time && (
                                <span className="text-xs opacity-75 mr-1">
                                  {item.start_time.slice(0, 5)}
                                </span>
                              )}
                              <span className="truncate">{item.title}</span>
                            </div>
                          );
                        })}
                        {dayItems.length > 2 && (
                          <div 
                            className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                            title={`View all ${dayItems.length} items`}
                          >
                            +{dayItems.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Expanded Day Modal */}
      {expandedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {expandedDay.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {expandedDayItems.length} {expandedDayItems.length === 1 ? 'item' : 'items'} scheduled
                  </p>
                </div>
                <button
                  onClick={() => {
                    setExpandedDay(null);
                    setExpandedDayItems([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {expandedDayItems
                  .sort((a, b) => {
                    const timeA = a.start_time ? parseTime(a.start_time) : 0;
                    const timeB = b.start_time ? parseTime(b.start_time) : 0;
                    return timeA - timeB;
                  })
                  .map((item) => {
                    const colorClasses = getColorClasses(item.color);
                    return (
                      <div 
                        key={item.id}
                        className={`border-2 rounded-lg p-4 ${colorClasses.bgClass} border-gray-200 hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{item.title}</h4>
                              <div className={`w-3 h-3 rounded-full ${getColorClasses(item.color).swatch}`}></div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <div className="flex items-center space-x-1 text-gray-700">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {item.start_time ? formatTime(item.start_time) : 'All day'}
                                  {item.end_time && ` - ${formatTime(item.end_time)}`}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.priority === 1 ? 'bg-red-100 text-red-700' :
                                item.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                Priority {item.priority}
                              </span>
                              <RecurrenceDisplay recurrenceType={item.recurrence_type} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setExpandedDay(null);
                    setExpandedDayItems([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// List View Component
const ListView: React.FC<{
  scheduler: any;
  formatTime: (time: string) => string;
  daysOfWeek: string[];
  parseTime: (time: string) => number;
}> = ({ scheduler, formatTime, daysOfWeek, parseTime }) => {
  const allItems = scheduler?.items || [];
  const groupedItems = daysOfWeek.reduce((acc, day, index) => {
    const dayNumber = index + 1;
    const dayItems = allItems.filter((item: SchedulerItem) => {
      // Include daily items on every day
      if (item.recurrence_type === 'daily') return true;
      // Include items that match the specific day of week
      if (item.day_of_week === dayNumber) return true;
      // Include one-time items that match this day (for completeness)
      if (item.recurrence_type === 'one-time' && item.start_date) {
        const itemDate = new Date(item.start_date);
        const jsItemDay = itemDate.getDay();
        const itemDay = jsItemDay === 0 ? 7 : jsItemDay; // Convert Sunday (0) to 7
        return itemDay === dayNumber;
      }
      return false;
    })
      .sort((a: SchedulerItem, b: SchedulerItem) => {
        const timeA = a.start_time ? parseTime(a.start_time) : 0;
        const timeB = b.start_time ? parseTime(b.start_time) : 0;
        return timeA - timeB;
      });
    acc[day] = dayItems;
    return acc;
  }, {} as Record<string, SchedulerItem[]>);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">List View</h2>
      
      <div className="space-y-6">
        {daysOfWeek.map((day) => {
          const items = groupedItems[day];
          return (
            <div key={day} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarDays className="w-5 h-5 mr-2" />
                {day}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({items.length} {items.length === 1 ? 'activity' : 'activities'})
                </span>
              </h3>
              
              {items.length === 0 ? (
                <p className="text-gray-500 italic">No activities scheduled</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded">
                      <div className="flex-shrink-0">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>
                            {item.start_time && formatTime(item.start_time)} - {item.end_time && formatTime(item.end_time)}
                          </span>
                          <span className={`badge badge-${item.priority === 1 ? 'primary' : item.priority === 2 ? 'secondary' : 'tertiary'}`}>
                            Priority {item.priority}
                          </span>
                          <RecurrenceDisplay recurrenceType={item.recurrence_type} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SchedulerDetailPage; 