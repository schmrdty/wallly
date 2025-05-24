import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

export function useSettingsForm() {
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
    if (!user) return;
    try {
      await api.post('/api/user/settings', { userId: user.id, reminderOption: value });
      setStatus('Reminder option updated!');
    } catch (err) {
      setStatus('Failed to update reminder option.');
      logger.error('Failed to update reminder option', { userId: user?.id, error: err });
    }
  };

  const handleEmailChange = async (value: string) => {
    setEmail(value);
    if (!user) return;
    if (value && !/\S+@\S+\.\S+/.test(value)) {
      setStatus('Invalid email format.');
      return;
    }
    if (value && value.length > 100) {
      setStatus('Email is too long.');
      return;
    }
    if (value && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
      setStatus('Invalid email format.');
      return;
    }
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
    if (!user) return;
    if (value && !value.startsWith('@')) {
      setStatus('Telegram handle must start with "@"');
      return;
    }
    try {
      await api.post('/api/user/settings', { userId: user.id, telegram: value });
      setStatus('Telegram handle updated!');
    } catch (err) {
      setStatus('Failed to update telegram handle.');
      logger.error('Failed to update telegram handle', { userId: user.id, error: err });
    }
  };

  return {
    purgeMode,
    autoRenew,
    status,
    reminderOption,
    email,
    telegram,
    handlePurgeToggle,
    handleAutoRenewToggle,
    handleReminderChange,
    handleEmailChange,
    handleTelegramChange,
    user
  };
}
