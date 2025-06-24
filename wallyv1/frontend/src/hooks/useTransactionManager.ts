import { useState, useCallback, useRef, useEffect } from 'react';
import { contractClient } from '../utils/contractClient.ts';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';

export interface TransactionRequest {
    id: string;
    type: 'permission' | 'session' | 'transfer' | 'batch' | 'meta';
    operation: string;
    params: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    gasEstimate?: bigint;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    hash?: string;
    error?: string;
    createdAt: number;
    updatedAt: number;
}

export interface BatchTransactionRequest {
    transactions: Omit<TransactionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    failureStrategy: 'fail_fast' | 'continue' | 'retry';
}

export function useTransactionManager() {
    const { address, isConnected } = useAccount();
    const [transactions, setTransactions] = useState<TransactionRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Real-time tracking
    const trackingInterval = useRef<NodeJS.Timeout | null>(null);
    const [isTracking, setIsTracking] = useState(false);

    // Add transaction to queue
    const addTransaction = useCallback((
        type: TransactionRequest['type'],
        operation: string,
        params: any,
        priority: TransactionRequest['priority'] = 'medium'
    ): string => {
        const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const transaction: TransactionRequest = {
            id,
            type,
            operation,
            params,
            priority,
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        setTransactions(prev => [...prev, transaction]);
        return id;
    }, []);

    // Execute single transaction
    const executeTransaction = useCallback(async (transactionId: string) => {
        if (!address) throw new Error('Wallet not connected');

        const transaction = transactions.find(tx => tx.id === transactionId);
        if (!transaction) throw new Error('Transaction not found');

        try {
            setLoading(true);

            // Update status to processing
            setTransactions(prev => prev.map(tx =>
                tx.id === transactionId
                    ? { ...tx, status: 'processing', updatedAt: Date.now() }
                    : tx
            ));

            let result: any;

            // Route to appropriate contract method based on type and operation
            switch (transaction.type) {
                case 'permission': if (transaction.operation === 'grant') {
                    // Convert string arrays back to bigint arrays if needed
                    const params = { ...transaction.params };
                    if (params.minBalances && Array.isArray(params.minBalances)) {
                        params.minBalances = params.minBalances.map((b: any) =>
                            typeof b === 'string' ? b : b.toString()
                        );
                    }
                    if (params.limits && Array.isArray(params.limits)) {
                        params.limits = params.limits.map((l: any) =>
                            typeof l === 'string' ? l : l.toString()
                        );
                    }
                    if (params.expiresAt && typeof params.expiresAt !== 'string') {
                        params.expiresAt = params.expiresAt.toString();
                    }

                    result = await contractClient.grantPermission({
                        user: address,
                        ...params
                    });
                } else if (transaction.operation === 'update') {
                    // Convert string arrays back to bigint arrays if needed
                    const params = { ...transaction.params };
                    if (params.minBalances && Array.isArray(params.minBalances)) {
                        params.minBalances = params.minBalances.map((b: any) =>
                            typeof b === 'string' ? BigInt(b) : b
                        );
                    }
                    if (params.limits && Array.isArray(params.limits)) {
                        params.limits = params.limits.map((l: any) =>
                            typeof l === 'string' ? BigInt(l) : l
                        );
                    }
                    if (params.expiresAt && typeof params.expiresAt === 'string') {
                        params.expiresAt = BigInt(params.expiresAt);
                    }

                    result = await contractClient.updatePermission({
                        user: address,
                        ...params
                    });
                } else if (transaction.operation === 'revoke') {
                    result = await contractClient.revokePermission({
                        user: address,
                        ...transaction.params
                    });
                }
                    break;

                case 'session':
                    if (transaction.operation === 'create') {
                        result = await contractClient.createMiniAppSession({
                            user: address,
                            ...transaction.params
                        });
                    } else if (transaction.operation === 'activate') {
                        result = await contractClient.activateSession({
                            user: address,
                            ...transaction.params
                        });
                    } else if (transaction.operation === 'deactivate') {
                        result = await contractClient.deactivateSession({
                            user: address,
                            ...transaction.params
                        });
                    }
                    break;

                case 'transfer':
                    if (transaction.operation === 'trigger') {
                        result = await contractClient.triggerTransfer({
                            user: address,
                            ...transaction.params
                        });
                    } else if (transaction.operation === 'miniapp_trigger') {
                        result = await contractClient.triggerMiniAppTransfer({
                            user: address,
                            ...transaction.params
                        });
                    }
                    break;

                case 'batch':
                    result = await contractClient.executeBatch({
                        user: address,
                        ...transaction.params
                    });
                    break;

                case 'meta':
                    result = await contractClient.executeMetaTransaction({
                        user: address,
                        ...transaction.params
                    });
                    break;

                default:
                    throw new Error(`Unknown transaction type: ${transaction.type}`);
            }

            // Update transaction with success
            setTransactions(prev => prev.map(tx =>
                tx.id === transactionId
                    ? {
                        ...tx,
                        status: 'completed',
                        hash: result.transactionHash,
                        updatedAt: Date.now()
                    }
                    : tx
            ));

            setError(null);
            return result;

        } catch (err: any) {
            // Update transaction with failure
            setTransactions(prev => prev.map(tx =>
                tx.id === transactionId
                    ? {
                        ...tx,
                        status: 'failed',
                        error: err.message || 'Transaction failed',
                        updatedAt: Date.now()
                    }
                    : tx
            ));

            setError(err.message || 'Transaction failed');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [address, transactions]);

    // Execute batch transactions
    const executeBatch = useCallback(async (batchRequest: BatchTransactionRequest) => {
        if (!address) throw new Error('Wallet not connected');

        try {
            setLoading(true);

            // Add all transactions to queue
            const transactionIds = batchRequest.transactions.map(tx =>
                addTransaction(tx.type, tx.operation, tx.params, batchRequest.priority)
            );

            // Execute batch on contract
            const result = await contractClient.executeBatch({
                user: address,
                transactions: batchRequest.transactions.map(tx => ({
                    operation: tx.operation,
                    params: tx.params
                })),
                priority: batchRequest.priority,
                failureStrategy: batchRequest.failureStrategy
            });

            // Update all transactions with batch result
            setTransactions(prev => prev.map(tx => {
                if (transactionIds.includes(tx.id)) {
                    const batchResult = result.results?.find((r: any) => r.operation === tx.operation);
                    return {
                        ...tx,
                        status: batchResult?.success ? 'completed' : 'failed',
                        hash: batchResult?.transactionHash,
                        error: batchResult?.error,
                        updatedAt: Date.now()
                    };
                }
                return tx;
            }));

            setError(null);
            return result;

        } catch (err: any) {
            setError(err.message || 'Batch execution failed');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [address, addTransaction]);

    // Cancel transaction
    const cancelTransaction = useCallback(async (transactionId: string) => {
        const transaction = transactions.find(tx => tx.id === transactionId);
        if (!transaction) throw new Error('Transaction not found');

        if (transaction.status === 'processing') {
            // If transaction is processing, try to cancel on backend
            try {
                await contractClient.cancelTransaction({ transactionId });
            } catch (err) {
                console.warn('Failed to cancel transaction on backend:', err);
            }
        }

        // Update local status
        setTransactions(prev => prev.map(tx =>
            tx.id === transactionId
                ? { ...tx, status: 'cancelled', updatedAt: Date.now() }
                : tx
        ));
    }, [transactions]);

    // Get transaction status
    const getTransactionStatus = useCallback(async (transactionId: string) => {
        try {
            const status = await contractClient.getTransactionStatus({ transactionId });            // Update local transaction with latest status
            setTransactions(prev => prev.map(tx =>
                tx.id === transactionId
                    ? {
                        ...tx,
                        status: (status.status as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled') || tx.status,
                        hash: status.hash || tx.hash,
                        error: status.error || tx.error,
                        updatedAt: Date.now()
                    }
                    : tx
            ));

            return status;
        } catch (err: any) {
            setError(err.message || 'Failed to get transaction status');
            throw err;
        }
    }, []);

    // Estimate gas for transaction
    const estimateGas = useCallback(async (
        type: TransactionRequest['type'],
        operation: string,
        params: any
    ) => {
        try {
            const estimate = await contractClient.estimateGas({
                operation: `${type}_${operation}`,
                params
            });            // Handle both possible return types from estimateGas
            if (estimate && typeof estimate === 'object') {
                // Check for direct gasEstimate property (plain object response)
                if ('gasEstimate' in estimate && !('success' in estimate)) {
                    const gasObj = estimate as { gasEstimate: bigint };
                    return gasObj.gasEstimate;
                }
                // Check for ApiResponse format
                if ('success' in estimate && 'data' in estimate) {
                    const apiResponse = estimate as any;
                    if (apiResponse.success && apiResponse.data && 'gasEstimate' in apiResponse.data) {
                        return BigInt(apiResponse.data.gasEstimate);
                    }
                    // Check for error in ApiResponse
                    if (!apiResponse.success) {
                        throw new Error(apiResponse.error || 'Gas estimation failed');
                    }
                }
            }

            throw new Error('Invalid gas estimate response format');
        } catch (err: any) {
            setError(err.message || 'Gas estimation failed');
            throw err;
        }
    }, []);

    // Simulate transaction
    const simulateTransaction = useCallback(async (
        type: TransactionRequest['type'],
        operation: string,
        params: any
    ) => {
        try {
            return await contractClient.simulateTransaction({
                operation: `${type}_${operation}`,
                params
            });
        } catch (err: any) {
            setError(err.message || 'Transaction simulation failed');
            throw err;
        }
    }, []);

    // Start real-time tracking
    const startTracking = useCallback(() => {
        if (isTracking) return;

        setIsTracking(true);
        trackingInterval.current = setInterval(async () => {
            // Check status of processing transactions
            const processingTxs = transactions.filter(tx =>
                tx.status === 'processing' || tx.status === 'pending'
            );

            for (const tx of processingTxs) {
                try {
                    await getTransactionStatus(tx.id);
                } catch (err) {
                    console.warn(`Failed to update status for transaction ${tx.id}:`, err);
                }
            }
        }, 5000); // Check every 5 seconds
    }, [isTracking, transactions, getTransactionStatus]);

    // Stop real-time tracking
    const stopTracking = useCallback(() => {
        setIsTracking(false);
        if (trackingInterval.current) {
            clearInterval(trackingInterval.current);
            trackingInterval.current = null;
        }
    }, []);

    // Clear completed/failed transactions
    const clearTransactions = useCallback((statuses: TransactionRequest['status'][] = ['completed', 'failed', 'cancelled']) => {
        setTransactions(prev => prev.filter(tx => !statuses.includes(tx.status)));
    }, []);

    // Get transactions by status
    const getTransactionsByStatus = useCallback((status: TransactionRequest['status']) => {
        return transactions.filter(tx => tx.status === status);
    }, [transactions]);

    // Get transactions by type
    const getTransactionsByType = useCallback((type: TransactionRequest['type']) => {
        return transactions.filter(tx => tx.type === type);
    }, [transactions]);

    // Auto-start tracking when connected
    useEffect(() => {
        if (isConnected && !isTracking) {
            startTracking();
        } else if (!isConnected && isTracking) {
            stopTracking();
        }
    }, [isConnected, isTracking, startTracking, stopTracking]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTracking();
        };
    }, [stopTracking]);

    return {
        // State
        transactions,
        loading,
        error,
        isTracking,

        // Transaction management
        addTransaction,
        executeTransaction,
        executeBatch,
        cancelTransaction,
        getTransactionStatus,

        // Utilities
        estimateGas,
        simulateTransaction,

        // Tracking control
        startTracking,
        stopTracking,

        // Transaction queries
        getTransactionsByStatus,
        getTransactionsByType,
        clearTransactions,

        // Computed properties
        pendingTransactions: getTransactionsByStatus('pending'),
        processingTransactions: getTransactionsByStatus('processing'),
        completedTransactions: getTransactionsByStatus('completed'),
        failedTransactions: getTransactionsByStatus('failed'),
        totalTransactions: transactions.length,
        hasActiveTransactions: transactions.some(tx =>
            tx.status === 'pending' || tx.status === 'processing'
        )
    };
}
