import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth-slice';
import systemReducer from './slices/system-slice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      system: systemReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
