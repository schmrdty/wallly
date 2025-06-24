import { createPublicClient, http, decodeErrorResult, type Address, type Hash } from 'viem';
import logger from '../infra/mon/logger.js';
import redisClient from '../db/redisClient.js';

export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum ErrorCategory {
    NETWORK = 'network',
    CONTRACT = 'contract',
    VALIDATION = 'validation',
    PERMISSION = 'permission',
    RATE_LIMIT = 'rate_limit',
    TIMEOUT = 'timeout',
    AUTHENTICATION = 'authentication',
    RESOURCE = 'resource',
    UNKNOWN = 'unknown'
}

export interface ContractError {
    id: string;
    type: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    context: Record<string, any>;
    timestamp: number;
    retryable: boolean;
    retryCount: number;
    maxRetries: number;
    nextRetry?: number;
    resolved: boolean;
    resolvedAt?: number;
    userAddress?: Address;
    transactionHash?: Hash;
    functionName?: string;
    blockNumber?: bigint;
}

export interface RetryStrategy {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
}

export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringWindow: number;
}

/**
 * Comprehensive Error Handling and Recovery Service
 * 
 * Provides:
 * - Error classification and categorization
 * - Retry strategies with exponential backoff
 * - Circuit breaker patterns
 * - Error tracking and analytics
 * - Recovery mechanism orchestration
 * - Alert and notification integration
 */
