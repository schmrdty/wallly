import React from 'react';
import { api } from '../utils/api.ts';
import { logger } from '../utils/logger.ts';

const RenewButton = ({ userId, disabled }: { userId: string; disabled?: boolean }) => {
  const handleRenew = async () => {
    try {
      await api.post('/api/permissions/renew', { userId });
      alert('Permission renewed successfully!');
    } catch (error) {
      logger.error('Error renewing permission', error);
      alert('Failed to renew permission.');
    }
  };

  return (
    <button onClick={handleRenew} disabled={disabled}>
      Renew Permission
    </button>
  );
};

export default RenewButton;