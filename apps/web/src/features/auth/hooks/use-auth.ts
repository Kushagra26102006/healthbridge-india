'use client';

import { useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSession, setLoading, setError, clearSession } from '@/store/slices/auth-slice';
import { authApi } from '../api/auth-api';
import type { RegisterRequestDto, LoginRequestDto } from '@healthbridge/shared-types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user, profile, isAuthenticated, isLoading, isInitialized, error } = useAppSelector(
    (state) => state.auth
  );

  /**
   * Initializes session from HTTP-only cookie on application boot
   */
  const initSession = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const data = await authApi.getMe();
      dispatch(setSession({ user: data.user, profile: data.profile }));
    } catch {
      // User is not authenticated; set initialized state
      dispatch(clearSession());
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialized) {
      void initSession();
    }
  }, [isInitialized, initSession]);

  /**
   * Login Mutation
   */
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequestDto) => authApi.login(credentials),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
    },
    onSuccess: (data) => {
      dispatch(setSession({ user: data.user }));
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: (err: Error) => {
      dispatch(setError(err.message || 'Login failed'));
    },
  });

  /**
   * Registration Mutation
   */
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequestDto) => authApi.register(data),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
    },
    onSuccess: (data) => {
      if (data.tokens?.accessToken) {
        dispatch(setSession({ user: data.user }));
      } else {
        dispatch(setLoading(false));
      }
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: (err: Error) => {
      dispatch(setError(err.message || 'Registration failed'));
    },
  });

  /**
   * Logout Mutation
   */
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      dispatch(clearSession());
      queryClient.clear();
    },
    onError: () => {
      // Clear client state even if network call fails
      dispatch(clearSession());
    },
  });

  /**
   * Logout from all devices
   */
  const logoutAllMutation = useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: () => {
      dispatch(clearSession());
      queryClient.clear();
    },
  });

  return {
    user,
    profile,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isInitialized,
    error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    logoutAll: logoutAllMutation.mutateAsync,
    initSession,
  };
};

