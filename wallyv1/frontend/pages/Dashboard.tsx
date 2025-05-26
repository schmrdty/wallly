import React, { useEffect } from 'react';
import { useAuth } from '../src/hooks/useAuth';
import EventFeed from '../src/components/EventFeed';
import { Notifications } from '../src/components/Notifications';
import TransferForm from '../src/components/TransferForm';
import { useRouter } from 'next/router';
import { DashboardUserInfo } from '../src/components/DashboardUserInfo';
import { DashboardSignOutButtons } from '../src/components/DashboardSignOutButtons';
import { DashboardNavButtons } from '../src/components/DashboardNavButtons';
import styles from '../styles/Dashboard.module.css';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection';
import { MiniAppBanner } from '../src/components/MiniAppBanner';
import { ThemeToggle } from '../src/components/ThemeToggle';

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
        <div className={styles.container}>
            <ThemeToggle />
            <div className={styles.dashboard}>
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
    );
}

export default Dashboard;