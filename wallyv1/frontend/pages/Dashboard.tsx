import React, { useEffect, useState } from 'react';
import { useAuth } from '../src/hooks/useAuth';
import { useSession } from '../src/hooks/useSession';
import EventFeed from '../src/components/EventFeed';
import Notifications from '../src/components/Notifications';
import RequireAuth from '../src/components/RequireAuth';
import TransferForm from '../src/components/TransferForm';
import TokenValidator from '../src/components/TokenValidator';
import { useRouter } from 'next/router';

const Dashboard = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const userId = user?.id;
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    validateSession,
    revokeSession,
    startWatching,
    stopWatching,
  } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const isValid = await validateSession();
        if (!isValid) {
          setError('Session expired or invalid. Please log in again.');
          setTimeout(() => router.push('/'), 2000);
        }
      } catch (err: any) {
        setError('Error validating session.');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [validateSession, router]);

  const handleAction = async (fn: () => Promise<any>, successMsg: string, failMsg: string) => {
    setActionStatus(null);
    try {
      await fn();
      setActionStatus(successMsg);
    } catch (e) {
      setActionStatus(failMsg);
    }
  };

  if (loading || authLoading || sessionLoading)
    return <div>Loading...</div>;
  if (error || authError || sessionError)
    return <div className="error">{error || authError || sessionError}</div>;

  return (
    <RequireAuth>
      <div className="dashboard-container">
        <h1>Welcome to Your Dashboard, {user?.name || user?.address}</h1>
        <section>
          <h2>Account Info</h2>
          <p><strong>Wallet Address:</strong> {user?.address}</p>
          <p><strong>Session Status:</strong> {session?.isValid ? 'Active' : 'Inactive'}</p>
          <p><strong>Session Expires:</strong> {session?.expiresAt ? new Date(session.expiresAt).toLocaleString() : 'N/A'}</p>
        </section>
        <section>
          <h2>Validate Token</h2>
          <TokenValidator />
        </section>
        <section>
          <h2>Transfer Tokens</h2>
          <TransferForm />
        </section>
        <section>
          <h2>Session Actions</h2>
          <RevokeButton
            onClick={() => handleAction(revokeSession, "Session revoked.", "Failed to revoke session.")}
            disabled={!session?.isValid || session?.revoked}
          />
          <StopWatchingButton
            onClick={() => handleAction(stopWatching, "Stopped watching.", "Failed to stop watching.")}
            disabled={!session?.isValid || session?.revoked || !session?.isWatching}
          />
          <StartWatchingButton
            onClick={() => handleAction(startWatching, "Started watching.", "Failed to start watching.")}
            disabled={!session?.isValid || session?.revoked || session?.isWatching}
          />
          {actionStatus && <div style={{ margin: 8, color: actionStatus.includes('Failed') ? 'red' : 'green' }}>{actionStatus}</div>}
        </section>
        <section>
          <h2>Recent Events</h2>
          <EventFeed />
        </section>
        <section>
          <h2>Notifications</h2>
          <Notifications userId={user?.id} />
        </section>
        <div className="session-info">
          <h2>Session Information</h2>
          <p>Session ID: {session?.id}</p>
          <p>Wallet Address: {user?.address}</p>
          <p>Fid: {user?.fid}</p>
          <p>Session Valid: {session?.isValid ? "Yes" : "No"}</p>
          <p>Allowed Tokens: {session?.allowedTokens?.join(", ")}</p>
          <p>Allow Entire Wallet: {session?.allowEntireWallet ? "Yes" : "No"}</p>
          <p>Created At: {session?.createdAt}</p>
          <p>Updated At: {session?.updatedAt}</p>
          <p>Expires At: {session?.expiresAt}</p>
          <p>Revoked: {session?.revoked ? "Yes" : "No"}</p>
          <p>Revoked At: {session?.revokedAt}</p>
          <p>Revoked By: {session?.revokedBy}</p>
          <p>Revoked Reason: {session?.revokedReason}</p>
        </div>
      </div>
    </RequireAuth>
  );
};

const RevokeButton = ({ onClick, disabled }: { onClick: () => void, disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled}>
    Revoke
  </button>
);
const StopWatchingButton = ({ onClick, disabled }: { onClick: () => void, disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled}>
    Stop Watching
  </button>
);
const StartWatchingButton = ({ onClick, disabled }: { onClick: () => void, disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled}>
    Start Watching
  </button>
);

export default Dashboard;