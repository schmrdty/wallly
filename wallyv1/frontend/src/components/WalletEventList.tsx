import React from 'react';
import { formatDate } from '../utils/formatters.ts';

type WalletEvent = {
  type: string;
  [key: string]: any;
};

const WalletEventList: React.FC<{ events: WalletEvent[] }> = ({ events }) => (
  <ul>
    {events.map((event, idx) => (
      <li key={idx}>
        <strong>{event.type}</strong>
        {/* ...render event details as in main file... */}
      </li>
    ))}
  </ul>
);

export default WalletEventList;
