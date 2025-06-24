import React, { useState } from 'react';
import { useContractIntegration } from '../hooks/useContractIntegration.ts';
import { useTransactionManager } from '../hooks/useTransactionManager.ts';
import { useAccount } from 'wagmi';
import { SessionStatus } from './SessionStatus.tsx';

const SessionManager: React.FC = () => {
  const { address } = useAccount();
  const {
    userData,
    loading: contractLoading,
    error: contractError,
    createSession,
    activateSession,
    deactivateSession,
    fetchUserData
  } = useContractIntegration();

  const {
    addTransaction,
    executeTransaction,
    loading: txLoading,
    error: txError,
    processingTransactions
  } = useTransactionManager();

  const [status, setStatus] = useState('');
  const [sessionForm, setSessionForm] = useState({
    miniAppId: '', // Will be autofilled if available from context
    permissions: ['transfer'],
    duration: 24 // hours
  });

  // Autofill miniAppId if available from env
  React.useEffect(() => {
    // Use NEXT_PUBLIC_MINI_APP_ID from environment
    const defaultMiniAppId = process.env.NEXT_PUBLIC_MINI_APP_ID || '';
    if (defaultMiniAppId && !sessionForm.miniAppId) {
      setSessionForm((prev) => ({ ...prev, miniAppId: defaultMiniAppId }));
    }
  }, [sessionForm.miniAppId]);

  // Combined states
  const loading = contractLoading || txLoading;
  const error = contractError || txError;
  const submitting = processingTransactions.length > 0;
  const session = userData?.session;
  const isValid = userData?.hasValidSession || false;

  // Handle session creation
  const handleCreateSession = async () => {
    if (!address) return;

    try {
      setStatus('Creating session...');
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + sessionForm.duration * 3600);
      // Autofill delegate address with connected wallet address
      const delegate = address;
      // Pass delegate to backend if required (add to params)
      const txId = addTransaction('session', 'create', {
        miniAppId: sessionForm.miniAppId,
        permissions: sessionForm.permissions,
        expiresAt,
        delegate // Ensure delegate is included in the session creation payload
      }, 'medium');
      await executeTransaction(txId);
      setStatus('Session created successfully!');
      await fetchUserData();
    } catch (err: any) {
      setStatus(`Session creation failed: ${err.message}`);
    }
  };

  // Handle session activation
  const handleActivate = async () => {
    if (!address) return;

    try {
      setStatus('Activating session...');

      const txId = addTransaction('session', 'activate', {}, 'high');
      await executeTransaction(txId);

      setStatus('Session activated successfully!');
      await fetchUserData();

    } catch (err: any) {
      setStatus(`Session activation failed: ${err.message}`);
    }
  };

  // Handle session deactivation
  const handleDeactivate = async () => {
    if (!address) return;

    try {
      setStatus('Deactivating session...');

      const txId = addTransaction('session', 'deactivate', {}, 'high');
      await executeTransaction(txId);

      setStatus('Session deactivated successfully!');
      await fetchUserData();

    } catch (err: any) {
      setStatus(`Session deactivation failed: ${err.message}`);
    }
  };

  return (
    <div className="session-manager">
      <h3 className="text-lg font-bold mb-4">Session Management</h3>

      {/* Current Session Status */}
      <div className="mb-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Session Valid:</strong>{' '}
              <span className={isValid ? 'text-green-600' : 'text-red-600'}>
                {isValid ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            {session && (
              <>
                {(session as any).miniAppId && (
                  <div>
                    <strong>Mini App ID:</strong> {(session as any).miniAppId}
                  </div>
                )}
                {(session as any).permissions && (session as any).permissions.length > 0 && (
                  <div className="col-span-2">
                    <strong>Permissions:</strong> {(session as any).permissions.join(', ')}
                  </div>
                )}
                <div>
                  <strong>Delegate:</strong> {session.delegate}
                </div>
                <div>
                  <strong>Expires:</strong>{' '}
                  {new Date(Number(session.expiresAt) * 1000).toLocaleString()}
                </div>
                <div>
                  <strong>Active:</strong> {session.active ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Allow Whole Wallet:</strong> {session.allowWholeWallet ? 'Yes' : 'No'}
                </div>
                <div className="col-span-2">
                  <strong>Allowed Tokens:</strong> {session.allowedTokens?.length > 0 ? session.allowedTokens.join(', ') : 'None'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create New Session Form */}
      {!session && (
        <div className="mb-6 p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">Create New Session</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Mini App ID</label>
              <input
                type="text"
                value={sessionForm.miniAppId}
                readOnly // Make miniAppId read-only if autofilled
                className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
                placeholder="Mini app identifier (autofilled)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration (hours)</label>
              <select
                value={sessionForm.duration}
                onChange={(e) => setSessionForm({ ...sessionForm, duration: Number(e.target.value) })}
                className="w-full p-2 border rounded-md"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={168}>7 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Permissions</label>
              <div className="space-y-1">
                {['transfer', 'read', 'write'].map(permission => (
                  <label key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sessionForm.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSessionForm({
                            ...sessionForm,
                            permissions: [...sessionForm.permissions, permission]
                          });
                        } else {
                          setSessionForm({
                            ...sessionForm,
                            permissions: sessionForm.permissions.filter(p => p !== permission)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateSession}
            disabled={submitting || loading || !sessionForm.miniAppId}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      )}

      {/* Session Control Buttons */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleActivate}
          disabled={submitting || loading || !session || isValid}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Activating...' : 'Activate Session'}
        </button>

        <button
          onClick={handleDeactivate}
          disabled={submitting || loading || !isValid}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? 'Deactivating...' : 'Deactivate Session'}
        </button>
      </div>

      {/* Transaction Status */}
      {processingTransactions.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">Processing Transactions</h4>
          {processingTransactions.map(tx => (
            <div key={tx.id} className="text-sm text-blue-600">
              {tx.operation} - {tx.status}
            </div>
          ))}
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div className={`mb-4 p-3 rounded-lg ${status.includes('successfully')
          ? 'bg-green-50 text-green-800'
          : status.includes('failed')
            ? 'bg-red-50 text-red-800'
            : 'bg-yellow-50 text-yellow-800'
          }`}>
          {status}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Session Status Component */}
      <SessionStatus status={status} />
    </div>
  );
};

export default SessionManager;
