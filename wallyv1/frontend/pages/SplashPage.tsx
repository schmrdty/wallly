import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/hooks/useAuth';
import { SplashSpinner } from '../src/components/SplashSpinner';
import { SplashLogo } from '../src/components/SplashLogo';
import { tryDetectMiniAppClient } from '../src/utils/miniAppDetection';
import { MiniAppBanner } from '../src/components/MiniAppBanner';
import styles from '../styles/SplashPage.module.css';

const SplashPage = () => {
  const router = useRouter();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      router.replace('/Home');
    }
  }, [authLoading, router]);

  const isMiniApp = tryDetectMiniAppClient();

  return (
    <div className={styles.container}>
      {isMiniApp && <MiniAppBanner />}
      <SplashLogo />
      <SplashSpinner />
    </div>
  );
};

export default SplashPage;