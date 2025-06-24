import React, { useState, useEffect } from 'react';
import { PermissionPreferences } from './PermissionPreferences';
import { PermissionPreview } from './PermissionPreview';
import { useContractIntegration } from '../hooks/useContractIntegration';
import { useTransactionManager } from '../hooks/useTransactionManager';
import { useAccount } from 'wagmi';
import type { Permission } from '../types/Permission';
import type { Address } from 'viem';

interface PermissionManagerProps {
  userId?: string;
  permission?: Permission | null;
  onPermissionChange?: () => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  userId: propUserId,
  permission: propPermission,
  onPermissionChange
}) => {
  const { address } = useAccount();
  const userId = propUserId || address || '';
  const {
    userData,
    loading: contractLoading,
    error: contractError,
    grantPermission,
    updatePermission,
    revokePermission,
    estimateGas,
    fetchUserData
  } = useContractIntegration();

  const {
    addTransaction,
    executeTransaction,
    loading: txLoading,
    error: txError,
    pendingTransactions,
    processingTransactions
  } = useTransactionManager();

  // Local state for form management
  const [autorenew, setAutorenew] = useState(false);
  const [reminder, setReminder] = useState('both');
  const [preview, setPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [renewStatus, setRenewStatus] = useState('');
  const [revokeStatus, setRevokeStatus] = useState('');

  // Use contract data or fallback to prop
  const permission = userData?.permission || propPermission;

  // Combined loading and error states
  const loading = contractLoading || txLoading;
  const error = contractError || txError;
  const submitting = processingTransactions.length > 0;

  // Load user preferences (simplified version)
  useEffect(() => {
    if (permission) {
      // Set defaults based on current permission
      setAutorenew(false); // Could be loaded from user preferences
      setReminder('both');
    }
  }, [permission]);

  // Handle save preferences
  const handleSavePrefs = async () => {
    try {
      // Save preferences logic would go here
      // For now, just update local state
      console.log('Saving preferences:', { autorenew, reminder });
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  };

  // Handle preview generation
  const handlePreview = async () => {
    if (!address || !permission) return;

    try {
      // Generate preview based on current permission
      const previewData = {
        withdrawalAddress: permission.withdrawalAddress,
        allowEntireWallet: permission.allowEntireWallet,
        tokenList: permission.tokenList,
        minBalances: permission.minBalances.map(b => BigInt(b).toString()), // Convert to string for storage
        limits: permission.limits.map(l => BigInt(l).toString()), // Convert to string for storage  
        expiresAt: (BigInt(Number(permission.expiresAt) + (30 * 24 * 60 * 60))).toString(), // Convert to string for storage
      };

      const gasEstimate = await estimateGas('permission_update', previewData);

      // Handle gasEstimate response - it returns { gasEstimate: bigint }
      let gasValue: bigint;
      if (typeof gasEstimate === 'object' && gasEstimate !== null && 'gasEstimate' in gasEstimate) {
        gasValue = gasEstimate.gasEstimate as bigint;
      } else if (typeof gasEstimate === 'bigint') {
        gasValue = gasEstimate;
      } else {
        console.warn('Unexpected gas estimate format:', gasEstimate);
        gasValue = BigInt(21000); // Default gas estimate
      }

      setPreview({
        ...previewData,
        gasEstimate: gasValue.toString(), // Convert to string for storage
        estimatedCost: (gasValue * BigInt(20000000000)).toString() // Convert to string for storage
      });
      setShowPreview(true);
    } catch (err: any) {
      console.error('Preview generation failed:', err);
      setRenewStatus(`Preview failed: ${err.message}`);
    }
  };

  // Handle permission renewal
  const handleRenew = async () => {
    if (!address || !preview) return;

    try {
      setRenewStatus('Preparing renewal...');

      // Add transaction to queue
      const txId = addTransaction('permission', 'update', preview, 'medium');

      setRenewStatus('Executing renewal...');

      // Execute the transaction
      const result = await executeTransaction(txId);

      setRenewStatus('Renewal completed successfully!');
      setShowPreview(false);
      setPreview(null);

      // Refresh data
      await fetchUserData();
      onPermissionChange?.();

    } catch (err: any) {
      setRenewStatus(`Renewal failed: ${err.message}`);
    }
  };

  // Handle permission revocation
  const handleRevoke = async () => {
    if (!address) return;

    try {
      setRevokeStatus('Preparing revocation...');

      // Add transaction to queue
      const txId = addTransaction('permission', 'revoke', {}, 'high');

      setRevokeStatus('Executing revocation...');

      // Execute the transaction
      const result = await executeTransaction(txId);

      setRevokeStatus('Permission revoked successfully!');

      // Refresh data
      await fetchUserData();
      onPermissionChange?.();

    } catch (err: any) {
      setRevokeStatus(`Revocation failed: ${err.message}`);
    }
  };

  return (
    <div className="permission-manager">
      <h2 className="text-xl font-bold mb-4">Permission Management</h2>

      {/* Current Permission Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current Permission</h3>
        {permission ? (
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Status:</strong> {permission.isActive ? 'Active' : 'Inactive'}
              </div>
              <div>
                <strong>Withdrawal Address:</strong>{' '}
                <span className="font-mono text-xs">
                  {permission.withdrawalAddress}
                </span>
              </div>
              <div>
                <strong>Entire Wallet:</strong> {permission.allowEntireWallet ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Expires:</strong>{' '}
                {new Date(Number(permission.expiresAt) * 1000).toLocaleDateString()}
              </div>
              <div className="col-span-2">
                <strong>Tokens:</strong> {permission.tokenList.length} token(s)
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 italic">No permission found</div>
        )}
      </div>

      {/* Transaction Status */}
      {(pendingTransactions.length > 0 || processingTransactions.length > 0) && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">Active Transactions</h4>
          {pendingTransactions.map(tx => (
            <div key={tx.id} className="text-sm text-blue-600">
              {tx.operation} - Pending
            </div>
          ))}
          {processingTransactions.map(tx => (
            <div key={tx.id} className="text-sm text-blue-600">
              {tx.operation} - Processing...
            </div>
          ))}
        </div>
      )}

      {/* Permission Preferences */}
      <PermissionPreferences
        autorenew={autorenew}
        setAutorenew={setAutorenew}
        reminder={reminder}
        setReminder={setReminder}
        loading={loading}
        onSave={handleSavePrefs}
      />

      {/* Permission Preview */}
      <PermissionPreview
        onPreview={handlePreview}
        loading={loading}
        showPreview={showPreview}
        preview={preview}
      />

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleRenew}
          disabled={submitting || loading || !showPreview || !preview}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Renewing...' : 'Renew Permission'}
        </button>

        <button
          onClick={handleRevoke}
          disabled={submitting || loading || !permission?.isActive}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Revoking...' : 'Revoke Permission'}
        </button>
      </div>

      {/* Status Messages */}
      {renewStatus && (
        <div className={`mt-4 p-3 rounded-lg ${renewStatus.includes('successfully')
          ? 'bg-green-50 text-green-800'
          : renewStatus.includes('failed')
            ? 'bg-red-50 text-red-800'
            : 'bg-yellow-50 text-yellow-800'
          }`}>
          {renewStatus}
        </div>
      )}

      {revokeStatus && (
        <div className={`mt-4 p-3 rounded-lg ${revokeStatus.includes('successfully')
          ? 'bg-green-50 text-green-800'
          : revokeStatus.includes('failed')
            ? 'bg-red-50 text-red-800'
            : 'bg-yellow-50 text-yellow-800'
          }`}>
          {revokeStatus}
        </div>
      )}

      {!showPreview && permission?.isActive && (
        <div className="mt-4 p-3 bg-orange-50 text-orange-800 rounded-lg">
          Please preview the contract changes before confirming renewal.
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default PermissionManager;