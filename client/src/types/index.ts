// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

// Scheduler types
export interface SchedulerItem {
  id: number;
  scheduler_id: number;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  day_of_week?: number | null;
  start_date?: string | null;
  end_date?: string;
  recurrence_type?: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
  recurrence_interval?: number;
  item_start_date?: string | null;
  item_end_date?: string | null;
  next_occurrence?: string | null;
  priority: number;
  order_index?: number;
  color?: string;
  exclusion_dates?: string[];
  created_at: string;
}

export interface Scheduler {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  category?: string;
  is_public: boolean;
  usage_count: number;
  like_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  items?: SchedulerItem[];
  popularity_score?: number;
  occurrences?: Record<string, any>;
}

// View types
export interface DailyViewData {
  date: string;
  dayOfWeek: number;
  items: SchedulerItem[];
}

export interface WeeklyViewData {
  week: string;
  startDate: string;
  endDate: string;
  days: { [key: number]: SchedulerItem[] };
}

export interface MonthlyViewData {
  month: string;
  year: number;
  monthNum: number;
  startDate: string;
  endDate: string;
  daysInMonth: number;
  days: { [key: number]: SchedulerItem[] };
}

// Analytics types
export interface PopularScheduler extends Scheduler {
  popularity_score: number;
  days_since_creation: number;
}

export interface TrendingScheduler extends Scheduler {
  recent_usage: number;
  recent_likes: number;
  recent_shares: number;
  total_recent_activity: number;
}

export interface CategoryStats {
  category: string;
  scheduler_count: number;
  total_usage: number;
  total_likes: number;
  total_shares: number;
}

export interface UserAnalytics {
  schedulers: Array<{
    id: number;
    title: string;
    category?: string;
    created_at: string;
    usage_count: number;
    like_count: number;
    share_count: number;
  }>;
  interactions: {
    [key: string]: number;
  };
  stats: {
    total_schedulers: number;
    public_schedulers: number;
    private_schedulers: number;
  };
}

export interface PlatformOverview {
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

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Form types
export interface SchedulerFormData {
  title: string;
  description?: string;
  category?: string;
  is_public: boolean;
  items: Array<{
    title: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    day_of_week?: number | null;
    start_date?: string | null;
    recurrence_type?: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
    recurrence_interval?: number;
    item_start_date?: string | null;
    item_end_date?: string | null;
    priority: number;
    color?: string;
  }>;
}

// Filter types
export interface SchedulerFilters {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PopularityFilters {
  limit?: number;
  category?: string;
  timeframe?: 'all' | 'week' | 'month' | 'year';
}

// UI types
export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'list';

export interface TimeSlot {
  start: string;
  end: string;
  item?: SchedulerItem;
}

export interface DaySchedule {
  date: string;
  dayOfWeek: number;
  timeSlots: TimeSlot[];
} 