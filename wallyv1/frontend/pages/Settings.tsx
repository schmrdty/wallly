import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/hooks/useAuth';
import { api } from '../src/utils/api';
import RenewButton from '../src/components/RenewButton';
import { logger } from '../src/utils/logger';

const Settings = () => {
  const { user } = useAuth();
  const [purgeMode, setPurgeMode] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [reminderOption, setReminderOption] = useState('none');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');

  useEffect(() => {
    if (user?.id) {
      api.get(`/api/user/settings/${user.id}`).then(res => {
        setPurgeMode(res.data.purgeMode || false);
        setAutoRenew(res.data.autoRenew || false);
        setReminderOption(res.data.reminderOption || 'none');
        setEmail(res.data.email || '');
        setTelegram(res.data.telegram || '');
      }).catch(err => {
        setStatus('Failed to load settings.');
        logger.error('Failed to load settings', { userId: user.id, error: err });
      });
    }
  }, [user?.id]);

  const handlePurgeToggle = async (checked: boolean) => {
    if (!user?.id) return;
    if (checked && autoRenew) {
      setStatus('Disable Auto-Renew before enabling Purge Mode.');
      return;
    }
    try {
      await api.post('/api/user/settings', { userId: user.id, purgeMode: checked });
      setPurgeMode(checked);
      setStatus('Purge Mode updated!');
    } catch (err) {
      setStatus('Failed to update Purge Mode.');
      logger.error('Failed to update Purge Mode', { userId: user.id, error: err });
    }
  };

  const handleAutoRenewToggle = async (checked: boolean) => {
    if (!user?.id) return;
    if (checked && purgeMode) {
      setStatus('Disable Purge Mode before enabling Auto-Renew.');
      return;
    }
    try {
      await api.post('/api/user/settings', { userId: user.id, autoRenew: checked });
      setAutoRenew(checked);
      setStatus('Auto-Renew updated!');
    } catch (err) {
      setStatus('Failed to update Auto-Renew.');
      logger.error('Failed to update Auto-Renew', { userId: user.id, error: err });
    }
  };

  const handleReminderChange = async (value: string) => {
    setReminderOption(value);
    try {
      await api.post('/api/user/settings', { userId: user.id, reminderOption: value });
      setStatus('Reminder option updated!');
    } catch (err) {
      setStatus('Failed to update reminder option.');
      logger.error('Failed to update reminder option', { userId: user.id, error: err });
    }
  };

  const handleEmailChange = async (value: string) => {
    setEmail(value);
    try {
      await api.post('/api/user/settings', { userId: user.id, email: value });
      setStatus('Email updated!');
    } catch (err) {
      setStatus('Failed to update email.');
      logger.error('Failed to update email', { userId: user.id, error: err });
    }
  };

  const handleTelegramChange = async (value: string) => {
    setTelegram(value);
    try {
      await api.post('/api/user/settings', { userId: user.id, telegram: value });
      setStatus('Telegram handle updated!');
    } catch (err) {
      setStatus('Failed to update telegram handle.');
      logger.error('Failed to update telegram handle', { userId: user.id, error: err });
    }
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <label>
        <input
          type="checkbox"
          checked={purgeMode}
          onChange={e => handlePurgeToggle(e.target.checked)}
        />
        Enable Purge Mode (delete audit logs immediately on revoke)
      </label>
      <div style={{ fontSize: '0.9em', color: '#666', marginTop: 8 }}>
        <strong>Purge Mode:</strong> When enabled, all your audit logs and session data will be deleted immediately when you revoke your session. When disabled, your audit logs are retained for 30 days after revoke before being deleted.
      </div>
      <label>
        <input
          type="checkbox"
          checked={autoRenew}
          onChange={e => handleAutoRenewToggle(e.target.checked)}
        />
        Enable Auto-Renew
      </label>
      <RenewButton userId={user?.id} disabled={purgeMode} />
      {purgeMode && (
        <div style={{ color: 'red' }}>
          Renew is disabled when Purge Mode is enabled.
        </div>
      )}
      {status && <div>{status}</div>}
      <div>
        <label>
          Reminder Option:
          <select value={reminderOption} onChange={e => handleReminderChange(e.target.value)}>
            <option value="none">None</option>
            <option value="7days">Remind me when I have 7 days remaining</option>
            <option value="1day">Remind me when I have 1 day remaining</option>
            <option value="both">Both</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Email (optional):{' '}
          <input
            type="email"
            value={email}
            onChange={e => handleEmailChange(e.target.value)}
            placeholder="your@email.com"
          />
        </label>
      </div>
      <div>
        <label>
          Telegram Handle (optional):{' '}
          <input
            type="text"
            value={telegram}
            onChange={e => handleTelegramChange(e.target.value)}
            placeholder="@yourhandle"
          />
        </label>
      </div>
      <div style={{ fontSize: '0.9em', color: '#666', marginTop: 8 }}>
        <strong>Note:</strong> Notifications are optional and off by default. You can use Wally without entering contact details.
      </div>
    </div>
  );
};

export default Settings;