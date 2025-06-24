import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from './useSession.ts';

export function useSessionManager() {
  const { isAuthenticated, isLoading: sessionLoading, onLogin, onLogout } = useSession();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleLogin = async (sessionId: string, userData?: any) => {
    try {
      setLoading(true);
      setStatus('Logging in...');

      onLogin(sessionId, userData);
      setStatus('Login successful');

      // Redirect after successful login
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setStatus('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      setStatus('Logging out...');

      onLogout();
      setStatus('Logged out');

      // Redirect after logout
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setStatus('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    isAuthenticated,
    loading: loading || sessionLoading,
    status,
    login: handleLogin,
    logout: handleLogout,
  };
}
