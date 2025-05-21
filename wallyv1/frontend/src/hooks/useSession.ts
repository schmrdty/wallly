import { useState, useEffect } from 'react';
import { setSessionId, getSessionId, clearSessionId, validateSession, revokeSession } from '../utils/session';

export function useSession() {
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);
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
  }, []);

  // Call this after SIWE login
  function onLogin(sessionId: string) {
    setSessionId(sessionId);
    setIsValid(true);
  }

  // Call this on logout
  async function logout() {
    await revokeSession();
    setIsValid(false);
  }

  return { isValid, loading, error, onLogin, logout };
}