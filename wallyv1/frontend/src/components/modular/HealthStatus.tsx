'use client';

import React from 'react';

interface HealthStatusProps {
    className?: string;
}

export const HealthStatus: React.FC<HealthStatusProps> = ({ className = '' }) => {
    return (
        <div className={`bg-white/10 backdrop-blur-md rounded-lg p-6 ${className}`}>
            <h2 className="text-xl font-semibold text-white mb-4">🏥 System Health</h2>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Frontend</span>
                    <span className="text-green-400">✅ Online</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Backend</span>
                    <span className="text-green-400">✅ Online</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Database</span>
                    <span className="text-yellow-400">⚠️ Redis Offline</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Farcaster SDK</span>
                    <span className="text-green-400">✅ Ready</span>
                </div>
            </div>
        </div>
    );
};
