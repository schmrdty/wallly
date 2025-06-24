import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContractIntegration } from '../hooks/useContractIntegration.ts';
import { useTransactionManager } from '../hooks/useTransactionManager.ts';
import { useEventMonitoring } from '../hooks/useEventMonitoring.ts';
import { PermissionManager } from './PermissionManager.tsx';
import SessionManager from './SessionManager.tsx';

interface TabConfig {
    id: string;
    label: string;
    component: React.ComponentType;
    icon: string;
}

const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', component: OverviewTab, icon: '📊' },
    { id: 'permissions', label: 'Permissions', component: PermissionManager, icon: '🔒' },
    { id: 'sessions', label: 'Sessions', component: SessionManager, icon: '🔗' },
    { id: 'transactions', label: 'Transactions', component: TransactionTab, icon: '📋' },
    { id: 'events', label: 'Events', component: EventsTab, icon: '📢' }
];

// Overview Tab Component
function OverviewTab() {
    const { address } = useAccount();
    const {
        contractState,
        userData,
        loading,
        error,
        isHealthy,
        realTimeEnabled,
        enableRealTimeUpdates,
        disableRealTimeUpdates
    } = useContractIntegration();

    const {
        totalTransactions,
        hasActiveTransactions,
        pendingTransactions,
        processingTransactions,
        completedTransactions,
        failedTransactions
    } = useTransactionManager();

    const { stats: eventStats, recentEvents } = useEventMonitoring();

    return (
        <div className="overview-tab space-y-6">
            {/* Health Status */}
            <div className={`p-4 rounded-lg ${isHealthy ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`font-semibold ${isHealthy ? 'text-green-800' : 'text-red-800'}`}>
                        Contract {isHealthy ? 'Healthy' : 'Unhealthy'}
                    </span>
                    {contractState && (
                        <span className="ml-4 text-sm text-gray-600">
                            Last updated: {new Date(contractState.lastUpdated).toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Real-time Monitoring Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                    <h3 className="font-semibold">Real-time Updates</h3>
                    <p className="text-sm text-gray-600">
                        {realTimeEnabled ? 'Receiving live updates' : 'Manual refresh mode'}
                    </p>
                </div>
                <button
                    onClick={realTimeEnabled ? disableRealTimeUpdates : enableRealTimeUpdates}
                    className={`px-4 py-2 rounded-lg font-medium ${realTimeEnabled
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {realTimeEnabled ? 'Disable' : 'Enable'}
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Contract Stats */}
                {contractState && (
                    <>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h4 className="text-sm font-medium text-gray-600">Total Users</h4>
                            <p className="text-2xl font-bold text-gray-900">
                                {contractState.totalUsers.toString()}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow">
                            <h4 className="text-sm font-medium text-gray-600">Active Permissions</h4>
                            <p className="text-2xl font-bold text-gray-900">
                                {contractState.totalPermissions.toString()}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow">
                            <h4 className="text-sm font-medium text-gray-600">Active Sessions</h4>
                            <p className="text-2xl font-bold text-gray-900">
                                {contractState.totalSessions.toString()}
                            </p>
                        </div>
                    </>
                )}

                {/* Transaction Stats */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h4 className="text-sm font-medium text-gray-600">My Transactions</h4>
                    <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
                    <div className="text-xs text-gray-500 mt-1">
                        {hasActiveTransactions && (
                            <span className="text-blue-600">
                                {pendingTransactions.length + processingTransactions.length} active
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* User Account Summary */}
            {userData && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Your Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${userData.hasActivePermission ? 'bg-green-500' : 'bg-gray-400'
                                }`}></div>
                            <h4 className="font-medium">Permission</h4>
                            <p className="text-sm text-gray-600">
                                {userData.hasActivePermission ? 'Active' : 'Inactive'}
                            </p>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${userData.hasValidSession ? 'bg-green-500' : 'bg-gray-400'
                                }`}></div>
                            <h4 className="font-medium">Session</h4>
                            <p className="text-sm text-gray-600">
                                {userData.hasValidSession ? 'Active' : 'Inactive'}
                            </p>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${userData.isAdmin ? 'bg-blue-500' : 'bg-gray-400'
                                }`}></div>
                            <h4 className="font-medium">Admin Role</h4>
                            <p className="text-sm text-gray-600">
                                {userData.isAdmin ? 'Yes' : 'No'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            {recentEvents.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentEvents.slice(0, 5).map(event => (
                            <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-3 ${event.severity === 'error' ? 'bg-red-500' :
                                        event.severity === 'warning' ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`}></div>
                                    <div>
                                        <p className="text-sm font-medium">{event.type}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${event.category === 'permission' ? 'bg-purple-100 text-purple-800' :
                                    event.category === 'session' ? 'bg-blue-100 text-blue-800' :
                                        event.category === 'transfer' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {event.category}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-800"><strong>Error:</strong> {error}</p>
                </div>
            )}
        </div>
    );
}

// Transaction Tab Component
function TransactionTab() {
    const {
        transactions,
        loading,
        error,
        cancelTransaction,
        clearTransactions,
        getTransactionsByStatus,
        totalTransactions,
        hasActiveTransactions
    } = useTransactionManager();

    const pendingTxs = getTransactionsByStatus('pending');
    const processingTxs = getTransactionsByStatus('processing');
    const completedTxs = getTransactionsByStatus('completed');
    const failedTxs = getTransactionsByStatus('failed');

    const handleCancelTransaction = async (txId: string) => {
        try {
            await cancelTransaction(txId);
        } catch (err) {
            console.error('Failed to cancel transaction:', err);
        }
    };

    return (
        <div className="transaction-tab space-y-6">
            {/* Transaction Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800">Total</h4>
                    <p className="text-2xl font-bold text-blue-900">{totalTransactions}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800">Pending</h4>
                    <p className="text-2xl font-bold text-yellow-900">{pendingTxs.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-800">Processing</h4>
                    <p className="text-2xl font-bold text-purple-900">{processingTxs.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800">Completed</h4>
                    <p className="text-2xl font-bold text-green-900">{completedTxs.length}</p>
                </div>
            </div>

            {/* Clear Completed Button */}
            {(completedTxs.length > 0 || failedTxs.length > 0) && (
                <div className="flex justify-end">
                    <button
                        onClick={() => clearTransactions(['completed', 'failed'])}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Clear Completed
                    </button>
                </div>
            )}

            {/* Transaction List */}
            {transactions.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold">Transaction History</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {transactions.slice(0, 20).map(tx => (
                            <div key={tx.id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{tx.operation}</p>
                                        <p className="text-sm text-gray-600">
                                            Type: {tx.type} | Priority: {tx.priority}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                tx.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                                                    tx.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {tx.status}
                                        </span>
                                        {(tx.status === 'pending' || tx.status === 'processing') && (
                                            <button
                                                onClick={() => handleCancelTransaction(tx.id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {tx.error && (
                                    <div className="mt-2 text-sm text-red-600">
                                        Error: {tx.error}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    No transactions yet
                </div>
            )}

            {error && (
                <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-800"><strong>Error:</strong> {error}</p>
                </div>
            )}
        </div>
    );
}

// Events Tab Component  
function EventsTab() {
    const {
        events,
        allEvents,
        loading,
        error,
        isMonitoring,
        filter,
        stats,
        startMonitoring,
        stopMonitoring,
        applyFilter,
        clearFilter
    } = useEventMonitoring();

    const handleFilterChange = (newFilter: Partial<typeof filter>) => {
        applyFilter({ ...filter, ...newFilter });
    };

    return (
        <div className="events-tab space-y-6">
            {/* Monitoring Controls */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                    <h3 className="font-semibold">Event Monitoring</h3>
                    <p className="text-sm text-gray-600">
                        {isMonitoring ? 'Actively monitoring contract events' : 'Event monitoring disabled'}
                    </p>
                </div>
                <button
                    onClick={isMonitoring ? stopMonitoring : startMonitoring}
                    className={`px-4 py-2 rounded-lg font-medium ${isMonitoring
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </button>
            </div>

            {/* Event Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-sm font-medium text-gray-600">Total Events</h4>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-sm font-medium text-gray-600">Recent (24h)</h4>
                        <p className="text-2xl font-bold text-gray-900">{stats.recentCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-sm font-medium text-gray-600">Error Rate</h4>
                        <p className="text-2xl font-bold text-gray-900">{(stats.errorRate).toFixed(1)}%</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-sm font-medium text-gray-600">Filtered</h4>
                        <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                    </div>
                </div>
            )}

            {/* Event Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={filter.categories?.[0] || ''}
                            onChange={(e) => handleFilterChange({
                                categories: e.target.value ? [e.target.value as any] : undefined
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Categories</option>
                            <option value="permission">Permission</option>
                            <option value="session">Session</option>
                            <option value="transfer">Transfer</option>
                            <option value="admin">Admin</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                        <select
                            value={filter.severities?.[0] || ''}
                            onChange={(e) => handleFilterChange({
                                severities: e.target.value ? [e.target.value as any] : undefined
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Severities</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>                    <div className="flex items-end">
                        <button
                            onClick={() => clearFilter()}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Event List */}
            {events.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold">Events</h3>
                    </div>
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                        {events.slice(0, 50).map(event => (
                            <div key={event.id} className="px-6 py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-1">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${event.severity === 'critical' ? 'bg-red-600' :
                                                event.severity === 'error' ? 'bg-red-500' :
                                                    event.severity === 'warning' ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                }`}></div>
                                            <p className="font-medium text-sm">{event.type}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </p>
                                        {event.user && (
                                            <p className="text-xs text-gray-600 font-mono">
                                                User: {event.user}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${event.category === 'permission' ? 'bg-purple-100 text-purple-800' :
                                            event.category === 'session' ? 'bg-blue-100 text-blue-800' :
                                                event.category === 'transfer' ? 'bg-green-100 text-green-800' :
                                                    event.category === 'admin' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {event.category}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                            event.severity === 'error' ? 'bg-red-100 text-red-800' :
                                                event.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {event.severity}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    No events to display
                </div>
            )}

            {error && (
                <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-800"><strong>Error:</strong> {error}</p>
                </div>
            )}
        </div>
    );
}

// Main Dashboard Component
export const ContractDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const { address, isConnected } = useAccount();

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab;

    if (!isConnected) {
        return (
            <div className="contract-dashboard">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Wallet Required:</strong> Please connect your wallet to use the contract dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="contract-dashboard">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Dashboard</h1>
                    <p className="text-gray-600">
                        Manage your permissions, sessions, and transfers
                    </p>
                    <div className="text-sm text-gray-500 font-mono mt-2">
                        Connected: {address}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>                {/* Tab Content */}
                <div className="tab-content">
                    {React.createElement(ActiveComponent)}
                </div>
            </div>
        </div>
    );
};

export default ContractDashboard;
