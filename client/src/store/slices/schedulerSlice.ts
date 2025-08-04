import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Scheduler, SchedulerFormData, ApiResponse } from '../../types';
import { apiService } from '../../services/api';

interface SchedulerState {
  schedulers: Scheduler[];
  currentScheduler: Scheduler | null;
  loading: boolean;
  error: string | null;
}

const initialState: SchedulerState = {
  schedulers: [],
  currentScheduler: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchPopularSchedulers = createAsyncThunk<
  ApiResponse<Scheduler[]>,
  number
>(
  'schedulers/fetchPopular',
  async (limit: number = 10) => {
    const response = await apiService.get<Scheduler[]>(`/schedulers/popular?limit=${limit}`);
    return response;
  }
);

export const fetchAllSchedulers = createAsyncThunk<
  ApiResponse<Scheduler[]>,
  { limit?: number; offset?: number; category?: string; search?: string }
>(
  'schedulers/fetchAll',
  async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    if (params.category) searchParams.append('category', params.category);
    if (params.search) searchParams.append('search', params.search);
    
    const response = await apiService.get<Scheduler[]>(`/schedulers?${searchParams.toString()}`);
    return response;
  }
);

export const fetchMySchedulers = createAsyncThunk<
  ApiResponse<Scheduler[]>,
  { limit?: number; offset?: number }
>(
  'schedulers/fetchMy',
  async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    
    const response = await apiService.get<Scheduler[]>(`/schedulers/my?${searchParams.toString()}`);
    return response;
  }
);

export const fetchSchedulerById = createAsyncThunk<
  ApiResponse<Scheduler>,
  string
>(
  'schedulers/fetchById',
  async (id: string) => {
    const response = await apiService.get<Scheduler>(`/schedulers/${id}`);
    return response;
  }
);

export const createScheduler = createAsyncThunk<
  ApiResponse<Scheduler>,
  SchedulerFormData,
  { rejectValue: string }
>(
  'schedulers/create',
  async (schedulerData: SchedulerFormData, { rejectWithValue }) => {
    try {
      console.log('🏪 Redux createScheduler called with:', schedulerData);
      const response = await apiService.post<Scheduler>('/schedulers', schedulerData);
      console.log('🏪 Redux createScheduler success:', response);
      return response;
    } catch (error: any) {
      console.error('🏪 Redux createScheduler error:', error);
      return rejectWithValue(error.message || 'Failed to create scheduler');
    }
  }
);

export const updateScheduler = createAsyncThunk<
  ApiResponse<Scheduler>,
  { id: string; data: Partial<SchedulerFormData> },
  { rejectValue: string }
>(
  'schedulers/update',
  async ({ id, data }: { id: string; data: Partial<SchedulerFormData> }, { rejectWithValue }) => {
    try {
      const response = await apiService.put<Scheduler>(`/schedulers/${id}`, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update scheduler');
    }
  }
);

export const deleteScheduler = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'schedulers/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.delete(`/schedulers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete scheduler');
    }
  }
);

const schedulerSlice = createSlice({
  name: 'schedulers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentScheduler: (state, action: PayloadAction<Scheduler | null>) => {
      state.currentScheduler = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Popular Schedulers
      .addCase(fetchPopularSchedulers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPopularSchedulers.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.schedulers = action.payload.data;
        }
      })
      .addCase(fetchPopularSchedulers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch schedulers';
      })
      // Fetch All Schedulers
      .addCase(fetchAllSchedulers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSchedulers.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.schedulers = action.payload.data;
        }
      })
      .addCase(fetchAllSchedulers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch schedulers';
      })
      // Fetch Scheduler by ID
      .addCase(fetchSchedulerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedulerById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.currentScheduler = action.payload.data;
        }
      })
      .addCase(fetchSchedulerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch scheduler';
      })
      // Create Scheduler
      .addCase(createScheduler.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createScheduler.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.currentScheduler = action.payload.data;
          state.schedulers.unshift(action.payload.data);
        }
      })
      .addCase(createScheduler.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create scheduler';
      })
      // Update Scheduler
      .addCase(updateScheduler.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateScheduler.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.currentScheduler = action.payload.data;
          const index = state.schedulers.findIndex(s => s.id === action.payload.data!.id);
          if (index !== -1) {
            state.schedulers[index] = action.payload.data;
          }
        }
      })
      .addCase(updateScheduler.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update scheduler';
      })
      // Delete Scheduler
      .addCase(deleteScheduler.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteScheduler.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = parseInt(action.payload);
        state.schedulers = state.schedulers.filter(s => s.id !== deletedId);
        if (state.currentScheduler?.id === deletedId) {
          state.currentScheduler = null;
        }
      })
      .addCase(deleteScheduler.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete scheduler';
      });
  },
});

export const { clearError, setCurrentScheduler } = schedulerSlice.actions;
export default schedulerSlice.reducer; 