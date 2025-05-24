import { useState, useEffect } from 'react';
import { setSessionId, getSessionId, clearSessionId, validateSession, revokeSession } from '../utils/session';

export function useSession() {
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isIdle, setIsIdle] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isValidateSession, setIsValidateSession] = useState(false);
  const [isRevokeSession, setIsRevokeSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      setLoading(true);
      setError(null);
      try {
        const valid = await validateSession();
        setIsValid(valid);
        if (!valid) clearSessionId();
      } catch (err: any) {
        setError(err.message || 'Session validation failed');
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    }
    check();
    // Initialize session on mount
    initializeSession();
    // Check session validity every 5 minutes
    const interval = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);
  // Call this after SIWE login
  function onLogin(sessionId: string) {
    setSessionId(sessionId);
    setIsValid(true);
  }
  // Call this to check if the session is valid
  async function checkSession() {
    setLoading(true);
    setError(null);
    try {
      const valid = await validateSession();
      setIsValid(valid);
      if (!valid) clearSessionId();
    } catch (err: any) {
      setError(err.message || 'Session validation failed');
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  }
  // Call this to initialize the session
  async function initializeSession() {

    setLoading(true);
    setError(null);
    try {
      const sessionId = getSessionId();
      if (!sessionId) throw new Error('No session ID found');
      const valid = await validateSession();
      setIsValid(valid);
    } catch (err: any) {
      setError(err.message || 'Session initialization failed');
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  }

  // Call this on logout
  async function logout() {
    await revokeSession();
    setIsValid(false);
  }

  return { isValid, loading, error, onLogin, logout };
}