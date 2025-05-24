import React from 'react';
import { useSessionManager } from '../hooks/useSessionManager';
import { SessionStatus } from './SessionStatus';

const SessionManager: React.FC = () => {
  const {
    isValid,
    sessionLoading,
    error,
    status,
    handleLogin,
    handleLogout,
    loading
  } = useSessionManager();

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
      <SessionStatus status={status} />
    </div>
  );
};

export default SessionManager;
