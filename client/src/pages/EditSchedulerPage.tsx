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
  end_date?: string; // New: end date for duration
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
  { value: 'blue', label: 'Blue', bgClass: 'bg-blue-100', textClass: 'text-blue-800', preview: 'bg-blue-500' },
  { value: 'green', label: 'Green', bgClass: 'bg-green-100', textClass: 'text-green-800', preview: 'bg-green-500' },
  { value: 'red', label: 'Red', bgClass: 'bg-red-100', textClass: 'text-red-800', preview: 'bg-red-500' },
  { value: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800', preview: 'bg-yellow-500' },
  { value: 'purple', label: 'Purple', bgClass: 'bg-purple-100', textClass: 'text-purple-800', preview: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', bgClass: 'bg-pink-100', textClass: 'text-pink-800', preview: 'bg-pink-500' },
  { value: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-100', textClass: 'text-indigo-800', preview: 'bg-indigo-500' },
  { value: 'gray', label: 'Gray', bgClass: 'bg-gray-100', textClass: 'text-gray-800', preview: 'bg-gray-500' }
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
    target_date: '',
    end_date: '',
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
    if (!newItem.title || !newItem.description) {
      setErrors({ item: 'Title and description are required' });
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
      title: newItem.title!,
      description: newItem.description!,
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
      target_date: '',
      end_date: '',
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
      target_date: '',
      end_date: '',
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
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        {item.recurrence_type === 'one-time' ? (
                          <span>{item.start_date ? new Date(item.start_date).toLocaleDateString() : 'No date set'}</span>
                        ) : item.recurrence_type === 'daily' ? (
                          <span>Every day</span>
                        ) : (
                          <span>{item.day_of_week ? daysOfWeek[item.day_of_week - 1] : 'No day set'}</span>
                        )}
                        <span>{item.start_time} - {item.end_time}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {item.recurrence_type === 'daily' && 'Daily'}
                          {item.recurrence_type === 'weekly' && 'Weekly'}
                          {item.recurrence_type === 'bi-weekly' && 'Bi-weekly'}
                          {item.recurrence_type === 'monthly' && 'Monthly'}
                          {item.recurrence_type === 'quarterly' && 'Quarterly'}
                          {item.recurrence_type === 'one-time' && 'One-time'}
                        </span>
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
              ))}
            </div>
          )}

          {/* Add/Edit Item Form */}
          {showAddItem && (
            <div className="border border-gray-200 rounded-lg p-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-4">
                {editingItem !== null ? 'Edit Item' : 'Add New Item'}
              </h3>
              
              {errors.item && (
                <p className="text-sm text-red-600 mb-4">{errors.item}</p>
              )}

              {/* Step 1: Title */}
              <div className="grid md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newItem.title}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Activity title"
                  />
                </div>
              </div>

              {/* Step 2: When should this happen? */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">📅 When should this happen?</h4>
                <div className="grid md:grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Date *
                    </label>
                    <input
                      type="date"
                      name="target_date"
                      value={newItem.target_date || ''}
                      onChange={handleItemChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {newItem.target_date && (
                      <p className="mt-1 text-sm text-blue-600 font-medium">
                        📍 {(() => {
                          // Parse date correctly to avoid timezone issues
                          const [year, month, day] = newItem.target_date.split('-').map(Number);
                          const date = new Date(year, month - 1, day); // month is 0-indexed
                          return date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Duration */}
              {newItem.target_date && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">⏱️ For how long?</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={newItem.end_date || ''}
                        onChange={handleItemChange}
                        min={newItem.target_date || undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center text-sm text-gray-600">
                        <input
                          type="checkbox"
                          name="no_end_date"
                          checked={!newItem.end_date}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleItemChange({ target: { name: 'end_date', value: '' } } as any);
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                        />
                        No end date
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: How often? */}
              {newItem.target_date && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">🔄 How often?</h4>
                  <div className="grid md:grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recurrence Type
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'one-time', label: 'One-time Event' },
                          { value: 'daily', label: 'Daily (Every day)' },
                          { 
                            value: 'weekly', 
                            label: newItem.target_date 
                              ? `Weekly (Every ${(() => {
                                  const [year, month, day] = newItem.target_date.split('-').map(Number);
                                  const date = new Date(year, month - 1, day);
                                  return date.toLocaleDateString('en-US', { weekday: 'long' });
                                })()})`
                              : 'Weekly'
                          },
                          { 
                            value: 'bi-weekly', 
                            label: newItem.target_date 
                              ? `Bi-weekly (Every 2 ${(() => {
                                  const [year, month, day] = newItem.target_date.split('-').map(Number);
                                  const date = new Date(year, month - 1, day);
                                  return date.toLocaleDateString('en-US', { weekday: 'long' });
                                })()}s)`
                              : 'Bi-weekly'
                          },
                          { 
                            value: 'monthly', 
                            label: newItem.target_date 
                              ? `Monthly (${(() => {
                                  const [year, month, day] = newItem.target_date.split('-').map(Number);
                                  const date = new Date(year, month - 1, day);
                                  const dayOfMonth = date.getDate();
                                  return `${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`;
                                })()} of each month)`
                              : 'Monthly'
                          },
                          { 
                            value: 'quarterly', 
                            label: newItem.target_date 
                              ? `Quarterly (Every 3 months)`
                              : 'Quarterly'
                          }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              name="recurrence_type"
                              value={option.value}
                              checked={newItem.recurrence_type === option.value}
                              onChange={handleItemChange}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Occurrence Preview */}
              {newItem.target_date && newItem.recurrence_type && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">👀 Preview Occurrences</h4>
                  <div className="text-sm text-gray-700">
                    {(() => {
                      if (newItem.recurrence_type === 'one-time') {
                        return (
                          <p>
                            📅 This will occur once on{' '}
                            <span className="font-semibold text-blue-600">
                              {(() => {
                                const [year, month, day] = newItem.target_date.split('-').map(Number);
                                const date = new Date(year, month - 1, day);
                                return date.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                });
                              })()}
                            </span>
                          </p>
                        );
                      }

                      // Calculate next few occurrences for recurring events
                      const [year, month, day] = newItem.target_date.split('-').map(Number);
                      const targetDate = new Date(year, month - 1, day);
                      const endDate = newItem.end_date ? (() => {
                        const [endYear, endMonth, endDay] = newItem.end_date.split('-').map(Number);
                        return new Date(endYear, endMonth - 1, endDay);
                      })() : null;
                      const occurrences = [];
                      let currentDate = new Date(targetDate);
                      
                      // Generate up to 5 occurrences or until end date
                      for (let i = 0; i < 5; i++) {
                        if (endDate && currentDate > endDate) break;
                        
                        occurrences.push(new Date(currentDate));
                        
                        // Calculate next occurrence
                        switch (newItem.recurrence_type) {
                          case 'daily':
                            currentDate.setDate(currentDate.getDate() + 1);
                            break;
                          case 'weekly':
                            currentDate.setDate(currentDate.getDate() + 7);
                            break;
                          case 'bi-weekly':
                            currentDate.setDate(currentDate.getDate() + 14);
                            break;
                          case 'monthly':
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            break;
                          case 'quarterly':
                            currentDate.setMonth(currentDate.getMonth() + 3);
                            break;
                        }
                      }

                      return (
                        <div>
                          <p className="mb-2">📅 Upcoming occurrences:</p>
                          <div className="space-y-1 pl-4">
                            {occurrences.map((date, index) => (
                              <div key={index} className="flex items-center text-xs">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                <span className="font-medium">
                                  {date.toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            ))}
                            {endDate ? (
                              <p className="text-xs text-gray-500 mt-2">
                                ⏹️ Ends on {endDate.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            ) : occurrences.length === 5 ? (
                              <p className="text-xs text-gray-500 mt-2">
                                ♾️ ...and continues indefinitely
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}


              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={newItem.start_time}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={newItem.end_time}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={newItem.description}
                  onChange={handleItemChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe this activity"
                />
              </div>

              {/* Color Picker */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🎨 Color (Current: {newItem.color})
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => {
                    const isSelected = newItem.color === color.value;
                    console.log(`Color ${color.value}: selected=${isSelected}, newItem.color=${newItem.color}`);
                    return (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleItemChange({ target: { name: 'color', value: color.value } } as any)}
                        className={`flex items-center space-x-2 p-2 rounded-md border-2 transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${color.preview}`}></div>
                        <span className="text-xs font-medium">{color.label}</span>
                      </button>
                    );
                  })}
                </div>
                {newItem.color && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-600">Preview: </span>
                    <span className={`text-xs px-2 py-1 rounded ${getColorClasses(newItem.color).bgClass} ${getColorClasses(newItem.color).textClass}`}>
                      {newItem.title || 'Sample Item'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addOrUpdateItem}
                  className="btn btn-primary"
                >
                  {editingItem !== null ? 'Update Item' : 'Add Item'}
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