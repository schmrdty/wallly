"use client";
import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection';
import { MiniAppBanner } from '@/components/MiniAppBanner';
import Link from 'next/link';

const images = {
  // These images must exist in the /public directory for Next.js to serve them correctly
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

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status') || 'error';
  const origin = searchParams.get('origin') || undefined;
  const { user } = useAuth();
  const userId = user?.id;
  const isMiniApp = tryDetectMiniAppClient();

  React.useEffect(() => {
    logger.info('User logged in', { userId });
    logger.warn('Action result', { userId, status, origin });
    if (status === 'error') {
      logger.error('An unknown error occurred', { error: 'timeout' });
    }
  }, [userId, status, origin]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-8">
      {isMiniApp && <MiniAppBanner />}
      <img src={getImage(status, origin)} alt={status} className="w-32 h-32 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">{getMessage(status, origin)}</h2>
      <div className="flex gap-4 mt-6">
        <Link href="/dashboard">
          <span className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Back to Dashboard</span>
        </Link>
        <a href="mailto:schmrdty@proton.me" className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition">Contact Support</a>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
        >
          Share Result
        </button>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}

