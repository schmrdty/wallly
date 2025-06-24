'use client';

import React, { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import BackButton from '@/components/BackButton';
import RenewButton from '@/components/RenewButton';
import { useSettingsForm } from '@/hooks/useSettingsForm';
import SettingsStatus from '@/components/SettingsStatus';
import ThemeToggle from '@/components/ThemeToggle';

export default function SettingsPage() {
    const [isMiniApp, setIsMiniApp] = useState(false);

    const {
        purgeMode,
        autoRenew,
        status,
        reminderOption,
        email,
        telegram,
        loading,
        error,
        handlePurgeToggle,
        handleAutoRenewToggle,
        handleReminderChange,
        handleEmailChange,
        handleTelegramChange,
        user
    } = useSettingsForm();

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

            <div className="relative z-10 p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <BackButton />
                            <h1 className="text-3xl font-bold text-white">Settings</h1>
                        </div>
                        <ThemeToggle />
                    </div>

                    {/* Mini App Indicator */}
                    {isMiniApp && (
                        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center mb-6">
                            <p className="text-green-800 dark:text-green-200">✓ Farcaster Mini App detected</p>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                            <p className="text-white">Loading settings...</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Data Management */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow">
                            <h2 className="text-xl font-semibold mb-4 text-white">Data Management</h2>

                            <div className="space-y-4">
                                <label className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={purgeMode}
                                        onChange={e => handlePurgeToggle(e.target.checked)}
                                        disabled={loading}
                                        className="mt-1 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 disabled:opacity-50"
                                    />
                                    <div>
                                        <div className="font-medium text-white">Enable Purge Mode</div>
                                        <div className="text-sm text-purple-200">
                                            Delete audit logs immediately on revoke. When disabled, logs are retained for 30 days.
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Auto-Renew Settings */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow">
                            <h2 className="text-xl font-semibold mb-4 text-white">Auto-Renew</h2>

                            <div className="space-y-4">
                                <label className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={autoRenew}
                                        onChange={e => handleAutoRenewToggle(e.target.checked)}
                                        disabled={loading}
                                        className="mt-1 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 disabled:opacity-50"
                                    />
                                    <div>
                                        <div className="font-medium text-white">Enable Auto-Renew</div>
                                        <div className="text-sm text-purple-200">
                                            Automatically renew your session before it expires.
                                        </div>
                                    </div>
                                </label>

                                <div className="mt-4">
                                    <RenewButton userId={user?.id ?? ''} disabled={purgeMode || loading} />
                                    {purgeMode && (
                                        <p className="text-red-400 text-sm mt-2">
                                            Renew is disabled when Purge Mode is enabled.
                                        </p>
                                    )}
                                </div>

                                <SettingsStatus status={status} />
                            </div>
                        </div>

                        {/* Notification Settings */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow">
                            <h2 className="text-xl font-semibold mb-4 text-white">Notifications</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-purple-200 mb-2">
                                        Reminder Option
                                    </label>
                                    <select
                                        value={reminderOption}
                                        onChange={e => handleReminderChange(e.target.value)}
                                        disabled={loading}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="none">None</option>
                                        <option value="7days">Remind me when I have 7 days remaining</option>
                                        <option value="1day">Remind me when I have 1 day remaining</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-purple-200 mb-2">
                                        Email (optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => handleEmailChange(e.target.value)}
                                        disabled={loading}
                                        placeholder="your@email.com"
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-purple-200 mb-2">
                                        Telegram Handle (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={telegram}
                                        onChange={e => handleTelegramChange(e.target.value)}
                                        disabled={loading}
                                        placeholder="@yourhandle"
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                                    />
                                </div>

                                <div className="bg-blue-50/10 backdrop-blur-sm p-4 rounded-lg">
                                    <p className="text-sm text-blue-200">
                                        <strong>Note:</strong> Settings are saved automatically. Some features may be limited if the backend is offline.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}