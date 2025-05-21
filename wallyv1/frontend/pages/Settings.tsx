import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/hooks/useAuth';
import { api } from '../src/utils/api';
import RenewButton from '../src/components/RenewButton';

const Settings = () => {
  const { user } = useAuth();
  const [purgeMode, setPurgeMode] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewConfig, setRenewConfig] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      api.get(`/api/user/settings/${user.id}`).then(res => {
        setPurgeMode(res.data.purgeMode || false);
        setAutoRenew(res.data.autoRenew || false);
        setRenewConfig(res.data.renewConfig || null);
      });
    }
  }, [user?.id]);

  const handlePurgeToggle = async () => {
    if (!user?.id) return;
    try {
      await api.post('/api/user/settings', { userId: user.id, purgeMode: !purgeMode });
      setPurgeMode(!purgeMode);
      setStatus('Purge Mode updated!');
    } catch {
      setStatus('Failed to update Purge Mode.');
    }
  };

  const handleAutoRenewToggle = async () => {
    if (!user?.id) return;
    try {
      await api.post('/api/user/settings', { userId: user.id, autoRenew: !autoRenew });
      setAutoRenew(!autoRenew);
      setStatus('Auto-Renew updated!');
    } catch {
      setStatus('Failed to update Auto-Renew.');
    }
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <label>
        <input
          type="checkbox"
          checked={purgeMode}
          onChange={handlePurgeToggle}
        />
        Enable Purge Mode (delete audit logs after 30 days)
      </label>
      <div style={{ fontSize: '0.9em', color: '#666', marginTop: 8 }}>
        Purge Mode will delete your audit logs after 30 days. Revoking a session is immediate, but Purge Mode is delayed for your safety.
      </div>
      <label>
        <input
          type="checkbox"
          checked={autoRenew}
          onChange={handleAutoRenewToggle}
        />
        Enable Auto-Renew
      </label>
      {autoRenew && renewConfig && (
        <div style={{ margin: '12px 0', background: '#f5f5f5', padding: 8 }}>
          <strong>Auto-Renew Configuration:</strong>
          <pre>{JSON.stringify(renewConfig, null, 2)}</pre>
        </div>
      )}
      <RenewButton userId={user?.id} disabled={purgeMode} />
      {purgeMode && (
        <div style={{ color: 'red' }}>
          Renew is disabled when Purge Mode is enabled.
        </div>
      )}
      {status && <div>{status}</div>}
    </div>
  );
};

export default Settings;