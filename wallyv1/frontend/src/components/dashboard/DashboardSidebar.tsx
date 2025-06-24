'use client';

import React from 'react';
import Image from 'next/image';

interface DashboardSidebarProps {
    currentView: string;
    onViewChangeAction: (view: string) => void;
    isOpen: boolean;
    onToggleAction: () => void;
    isMiniApp: boolean;
    onModuleOpenAction: (module: string) => void;
}

const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: '🏠' },
    { id: 'transfers', label: 'Transfers', icon: '💸' },
    { id: 'automation', label: 'Automation', icon: '⚙️' },
    { id: 'health', label: 'Health', icon: '🏥' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = function DashboardSidebar({
    currentView,
    onViewChangeAction,
    isOpen,
    onToggleAction,
    isMiniApp,
    onModuleOpenAction
}) {
    return (
        <nav className="flex flex-col gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl pondWater-font shadow pondWater-btn w-64 min-h-screen border-2 border-yellow-400" style={{ boxShadow: '0 0 16px 2px #FFD60055' }}>
            {sidebarItems.map((item) => (
                <button
                    key={item.id}
                    className={`pondWater-btn flex flex-row items-center w-full px-4 py-3 my-1 text-left ${currentView === item.id ? 'bg-white/20 border-yellow-400 text-white font-bold' : 'bg-white/10 border-yellow-400 text-white/80'}`}
                    style={{ borderRadius: '10px', fontFamily: 'pondWater, SF Pro Display, sans-serif', fontWeight: 600, textShadow: '0px 4px 10px #FFD600, 0px 4px 10px rgba(0,0,0,0.3)' }} onClick={() => onViewChangeAction(item.id)}
                    aria-label={item.label}
                >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default DashboardSidebar;
