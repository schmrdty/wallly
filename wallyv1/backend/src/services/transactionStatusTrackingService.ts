import { createPublicClient, http, decodeEventLog } from 'viem';
import { base } from 'viem/chains';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';
import wallyv1Abi from '../abis/wallyv1.json' with { type: 'json' };
import { notificationService } from './notificationService.js';
import { enhancedEventMonitoringService } from './enhancedEventMonitoringService.js';

export interface TransactionStatus {
    hash: string;
    status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'timeout' | 'unknown';
    blockNumber?: bigint;
    blockHash?: string;
    transactionIndex?: number;
    gasUsed?: bigint;
    effectiveGasPrice?: bigint;
    logs?: any[];
    createdAt: number;
    updatedAt: number;
    confirmations?: number;
    estimatedConfirmationTime?: number;
    userAddress?: string;
    contractAddress?: string;
    method?: string;
    value?: string;
    gasLimit?: string;
    gasPrice?: string;
    nonce?: number;
    from?: string;
    to?: string;
    data?: string;
    error?: string;
    events?: any[];
    retryCount: number;
    lastRetryAt?: number;
    maxRetries: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'permission' | 'transfer' | 'session' | 'admin' | 'other';
    metadata?: Record<string, any>;
}

export interface TransactionTrackingConfig {
    maxRetries: number;
    retryInterval: number;
    timeoutDuration: number;
    confirmationBlocks: number;
    enableRealTimeTracking: boolean;
    enableNotifications: boolean;
    batchSize: number;
    cleanupInterval: number;
    retentionPeriod: number;
}

export interface TransactionBatch {
    id: string;
    transactions: string[];
    status: 'pending' | 'completed' | 'failed' | 'partial';
    createdAt: number;
    completedAt?: number | null;
    successCount: number;
    failureCount: number;
    userId?: string;
    metadata?: Record<string, any>;
}

class TransactionStatusTrackingService {
    private isTracking = false;
    private trackingInterval?: NodeJS.Timeout;
    private config: TransactionTrackingConfig;
    private client = createPublicClient({
        chain: base,
        transport: http(process.env.NEXT_PUBLIC_RPC_URL_1 || process.env.RPC_URL),
    });

    constructor() {
        this.config = {
            maxRetries: parseInt(process.env.TX_MAX_RETRIES || '5'),
            retryInterval: parseInt(process.env.TX_RETRY_INTERVAL || '5000'), // 5 seconds
            timeoutDuration: parseInt(process.env.TX_TIMEOUT || '300000'), // 5 minutes
            confirmationBlocks: parseInt(process.env.TX_CONFIRMATION_BLOCKS || '3'),
            enableRealTimeTracking: process.env.TX_REAL_TIME_TRACKING !== 'false',
            enableNotifications: process.env.TX_NOTIFICATIONS !== 'false',
            batchSize: parseInt(process.env.TX_BATCH_SIZE || '50'),
            cleanupInterval: parseInt(process.env.TX_CLEANUP_INTERVAL || '3600000'), // 1 hour
            retentionPeriod: parseInt(process.env.TX_RETENTION_PERIOD || '2592000000'), // 30 days
        };
    }

    /**
     * Start transaction status tracking service
     */
    async startTracking(): Promise<void> {
        if (this.isTracking) {
            logger.warn('Transaction tracking already running');
            return;
        }

        try {
            this.isTracking = true;

            // Start periodic tracking
            this.trackingInterval = setInterval(async () => {
                await this.processTrackingQueue();
            }, this.config.retryInterval);

            // Start cleanup interval
            setInterval(async () => {
                await this.cleanupOldTransactions();
            }, this.config.cleanupInterval);

            logger.info('✅ Transaction status tracking service started');
        } catch (error) {
            logger.error('Failed to start transaction tracking:', error);
            this.isTracking = false;
            throw error;
        }
    }

