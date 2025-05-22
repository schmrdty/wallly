import React from 'react';
import { logger } from '../src/utils/logger';
import { useAuth } from '../src/hooks/useAuth';

const images = {
  success: '/watchingSuccess.png',
  fail: '/watchingFailed.png',
  error: '/UIError.png',
};

function getMessage(status: string, origin?: string) {
  if (status === 'success') {
    if (origin === 'GrantPermission') return 'Transaction successful! Wally is now watching your wallet.';
    if (origin === 'RevokePermission') return 'Transaction successful! Wally is not watching your wallet.';
    if (origin === 'PurgePermission') return 'Transaction successful! Wally is purging your wallet data.';
    return 'Transaction successful!';
  }
  if (status === 'fail') {
    if (origin === 'RevokePermission') return 'Revoke failed! Wally is still watching your wallet.';
    return 'Transaction failed! Wally is still watching your wallet.';
    if (origin === 'PurgePermission') return 'Purge failed! Wally is still watching your wallet.';
    return 'Purge failed! Wally is still watching your wallet or we still have your data.';
    if (origin === 'GrantPermission') return 'Grant failed! Wally is not watching your wallet.';
    return 'Transaction failed! Wally is not watching your wallet.';
  }
  if (status === 'error') {
    if (typeof window !== 'undefined' && window.location.href.includes('localhost')) {
      return 'An unknown error occurred! Wally is still watching your wallet.';
    }
    return 'An error occurred. Please try again.';
  }
  return 'Unknown result.';
}

const ResultPage = ({ status, origin }: { status: string, origin?: string }) => {
  const { user } = useAuth();
  const userId = user?.id; // Use this everywhere you need the user ID

  return (
    <div>
      <img src={images[status] || images.error} alt={status} />
      <h2>{getMessage(status, origin)}</h2>
    </div>
  );
};

logger.info('User logged in', { userId: 123 });
logger.warn('API rate limit approaching');
logger.error('Failed to fetch data', { error: 'timeout' });
logger.debug('Debugging details', { foo: 'bar' });

export default ResultPage;