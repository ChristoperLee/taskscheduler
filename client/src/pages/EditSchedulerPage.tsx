import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { updateScheduler, fetchSchedulerById } from '../store/slices/schedulerSlice';
import { Calendar, Loader2, Plus, X, Edit } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface SchedulerItem {
  id?: number;
  title: string;
  description: string;
  target_date?: string; // New: unified target date
  end_date?: string | null; // New: end date for duration
  day_of_week?: number | null; // Legacy: keep for backward compatibility
  start_date?: string | null; // Legacy: keep for backward compatibility
  start_time: string;
  end_time: string;
  order_index: number;
  priority: number;
  recurrence_type: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
  recurrence_interval: number;
  item_start_date?: string | null; // Legacy: keep for backward compatibility
  item_end_date?: string | null; // Legacy: keep for backward compatibility
  color?: string; // New: color for visual identification
}

// Helper function for ordinal suffixes (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';  
    case 3: return 'rd';
    default: return 'th';
  }
};

// Color options for schedule items
const colorOptions = [
  { value: 'blue', label: 'Blue', bgClass: 'bg-blue-100', textClass: 'text-blue-800', swatch: 'bg-blue-500' },
  { value: 'green', label: 'Green', bgClass: 'bg-green-100', textClass: 'text-green-800', swatch: 'bg-green-500' },
  { value: 'red', label: 'Red', bgClass: 'bg-red-100', textClass: 'text-red-800', swatch: 'bg-red-500' },
  { value: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800', swatch: 'bg-yellow-500' },
  { value: 'purple', label: 'Purple', bgClass: 'bg-purple-100', textClass: 'text-purple-800', swatch: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', bgClass: 'bg-pink-100', textClass: 'text-pink-800', swatch: 'bg-pink-500' },
  { value: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-100', textClass: 'text-indigo-800', swatch: 'bg-indigo-500' },
  { value: 'gray', label: 'Gray', bgClass: 'bg-gray-100', textClass: 'text-gray-800', swatch: 'bg-gray-500' }
];

// Helper function to get color classes with explicit class mapping
const getColorClasses = (color?: string) => {
  const colorToUse = color || 'blue';
  
  // Explicit mapping to ensure Tailwind includes these classes
  switch (colorToUse) {
    case 'blue':
      return { bgClass: 'bg-blue-100', textClass: 'text-blue-800' };
    case 'green':
      return { bgClass: 'bg-green-100', textClass: 'text-green-800' };
    case 'red':
      return { bgClass: 'bg-red-100', textClass: 'text-red-800' };
    case 'yellow':
      return { bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' };
    case 'purple':
      return { bgClass: 'bg-purple-100', textClass: 'text-purple-800' };
    case 'pink':
      return { bgClass: 'bg-pink-100', textClass: 'text-pink-800' };
    case 'indigo':
      return { bgClass: 'bg-indigo-100', textClass: 'text-indigo-800' };
    case 'gray':
      return { bgClass: 'bg-gray-100', textClass: 'text-gray-800' };
    default:
      return { bgClass: 'bg-blue-100', textClass: 'text-blue-800' };
  }
};

const EditSchedulerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    is_public: true
  });
  const [items, setItems] = useState<SchedulerItem[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<Partial<SchedulerItem>>({
    title: '',
    description: '',
    target_date: new Date().toISOString().split('T')[0],
    end_date: null,
    start_time: '09:00',
    end_time: '10:00',
    order_index: 0,
    recurrence_type: 'one-time',
    recurrence_interval: 1,
    color: 'blue'
  });
  const [isInitialized, setIsInitialized] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentScheduler, loading, error } = useSelector((state: RootState) => state.schedulers);

  // Load scheduler data
  useEffect(() => {
    if (id) {
      dispatch(fetchSchedulerById(id));
    }
  }, [dispatch, id]);

  // Populate form when scheduler data is loaded
  useEffect(() => {
    if (currentScheduler && !isInitialized) {
      setFormData({
        title: currentScheduler.title || '',
        description: currentScheduler.description || '',
        category: currentScheduler.category || 'personal',
        is_public: currentScheduler.is_public !== undefined ? currentScheduler.is_public : true
      });

      if (currentScheduler.items) {
        console.log('🔍 Raw scheduler items from API:', currentScheduler.items);
        
        // Helper function to preserve Date objects for internal use but also store string versions
        const formatDateValue = (date: any): string | null => {
          if (!date) return null;
          if (typeof date === 'string') {
            // Handle ISO date strings from API (e.g., "2025-08-04T07:00:00.000Z")
            if (date.includes('T')) {
              // Extract date part directly to avoid timezone conversion
              return date.split('T')[0];
            }
            return date;
          }
          if (date instanceof Date) {
            // For Date objects, format to YYYY-MM-DD in local timezone
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          if (date && typeof date === 'object' && date.toISOString) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          return null;
        };

        setItems(currentScheduler.items.map((item, index) => ({
          id: item.id,
          title: item.title || '',
          description: item.description || '',
          day_of_week: item.day_of_week || null,
          start_date: formatDateValue(item.start_date),
          start_time: item.start_time || '09:00',
          end_time: item.end_time || '10:00',
          order_index: index,
          priority: item.priority || 1,
          recurrence_type: item.recurrence_type || 'one-time',
          recurrence_interval: item.recurrence_interval || 1,
          item_start_date: formatDateValue(item.item_start_date),
          item_end_date: formatDateValue(item.item_end_date),
          color: item.color || 'blue' // Add color field with default
        })));
      }
      setIsInitialized(true);
    }
  }, [currentScheduler, isInitialized]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: name === 'day_of_week' || name === 'order_index' || name === 'recurrence_interval' ? parseInt(value) : value
    }));
  };

  const startEditingItem = (index: number) => {
    const item = items[index];
    
    
    // Helper function to convert Date objects to YYYY-MM-DD strings
    const formatDateForInput = (date: any): string => {
      if (!date) return '';
      if (typeof date === 'string') {
        // Handle ISO date strings from API (e.g., "2025-08-04T07:00:00.000Z")
        if (date.includes('T')) {
          // Extract date part directly to avoid timezone conversion
          return date.split('T')[0];
        }
        return date;
      }
      if (date instanceof Date) {
        // For Date objects, format to YYYY-MM-DD in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      // Handle case where date might be a Date object but not recognized as instanceof Date
      if (date && typeof date === 'object' && date.toISOString) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return '';
    };
    
    // Handle backward compatibility: convert legacy format to new format
    let targetDate = '';
    let endDate = '';
    
    if (item.target_date) {
      // New format
      targetDate = formatDateForInput(item.target_date);
      endDate = formatDateForInput(item.end_date);
    } else {
      // Legacy format - convert to new format
      if (item.recurrence_type === 'one-time' && item.start_date) {
        targetDate = formatDateForInput(item.start_date);
      } else if (item.item_start_date) {
        targetDate = formatDateForInput(item.item_start_date);
        endDate = formatDateForInput(item.item_end_date);
      }
    }
    
    const editData = {
      title: item.title || '',
      description: item.description || '',
      target_date: targetDate,
      end_date: endDate,
      start_time: item.start_time || '09:00',
      end_time: item.end_time || '10:00',
      order_index: item.order_index || 0,
      recurrence_type: item.recurrence_type || 'one-time',
      recurrence_interval: item.recurrence_interval || 1,
      color: item.color || 'blue'
    };
    
    setNewItem(editData);
    setEditingItem(index);
    setShowAddItem(true);
  };

  const addOrUpdateItem = () => {
    // Clear any previous errors
    setErrors({});
    
    // Validate required fields
    if (!newItem.title || newItem.title.trim() === '') {
      setErrors({ item: 'Title is required' });
      return;
    }

    if (!newItem.description || newItem.description.trim() === '') {
      setErrors({ item: 'Description is required' });
      return;
    }

    if (!newItem.target_date) {
      setErrors({ item: 'Target date is required' });
      return;
    }

    // Convert new format to compatible format for backend
    // Parse date correctly to avoid timezone issues
    const [year, month, day] = newItem.target_date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day); // Create local date without timezone conversion
    
    // Convert JavaScript day (0=Sunday, 1=Monday, ..., 6=Saturday) to our system (1=Monday, ..., 7=Sunday)
    const jsDay = targetDate.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    
    console.log('🗓️ Day of week calculation:', {
      targetDate: newItem.target_date,
      jsDay,
      dayOfWeek,
      actualDate: targetDate.toDateString()
    });

    const itemData: SchedulerItem = {
      title: newItem.title!.trim(),
      description: newItem.description!.trim(),
      target_date: newItem.target_date,
      end_date: newItem.end_date || undefined,
      // Legacy fields for backward compatibility
      day_of_week: (newItem.recurrence_type === 'one-time' || newItem.recurrence_type === 'daily') ? null : dayOfWeek,
      start_date: newItem.recurrence_type === 'one-time' ? newItem.target_date : null,
      item_start_date: newItem.recurrence_type !== 'one-time' ? newItem.target_date : null,
      item_end_date: newItem.recurrence_type !== 'one-time' ? (newItem.end_date || null) : null,
      start_time: newItem.start_time || '09:00',
      end_time: newItem.end_time || '10:00',
      order_index: editingItem !== null ? editingItem : items.length,
      priority: 1,
      recurrence_type: newItem.recurrence_type || 'one-time',
      recurrence_interval: newItem.recurrence_interval || 1,
      color: newItem.color || 'blue'
    };

    console.log('🎨 Saving item with color:', {
      newItemColor: newItem.color,
      itemDataColor: itemData.color,
      fullItemData: itemData
    });

    if (editingItem !== null) {
      // Update existing item
      setItems(prev => prev.map((item, index) => 
        index === editingItem ? itemData : item
      ));
      setEditingItem(null);
    } else {
      // Add new item
      setItems(prev => [...prev, itemData]);
    }

    setNewItem({
      title: '',
      description: '',
      target_date: new Date().toISOString().split('T')[0],
      end_date: null,
      start_time: '09:00',
      end_time: '10:00',
      order_index: items.length + 1,
      recurrence_type: 'one-time',
      recurrence_interval: 1,
      color: 'blue'
    });
    setShowAddItem(false);
    setErrors({});
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const cancelEdit = () => {
    setShowAddItem(false);
    setEditingItem(null);
    setNewItem({
      title: '',
      description: '',
      target_date: new Date().toISOString().split('T')[0],
      end_date: null,
      start_time: '09:00',
      end_time: '10:00',
      order_index: 0,
      recurrence_type: 'one-time',
      recurrence_interval: 1,
      color: 'blue'
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one schedule item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) return;

    console.log('🚀 Submitting scheduler with items:', {
      formData,
      items,
      itemsWithColors: items.map(item => ({ title: item.title, color: item.color }))
    });

    try {
      const result = await dispatch(updateScheduler({
        id,
        data: {
          ...formData,
          items
        }
      })).unwrap();
      
      if (result.data) {
        navigate(`/scheduler/${result.data.id}`);
      }
    } catch (error: any) {
      console.error('Update scheduler failed:', error);
    }
  };

  if (loading || !isInitialized) {
    return <LoadingSpinner />;
  }

  if (!currentScheduler) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Scheduler not found</h1>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Helper function to get day name from date
  const getDayFromDate = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Convert to our day system
  };

  // Helper function to get context-aware recurrence label
  const getRecurrenceLabel = (recurrenceType: string, targetDate: string): string => {
    if (!targetDate) return recurrenceType;
    
    const dayName = getDayFromDate(targetDate);
    switch (recurrenceType) {
      case 'daily': return 'Every day';
      case 'weekly': return `Every ${dayName}`;
      case 'bi-weekly': return `Every other ${dayName}`;
      case 'monthly': return `Monthly on this date`;
      case 'quarterly': return `Quarterly on this date`;
      case 'one-time': return `One-time on ${dayName}`;
      default: return recurrenceType;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Edit className="w-8 h-8 mr-3 text-primary-600" />
          Edit Scheduler
        </h1>
        <p className="text-gray-600">
          Update your scheduler with new time slots and activities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Scheduler Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter scheduler title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="health">Health</option>
                <option value="education">Education</option>
                <option value="family">Family</option>
                <option value="creative">Creative</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe your scheduler"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Make this scheduler public (visible to other users)
              </span>
            </label>
          </div>
        </div>


        {/* Schedule Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Schedule Items</h2>
            <button
              type="button"
              onClick={() => setShowAddItem(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
          </div>

          {errors.items && (
            <p className="text-sm text-red-600 mb-4">{errors.items}</p>
          )}

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No schedule items yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const colorClasses = getColorClasses(item.color);
                const targetDate = item.target_date || item.start_date || item.item_start_date || '';
                return (
                  <div key={index} className={`border-2 ${colorClasses.bgClass} border-gray-200 rounded-lg p-4`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <div className={`w-3 h-3 rounded-full ${colorOptions.find(opt => opt.value === item.color)?.swatch || 'bg-blue-500'}`}></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="flex items-center space-x-1 text-gray-700">
                            <Calendar className="w-4 h-4" />
                            <span>{targetDate}</span>
                          </span>
                          <span className="text-gray-500">
                            {item.start_time} - {item.end_time}
                          </span>
                          <span className={`px-2 py-1 ${colorClasses.bgClass} ${colorClasses.textClass} rounded-full text-xs font-medium`}>
                            {getRecurrenceLabel(item.recurrence_type || 'one-time', targetDate)}
                          </span>
                          {item.end_date && (
                            <span className="text-xs text-gray-500">
                              Until {item.end_date}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => startEditingItem(index)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit item"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Item Form - New Progressive Design */}
          {showAddItem && (
            <div className="border border-gray-200 rounded-lg p-6 mt-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {editingItem !== null ? 'Edit Schedule Item' : 'Add New Schedule Item'}
              </h3>
              
              {errors.item && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                  {errors.item}
                </div>
              )}

              {/* Step 1: Basic Information - Blue Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">📝 Basic Information</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newItem.title || ''}
                      onChange={handleItemChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.item && (!newItem.title || newItem.title.trim() === '') 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder="e.g., Team Meeting, Workout, Study Session"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={newItem.description || ''}
                      onChange={handleItemChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.item && (!newItem.description || newItem.description.trim() === '') 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Brief description of the activity"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Target Date - Green Section */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-green-900 mb-3">📅 Target Date</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date *
                    </label>
                    <input
                      type="date"
                      name="target_date"
                      value={newItem.target_date || ''}
                      onChange={handleItemChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day Information
                    </label>
                    <div className="px-3 py-2 bg-green-100 border border-green-300 rounded-md text-green-800 font-medium">
                      {newItem.target_date ? getDayFromDate(newItem.target_date) : 'Select a date'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Time Range - Purple Section */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-3">⏰ Time Range</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      value={newItem.start_time || '09:00'}
                      onChange={handleItemChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      value={newItem.end_time || '10:00'}
                      onChange={handleItemChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Recurrence Type - Orange Section */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-orange-900 mb-3">🔄 Recurrence Pattern</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurrence Type
                    </label>
                    <select
                      name="recurrence_type"
                      value={newItem.recurrence_type || 'one-time'}
                      onChange={handleItemChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="one-time">One-time Event</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly (Every 2 weeks)</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly (Every 3 months)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pattern Preview
                    </label>
                    <div className="px-3 py-2 bg-orange-100 border border-orange-300 rounded-md text-orange-800 font-medium">
                      {getRecurrenceLabel(newItem.recurrence_type || 'one-time', newItem.target_date || '')}
                    </div>
                  </div>
                </div>

                {(newItem.recurrence_type !== 'one-time') && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={newItem.end_date || ''}
                      onChange={handleItemChange}
                      min={newItem.target_date || undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Leave empty for indefinite recurrence
                    </p>
                  </div>
                )}
              </div>

              {/* Step 5: Color Selection - Pink Section */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-pink-900 mb-3">🎨 Color Theme</h4>
                
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewItem(prev => ({ ...prev, color: color.value }))}
                      className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                        newItem.color === color.value 
                          ? 'border-pink-500 bg-white shadow-md' 
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${color.swatch} mb-1`}></div>
                      <span className="text-xs text-gray-600">{color.label}</span>
                    </button>
                  ))}
                </div>

                {/* Color Preview */}
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${getColorClasses(newItem.color).bgClass} ${getColorClasses(newItem.color).textClass}`}>
                    {newItem.title || 'Your Activity'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addOrUpdateItem}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingItem !== null ? 'Update Item' : 'Add Schedule Item'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/scheduler/${id}`)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
            ) : null}
            Update Scheduler
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSchedulerPage;
