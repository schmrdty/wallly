import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface NotificationsProps {
  userId: string;
}

export const Notifications: React.FC<NotificationsProps> = ({ userId }) => {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    api.get(`/api/audit/${userId}`).then(res => setEvents(res.data));
  }, [userId]);

  const renderEvent = (e) => {
    switch (e.event) {
      case 'PermissionGranted':
        return (
          <>
            <strong>Permission Granted</strong>
            <div>Tokens: {e.tokens?.join(', ')}</div>
            <div>Expires: {e.expiresAt ? new Date(e.expiresAt).toLocaleString() : 'N/A'}</div>
          </>
        );
      case 'PermissionRevoked':
        return (
          <>
            <strong>Permission Revoked</strong>
            <div>Granted: {e.oracleTimestamp ? new Date(e.oracleTimestamp).toLocaleString() : 'unknown'}</div>
            <div>Revoked: {e.revokedAt ? new Date(e.revokedAt).toLocaleString() : 'unknown'}</div>
          </>
        );
      case 'MiniAppSessionStarted':
        return (
          <>
            <strong>Mini-App Session Started</strong>
            <div>Delegate: {e.delegate}</div>
            <div>Expires: {e.expiresAt ? new Date(e.expiresAt).toLocaleString() : 'N/A'}</div>
          </>
        );
      case 'MiniAppSessionRevoked':
        return (
          <>
            <strong>Mini-App Session Revoked</strong>
            <div>Delegate: {e.delegate}</div>
            <div>Revoked: {e.revokedAt ? new Date(e.revokedAt).toLocaleString() : 'unknown'}</div>
          </>
        );
      case 'AutomatedTransferExecuted':
        return (
          <>
            <strong>Automated Transfer Executed</strong>
            <div>Tokens: {e.tokens?.join(', ')}</div>
            <div>Tx: <a href={`https://basescan.org/tx/${e.transactionHash}`} target="_blank" rel="noopener noreferrer">{e.transactionHash}</a></div>
          </>
        );
      case 'ManualTransferExecuted':
        return (
          <>
            <strong>Manual Transfer Executed</strong>
            <div>Tokens: {e.tokens?.join(', ')}</div>
            <div>Tx: <a href={`https://basescan.org/tx/${e.transactionHash}`} target="_blank" rel="noopener noreferrer">{e.transactionHash}</a></div>
          </>
        );
      case 'TokenAdded':
        return (
          <>
            <strong>Token Added</strong>
            <div>Token: {e.tokenSymbol}</div>
          </>
        );
      case 'TokenRemoved':
        return (
          <>
            <strong>Token Removed</strong>
            <div>Token: {e.tokenSymbol}</div>
          </>
        );
      case 'PermissionExpiringSoon':
        return (
          <>
            <strong>Permission Expiring Soon</strong>
            <div>Expires: {e.expiresAt ? new Date(e.expiresAt).toLocaleString() : 'N/A'}</div>
          </>
        );
      case 'Error':
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

  return (
    <div>
      {events.map(e => (
        <div key={e.transactionHash || e.createdAt || Math.random()}>
          {renderEvent(e)}
        </div>
      ))}
    </div>
  );
};