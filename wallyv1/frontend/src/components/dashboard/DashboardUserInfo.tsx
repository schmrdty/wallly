'use client';

import React from 'react';
import UserInfo from '@/components/UserInfo';

export function DashboardUserInfo() {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Profile Information</h2>
            <UserInfo />
        </div>
    );
}
