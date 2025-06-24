// Enhanced Subscription Management Service with Error Handling and Fallbacks
import { WallyService } from './wallyService.js';
import { SubscriptionConfig } from '../types/automation.js';
import cron, { ScheduledTask } from 'node-cron';
import logger from '../infra/mon/logger.js';
import redisClient from '../db/redisClient.js';
import {
    validateSubscriptionConfig,
    calculateNextPaymentDate,
    checkSubscriptionHealth
} from '../utils/subscriptionManagementHelpers.js';

interface SubscriptionError {
    id: string;
    error: string;
    timestamp: number;
    retryCount: number;
    nextRetry?: number;
}

export class EnhancedSubscriptionManager {
    private cronJobs = new Map<string, ScheduledTask>();
    private failedSubscriptions = new Map<string, SubscriptionError>();
    private maxRetries = 3;
    private retryDelayMinutes = 5;

    constructor(private wallyService: WallyService) { }

    async scheduleSubscription(config: SubscriptionConfig): Promise<boolean> {
        try {
            // Validate configuration
            const validation = validateSubscriptionConfig(config);
            if (!validation.isValid) {
                logger.error(`Invalid subscription config: ${validation.errors.join(', ')}`);
                return false;
            }

            // Stop existing job if any
            this.stopSubscription(config.id);

            // Create cron expression
            const cronExpression = this.getCronExpression(config.metadata);
            if (!cron.validate(cronExpression)) {
                logger.error(`Invalid cron expression: ${cronExpression}`);
                return false;
            }            // Schedule the job
            const task = cron.schedule(cronExpression, async () => {
                await this.executeSubscriptionPayment(config);
            }, {
                timezone: 'UTC'
            });

            // Start the task
            task.start();
            this.cronJobs.set(config.id, task);

            // Store in Redis for persistence
            await this.persistSubscription(config);

            logger.info(`Subscription ${config.id} scheduled successfully`);
            return true;

        } catch (error: any) {
            logger.error(`Failed to schedule subscription ${config.id}:`, error);
            return false;
        }
    }

    async executeSubscriptionPayment(config: SubscriptionConfig): Promise<void> {
        const startTime = Date.now();
        let success = false;

        try {
            logger.info(`Executing subscription payment for ${config.id}`);            // Validate permissions
            const hasPermission = await this.wallyService.validatePermissions(config.walletAddress);
            if (!hasPermission) {
                throw new Error('User permissions expired or invalid');
            }

            // Get wallet balance

            // Check balance before execution
            const balance = await this.wallyService.getBalance(config.walletAddress, config.metadata.tokenAddress);
            const requiredAmount = parseFloat(config.metadata.amount);

            if (balance < requiredAmount) {
                throw new Error(`Insufficient balance: ${balance} < ${requiredAmount}`);
            }

            // Execute the transfer
            const result = await this.wallyService.executeTransfer({
                wallet: config.walletAddress,
                token: config.metadata.tokenAddress || '0x0000000000000000000000000000000000000000',
                recipient: config.metadata.recipientAddress,
                amount: config.metadata.amount
            });

            // Post-execution validation
            if (!result || !result.txHash) {
                throw new Error('Transfer execution failed - no transaction hash returned');
            }

            // Update payment history
            await this.recordSuccessfulPayment(config, result);

            // Clear any previous failures
            this.failedSubscriptions.delete(config.id);

            success = true;
            logger.info(`Subscription payment ${config.id} completed successfully in ${Date.now() - startTime}ms`);

        } catch (error: any) {
            logger.error(`Subscription payment ${config.id} failed:`, error);
            await this.handlePaymentFailure(config, error);
        } finally {
            // Record execution metrics
            await this.recordExecutionMetrics(config.id, success, Date.now() - startTime);
        }
    }

    private async handlePaymentFailure(config: SubscriptionConfig, error: Error): Promise<void> {
        const failureData = this.failedSubscriptions.get(config.id) || {
            id: config.id,
            error: error.message,
            timestamp: Date.now(),
            retryCount: 0
        };

        failureData.retryCount++;
        failureData.timestamp = Date.now();
        failureData.error = error.message;

        if (failureData.retryCount <= this.maxRetries) {
            // Schedule retry
            const retryDelay = this.retryDelayMinutes * failureData.retryCount; // Exponential backoff
            failureData.nextRetry = Date.now() + (retryDelay * 60 * 1000);

            setTimeout(async () => {
                logger.info(`Retrying subscription payment ${config.id} (attempt ${failureData.retryCount})`);
                await this.executeSubscriptionPayment(config);
            }, retryDelay * 60 * 1000);

            this.failedSubscriptions.set(config.id, failureData);

        } else {
            // Max retries exceeded - disable subscription and notify
            logger.error(`Subscription ${config.id} disabled after ${this.maxRetries} failed attempts`);
            await this.disableSubscription(config.id, `Max retries exceeded: ${error.message}`);

            // TODO: Send notification to user about failed subscription
            // await this.notifyUserOfFailure(config, error);
        }

        // Store failure in Redis for monitoring
        await this.recordFailure(config.id, failureData);
    }

    async stopSubscription(id: string): Promise<boolean> {
        try {
            const job = this.cronJobs.get(id);
            if (job) {
                job.stop();
                this.cronJobs.delete(id);
            }

            // Remove from Redis
            await redisClient.del(`subscription:${id}`);

            logger.info(`Subscription ${id} stopped`);
            return true;
        } catch (error: any) {
            logger.error(`Failed to stop subscription ${id}:`, error);
            return false;
        }
    }

