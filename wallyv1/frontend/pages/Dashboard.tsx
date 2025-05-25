import React, { useEffect, useState } from 'react';
import { useAuth } from '../src/hooks/useAuth';
import { useSession } from '../src/hooks/useSession';
import EventFeed from '../src/components/EventFeed';
import { Notifications } from '../src/components/Notifications';
import TransferForm from '../src/components/TransferForm';
import { useRouter } from 'next/router';
import { DashboardUserInfo } from '../src/components/DashboardUserInfo';
import { DashboardSignOutButtons } from '../src/components/DashboardSignOutButtons';
import { DashboardNavButtons } from '../src/components/DashboardNavButtons';
import styles from '../styles/Dashboard.module.css';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection'; 
import { MiniAppBanner } from '../src/components/MiniAppBanner'; // Import the MiniAppBanner component


function Dashboard() {
    const { user, loading: authLoading, logoutUser } = useAuth();
    const userId = user?.id;
    const {
        loading: sessionLoading, error: sessionError, isValid,
    } = useSession();
    const [actionStatus, setActionStatus] = useState<string | null>(null);
    const router = useRouter();

    function isMiniAppRequest() {
  return tryDetectMiniAppClient() || window.location.pathname.startsWith('/mini');
}
    useEffect(() => {
        if ((!authLoading && !userId) || (!sessionLoading && !isValid)) {
            router.replace('/');
        }
    }, [authLoading, userId, sessionLoading, isValid, router]);

    const isMiniApp = tryDetectMiniAppClient(); // Detect if it's a mini app

    if (!userId || !isValid) return null;

    return (
        <div className={styles.dashboard}>
            <h1>Dashboard</h1>
            <DashboardUserInfo user={user} isValid={isValid} />
            <DashboardSignOutButtons user={user} logoutUser={logoutUser} />
            <DashboardNavButtons router={router} />
            {actionStatus && <div className="action-status">{actionStatus}</div>}
            {userId && <Notifications userId={userId} />}
            <TransferForm />
            {userId && <EventFeed userId={userId} />}
            {isMiniApp && <MiniAppBanner />} {/* Show the banner if it's a mini app */}
        </div>
    );
}

export default Dashboard;