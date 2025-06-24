'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '../types/user';
import { setSessionId as setSessionIdMem, getSessionId, clearSessionId } from '../utils/session';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

interface SessionContextProps {
  isAuthenticated: boolean;
  sessionId: string | null;
  user: AuthUser | null;
  setSession: (sessionId: string, user: AuthUser) => void;
  clearSession: () => void;
  isValid: boolean;
  loading: boolean;
  error: string | null;
  login: (userData: any) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextProps>({
  sessionId: null,
  user: null,
  setSession: () => { },
  clearSession: () => { },
  isValid: false,
  loading: true,
  error: null,
  login: () => { },
  logout: () => { },
  isAuthenticated: false,
  refreshSession: async () => { }
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate session with backend
  const validateCurrentSession = async (id: string): Promise<boolean> => {
    try {
      // Skip validation for temporary sessions (offline mode)
      if (id === 'temp-session') {
        console.log('🔍 SessionContext: Skipping validation for temporary session');
        return true;
      }

      console.log('🔍 SessionContext: Validating session:', id?.slice(0, 8) + '...');
      const response = await api.post('/api/auth/validate', { sessionId: id });
      console.log('🔍 SessionContext: Validation successful:', response.data);
      return true;
    } catch (err: any) {
      console.log('🔍 SessionContext: Session validation failed:', err?.response?.status, err?.response?.data?.message || err?.message);

      // If it's a 401 (unauthorized), the session is definitely invalid
      if (err?.response?.status === 401) {
        console.log('🔍 SessionContext: Session invalid (401), clearing session');
        return false;
      }

      // If it's a network error and we have a session, keep it temporarily
      if ((err?.code === 'ERR_NETWORK' || err?.code === 'ERR_SSL_PROTOCOL_ERROR' || err?.response?.status >= 500) && id) {
        console.warn('🔍 SessionContext: Network/server error during validation, keeping session temporarily');
        return true; // Keep session valid during network issues
      }

      // For other errors (400, etc.), assume session is invalid
      console.log('🔍 SessionContext: Session validation failed with error, clearing session');
      return false;
    }
  };

  // On mount, check for sessionId and validate
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // JWT-based session: check for JWT in localStorage
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
          setSessionIdState(jwt);
          // Optionally, validate with backend
          const valid = await validateCurrentSession(jwt);
          setIsValid(valid);
          setIsAuthenticated(valid);
          if (!valid) {
            clearSession();
            setError('Session expired');
          }
        } else {
          setIsValid(false);
          setIsAuthenticated(false);
        }
      } catch (err: any) {
        setIsValid(false);
        setIsAuthenticated(false);
        setError('Failed to initialize session');
      } finally {
        setLoading(false);
      }
    };
    initializeSession();
  }, []);

  // Auto-refresh session periodically
  useEffect(() => {
    if (!sessionId || !isValid) return;

    const interval = setInterval(async () => {
      const valid = await validateCurrentSession(sessionId);
      setIsValid(valid);
      setIsAuthenticated(valid);
      if (!valid) {
        setError('Session expired');
        clearSession();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [sessionId, isValid]);

  const setSession = (id: string, userObj: AuthUser) => {
    console.log('🔍 SessionContext: Setting session:', { id, userId: userObj.id, provider: userObj.authProvider });
    setSessionIdMem(id);
    setSessionIdState(id);
    setUser(userObj);
    setIsValid(true); // Trust that the backend session is valid when we create it
    setIsAuthenticated(true);
    setError(null);
    setLoading(false); // Mark as not loading since we have valid session
    logger.info('Session created', { userId: userObj.id, provider: userObj.authProvider });
  };

  const clearSession = () => {
    clearSessionId();
    setSessionIdState(null);
    setUser(null);
    setIsValid(false);
    setIsAuthenticated(false);
    setError(null);
    logger.info('Session cleared');
  };

  const login = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearSession();
  };

  const refreshSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    const valid = await validateCurrentSession(sessionId);
    setIsValid(valid);
    setIsAuthenticated(valid);

    if (!valid) {
      clearSession();
      setError('Session expired');
    }

    setLoading(false);
  };

  return (
    <SessionContext.Provider value={{
      isAuthenticated,
      sessionId,
      user,
      setSession,
      clearSession,
      isValid,
      loading,
      error,
      login,
      logout,
      refreshSession
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => useContext(SessionContext);

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  address?: string;
}
