'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@/context/SessionContext';

export default function SplashPage() {
  const router = useRouter();
  const { isValid, loading } = useSessionContext();

  useEffect(() => {
    // Immediate redirect - no splash timer
    if (!loading) {
      if (isValid) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [isValid, loading, router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundImage: "url('/opengraph-image.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="text-center space-y-8 bg-black/60 backdrop-blur-sm rounded-lg p-12">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="/opengraph-image.png"
            alt="Wally Logo"
            className="w-32 h-32 rounded-lg shadow-lg"
          />
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Welcome to Wally the Wallet Watcher
          </h1>
          <p className="text-xl text-purple-200">
            The Haberdasheries pet duck!
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>

        <p className="text-lg text-white">Loading...</p>
      </div>
    </div>
  );
}
