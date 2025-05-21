import React, { useState } from 'react';
import { useSession } from '../hooks/useSession';
import { useRouter } from 'next/router';

const SessionManager: React.FC = () => {
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

  return (
    <div>
      <h3>Session Info</h3>
      <div>
        <strong>Session Valid:</strong> {isValid ? 'Yes' : 'No'}
      </div>
      <div>
        <strong>Session Loading:</strong> {sessionLoading ? 'Yes' : 'No'}
      </div>
      <div>
        <strong>Session Error:</strong> {error ? error : 'None'}
      </div>
      <button onClick={handleLogin} disabled={loading || sessionLoading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <button onClick={handleLogout} disabled={loading || sessionLoading}>
        {loading ? 'Logging out...' : 'Logout'}
      </button>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </div>
  );
};

export default SessionManager;
