import { useState, useEffect, useCallback, useRef } from 'react';
import { contractClient } from '../utils/contractClient';
import { frontendErrorHandler } from '../utils/errorHandler';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import type { ContractPermission, MiniAppSession, UserNonces } from '../utils/contractClient';

export interface ContractState {
    // Frontend expected fields
    isActive: boolean;
    isPaused: boolean;
    totalUsers: string;
    totalPermissions: string;
    totalSessions: string;
    oracleTimestamp: string;
    lastUpdated: number;

    // Additional backend fields (optional)
    owner?: Address;
    defaultDuration?: string;
    minDuration?: string;
    maxDuration?: string;
    globalRateLimit?: string;
    whitelistToken?: Address;
    minWhitelistBalance?: string;
    chainlinkOracle?: Address;
    useChainlink?: boolean;
    [key: string]: any; // For other backend fields
}

export interface UserContractData {
    permission: ContractPermission | null;
    session: MiniAppSession | null;
    nonces: UserNonces | null;
    roles: string[];
    isAdmin: boolean;
    hasValidSession: boolean;
    hasActivePermission: boolean;
}

export function useContractIntegration() {
    const { address, isConnected } = useAccount();
    const [contractState, setContractState] = useState<ContractState | null>(null);
    const [userData, setUserData] = useState<UserContractData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHealthy, setIsHealthy] = useState(true);

    // Real-time updates
    const [realTimeEnabled, setRealTimeEnabled] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null); const wsRef = useRef<WebSocket | null>(null);

    // Fetch contract state
    const fetchContractState = useCallback(async () => {
        try {
            const response = await contractClient.getContractState();
            if (response.success && response.data) {
                // Ensure lastUpdated is set with current timestamp if not provided
                const stateData = {
                    ...response.data,
                    lastUpdated: response.data.lastUpdated ?? Date.now()
                };
                setContractState(stateData);
                setError(null);
                return stateData;
            } else {
                throw new Error(response.error || 'Failed to fetch contract state');
            }
        } catch (err: any) {
            const handledError = await frontendErrorHandler.classifyError(err, {
                operation: 'fetchContractState',
                context: { address }
            });
            setError(handledError.userFriendlyMessage);
            return null;
        }
    }, [address]);

    // Fetch user data
    const fetchUserData = useCallback(async (userAddress?: Address) => {
        const targetAddress = userAddress || address;
        if (!targetAddress) return null; try {
            setLoading(true); const [permissionResponse, sessionResponse, noncesResponse] = await Promise.all([
                contractClient.getUserPermission(targetAddress),
                contractClient.getUserSession(targetAddress),
                contractClient.getUserNonces(targetAddress)]);

            // Check if user is admin by checking roles
            const isAdmin = await contractClient.isUserAdmin(targetAddress); const userData: UserContractData = {
                permission: (permissionResponse.success && permissionResponse.data) ? permissionResponse.data : null,
                session: (sessionResponse.success && sessionResponse.data) ? sessionResponse.data : null,
                nonces: (noncesResponse.success && noncesResponse.data) ? noncesResponse.data : null,
                roles: isAdmin ? ['ADMIN_ROLE'] : [],
                isAdmin: Boolean(isAdmin),
                hasValidSession: Boolean(sessionResponse.success && sessionResponse.data?.active),
                hasActivePermission: Boolean(permissionResponse.success && permissionResponse.data?.isActive)
            };

            setUserData(userData);
            setError(null);
            return userData;
        } catch (err: any) {
            const handledError = frontendErrorHandler.classifyError(err, {
                operation: 'fetchUserData',
                context: { targetAddress, address }
            });
            setError(handledError.userFriendlyMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [address]);  // Check contract health
    const checkHealth = useCallback(async () => {
        try {
            const healthResponse = await contractClient.getHealthStatus();
            const isHealthy = healthResponse.success && healthResponse.data?.healthy !== false;
            setIsHealthy(isHealthy);
            return { isHealthy, lastUpdate: Date.now(), issues: isHealthy ? [] : ['Service unavailable'] };
        } catch (err: any) {
            const handledError = frontendErrorHandler.classifyError(err, {
                operation: 'checkHealth',
                context: { address }
            });
            setIsHealthy(false);
            setError(handledError.userFriendlyMessage);
            return { isHealthy: false, lastUpdate: 0, issues: ['Connection failed'] };
        }
    }, [address]);

    // Fetch detailed contract statistics
    const fetchContractStats = useCallback(async () => {
        try {
            const response = await fetch('/api/contract/stats');
            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to fetch contract stats');
            }
        } catch (err: any) {
            const handledError = await frontendErrorHandler.classifyError(err, {
                operation: 'fetchContractStats',
                context: { address }
            });
            setError(handledError.userFriendlyMessage);
            return null;
        }
    }, [address]);

    // Refresh contract statistics
    const refreshContractStats = useCallback(async () => {
        try {
            const response = await fetch('/api/contract/stats/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();

            if (result.success) {
                // Also refresh the contract state to get updated totals
                await fetchContractState();
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to refresh contract stats');
            }
        } catch (err: any) {
            const handledError = await frontendErrorHandler.classifyError(err, {
                operation: 'refreshContractStats',
                context: { address }
            });
            setError(handledError.userFriendlyMessage);
            return null;
        }
    }, [address, fetchContractState]);

    // Permission management
    const grantPermission = useCallback(async (
        withdrawalAddress: Address,
        allowEntireWallet: boolean,
        tokenList: Address[],
        minBalances: string[],
        limits: string[],
        expiresAt: bigint,
        signature?: string) => {
        if (!address) throw new Error('Wallet not connected');

        try {
            setLoading(true);
            // Calculate duration from expiresAt
            const currentTime = Math.floor(Date.now() / 1000);
            const expiresAtSeconds = typeof expiresAt === 'bigint' ? Number(expiresAt) : parseInt(String(expiresAt));
            const duration = Math.max(3600, expiresAtSeconds - currentTime); // At least 1 hour

            const result = await contractClient.grantPermission({
                withdrawalAddress,
                allowEntireWallet,
                duration: duration.toString(),
                tokenList,
                minBalances: minBalances.map(b => b.toString()),
                limits: limits.map(l => l.toString())
            });

            // Refresh user data after successful grant
            await fetchUserData();
            // Refresh user data after successful grant
            await fetchUserData();
            return result;
        } finally {
            setLoading(false);
        }
    }, [address, fetchUserData]); const updatePermission = useCallback(async (
        withdrawalAddress: Address,
        allowEntireWallet: boolean,
        tokenList: Address[],
        minBalances: bigint[],
        limits: bigint[],
        expiresAt: bigint,
        signature?: string
    ) => {
        if (!address) throw new Error('Wallet not connected');
        try {
            setLoading(true);            const result = await contractClient.updatePermission({
                user: address as `0x${string}`,
                withdrawalAddress: withdrawalAddress as `0x${string}`,
                allowEntireWallet,
                tokenList,
                minBalances,
                limits,
                expiresAt,
                signature
            });

            await fetchUserData();
            return result;
        } finally {
            setLoading(false);
        }
    }, [address, fetchUserData]);

    const revokePermission = useCallback(async (signature?: string) => {
        if (!address) throw new Error('Wallet not connected');

        try {
            setLoading(true);
            const result = await contractClient.revokePermission({
                user: address,
                signature
            });

            await fetchUserData();
            return result;
        } finally {
            setLoading(false);
        }
    }, [address, fetchUserData]);

    // Session management
    const createSession = useCallback(async (
        miniAppId: string,
        permissions: string[],
        expiresAt: bigint,
        signature?: string
    ) => {
        if (!address) throw new Error('Wallet not connected');

        try {
            setLoading(true);
            const result = await contractClient.createMiniAppSession({
                user: address,
                miniAppId,
                permissions,
                expiresAt,
                signature
            });

            await fetchUserData();
            return result;
        } finally {
            setLoading(false);
        }
    }, [address, fetchUserData]);

    const activateSession = useCallback(async (signature?: string) => {
        if (!address) throw new Error('Wallet not connected');

        try {
            setLoading(true);
            const result = await contractClient.activateSession({
                user: address,
                signature
            });

            await fetchUserData();
            return result;
        } finally {
            setLoading(false);
        }
    }, [address, fetchUserData]);

    const deactivateSession = useCallback(async (signature?: string) => {
        if (!address) throw new Error('Wallet not connected');

        try {
            setLoading(true);
            const result = await contractClient.deactivateSession({
                user: address,
                signature
            });

            await fetchUserData();
            return result;
        } finally {
            setLoading(false);
        }
    }, [address, fetchUserData]);

    // Transfer operations
    const triggerTransfer = useCallback(async (
        to: Address,
        token: Address,
        amount: bigint,
        signature?: string
    ) => {
        if (!address) throw new Error('Wallet not connected');

        try {
            setLoading(true);
            const result = await contractClient.triggerTransfer({
                user: address,
                to,
                token,
                amount,
                signature
            });

            await fetchUserData();
            return result;
        } finally {
            setLoading(false);
        }
    }, [address, fetchUserData]);

    // Utility functions
    const estimateGas = useCallback(async (operation: string, params: any) => {
        try {
            return await contractClient.estimateGas({ operation, params });
        } catch (err: any) {
            setError(err.message || 'Gas estimation failed');
            throw err;
        }
    }, []);

    const simulateTransaction = useCallback(async (operation: string, params: any) => {
        try {
            return await contractClient.simulateTransaction({ operation, params });
        } catch (err: any) {
            setError(err.message || 'Transaction simulation failed');
            throw err;
        }
    }, []);

    // Real-time updates setup
    const enableRealTimeUpdates = useCallback(() => {
        if (realTimeEnabled) return;

        setRealTimeEnabled(true);

        // Polling fallback
        intervalRef.current = setInterval(async () => {
            await Promise.all([
                fetchContractState(),
                address ? fetchUserData() : Promise.resolve(),
                checkHealth()
            ]);
        }, 30000); // Update every 30 seconds

        // WebSocket connection for real-time updates
        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'contract_state_update') {
                        setContractState(data.state);
                    } else if (data.type === 'user_data_update' && data.address === address) {
                        fetchUserData();
                    }
                } catch (err) {
                    console.warn('Failed to parse WebSocket message:', err);
                }
            };

            wsRef.current.onerror = () => {
                console.warn('WebSocket connection failed, using polling only');
            };
        } catch (err) {
            console.warn('Failed to establish WebSocket connection:', err);
        }
    }, [realTimeEnabled, fetchContractState, fetchUserData, checkHealth, address]);

    const disableRealTimeUpdates = useCallback(() => {
        setRealTimeEnabled(false);

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    // Initial data load
    useEffect(() => {
        if (isConnected) {
            Promise.all([
                fetchContractState(),
                fetchUserData(),
                checkHealth()
            ]);
        }
    }, [isConnected, fetchContractState, fetchUserData, checkHealth]);

    // Cleanup
    useEffect(() => {
        return () => {
            disableRealTimeUpdates();
        };
    }, [disableRealTimeUpdates]); return {
        // State
        contractState,
        userData,
        loading,
        error,
        isHealthy,
        realTimeEnabled,

        // Actions
        fetchContractState,
        fetchUserData,
        checkHealth,
        fetchContractStats,
        refreshContractStats,

        // Permission management
        grantPermission,
        updatePermission,
        revokePermission,

        // Session management
        createSession,
        activateSession,
        deactivateSession,

        // Transfer operations
        triggerTransfer,

        // Utilities
        estimateGas,
        simulateTransaction,

        // Real-time updates
        enableRealTimeUpdates,
        disableRealTimeUpdates,        // Helpers
        refreshData: useCallback(() => {
            return Promise.all([
                fetchContractState(),
                address ? fetchUserData() : Promise.resolve(),
                checkHealth()
            ]);
        }, [fetchContractState, fetchUserData, checkHealth, address])
    };
}
