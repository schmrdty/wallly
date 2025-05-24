import { useState } from 'react';
import { useSession } from '../hooks/useSession';
import { useRouter } from 'next/router';

export function useSessionManager() {
  const { isValid, loading: sessionLoading, error, onLogin, logout } = useSession();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    setStatus('');
    try {
      await logout();
      setStatus('Logged out.');
      setTimeout(() => router.push('/'), 1000);
    } catch {
      setStatus('Failed to log out.');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setStatus('');
    try {
      await onLogin('your-session-id');
      setStatus('Logged in.');
    } catch {
      setStatus('Failed to log in.');
    }
    setLoading(false);
  };

  return {
    isValid,
    sessionLoading,
    error,
    status,
    handleLogin,
    handleLogout,
    loading
  };
}
