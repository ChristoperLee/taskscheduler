import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PopularScheduler, TrendingScheduler, CategoryStats } from '../../types';

interface AnalyticsState {
  popularSchedulers: PopularScheduler[];
  trendingSchedulers: TrendingScheduler[];
  categoryStats: CategoryStats[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  popularSchedulers: [],
  trendingSchedulers: [],
  categoryStats: [],
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setPopularSchedulers: (state, action: PayloadAction<PopularScheduler[]>) => {
      state.popularSchedulers = action.payload;
    },
    setTrendingSchedulers: (state, action: PayloadAction<TrendingScheduler[]>) => {
      state.trendingSchedulers = action.payload;
    },
    setCategoryStats: (state, action: PayloadAction<CategoryStats[]>) => {
      state.categoryStats = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { 
  setPopularSchedulers, 
  setTrendingSchedulers, 
  setCategoryStats, 
  setLoading, 
  setError 
} = analyticsSlice.actions;

export default analyticsSlice.reducer; 