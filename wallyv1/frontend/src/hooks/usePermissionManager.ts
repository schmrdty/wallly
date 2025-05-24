import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import type { Permission } from '../types/Permission';

interface UsePermissionManagerProps {
  userId: string;
  permission: Permission | null;
  onPermissionChange: () => void;
}

export function usePermissionManager({
  userId,
  permission,
  onPermissionChange
}: UsePermissionManagerProps) {
  const [autorenew, setAutorenew] = useState(false);
  const [reminder, setReminder] = useState('both');
  const [preview, setPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [renewStatus, setRenewStatus] = useState('');
  const [revokeStatus, setRevokeStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSavePrefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/user/prefs', { userId, autorenew, reminderOption: reminder });
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to save preferences.');
    }
    setLoading(false);
  }, [userId, autorenew, reminder]);

  const handlePreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/permissions/preview', {
        withdrawalAddress: permission?.withdrawalAddress,
        allowEntireWallet: permission?.allowEntireWallet,
        expiresAt: permission?.expiresAt,
        tokenList: permission?.tokenList,
        minBalances: permission?.minBalances,
        limits: permission?.limits,
        autorenew
      });
      setPreview(data);
      setShowPreview(true);
    } catch (e: any) {
      setPreview(null);
      setShowPreview(false);
      setError(e?.response?.data?.error || 'Failed to preview contract.');
    }
    setLoading(false);
  }, [permission, autorenew]);

  const handleRenew = useCallback(async () => {
    if (!showPreview || !preview) {
      setRenewStatus('Please preview the contract before renewing.');
      return;
    }
    setSubmitting(true);
    setRenewStatus('');
    setError(null);
    try {
      const { data } = await api.post('/api/permissions/renew', { userId });
      setRenewStatus(`Renewal scheduled for: ${data.scheduledFor}`);
      onPermissionChange();
    } catch (e: any) {
      setRenewStatus(e?.response?.data?.error || 'Renewal failed.');
      setError(e?.response?.data?.error || 'Renewal failed.');
    }
    setSubmitting(false);
  }, [showPreview, preview, userId, onPermissionChange]);

  const handleRevoke = useCallback(async () => {
    setSubmitting(true);
    setRevokeStatus('');
    setError(null);
    try {
      const { data } = await api.post('/api/permissions/revoke', { userId });
      setRevokeStatus(data.message);
      onPermissionChange();
    } catch (e: any) {
      setRevokeStatus(e?.response?.data?.error || 'Revoke failed.');
      setError(e?.response?.data?.error || 'Revoke failed.');
    }
    setSubmitting(false);
  }, [userId, onPermissionChange]);

  return {
    autorenew,
    setAutorenew,
    reminder,
    setReminder,
    loading,
    submitting,
    error,
    preview,
    showPreview,
    renewStatus,
    revokeStatus,
    handleSavePrefs,
    handlePreview,
    handleRenew,
    handleRevoke,
  };
}