    /**
     * Stop transaction status tracking service
     */
    stopTracking(): void {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = undefined;
        }
        this.isTracking = false;
        logger.info('Transaction status tracking service stopped');
    }

    /**
     * Track a new transaction
     */
    async trackTransaction(
        hash: string,
        userAddress?: string,
        category: TransactionStatus['category'] = 'other',
        priority: TransactionStatus['priority'] = 'medium',
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            const existingTx = await this.getTransactionStatus(hash);
            if (existingTx && existingTx.status !== 'pending') {
                logger.debug(`Transaction ${hash} already tracked with status: ${existingTx.status}`);
                return;
            }

            const transaction: TransactionStatus = {
                hash,
                status: 'pending',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                userAddress,
                category,
                priority,
                metadata,
                retryCount: 0,
                maxRetries: this.config.maxRetries,
            };

            // Try to get initial transaction data
            try {
                const txData = await this.client.getTransaction({ hash: hash as `0x${string}` });
                transaction.from = txData.from;
                transaction.to = txData.to || undefined;
                transaction.value = txData.value?.toString();
                transaction.gasLimit = txData.gas?.toString();
                transaction.gasPrice = txData.gasPrice?.toString();
                transaction.nonce = txData.nonce;
                transaction.data = txData.input;
                transaction.contractAddress = txData.to || undefined;

                // Decode method if it's a contract call
                if (txData.input && txData.input !== '0x') {
                    transaction.method = this.decodeMethodFromData(txData.input);
                }
            } catch (error) {
                logger.debug(`Could not fetch initial transaction data for ${hash}:`, error);
            }

            await this.storeTransactionStatus(transaction);

            // Add to tracking queue
            await this.addToTrackingQueue(hash, priority);

            logger.info(`Started tracking transaction: ${hash} (category: ${category}, priority: ${priority})`);

            // Send notification if enabled
            if (this.config.enableNotifications && userAddress) {
                await notificationService.sendInAppNotification(
                    userAddress,
                    'Transaction Submitted',
                    `Transaction ${hash.substring(0, 10)}... is being tracked`
                );
            }
        } catch (error) {
            logger.error(`Failed to track transaction ${hash}:`, error);
            throw error;
        }
    }

    /**
     * Track a batch of transactions
     */
    async trackTransactionBatch(
        hashes: string[],
        userAddress?: string,
        category: TransactionStatus['category'] = 'other',
        priority: TransactionStatus['priority'] = 'medium',
        metadata?: Record<string, any>
    ): Promise<string> {
        try {
            const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const batch: TransactionBatch = {
                id: batchId,
                transactions: hashes,
                status: 'pending',
                createdAt: Date.now(),
                successCount: 0,
                failureCount: 0,
                metadata,
            };

            // Track individual transactions
            for (const hash of hashes) {
                await this.trackTransaction(hash, userAddress, category, priority, {
                    ...metadata,
                    batchId,
                });
            }

            await this.storeBatch(batch);
            logger.info(`Started tracking transaction batch ${batchId} with ${hashes.length} transactions`);

            return batchId;
        } catch (error) {
            logger.error('Failed to track transaction batch:', error);
            throw error;
        }
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(hash: string): Promise<TransactionStatus | null> {
        try {
            const data = await redisClient.get(`tx_status:${hash}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Failed to get transaction status for ${hash}:`, error);
            return null;
        }
    }

    /**
     * Get batch status
     */
    async getBatchStatus(batchId: string): Promise<TransactionBatch | null> {
        try {
            const data = await redisClient.get(`tx_batch:${batchId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Failed to get batch status for ${batchId}:`, error);
            return null;
        }
    }

    /**
     * Get user's transaction history
     */
    async getUserTransactions(
        userAddress: string,
        status?: TransactionStatus['status'],
        category?: TransactionStatus['category'],
        limit = 50,
        offset = 0
    ): Promise<TransactionStatus[]> {
        try {
            const pattern = `tx_status:*`;
            const keys = await redisClient.keys(pattern);
            const transactions: TransactionStatus[] = [];

            // Get all transactions and filter
            for (const key of keys.slice(offset, offset + limit)) {
                const data = await redisClient.get(key);
                if (data) {
                    const tx: TransactionStatus = JSON.parse(data);
                    if (tx.userAddress === userAddress) {
                        if (!status || tx.status === status) {
                            if (!category || tx.category === category) {
                                transactions.push(tx);
                            }
                        }
                    }
                }
            }

            // Sort by creation time (newest first)
            return transactions.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            logger.error(`Failed to get user transactions for ${userAddress}:`, error);
            return [];
        }
    }

    /**
     * Get transaction statistics
     */
    async getTransactionStats(userAddress?: string): Promise<{
        total: number;
        pending: number;
        confirmed: number;
        failed: number;
        byCategory: Record<string, number>;
        byPriority: Record<string, number>;
        avgConfirmationTime: number;
        recentActivity: TransactionStatus[];
    }> {
        try {
            const pattern = `tx_status:*`;
            const keys = await redisClient.keys(pattern);

            let total = 0;
            let pending = 0;
            let confirmed = 0;
            let failed = 0;
            const byCategory: Record<string, number> = {};
            const byPriority: Record<string, number> = {};
            const confirmationTimes: number[] = [];
            const recentActivity: TransactionStatus[] = [];

            for (const key of keys) {
                const data = await redisClient.get(key);
                if (data) {
                    const tx: TransactionStatus = JSON.parse(data);

                    // Filter by user if specified
                    if (userAddress && tx.userAddress !== userAddress) {
                        continue;
                    }

                    total++;

                    // Count by status
                    if (tx.status === 'pending') pending++;
                    else if (tx.status === 'confirmed') confirmed++;
                    else if (tx.status === 'failed') failed++;

                    // Count by category
                    byCategory[tx.category] = (byCategory[tx.category] || 0) + 1;

                    // Count by priority
                    byPriority[tx.priority] = (byPriority[tx.priority] || 0) + 1;

                    // Calculate confirmation time
                    if (tx.status === 'confirmed' && tx.estimatedConfirmationTime) {
                        confirmationTimes.push(tx.estimatedConfirmationTime);
                    }

                    // Recent activity (last 24 hours)
                    if (Date.now() - tx.updatedAt < 24 * 60 * 60 * 1000) {
                        recentActivity.push(tx);
                    }
                }
            }

            const avgConfirmationTime = confirmationTimes.length > 0
                ? confirmationTimes.reduce((a, b) => a + b, 0) / confirmationTimes.length
                : 0;

            return {
                total,
                pending,
                confirmed,
                failed,
                byCategory,
                byPriority,
                avgConfirmationTime,
                recentActivity: recentActivity.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10),
            };
        } catch (error) {
            logger.error('Failed to get transaction stats:', error);
            return {
                total: 0,
                pending: 0,
                confirmed: 0,
                failed: 0,
                byCategory: {},
                byPriority: {},
                avgConfirmationTime: 0,
                recentActivity: [],
            };
        }
    }

    /**
     * Process the tracking queue
     */
    private async processTrackingQueue(): Promise<void> {
        try {
            const queueKey = 'tx_tracking_queue';
            const priorityQueues = ['critical', 'high', 'medium', 'low'];

            for (const priority of priorityQueues) {
                const transactions = await redisClient.lRange(`${queueKey}:${priority}`, 0, this.config.batchSize - 1);

                if (transactions.length === 0) continue;

                // Process transactions in parallel (with concurrency limit)
                const promises = transactions.map(hash => this.updateTransactionStatus(hash));
                await Promise.allSettled(promises);

                // Remove processed transactions from queue
                await redisClient.lTrim(`${queueKey}:${priority}`, transactions.length, -1);
            }
        } catch (error) {
            logger.error('Error processing tracking queue:', error);
        }
    }

    /**
     * Update transaction status
     */
    private async updateTransactionStatus(hash: string): Promise<void> {
        try {
            const transaction = await this.getTransactionStatus(hash);
            if (!transaction || transaction.status !== 'pending') {
                return;
            }

            // Check if transaction has timed out
            if (Date.now() - transaction.createdAt > this.config.timeoutDuration) {
                transaction.status = 'timeout';
                transaction.updatedAt = Date.now();
                await this.storeTransactionStatus(transaction);
                await this.notifyStatusChange(transaction);
                return;
            } try {
                // Get transaction receipt
                const receipt = await this.client.getTransactionReceipt({
                    hash: hash as `0x${string}`
                });

                // Update transaction with receipt data
                transaction.blockNumber = receipt.blockNumber;
                transaction.blockHash = receipt.blockHash;
                transaction.transactionIndex = receipt.transactionIndex;
                transaction.gasUsed = receipt.gasUsed;
                transaction.effectiveGasPrice = receipt.effectiveGasPrice;
                transaction.logs = receipt.logs;
                transaction.updatedAt = Date.now();

                // Check if transaction was successful
                if (receipt.status === 'success') {
                    transaction.status = 'confirmed';
                    transaction.estimatedConfirmationTime = Date.now() - transaction.createdAt;

                    // Decode and store contract events
                    if (receipt.logs.length > 0) {
                        transaction.events = await this.decodeTransactionEvents(receipt.logs);
                    }

                    // Get current block number for confirmations
                    const currentBlock = await this.client.getBlockNumber();
                    transaction.confirmations = Number(currentBlock - receipt.blockNumber);

                } else {
                    transaction.status = 'failed';
                    transaction.error = 'Transaction failed';
                }

                await this.storeTransactionStatus(transaction);
                await this.notifyStatusChange(transaction);
                await this.updateBatchStatus(transaction);

            } catch (receiptError: any) {
                // Transaction might still be pending
                if (receiptError.message?.includes('not found')) {
                    // Increment retry count
                    transaction.retryCount++;
                    transaction.lastRetryAt = Date.now();

                    if (transaction.retryCount >= transaction.maxRetries) {
                        transaction.status = 'timeout';
                        transaction.error = 'Max retries exceeded';
                        await this.storeTransactionStatus(transaction);
                        await this.notifyStatusChange(transaction);
                    } else {
                        // Re-add to queue for retry
                        await this.addToTrackingQueue(hash, transaction.priority);
                    }
                } else {
                    logger.error(`Error getting receipt for ${hash}:`, receiptError);
                    transaction.retryCount++;
                    if (transaction.retryCount >= transaction.maxRetries) {
                        transaction.status = 'failed';
                        transaction.error = receiptError.message;
                        await this.storeTransactionStatus(transaction);
                        await this.notifyStatusChange(transaction);
                    }
                }
            }
        } catch (error) {
            logger.error(`Failed to update transaction status for ${hash}:`, error);
        }
    }

    /**
     * Decode transaction events
     */
    private async decodeTransactionEvents(logs: any[]): Promise<any[]> {
        const events: any[] = [];

        for (const log of logs) {
            try {
                // Try to decode with WallyV1 ABI
                const decoded = decodeEventLog({
                    abi: wallyv1Abi,
                    data: log.data,
                    topics: log.topics,
                });

                events.push({
                    eventName: decoded.eventName,
                    args: decoded.args,
                    address: log.address,
                    blockNumber: log.blockNumber,
                    transactionHash: log.transactionHash,
                    logIndex: log.logIndex,
                });

                // Also send to enhanced event monitoring service
                await enhancedEventMonitoringService.processExternalEventLog({
                    address: log.address,
                    topics: log.topics,
                    data: log.data,
                    blockNumber: Number(log.blockNumber),
                    transactionHash: log.transactionHash,
                    logIndex: log.logIndex,
                    eventName: 'TransactionEvent' // Provide default event name
                });

            } catch (error) {
                // Event might not be from our contract or might be a different event
                logger.debug(`Could not decode event log:`, error);
            }
        }

        return events;
    }

    /**
     * Notify about status changes
     */
    private async notifyStatusChange(transaction: TransactionStatus): Promise<void> {
        if (!this.config.enableNotifications || !transaction.userAddress) {
            return;
        }

        try {
            let title = '';
            let message = '';
            const txShort = transaction.hash.substring(0, 10);

            switch (transaction.status) {
                case 'confirmed':
                    title = 'Transaction Confirmed';
                    message = `Transaction ${txShort}... was successful`;
                    break;
                case 'failed':
                    title = 'Transaction Failed';
                    message = `Transaction ${txShort}... failed${transaction.error ? `: ${transaction.error}` : ''}`;
                    break;
                case 'timeout':
                    title = 'Transaction Timeout';
                    message = `Transaction ${txShort}... timed out`;
                    break;
                default:
                    return; // Don't notify for other statuses
            }

            await notificationService.sendInAppNotification(
                transaction.userAddress,
                title,
                message
            );
        } catch (error) {
            logger.error('Failed to send transaction status notification:', error);
        }
    }

    /**
     * Update batch status
     */
    private async updateBatchStatus(transaction: TransactionStatus): Promise<void> {
        const batchId = transaction.metadata?.batchId;
        if (!batchId) return;

        try {
            const batch = await this.getBatchStatus(batchId);
            if (!batch) return;

            // Update counters
            if (transaction.status === 'confirmed') {
                batch.successCount++;
            } else if (transaction.status === 'failed' || transaction.status === 'timeout') {
                batch.failureCount++;
            }

            // Check if batch is complete
            const totalProcessed = batch.successCount + batch.failureCount;
            if (totalProcessed === batch.transactions.length) {
                batch.status = batch.failureCount === 0 ? 'completed' :
                    batch.successCount === 0 ? 'failed' : 'partial';
                batch.completedAt = Date.now();
            }

            await this.storeBatch(batch);
        } catch (error) {
            logger.error(`Failed to update batch status for ${batchId}:`, error);
        }
    }

    /**
     * Add transaction to tracking queue
     */
    private async addToTrackingQueue(hash: string, priority: TransactionStatus['priority']): Promise<void> {
        const queueKey = `tx_tracking_queue:${priority}`;
        await redisClient.rPush(queueKey, [hash]);
    }

    /**
     * Store transaction status
     */
    private async storeTransactionStatus(transaction: TransactionStatus): Promise<void> {
        const key = `tx_status:${transaction.hash}`;
        await redisClient.setEx(key, this.config.retentionPeriod / 1000, JSON.stringify(transaction));
    }

    /**
     * Store batch information
     */
    private async storeBatch(batch: TransactionBatch): Promise<void> {
        const key = `tx_batch:${batch.id}`;
        await redisClient.setEx(key, this.config.retentionPeriod / 1000, JSON.stringify(batch));
    }

    /**
     * Decode method from transaction data
     */
    private decodeMethodFromData(data: string): string {
        try {
            const methodSelector = data.substring(0, 10);

            // Common method selectors for WallyV1 contract
            const methodMap: Record<string, string> = {
                '0xa9059cbb': 'transfer',
                '0x23b872dd': 'transferFrom',
                '0x095ea7b3': 'approve',
                '0x8da5cb5b': 'owner',
                '0x70a08231': 'balanceOf',
                // Add more method selectors as needed
            };

            return methodMap[methodSelector] || 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Clean up old transactions
     */
    private async cleanupOldTransactions(): Promise<void> {
        try {
            const pattern = 'tx_status:*';
            const keys = await redisClient.keys(pattern);
            const cutoffTime = Date.now() - this.config.retentionPeriod;

            let cleanedCount = 0;

            for (const key of keys) {
                const data = await redisClient.get(key);
                if (data) {
                    const transaction: TransactionStatus = JSON.parse(data);
                    if (transaction.updatedAt < cutoffTime) {
                        await redisClient.del(key);
                        cleanedCount++;
                    }
                }
            }

            if (cleanedCount > 0) {
                logger.info(`Cleaned up ${cleanedCount} old transactions`);
            }
        } catch (error) {
            logger.error('Error during transaction cleanup:', error);
        }
    }

    /**
     * Get service health status
     */
    async getServiceHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        isTracking: boolean;
        queueSizes: Record<string, number>;
        totalTracked: number;
        lastProcessedAt?: number;
    }> {
        try {
            const queueSizes: Record<string, number> = {};
            const priorities = ['critical', 'high', 'medium', 'low'];

            for (const priority of priorities) {
                const size = await redisClient.lLen(`tx_tracking_queue:${priority}`);
                queueSizes[priority] = size;
            }

            const totalTracked = await redisClient.keys('tx_status:*').then(keys => keys.length);

            const status = this.isTracking ? 'healthy' : 'degraded';

            return {
                status,
                isTracking: this.isTracking,
                queueSizes,
                totalTracked,
                lastProcessedAt: Date.now(),
            };
        } catch (error) {
            logger.error('Failed to get service health:', error);
            return {
                status: 'unhealthy',
                isTracking: false,
                queueSizes: {},
                totalTracked: 0,
            };
        }
    }

    /**
     * Create a new transaction batch
     */
    async createBatch(batchId: string, transactionCount: number, userId?: string): Promise<void> {
        const batch: TransactionBatch = {
            id: batchId,
            transactions: [],
            status: 'pending',
            createdAt: Date.now(),
            completedAt: null,
            successCount: 0,
            failureCount: 0,
            userId,
            metadata: {
                expectedCount: transactionCount,
                currentCount: 0
            }
        };

        await this.storeBatch(batch);
        logger.info(`Created transaction batch: ${batchId} with expected ${transactionCount} transactions`);
    }

    /**
     * Add transaction to batch
     */
    async addTransactionToBatch(batchId: string, txHash: string): Promise<void> {
        try {
            const batch = await this.getBatchStatus(batchId);
            if (!batch) {
                logger.warn(`Batch ${batchId} not found when trying to add transaction ${txHash}`);
                return;
            }

            batch.transactions.push(txHash);
            if (batch.metadata) {
                batch.metadata.currentCount = batch.transactions.length;
            }

            await this.storeBatch(batch);
            logger.info(`Added transaction ${txHash} to batch ${batchId}`);
        } catch (error) {
            logger.error(`Failed to add transaction ${txHash} to batch ${batchId}:`, error);
        }
    }
}

export const transactionStatusTrackingService = new TransactionStatusTrackingService();
