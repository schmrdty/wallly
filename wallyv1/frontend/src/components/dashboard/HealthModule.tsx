import React, { useEffect, useState } from 'react';
import { healthCheck } from '@/utils/api';

const healthLinks = [
  { name: 'Base', url: 'https://status.base.org/', color: 'bg-blue-500' },
  { name: 'Degen', url: 'https://degen.tips/status', color: 'bg-purple-500' },
  { name: 'Optimism', url: 'https://status.optimism.io/', color: 'bg-red-500' },
  { name: 'Ethereum', url: 'https://ethstats.net/', color: 'bg-gray-600' },
  { name: 'Farcaster', url: 'https://farcaster.network/status', color: 'bg-purple-600' },
  { name: 'Telegram', url: 'https://downdetector.com/status/telegram/', color: 'bg-blue-400' },
  { name: 'Email Services', url: 'https://downdetector.com/status/gmail/', color: 'bg-green-500' },
];

const HealthModule: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 text-center max-w-md w-full shadow-xl mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">System Health</h1>
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
              <p className="text-sm text-gray-500">Uptime: {Math.floor(health.uptime / 60)} minutes</p>
            )}
          </div>
        )}
      </div>
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">External Service Status</h2>
        <div className="flex flex-col gap-3">
          {healthLinks.map((link) => (
            <button
              key={link.name}
              type="button"
              onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
              className={`${link.color} hover:opacity-80 text-white text-center py-3 px-4 rounded-lg transition duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 mb-2`}
              aria-label={`Check ${link.name} status`}
            >
              {link.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Click any service to check its current status
        </p>
      </div>
    </div>
  );
};

export default HealthModule;
