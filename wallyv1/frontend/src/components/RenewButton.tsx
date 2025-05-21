import React from 'react';
import { api } from '../utils/api';
import { logger } from '../utils/logger';
const RenewButton = ({ userId }: { userId: string }) => {
  const handleRenew = async () => {
    await api.post('/api/permissions/renew', { userId });
    // Optionally show a success message
    alert('Permission renewed successfully!');
    }
    .catch((error) => {
      // Handle error
      logger.error('Error renewing permission', error);
      alert('Failed to renew permission.');
    });
  };
  return <button onClick={handleRenew}>Renew Permission</button>;
};

export default RenewButton;