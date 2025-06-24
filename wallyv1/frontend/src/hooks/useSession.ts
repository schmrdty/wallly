import { useState, useEffect, useCallback } from 'react';

interface SessionData {
  sessionId: string;
  user?: any;
}

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedSession = localStorage.getItem('wally_session');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (error) {
        console.error('Failed to parse saved session:', error);
        localStorage.removeItem('wally_session');
      }
    }
    setIsLoading(false);
  }, []);

  const onLogin = useCallback((sessionId: string, user?: any) => {
    const sessionData = { sessionId, user };
    setSession(sessionData);
    localStorage.setItem('wally_session', JSON.stringify(sessionData));
  }, []);

  const onLogout = useCallback(() => {
    setSession(null);
    localStorage.removeItem('wally_session');
  }, []);

  return {
    session,
    isLoading,
    onLogin,
    onLogout,
    isAuthenticated: !!session
  };
}

export default useSession;