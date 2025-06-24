'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { healthCheck } from '@/utils/api.ts';

export default function HealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMiniApp, setIsMiniApp] = useState(false);

  // Detect Mini App environment using SDK
  useEffect(() => {
    const detectMiniApp = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(isInMiniApp);
      } catch (error) {
        console.warn('Not in Farcaster Mini App:', error);
        setIsMiniApp(false);
      }
    };

    detectMiniApp();
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await healthCheck();
        setHealth(result);
      } catch (error) {
        setHealth({ status: 'error', message: 'Health check failed' });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  const healthLinks = [
    { name: 'Base', url: 'https://status.base.org/', color: 'bg-blue-500' },
    { name: 'Degen', url: 'https://degen.tips/status', color: 'bg-purple-500' },
    { name: 'Optimism', url: 'https://status.optimism.io/', color: 'bg-red-500' },
    { name: 'Ethereum', url: 'https://ethstats.net/', color: 'bg-gray-600' },
    { name: 'Farcaster', url: 'https://farcaster.network/status', color: 'bg-purple-600' },
    { name: 'Telegram', url: 'https://downdetector.com/status/telegram/', color: 'bg-blue-400' },
    { name: 'Email Services', url: 'https://downdetector.com/status/gmail/', color: 'bg-green-500' },
  ];

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/opengraph-image.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Background Doctor Images */}
      <div className="absolute inset-0 opacity-20">
        <img
          src="/doctor_wally.png"
          alt="Doctor Wally"
          className="absolute bottom-0 left-0 w-64 h-64 object-contain"
        />
        <img
          src="/doctor_wally2.png"
          alt="Doctor Wally 2"
          className="absolute bottom-0 right-0 w-64 h-64 object-contain"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Mini App Indicator */}
        {isMiniApp && (
          <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mb-6 text-center">
            <p className="text-green-800 dark:text-green-200">✓ Farcaster Mini App detected</p>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 text-center max-w-md w-full shadow-xl mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            System Health
          </h1>

          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="text-gray-600">Checking health...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-semibold ${health?.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                  {health?.status === 'ok' ? 'All Systems Operational' : 'System Issues Detected'}
                </span>
              </div>

              {health?.message && (
                <p className="text-gray-600">{health.message}</p>
              )}

              {health?.uptime && (
                <p className="text-sm text-gray-500">
                  Uptime: {Math.floor(health.uptime / 60)} minutes
                </p>
              )}
            </div>
          )}
        </div>

        {/* External Health Status Links */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 w-full max-w-2xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">External Service Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {healthLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${link.color} hover:opacity-80 text-white text-center py-3 px-4 rounded-lg transition duration-200 font-medium text-sm`}
              >
                {link.name}
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Click any service to check its current status
          </p>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = '/auth'}
            className="pondWater-btn px-6 py-3 rounded-lg font-semibold"
          >
            Back to Auth
          </button>
        </div>
      </div>
    </div>
  );
}
