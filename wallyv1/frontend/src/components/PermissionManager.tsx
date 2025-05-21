import React, { useState, useEffect } from 'react';
import api from '../services/api';

const reminderOptions = [
  { value: 'both', label: 'Yes, 1 Week & 1 Day' },
  { value: '1day', label: 'Yes, 1 Day Only' },
  { value: '1week', label: 'Yes, 1 Week Only' },
  { value: 'none', label: 'No Reminders' }
];

const PermissionManager = ({ userId, permission }) => {
  const [autorenew, setAutorenew] = useState(false);
  const [reminder, setReminder] = useState('both');
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [renewStatus, setRenewStatus] = useState('');
  const [revokeStatus, setRevokeStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const { data } = await api.get(`/api/user/prefs/${userId}`);
        if (data) {
          setAutorenew(data.autorenew ?? false);
          setReminder(data.reminderOption ?? 'both');
        }
      } catch {
        // Defaults are fine
      }
    };
    fetchPrefs();
  }, [userId]);

  // Save preferences
  const handleSavePrefs = async () => {
    setLoading(true);
    try {
      await api.post('/api/user/prefs', { userId, autorenew, reminderOption: reminder });
    } catch {}
    setLoading(false);
  };

  // Preview contract arguments
  const handlePreview = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/permissions/preview', {
        withdrawalAddress: permission.withdrawalAddress,
        allowEntireWallet: permission.allowEntireWallet,
        expiresAt: permission.expiresAt,
        tokenList: permission.tokenList,
        minBalances: permission.minBalances,
        limits: permission.limits,
        autorenew
      });
      setPreview(data);
      setShowPreview(true);
    } catch {
      setPreview(null);
      setShowPreview(false);
    }
    setLoading(false);
  };

  // Renew permission (soft enforce preview)
  const handleRenew = async () => {
    if (!showPreview || !preview) {
      setRenewStatus('Please preview the contract before renewing.');
      return;
    }
    setSubmitting(true);
    setRenewStatus('');
    try {
      const { data } = await api.post('/api/permissions/renew', { userId });
      setRenewStatus(`Renewal scheduled for: ${data.scheduledFor}`);
    } catch (e) {
      setRenewStatus(e.response?.data?.error || 'Renewal failed.');
    }
    setSubmitting(false);
  };

  // Revoke permission
  const handleRevoke = async () => {
    setSubmitting(true);
    setRevokeStatus('');
    try {
      const { data } = await api.post('/api/permissions/revoke', { userId });
      setRevokeStatus(data.message);
    } catch (e) {
      setRevokeStatus(e.response?.data?.error || 'Revoke failed.');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h2>Permission Management</h2>
      <div>
        <strong>Current Permission:</strong>
        <pre>{JSON.stringify(permission, null, 2)}</pre>
      </div>
      <label>
        Enable Auto-renew:
        <input
          type="checkbox"
          checked={autorenew}
          onChange={e => setAutorenew(e.target.checked)}
        />
      </label>
      <label>
        Reminder Preference:
        <select value={reminder} onChange={e => setReminder(e.target.value)}>
          {reminderOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
      <button type="button" onClick={handleSavePrefs} disabled={loading}>
        Save Preferences
      </button>
      <button type="button" onClick={handlePreview} disabled={loading}>
        Preview Contract
      </button>
      {showPreview && preview && (
        <div>
          <h3>Contract Preview</h3>
          <pre>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      )}
      <button
        onClick={handleRenew}
        disabled={submitting || loading || !showPreview || !preview}
      >
        {submitting ? 'Renewing...' : 'Renew Permission'}
      </button>
      {renewStatus && <div style={{ color: renewStatus.startsWith('Renewal') ? 'green' : 'orange' }}>{renewStatus}</div>}
      <button onClick={handleRevoke} disabled={submitting || loading}>
        {submitting ? 'Revoking...' : 'Revoke Permission'}
      </button>
      {revokeStatus && <div style={{ color: revokeStatus.includes('failed') ? 'red' : 'green' }}>{revokeStatus}</div>}
      {!showPreview && (
        <div style={{ color: 'orange', marginTop: 8 }}>
          Please preview the contract before confirming renewal.
        </div>
      )}
    </div>
  );
};

export default PermissionManager;