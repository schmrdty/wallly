import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.ts';
import { NotificationEventRenderer } from './NotificationEventRenderer.tsx';

interface NotificationsProps {
  userId: string;
}

export interface NotificationEvent {
  event: string;
  tokens?: string[];
  expiresAt?: string;
  oracleTimestamp?: string;
  revokedAt?: string;
  delegate?: string;
  transactionHash?: string;
  tokenSymbol?: string;
  message?: string;
  createdAt?: string;
  // ...other fields as needed
}

function Notifications({ userId }: NotificationsProps) {
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  useEffect(() => {
    api.get(`/api/audit/${userId}`).then(res => setEvents(res.data));
  }, [userId]);

  return (
    <div>
      {events.map(e => (
        <div key={e.transactionHash || e.createdAt || Math.random()}>
          <NotificationEventRenderer event={e} />
        </div>
      ))}
    </div>
  );
}

export default Notifications;