import React from 'react';
import { PermissionPreferences } from './PermissionPreferences';
import { PermissionPreview } from './PermissionPreview';
import { usePermissionManager } from '../hooks/usePermissionManager';
import type { Permission } from '../types/Permission';

interface PermissionManagerProps {
  userId: string;
  permission: Permission | null;
  onPermissionChange: () => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  userId,
  permission,
  onPermissionChange
}) => {
  const {
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
  } = usePermissionManager({ userId, permission, onPermissionChange });

  return (
    <div>
      <h2>Permission Management</h2>
      <div>
        <strong>Current Permission:</strong>
        <pre>{JSON.stringify(permission, null, 2)}</pre>
      </div>
      <PermissionPreferences
        autorenew={autorenew}
        setAutorenew={setAutorenew}
        reminder={reminder}
        setReminder={setReminder}
        loading={loading}
        onSave={handleSavePrefs}
      />
      <PermissionPreview
        onPreview={handlePreview}
        loading={loading}
        showPreview={showPreview}
        preview={preview}
      />
      <button
        onClick={handleRenew}
        disabled={submitting || loading || !showPreview || !preview}
      >
        {submitting ? 'Renewing...' : 'Renew Permission'}
      </button>
      {renewStatus && (
        <div style={{ color: renewStatus.startsWith('Renewal') ? 'green' : 'orange' }}>
          {renewStatus}
        </div>
      )}
      <button onClick={handleRevoke} disabled={submitting || loading}>
        {submitting ? 'Revoking...' : 'Revoke Permission'}
      </button>
      {revokeStatus && (
        <div style={{ color: revokeStatus.includes('failed') ? 'red' : 'green' }}>
          {revokeStatus}
        </div>
      )}
      {!showPreview && (
        <div style={{ color: 'orange', marginTop: 8 }}>
          Please preview the contract before confirming renewal.
        </div>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default PermissionManager;