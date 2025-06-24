"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { sdk } from '@farcaster/frame-sdk';
import SplashSpinner from '@/components/SplashSpinner';

const SplashPage = () => {
  const router = useRouter();
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Detect Mini App environment and redirect if not in Mini App
  useEffect(() => {
    const detectMiniApp = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          await sdk.actions.ready();
        } else {
          // If not in Mini App, redirect to regular auth page
          router.replace('/auth');
          return;
        }
      } catch (error) {
        console.warn('Not in Farcaster Mini App:', error);
        // If SDK fails, assume not in Mini App and redirect
        router.replace('/auth');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    detectMiniApp();
  }, [router]);

  // Show loading while checking Mini App status
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: "url('/opengraph-image.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center bg-black/60 backdrop-blur-sm rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render if in Mini App
  if (!isMiniApp) {
    return null; // This should not be reached due to redirect
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: "url('/opengraph-image.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 text-center p-8 max-w-md w-full bg-black/60 backdrop-blur-sm rounded-2xl">
        {/* Mini App Indicator */}
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mb-6 text-center">
          <p className="text-green-800 dark:text-green-200">Welcome to Wally fellow caster!</p>
        </div>

        {/* Responsive Wally Preview */}
        <div className="mb-8">
          <Image
            src="/wally-preview.png"
            alt="Wally Preview"
            width={300}
            height={300}
            className="mx-auto rounded-lg shadow-lg"
            style={{ maxWidth: '90vw', height: 'auto' }}
            priority
          />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Wally
        </h1>

        <p className="text-lg text-purple-200 mb-8">
          Your intelligent wallet watcher
        </p>

        <button
          onClick={() => router.push('/auth')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 shadow-lg hover:shadow-xl mb-8"
        >
          Get Started
        </button>

        <div className="mt-8">
          <SplashSpinner />
        </div>
      </div>
    </div>
  );
};

export default SplashPage;