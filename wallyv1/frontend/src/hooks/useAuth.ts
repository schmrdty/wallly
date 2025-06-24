'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthUser } from '@/types/user.ts';
import { api } from '@/utils/api.ts';
import { logger } from '@/utils/logger.ts';
import { loadUserFromStorage, saveUserToStorage } from './authStorage.ts';
import { useSignMessage } from 'wagmi';

/**
 * Custom hook for authentication state and actions.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signMessageAsync } = useSignMessage();

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedUser = loadUserFromStorage();
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
      logger.info('User restored from storage', { userId: storedUser.id });
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    saveUserToStorage(user);
  }, [user]);

  /**
   * Update user state and storage
   */
  const updateUserState = useCallback((userData: AuthUser | null) => {
    setUser(userData);
    setIsAuthenticated(!!userData);
    saveUserToStorage(userData);
  }, []);

  /**
   * Called by Farcaster auth on success.
   */
  const signInWithFarcaster = useCallback(async (userData: any) => {
    try {
      setLoading(true);
      setError(null);

      // Validate user data
      if (!userData.id) {
        throw new Error('User ID is required');
      }

      const authUser: AuthUser = {
        id: userData.fid?.toString() || userData.id,
        address: userData.address || '',
        fid: userData.fid,
        authProvider: 'farcaster',
        farcasterUser: {
          fid: userData.fid,
          username: userData.username,
          displayName: userData.displayName,
          pfpUrl: userData.pfpUrl
        }
      };

      updateUserState(authUser);
      logger.info('Farcaster sign-in successful', { userId: authUser.id });

    } catch (err: any) {
      logger.error('Farcaster sign-in failed:', err);
      setError(err.message || 'Farcaster sign-in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateUserState]);

  /**
   * Called by wallet auth on success.
   */
  const signInWithEthereum = useCallback(async (nonce: string, address: string) => {
    try {
      setLoading(true);
      setError(null);
      const message = `Sign this message to authenticate. Nonce: ${nonce}`;
      const signature = await signMessageAsync({ message });
      const response = await api.post('/api/auth/siwe', {
        message,
        signature,
        address
      });
      if (response.data?.token) {
        localStorage.setItem('jwt', response.data.token);
      }
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signMessageAsync]);

  /**
   * Login with Farcaster using backend API
   */
  const loginWithFarcaster = useCallback(async (authResult: any) => {
    try {
      setLoading(true);
      setError(null);

      // Call backend auth endpoint
      const response = await api.post('/api/auth/farcaster', authResult);

      if (response.data?.token) {
        localStorage.setItem('jwt', response.data.token);
      }

      if (response.data?.user) {
        const userData = {
          ...response.data.user,
          authProvider: 'farcaster'
        };

        updateUserState(userData);
        logger.info('FarcasterAuthSuccess', { userId: userData.id });

        return response.data;
      }

      throw new Error('Invalid response from authentication service');

    } catch (err: any) {
      logger.error('Farcaster login failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [updateUserState]);

  /**
   * Logout user and clear all state
   */
  const logoutUser = useCallback(async () => {
    try {
      setLoading(true);

      // Call backend logout if user exists
      if (user) {
        try {
          await api.post('/api/auth/logout');
        } catch (err) {
          // Log but don't throw - we still want to clear local state
          logger.warn('Backend logout failed, clearing local state anyway', err);
        }
      }

      // Clear local state
      updateUserState(null);
      setError(null);

      logger.info('User logged out successfully');

    } catch (err: any) {
      logger.error('Logout failed:', err);
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  }, [user, updateUserState]);

  /**
   * Refresh user data from backend
   */
  const refreshUser = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get('/api/auth/session');
      if (response.data?.user) {
        updateUserState(response.data.user);
      }
    } catch (err) {
      logger.warn('Failed to refresh user data:', err);
      // Don't throw here as this is a background operation
    }
  }, [user, updateUserState]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    setUser: updateUserState,
    isAuthenticated,
    loading,
    error,
    loginWithFarcaster,
    logoutUser,
    signInWithFarcaster,
    signInWithEthereum,
    refreshUser,
    clearError
  };
}

export default useAuth;