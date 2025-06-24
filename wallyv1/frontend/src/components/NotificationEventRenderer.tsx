import React from 'react';
import type { NotificationEvent } from './Notifications.tsx';

const eventTypes = {
  PermissionGranted: 'PermissionGranted',
  PermissionRevoked: 'PermissionRevoked',
  MiniAppSessionStarted: 'MiniAppSessionStarted',
  MiniAppSessionRevoked: 'MiniAppSessionRevoked',
  AutomatedTransferExecuted: 'AutomatedTransferExecuted',
  ManualTransferExecuted: 'ManualTransferExecuted',
  TokenAdded: 'TokenAdded',
  TokenRemoved: 'TokenRemoved',
  PermissionExpiringSoon: 'PermissionExpiringSoon',
  Error: 'Error'
} as const;

export const NotificationEventRenderer: React.FC<{ event: NotificationEvent }> = ({ event: e }) => {
  switch (e.event) {
    case eventTypes.PermissionGranted:
      return (
        <>
          <strong>Permission Granted</strong>
          <div>Tokens: {e.tokens?.join(', ')}</div>
          <div>Expires: {e.expiresAt ? new Date(e.expiresAt).toLocaleString() : 'N/A'}</div>
        </>
      );
    case eventTypes.PermissionRevoked:
      return (
        <>
          <strong>Permission Revoked</strong>
          <div>Granted: {e.oracleTimestamp ? new Date(e.oracleTimestamp).toLocaleString() : 'unknown'}</div>
          <div>Revoked: {e.revokedAt ? new Date(e.revokedAt).toLocaleString() : 'unknown'}</div>
        </>
      );
    case eventTypes.MiniAppSessionStarted:
      return (
        <>
          <strong>Mini-App Session Started</strong>
          <div>Delegate: {e.delegate}</div>
          <div>Expires: {e.expiresAt ? new Date(e.expiresAt).toLocaleString() : 'N/A'}</div>
        </>
      );
    case eventTypes.MiniAppSessionRevoked:
      return (
        <>
          <strong>Mini-App Session Revoked</strong>
          <div>Delegate: {e.delegate}</div>
          <div>Revoked: {e.revokedAt ? new Date(e.revokedAt).toLocaleString() : 'unknown'}</div>
        </>
      );
    case eventTypes.AutomatedTransferExecuted:
      return (
        <>
          <strong>Automated Transfer Executed</strong>
          <div>Tokens: {e.tokens?.join(', ')}</div>
          <div>Tx: <a href={`https://basescan.org/tx/${e.transactionHash}`} target="_blank" rel="noopener noreferrer">{e.transactionHash}</a></div>
        </>
      );
    case eventTypes.ManualTransferExecuted:
      return (
        <>
          <strong>Manual Transfer Executed</strong>
          <div>Tokens: {e.tokens?.join(', ')}</div>
          <div>Tx: <a href={`https://basescan.org/tx/${e.transactionHash}`} target="_blank" rel="noopener noreferrer">{e.transactionHash}</a></div>
        </>
      );
    case eventTypes.TokenAdded:
      return (
        <>
          <strong>Token Added</strong>
          <div>Token: {e.tokenSymbol}</div>
        </>
      );
    case eventTypes.TokenRemoved:
      return (
        <>
          <strong>Token Removed</strong>
          <div>Token: {e.tokenSymbol}</div>
        </>
      );
    case eventTypes.PermissionExpiringSoon:
      return (
        <>
          <strong>Permission Expiring Soon</strong>
          <div>Expires: {e.expiresAt ? new Date(e.expiresAt).toLocaleString() : 'N/A'}</div>
        </>
      );
    case eventTypes.Error:
      return (
        <>
          <strong>Error</strong>
          <div>{e.message}</div>
        </>
      );
    default:
      return (
        <>
          <strong>{e.event}</strong>
          <div>Details: {JSON.stringify(e)}</div>
        </>
      );
  }
};
