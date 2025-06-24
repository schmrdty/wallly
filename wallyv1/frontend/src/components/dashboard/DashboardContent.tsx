'use client';

import { useSessionContext } from '@/context/SessionContext.jsx';
import Notifications from '@/components/Notifications.tsx';
import EventFeed from '@/components/EventFeed.tsx';
import { DashboardUserInfo } from './DashboardUserInfo.jsx';

export function DashboardMainView() {
    const { user } = useSessionContext();

    return (
        <div className="grid gap-6 border-2 border-yellow-400 rounded-xl p-4">
            {/* User Profile Information */}
            <DashboardUserInfo />

            {/* Wallet Overview */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-2 border-yellow-400">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Wallet Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 dark:text-purple-400">Active Sessions</div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">1</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-sm text-green-600 dark:text-green-400">Total Transfers</div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">0</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 dark:text-blue-400">Notifications</div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">0</div>
                    </div>
                </div>
            </div>

            {user && (
                <>
                    {/* Notifications */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-2 border-yellow-400">
                        <h2 className="text-xl font-semibold mb-4 dark:text-white">Notifications</h2>
                        <Notifications userId={user.id} />
                    </div>

                    {/* Event Feed */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-2 border-yellow-400">
                        <h2 className="text-xl font-semibold mb-4 dark:text-white">Recent Activity</h2>
                        <EventFeed userId={user.id} />
                    </div>
                </>
            )}
        </div>
    );
}
