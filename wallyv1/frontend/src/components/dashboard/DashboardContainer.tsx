'use client';

import React, { useState, useEffect } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardMainView } from './DashboardMainView';
import UserInfo from '../UserInfo';
import { PermissionManager } from '../PermissionManager';
import SessionManager from '../SessionManager';
import ContractDashboard from '../ContractDashboard';
import EventFeed from '../EventFeed';
import SettingsModule from './SettingsModule';
import HealthModule from './HealthModule';
import WalletWatchingManager from '../WalletWatchingManager';
import SchedulerInterface from '../SchedulerInterface';
import { WalletConnectionManager } from '../WalletConnectionManager';

// Try to import the real SDK, fall back to mock if not available
let sdk: any;
try {
    sdk = require('@farcaster/frame-sdk').sdk;
} catch (error) {
    console.warn('Real @farcaster/frame-sdk not available, using mock');
    sdk = require('../../lib/frameSDK').sdk;
}

export type DashboardView =
    | 'overview' // User Dashboard
    | 'transfers' // Management (Transfers, Permissions, Sessions)
    | 'automation' // Automation Scheduler
    | 'health'    // Health and Resources
    | 'events'    // Event Feed
    | 'settings'; // Settings

interface DashboardContainerProps {
    initialView?: DashboardView;
}

function DashboardContainer({
    initialView = 'overview'
}: DashboardContainerProps) {
    const [currentView, setCurrentView] = useState<DashboardView>(initialView);
    const [isMiniApp, setIsMiniApp] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openModule, setOpenModule] = useState<string | null>(null);
    const { loading, user, isValid } = useSessionContext();

    // Detect Mini App environment
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
    // Event listener for quick action navigation and automation
    useEffect(() => {
        const handleNavigate = (e: any) => {
            if (e.detail && e.detail.view) {
                setCurrentView(e.detail.view);
            }
        };
        const handleAutomate = () => {
            // Placeholder: trigger automation logic here
            alert('Automation (native/token forwarding) will be triggered here.');
        };
        window.addEventListener('dashboard-navigate', handleNavigate);
        window.addEventListener('dashboard-automate', handleAutomate);
        return () => {
            window.removeEventListener('dashboard-navigate', handleNavigate);
            window.removeEventListener('dashboard-automate', handleAutomate);
        };
    }, []);    // Component mapping for views
    const renderView = () => {
        switch (currentView) {
            case 'overview':
                return <DashboardMainView openModule={openModule} onCloseModuleAction={() => setOpenModule(null)} />;
            case 'transfers':
                return <>
                    <PermissionManager />
                    <SessionManager />
                </>;
            case 'automation':
                return <SchedulerInterface />;
            case 'health':
                return (
                    <div className="p-6">
                        <HealthModule />
                    </div>
                );
            case 'events':
                return (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Event Feed</h2>
                        <EventFeed userId={user?.id || user?.fid?.toString() || 'unknown'} />
                    </div>
                );
            case 'settings':
                return (
                    <div className="p-6">
                        <SettingsModule />
                    </div>
                );
            default:
                return <DashboardMainView openModule={openModule} onCloseModuleAction={() => setOpenModule(null)} />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isValid || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Sorry, you are not authorized.</h2>
                    <p className="text-gray-600 dark:text-gray-300">Please sign in to access the dashboard.</p>
                </div>
            </div>
        );
    }
    return (
        <div className="relative flex flex-row min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black text-white pondWater-font">
            {/* Sidebar on the left */}
            <DashboardSidebar
                currentView={currentView}
                onViewChangeAction={(view) => setCurrentView(view as DashboardView)}
                isOpen={sidebarOpen}
                onToggleAction={() => setSidebarOpen(!sidebarOpen)}
                isMiniApp={isMiniApp}
                onModuleOpenAction={setOpenModule}
            />
            {/* Main content on the right, fills space */}
            <main className="flex-1 flex flex-col min-h-screen p-4 md:p-8 pondWater-font gap-6">
                <DashboardHeader
                    currentView={currentView}
                    onMenuToggleAction={() => setSidebarOpen(!sidebarOpen)}
                    isMiniApp={isMiniApp}
                />
                <div className="flex-1 flex flex-col items-center justify-start">
                    <div
                        className="w-full max-w-4xl bg-white/10 rounded-xl shadow-lg p-8 pondWater-font border-2 border-yellow-400 flex flex-col gap-6 items-center"
                        style={{ backdropFilter: 'blur(15px)' }}
                    >
                        {openModule ? (
                            <DashboardMainView openModule={openModule} onCloseModuleAction={() => setOpenModule(null)} />
                        ) : (
                            renderView()
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardContainer;
