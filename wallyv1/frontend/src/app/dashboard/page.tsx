'use client';
import React, { useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import EventFeed from '@/components/EventFeed';
import { Notifications } from '@/components/Notifications';
import TransferForm from '@/components/TransferForm';
import { useRouter } from 'next/navigation';
import { DashboardUserInfo } from '@/components/DashboardUserInfo';
import { DashboardSignOutButtons } from '@/components/DashboardSignOutButtons';
import { DashboardNavButtons } from '@/components/DashboardNavButtons';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection';
import { MiniAppBanner } from '@/components/MiniAppBanner';
import { ThemeToggle } from '@/components/ThemeToggle';
import wallyv1DashAbi from '@/abis/wallyv1DashAbi';

function Dashboard() {
    const { user, loading: authLoading, logoutUser } = useAuth();
    const userId = user?.id;
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !userId) {
            router.replace('/');
        }
    }, [authLoading, userId, router]);

    const isMiniApp = tryDetectMiniAppClient();

    if (!userId) return null;

    return (
        <Suspense>
            <div className="container">
                <ThemeToggle />
                <div className="dashboard">
                    <h1>Dashboard</h1>
                    <DashboardUserInfo user={user} isValid={true} />
                    <DashboardSignOutButtons user={user} logoutUser={logoutUser} />
                    <DashboardNavButtons router={router} />
                    {userId && <Notifications userId={userId} />}
                    <TransferForm />
                    {userId && <EventFeed userId={userId} />}
                    {isMiniApp && <MiniAppBanner />}
                </div>
            </div>
        </Suspense>
    );
}

export default Dashboard;