class ContractErrorHandler {
    private readonly DEFAULT_RETRY_STRATEGY: RetryStrategy = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true
    };

    private readonly CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        monitoringWindow: 300000 // 5 minutes
    };

    private circuitBreakerStates = new Map<string, {
        failures: number;
        lastFailure: number;
        state: 'closed' | 'open' | 'half-open';
        nextAttempt: number;
    }>();

    // ===========================================
    // ERROR CLASSIFICATION
    // ===========================================

    /**
     * Classify and categorize an error
     */
    classifyError(error: any, context: Record<string, any> = {}): ContractError {
        const errorId = this.generateErrorId();
        const timestamp = Date.now();

        let category = ErrorCategory.UNKNOWN;
        let severity = ErrorSeverity.MEDIUM;
        let retryable = false;
        let maxRetries = 0;

        // Network errors
        if (this.isNetworkError(error)) {
            category = ErrorCategory.NETWORK;
            severity = ErrorSeverity.HIGH;
            retryable = true;
            maxRetries = 5;
        }
        // Contract-specific errors
        else if (this.isContractError(error)) {
            category = ErrorCategory.CONTRACT;
            const contractErrorInfo = this.parseContractError(error);
            severity = contractErrorInfo.severity;
            retryable = contractErrorInfo.retryable;
            maxRetries = contractErrorInfo.retryable ? 3 : 0;
        }
        // Rate limiting errors
        else if (this.isRateLimitError(error)) {
            category = ErrorCategory.RATE_LIMIT;
            severity = ErrorSeverity.MEDIUM;
            retryable = true;
            maxRetries = 3;
        }
        // Timeout errors
        else if (this.isTimeoutError(error)) {
            category = ErrorCategory.TIMEOUT;
            severity = ErrorSeverity.MEDIUM;
            retryable = true;
            maxRetries = 3;
        }
        // Validation errors
        else if (this.isValidationError(error)) {
            category = ErrorCategory.VALIDATION;
            severity = ErrorSeverity.LOW;
            retryable = false;
        }
        // Permission errors
        else if (this.isPermissionError(error)) {
            category = ErrorCategory.PERMISSION;
            severity = ErrorSeverity.HIGH;
            retryable = false;
        }
        // Authentication errors
        else if (this.isAuthenticationError(error)) {
            category = ErrorCategory.AUTHENTICATION;
            severity = ErrorSeverity.HIGH;
            retryable = false;
        }
        // Resource errors (out of gas, etc.)
        else if (this.isResourceError(error)) {
            category = ErrorCategory.RESOURCE;
            severity = ErrorSeverity.MEDIUM;
            retryable = true;
            maxRetries = 2;
        }

        return {
            id: errorId,
            type: error.name || 'UnknownError',
            message: error.message || 'Unknown error occurred',
            category,
            severity,
            context: {
                ...context,
                stack: error.stack,
                code: error.code,
                data: error.data
            },
            timestamp,
            retryable,
            retryCount: 0,
            maxRetries,
            resolved: false
        };
    }

    // ===========================================
    // ERROR DETECTION METHODS
    // ===========================================

    private isNetworkError(error: any): boolean {
        const networkMessages = [
            'network error',
            'connection refused',
            'timeout',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'fetch failed'
        ];

        return networkMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase()) ||
            error.code?.toLowerCase().includes(msg.toLowerCase())
        );
    }

    private isContractError(error: any): boolean {
        return error.data ||
            error.message?.includes('execution reverted') ||
            error.message?.includes('transaction failed') ||
            error.code === 'CALL_EXCEPTION';
    }

    private isRateLimitError(error: any): boolean {
        const rateLimitMessages = [
            'rate limit',
            'too many requests',
            'rate exceeded',
            'throttled'
        ];

        return rateLimitMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        );
    }

    private isTimeoutError(error: any): boolean {
        return error.message?.toLowerCase().includes('timeout') ||
            error.code === 'TIMEOUT';
    }

    private isValidationError(error: any): boolean {
        const validationMessages = [
            'invalid',
            'malformed',
            'bad input',
            'validation failed',
            'invalid address',
            'invalid signature'
        ];

        return validationMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        );
    }

    private isPermissionError(error: any): boolean {
        const permissionMessages = [
            'not authorized',
            'permission denied',
            'access denied',
            'unauthorized',
            'not owner',
            'not admin'
        ];

        return permissionMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        );
    }

    private isAuthenticationError(error: any): boolean {
        const authMessages = [
            'authentication failed',
            'invalid signature',
            'unauthorized',
            'access token'
        ];

        return authMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        );
    }

    private isResourceError(error: any): boolean {
        const resourceMessages = [
            'out of gas',
            'insufficient funds',
            'insufficient balance',
            'gas limit',
            'gas required exceeds'
        ];

        return resourceMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        );
    }

    private parseContractError(error: any): { severity: ErrorSeverity; retryable: boolean } {
        const message = error.message?.toLowerCase() || '';

        // Critical contract errors (not retryable)
        if (message.includes('not owner') ||
            message.includes('not authorized') ||
            message.includes('permission denied')) {
            return { severity: ErrorSeverity.CRITICAL, retryable: false };
        }

        // High severity (potentially retryable)
        if (message.includes('execution reverted') ||
            message.includes('transaction failed')) {
            return { severity: ErrorSeverity.HIGH, retryable: true };
        }

        // Medium severity (retryable)
        return { severity: ErrorSeverity.MEDIUM, retryable: true };
    }

    // ===========================================
    // RETRY MECHANISMS
    // ===========================================

    /**
     * Execute function with retry logic
     */
    async executeWithRetry<T>(
        operation: () => Promise<T>,
        context: Record<string, any> = {},
        retryStrategy: Partial<RetryStrategy> = {}
    ): Promise<T> {
        const strategy = { ...this.DEFAULT_RETRY_STRATEGY, ...retryStrategy };
        const serviceKey = this.getServiceKey(context);

        // Check circuit breaker
        if (!this.canAttempt(serviceKey)) {
            throw new Error(`Circuit breaker is open for service: ${serviceKey}`);
        }

        let lastError: any;

        for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
            try {
                const result = await operation();

                // Reset circuit breaker on success
                this.recordSuccess(serviceKey);

                if (attempt > 0) {
                    logger.info('Operation succeeded after retry', {
                        attempt,
                        context,
                        serviceKey
                    });
                }

                return result;
            } catch (error) {
                lastError = error;
                const contractError = this.classifyError(error, context);

                // Log error
                await this.logError(contractError);

                // Record failure for circuit breaker
                this.recordFailure(serviceKey);

                // Don't retry if not retryable
                if (!contractError.retryable || attempt >= strategy.maxRetries) {
                    break;
                }

                // Calculate delay with exponential backoff and jitter
                const delay = this.calculateDelay(attempt, strategy);

                logger.warn('Operation failed, retrying', {
                    attempt: attempt + 1,
                    maxRetries: strategy.maxRetries,
                    delay,
                    error: contractError.message,
                    context,
                    serviceKey
                });

                await this.sleep(delay);
            }
        }

        // All retries exhausted
        const finalError = this.classifyError(lastError, context);
        await this.logError(finalError);
        throw lastError;
    }

    /**
     * Execute with circuit breaker pattern
     */
    async executeWithCircuitBreaker<T>(
        operation: () => Promise<T>,
        serviceKey: string,
        context: Record<string, any> = {}
    ): Promise<T> {
        if (!this.canAttempt(serviceKey)) {
            throw new Error(`Circuit breaker is open for service: ${serviceKey}`);
        }

        try {
            const result = await operation();
            this.recordSuccess(serviceKey);
            return result;
        } catch (error) {
            this.recordFailure(serviceKey);
            const contractError = this.classifyError(error, { ...context, serviceKey });
            await this.logError(contractError);
            throw error;
        }
    }

    // ===========================================
    // CIRCUIT BREAKER LOGIC
    // ===========================================

    private canAttempt(serviceKey: string): boolean {
        const state = this.circuitBreakerStates.get(serviceKey);
        if (!state) return true;

        const now = Date.now();

        switch (state.state) {
            case 'closed':
                return true;

            case 'open':
                if (now >= state.nextAttempt) {
                    // Transition to half-open
                    state.state = 'half-open';
                    logger.info('Circuit breaker transitioning to half-open', { serviceKey });
                    return true;
                }
                return false;

            case 'half-open':
                return true;

            default:
                return true;
        }
    }

    private recordSuccess(serviceKey: string): void {
        const state = this.circuitBreakerStates.get(serviceKey);
        if (state) {
            // Reset on success
            state.failures = 0;
            state.state = 'closed';
            logger.debug('Circuit breaker reset to closed', { serviceKey });
        }
    }

    private recordFailure(serviceKey: string): void {
        let state = this.circuitBreakerStates.get(serviceKey);
        if (!state) {
            state = {
                failures: 0,
                lastFailure: 0,
                state: 'closed',
                nextAttempt: 0
            };
            this.circuitBreakerStates.set(serviceKey, state);
        }

        state.failures++;
        state.lastFailure = Date.now();

        // Check if we should open the circuit
        if (state.failures >= this.CIRCUIT_BREAKER_CONFIG.failureThreshold &&
            state.state === 'closed') {
            state.state = 'open';
            state.nextAttempt = Date.now() + this.CIRCUIT_BREAKER_CONFIG.recoveryTimeout;

            logger.warn('Circuit breaker opened', {
                serviceKey,
                failures: state.failures,
                threshold: this.CIRCUIT_BREAKER_CONFIG.failureThreshold,
                nextAttempt: new Date(state.nextAttempt).toISOString()
            });
        }
    }

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================

    private calculateDelay(attempt: number, strategy: RetryStrategy): number {
        let delay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt);
        delay = Math.min(delay, strategy.maxDelay);

        // Add jitter to prevent thundering herd
        if (strategy.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }

        return Math.floor(delay);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private generateErrorId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getServiceKey(context: Record<string, any>): string {
        return context.service || context.functionName || 'unknown';
    }

    // ===========================================
    // ERROR LOGGING AND TRACKING
    // ===========================================

    /**
     * Log error with structured data
     */
    async logError(error: ContractError): Promise<void> {
        try {
            // Log to application logger
            logger.error(`Contract Error [${error.category}]`, {
                errorId: error.id,
                type: error.type,
                message: error.message,
                severity: error.severity,
                retryable: error.retryable,
                context: error.context,
                timestamp: new Date(error.timestamp).toISOString()
            });

            // Store in Redis for tracking
            const errorKey = `contract_error:${error.id}`;
            await redisClient.setEx(errorKey, 3600, JSON.stringify(error)); // 1 hour TTL

            // Update error statistics
            await this.updateErrorStats(error);

            // Send alerts for critical errors
            if (error.severity === ErrorSeverity.CRITICAL) {
                await this.sendCriticalAlert(error);
            }

        } catch (logError) {
            // Fallback logging - don't let logging errors break the system
            console.error('Failed to log contract error:', logError);
            console.error('Original error:', error);
        }
    }

    /**
     * Update error statistics
     */
    private async updateErrorStats(error: ContractError): Promise<void> {
        try {
            const statsKey = 'contract_error_stats';
            const hourlyKey = `contract_error_stats:${Math.floor(Date.now() / 3600000)}`;

            // Increment counters
            await Promise.all([
                redisClient.hincrby(statsKey, `total`, 1),
                redisClient.hincrby(statsKey, `category:${error.category}`, 1),
                redisClient.hincrby(statsKey, `severity:${error.severity}`, 1),
                redisClient.hincrby(hourlyKey, `total`, 1),
                redisClient.hincrby(hourlyKey, `category:${error.category}`, 1),
                redisClient.expire(hourlyKey, 86400) // 24 hours TTL
            ]);

        } catch (err) {
            logger.warn('Failed to update error statistics', err);
        }
    }

    /**
     * Send critical error alerts
     */
    private async sendCriticalAlert(error: ContractError): Promise<void> {
        try {
            // Store critical error for immediate attention
            const alertKey = `critical_alert:${error.id}`;
            await redisClient.setEx(alertKey, 86400, JSON.stringify({
                ...error,
                alertSent: true,
                alertTimestamp: Date.now()
            }));

            logger.error('CRITICAL CONTRACT ERROR - IMMEDIATE ATTENTION REQUIRED', {
                errorId: error.id,
                message: error.message,
                context: error.context,
                timestamp: new Date().toISOString()
            });

            // TODO: Integrate with notification service for Slack/email alerts

        } catch (err) {
            logger.error('Failed to send critical alert', err);
        }
    }

    // ===========================================
    // ERROR RECOVERY
    // ===========================================

    /**
     * Get error statistics
     */
    async getErrorStats(): Promise<Record<string, any>> {
        try {
            const stats = await redisClient.hgetall('contract_error_stats');
            return stats || {};
        } catch (err) {
            logger.warn('Failed to get error statistics', err);
            return {};
        }
    }

    /**
     * Get circuit breaker status
     */
    getCircuitBreakerStatus(): Record<string, any> {
        const status: Record<string, any> = {};

        for (const [serviceKey, state] of this.circuitBreakerStates.entries()) {
            status[serviceKey] = {
                state: state.state,
                failures: state.failures,
                lastFailure: state.lastFailure ? new Date(state.lastFailure).toISOString() : null,
                nextAttempt: state.nextAttempt ? new Date(state.nextAttempt).toISOString() : null
            };
        }

        return status;
    }

    /**
     * Reset circuit breaker for a service
     */
    resetCircuitBreaker(serviceKey: string): void {
        this.circuitBreakerStates.delete(serviceKey);
        logger.info('Circuit breaker manually reset', { serviceKey });
    }

    /**
     * Health check for error handler
     */
    async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }> {
        try {
            const stats = await this.getErrorStats();
            const circuitBreakerStatus = this.getCircuitBreakerStatus();

            const openCircuits = Object.values(circuitBreakerStatus)
                .filter((state: any) => state.state === 'open').length;

            let status: 'healthy' | 'degraded' | 'unhealthy';

            if (openCircuits === 0) {
                status = 'healthy';
            } else if (openCircuits <= 2) {
                status = 'degraded';
            } else {
                status = 'unhealthy';
            }

            return {
                status,
                details: {
                    errorStats: stats,
                    circuitBreakers: circuitBreakerStatus,
                    openCircuits,
                    totalServices: Object.keys(circuitBreakerStatus).length
                }
            };

        } catch (error) {
            logger.error('Error handler health check failed', error);
            return {
                status: 'unhealthy',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }
}

// Export singleton instance
export const contractErrorHandler = new ContractErrorHandler();
export default contractErrorHandler;
