import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserPublicDto } from '@healthbridge/shared-types';

export interface AuthState {
  user: UserPublicDto | null;
  profile: unknown | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (
      state,
      action: PayloadAction<{ user: UserPublicDto | null; profile?: unknown }>
    ) => {
      state.user = action.payload.user;
      state.profile = action.payload.profile || null;
      state.isAuthenticated = !!action.payload.user;
      state.isLoading = false;
      state.isInitialized = true;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearSession: (state) => {
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isInitialized = true;
      state.error = null;
    },
  },
});

export const { setSession, setLoading, setError, clearSession } = authSlice.actions;

// Backward-compatibility alias
export const setUser = (user: UserPublicDto | null) => setSession({ user });
export const logout = clearSession;

export default authSlice.reducer;
