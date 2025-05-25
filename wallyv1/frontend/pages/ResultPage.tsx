import React from 'react';
import { logger } from '../src/utils/logger';
import { useAuth } from '../src/hooks/useAuth';
import '../styles/ResultPage.module.css';
import { useEffect as reactUseEffect } from 'react';
import { tryDetectMiniAppClient } from '../src/utils/miniAppDetection';
import { MiniAppBanner } from '../src/components/MiniAppBanner';

function isMiniAppRequest(): { isMiniApp: boolean; error?: any; } {
  return tryDetectMiniAppClient() || window.location.pathname.startsWith('/mini');
}
const images = {
  success: '/watchingSuccess.png',
  fail: '/watchingFailed.png',
  error: '/UIError.png',
};

function getMessage(status: string, origin?: string) {
  if (status === 'success') {
    if (origin === 'GrantPermission') return 'Transaction successful! Wally is now watching your wallet.';
    if (origin === 'RevokePermission') return 'Revoke successful! Wally is not watching your wallet.';
    if (origin === 'PurgePermission') return 'Purge successful! Wally is purging your wallet data.';
    return 'Transaction successful! Wally is now watching your wallet.';
    
  }
  if (status === 'fail') {
    if (origin === 'RevokePermission') return 'Revoke failed! Wally is still watching your wallet.';
    if (origin === 'PurgePermission') return 'Purge failed! Wally is still watching your wallet or we still have your data.';
    if (origin === 'GrantPermission') return 'Grant failed! Wally is not watching your wallet.';
    return 'Transaction failed! Wally is still watching your wallet.';
  }
  if (status === 'error') {
    if (typeof window !== 'undefined' && window.location.href.includes('localhost')) {
      return 'An unknown error occurred! Wally is still watching your wallet.';
    }
    return 'An error occurred. Please try again.';
  }
  return 'Unknown result.';
}

function getImage(status: string, origin?: string) {
  if (status === 'success') return images.success;
  if (status === 'fail') return images.fail;
  if (status === 'error') return images.error;
  return images.error;
}

const ResultPage = ({ status, origin }: { status: string, origin?: string }) => {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    logger.info('User logged in', { userId });
    logger.warn('Action failed, please try again', { userId, status });
    if (status === 'error') {
      logger.error('An unknown error occurred', { error: 'timeout' });
    }
    logger.debug('Debugging details', { foo: 'bar' });
  }, [userId]);

  const isMiniApp = isMiniAppClient();

  return (
    <div>
      {isMiniApp && <MiniAppBanner />}
      <img src={getImage(status, origin)} alt={status} />
      <h2>{getMessage(status, origin)}</h2>
    </div>
  );
};

function useEffect(effect: () => void, deps: (string | undefined)[]) {
  reactUseEffect(effect, deps);
}

function isMiniAppClient() {
  try {
    const result = isMiniAppRequest();
    return result.isMiniApp;
  } catch (error) {
    logger.error('Failed to detect mini app client', { error });
    return false;
  }
}

export default ResultPage;

