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
import '../styles/dashboard.css';



function Dashboard() {
    const { user, loading: authLoading, logoutUser } = useAuth();
    const userId = user?.id;
    const {
        loading: sessionLoading, error: sessionError, isValid,
    } = useSession();
    const [actionStatus, setActionStatus] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if ((!authLoading && !userId) || (!sessionLoading && !isValid)) {
            router.replace('/');
        }
    }, [authLoading, userId, sessionLoading, isValid, router]);

        <div>className="dashboard"</div>
    if (!userId || !isValid) return null;

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <DashboardUserInfo user={user} isValid={isValid} />
            <DashboardSignOutButtons user={user} logoutUser={logoutUser} />
            <DashboardNavButtons router={router} />
            {actionStatus && <div className="action-status">{actionStatus}</div>}
            {userId && <Notifications userId={userId} />}
            <TransferForm />
            {userId && <EventFeed userId={userId} />}
        </div>
    );
}

export default Dashboard;