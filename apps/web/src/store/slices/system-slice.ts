import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { HealthCheckData } from '@healthbridge/shared-types';

export interface SystemState {
  backendHealth: HealthCheckData | null;
  lastChecked: string | null;
  isConnected: boolean;
}

const initialState: SystemState = {
  backendHealth: null,
  lastChecked: null,
  isConnected: false,
};

export const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setBackendHealth: (state, action: PayloadAction<HealthCheckData>) => {
      state.backendHealth = action.payload;
      state.lastChecked = new Date().toISOString();
      state.isConnected = action.payload.status === 'healthy';
    },
    setDisconnected: (state) => {
      state.isConnected = false;
      state.lastChecked = new Date().toISOString();
    },
  },
});

export const { setBackendHealth, setDisconnected } = systemSlice.actions;
export default systemSlice.reducer;

