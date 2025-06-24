import { useState, useEffect } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { api } from '@/utils/api';
import { logger } from '@/utils/logger';

export function useSettingsForm() {
  const { user } = useSessionContext();
  const [purgeMode, setPurgeMode] = useState<boolean>(false);
  const [autoRenew, setAutoRenew] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('idle');
  const [reminderOption, setReminderOption] = useState<string>('none');
  const [email, setEmail] = useState<string>('');
  const [telegram, setTelegram] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings with proper error handling
  useEffect(() => {
    if (!user?.id) return;

    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/api/user/settings/${user.id}`);

        if (response.data) {
          setPurgeMode(response.data.purgeMode || false);
          setAutoRenew(response.data.autoRenew || false);
          setReminderOption(response.data.reminderOption || 'none');
          setEmail(response.data.email || '');
          setTelegram(response.data.telegram || '');
        }
      } catch (error: any) {
        // Log error but don't break the UI
        logger.error('Failed to load settings', { userId: user.id, error });
        setError('Failed to load settings. Using defaults.');

        // Set reasonable defaults
        setPurgeMode(false);
        setAutoRenew(false);
        setReminderOption('none');
        setEmail('');
        setTelegram('');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  const handlePurgeToggle = async (enabled: boolean) => {
    if (!user?.id) return;

    try {
      setPurgeMode(enabled); // Optimistic update
      await api.post('/api/user/settings', {
        userId: user.id,
        purgeMode: enabled
      });
    } catch (error: any) {
      // Revert on error
      setPurgeMode(!enabled);
      logger.error('Failed to update Purge Mode', { userId: user.id, error });
      setError('Failed to update Purge Mode. Please try again.');
    }
  };

  const handleAutoRenewToggle = async (enabled: boolean) => {
    if (!user?.id) return;

    try {
      setAutoRenew(enabled); // Optimistic update
      await api.post('/api/user/settings', {
        userId: user.id,
        autoRenew: enabled
      });
    } catch (error: any) {
      // Revert on error
      setAutoRenew(!enabled);
      logger.error('Failed to update Auto-Renew', { userId: user.id, error });
      setError('Failed to update Auto-Renew. Please try again.');
    }
  };

  const handleReminderChange = async (option: string) => {
    if (!user?.id) return;

    try {
      setReminderOption(option); // Optimistic update
      await api.post('/api/user/settings', {
        userId: user.id,
        reminderOption: option
      });
    } catch (error: any) {
      logger.error('Failed to update reminder option', { userId: user.id, error });
      setError('Failed to update reminder option. Please try again.');
    }
  };

  const handleEmailChange = async (newEmail: string) => {
    if (!user?.id) return;

    try {
      setEmail(newEmail); // Optimistic update
      await api.post('/api/user/settings', {
        userId: user.id,
        email: newEmail
      });
    } catch (error: any) {
      logger.error('Failed to update email', { userId: user.id, error });
      setError('Failed to update email. Please try again.');
    }
  };

  const handleTelegramChange = async (newTelegram: string) => {
    if (!user?.id) return;

    try {
      setTelegram(newTelegram); // Optimistic update
      await api.post('/api/user/settings', {
        userId: user.id,
        telegram: newTelegram
      });
    } catch (error: any) {
      logger.error('Failed to update telegram', { userId: user.id, error });
      setError('Failed to update telegram. Please try again.');
    }
  };

  return {
    purgeMode,
    autoRenew,
    status,
    reminderOption,
    email,
    telegram,
    loading,
    error,
    handlePurgeToggle,
    handleAutoRenewToggle,
    handleReminderChange,
    handleEmailChange,
    handleTelegramChange,
    user
  };
}