    async pauseSubscription(id: string): Promise<boolean> {
        try {
            const job = this.cronJobs.get(id);
            if (job) {
                job.stop();
            }

            // Mark as paused in Redis
            await redisClient.set(`subscription:${id}:paused`, 'true');

            logger.info(`Subscription ${id} paused`);
            return true;
        } catch (error: any) {
            logger.error(`Failed to pause subscription ${id}:`, error);
            return false;
        }
    }

    async resumeSubscription(id: string): Promise<boolean> {
        try {
            // Get subscription config from Redis
            const configData = await redisClient.get(`subscription:${id}`);
            if (!configData) {
                throw new Error('Subscription configuration not found');
            }

            const config: SubscriptionConfig = JSON.parse(configData);

            // Remove pause flag
            await redisClient.del(`subscription:${id}:paused`);

            // Reschedule
            return await this.scheduleSubscription(config);
        } catch (error: any) {
            logger.error(`Failed to resume subscription ${id}:`, error);
            return false;
        }
    }

    // Fallback mechanism - restart all subscriptions on service restart
    async restoreSubscriptions(): Promise<void> {
        try {
            logger.info('Restoring subscriptions from Redis...');

            const keys = await redisClient.keys('subscription:*');
            const configKeys = keys.filter(key => !key.includes(':paused') && !key.includes(':failure'));

            for (const key of configKeys) {
                try {
                    const configData = await redisClient.get(key);
                    if (configData) {
                        const config: SubscriptionConfig = JSON.parse(configData);

                        // Check if paused
                        const isPaused = await redisClient.exists(`${key}:paused`);
                        if (!isPaused) {
                            await this.scheduleSubscription(config);
                        }
                    }
                } catch (error: any) {
                    logger.error(`Failed to restore subscription ${key}:`, error);
                }
            }

            logger.info(`Restored ${configKeys.length} subscriptions`);
        } catch (error: any) {
            logger.error('Failed to restore subscriptions:', error);
        }
    }

    private getCronExpression(metadata: SubscriptionConfig['metadata']): string {
        const { frequency, dayOfMonth = 1, monthOfYear } = metadata;

        if (frequency === 'monthly') {
            return `0 0 ${dayOfMonth} * *`; // Run at midnight on specified day each month
        } else if (frequency === 'yearly') {
            const month = monthOfYear || 1;
            return `0 0 ${dayOfMonth} ${month} *`; // Run at midnight on specified day and month each year
        }

        throw new Error(`Unsupported frequency: ${frequency}`);
    }

    private async persistSubscription(config: SubscriptionConfig): Promise<void> {
        await redisClient.set(`subscription:${config.id}`, JSON.stringify(config));
        await redisClient.set(`subscription:${config.id}:lastUpdate`, Date.now().toString());
    }

    private async disableSubscription(id: string, reason: string): Promise<void> {
        await this.stopSubscription(id);
        await redisClient.set(`subscription:${id}:disabled`, JSON.stringify({
            reason,
            timestamp: Date.now()
        }));
    }

    private async recordSuccessfulPayment(config: SubscriptionConfig, result: any): Promise<void> {
        const paymentRecord = {
            subscriptionId: config.id,
            txHash: result.txHash,
            amount: config.metadata.amount,
            recipient: config.metadata.recipientAddress,
            timestamp: Date.now(),
            status: 'success'
        };

        await redisClient.lPush(`payments:${config.id}`, JSON.stringify(paymentRecord));
        await redisClient.lTrim(`payments:${config.id}`, 0, 99); // Keep last 100 payments
    }

    private async recordFailure(id: string, failure: SubscriptionError): Promise<void> {
        await redisClient.set(`subscription:${id}:failure`, JSON.stringify(failure));
    }

    private async recordExecutionMetrics(id: string, success: boolean, duration: number): Promise<void> {
        const metrics = {
            subscriptionId: id,
            success,
            duration,
            timestamp: Date.now()
        };

        await redisClient.lPush(`metrics:subscription:${id}`, JSON.stringify(metrics));
        await redisClient.lTrim(`metrics:subscription:${id}`, 0, 99); // Keep last 100 executions
    }

    // Monitoring and health check methods
    async getSubscriptionStatus(id: string) {
        const isActive = this.cronJobs.has(id);
        const isPaused = await redisClient.exists(`subscription:${id}:paused`);
        const isDisabled = await redisClient.exists(`subscription:${id}:disabled`);
        const failure = await redisClient.get(`subscription:${id}:failure`);

        return {
            id,
            active: isActive,
            paused: Boolean(isPaused),
            disabled: Boolean(isDisabled),
            lastFailure: failure ? JSON.parse(failure) : null
        };
    }

    async getFailedSubscriptions() {
        return Array.from(this.failedSubscriptions.values());
    }

    async getHealthReport() {
        const activeCount = this.cronJobs.size;
        const failedCount = this.failedSubscriptions.size;
        const pausedKeys = await redisClient.keys('subscription:*:paused');
        const disabledKeys = await redisClient.keys('subscription:*:disabled');

        return {
            active: activeCount,
            failed: failedCount,
            paused: pausedKeys.length,
            disabled: disabledKeys.length,
            uptime: process.uptime(),
            timestamp: Date.now()
        };
    }
}

// Export singleton instance
export const subscriptionManager = new EnhancedSubscriptionManager(new WallyService());
