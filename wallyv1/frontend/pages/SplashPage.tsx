import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/hooks/useAuth';
import { SplashSpinner } from '../src/components/SplashSpinner';
import { SplashLogo } from '../src/components/SplashLogo';

const SplashPage = () => {
  const router = useRouter();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      router.replace('/Home');
    }
  }, [authLoading, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7fafc'
    }}>
      <SplashLogo />
      <SplashSpinner />
    </div>
  );
};

export default SplashPage;