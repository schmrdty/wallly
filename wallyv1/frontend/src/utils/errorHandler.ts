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
    USER_REJECTED = 'user_rejected',
    UNKNOWN = 'unknown'
}

export interface UIError {
    id: string;
    type: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    context: Record<string, any>;
    timestamp: number;
    retryable: boolean;
    userFriendlyMessage: string;
    actionable: boolean;
    suggestedAction?: string;
}

export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

/**
 * Frontend Error Handler for Contract Operations
 * 
 * Provides:
 * - Error classification and user-friendly messaging
 * - Retry logic for frontend operations
 * - Error tracking and reporting
 * - User notification integration
 */
class FrontendErrorHandler {
    private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
    };

    /**
     * Classify an error and make it user-friendly
     */
    classifyError(error: any, context: Record<string, any> = {}): UIError {
        const errorId = this.generateErrorId();
        const timestamp = Date.now();

        let category = ErrorCategory.UNKNOWN;
        let severity = ErrorSeverity.MEDIUM;
        let retryable = false;
        let userFriendlyMessage = 'An unexpected error occurred. Please try again.';
        let actionable = false;
        let suggestedAction: string | undefined;

        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.code;

        // Network errors
        if (this.isNetworkError(error)) {
            category = ErrorCategory.NETWORK;
            severity = ErrorSeverity.HIGH;
            retryable = true;
            userFriendlyMessage = 'Network connection issue. Please check your internet connection and try again.';
            actionable = true;
            suggestedAction = 'Check internet connection and retry';
        }
        // User rejected transaction
        else if (this.isUserRejectedError(error)) {
            category = ErrorCategory.USER_REJECTED;
            severity = ErrorSeverity.LOW;
            retryable = true;
            userFriendlyMessage = 'Transaction was cancelled. Please try again if you want to proceed.';
            actionable = true;
            suggestedAction = 'Retry the transaction and approve it in your wallet';
        }
        // Insufficient funds
        else if (this.isInsufficientFundsError(error)) {
            category = ErrorCategory.RESOURCE;
            severity = ErrorSeverity.HIGH;
            retryable = false;
            userFriendlyMessage = 'Insufficient funds for this transaction. Please add more funds to your wallet.';
            actionable = true;
            suggestedAction = 'Add more funds to your wallet';
        }
        // Gas estimation errors
        else if (this.isGasError(error)) {
            category = ErrorCategory.RESOURCE;
            severity = ErrorSeverity.MEDIUM;
            retryable = true;
            userFriendlyMessage = 'Gas estimation failed. The transaction might fail or cost more than expected.';
            actionable = true;
            suggestedAction = 'Try increasing gas limit or retry later';
        }
        // Contract reverted errors
        else if (this.isContractRevertError(error)) {
            category = ErrorCategory.CONTRACT;
            severity = ErrorSeverity.HIGH;
            retryable = false;

            // Parse specific contract errors
            const contractErrorInfo = this.parseContractRevertReason(error);
            userFriendlyMessage = contractErrorInfo.userMessage;
            suggestedAction = contractErrorInfo.suggestedAction;
            actionable = !!suggestedAction;
        }
        // Permission/Authorization errors
        else if (this.isPermissionError(error)) {
            category = ErrorCategory.PERMISSION;
            severity = ErrorSeverity.HIGH;
            retryable = false;
            userFriendlyMessage = 'You don\'t have permission to perform this action.';
            actionable = true;
            suggestedAction = 'Request proper permissions or contact an administrator';
        }
        // Rate limit errors
        else if (this.isRateLimitError(error)) {
            category = ErrorCategory.RATE_LIMIT;
            severity = ErrorSeverity.MEDIUM;
            retryable = true;
            userFriendlyMessage = 'Too many requests. Please wait a moment and try again.';
            actionable = true;
            suggestedAction = 'Wait a few seconds and retry';
        }
        // Timeout errors
        else if (this.isTimeoutError(error)) {
            category = ErrorCategory.TIMEOUT;
            severity = ErrorSeverity.MEDIUM;
            retryable = true;
            userFriendlyMessage = 'The request timed out. Please try again.';
            actionable = true;
            suggestedAction = 'Retry the operation';
        }
        // Validation errors
        else if (this.isValidationError(error)) {
            category = ErrorCategory.VALIDATION;
            severity = ErrorSeverity.LOW;
            retryable = false;
            userFriendlyMessage = 'Invalid input provided. Please check your data and try again.';
            actionable = true;
            suggestedAction = 'Verify your input data is correct';
        }
        // Wallet connection errors
        else if (this.isWalletError(error)) {
            category = ErrorCategory.AUTHENTICATION;
            severity = ErrorSeverity.HIGH;
            retryable = true;
            userFriendlyMessage = 'Wallet connection issue. Please connect your wallet and try again.';
            actionable = true;
            suggestedAction = 'Connect your wallet and retry';
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
            userFriendlyMessage,
            actionable,
            suggestedAction
        };
    }

    /**
     * Execute operation with retry logic
     */
    async executeWithRetry<T>(
        operation: () => Promise<T>,
        context: Record<string, any> = {},
        retryConfig: Partial<RetryConfig> = {}
    ): Promise<T> {
        const config = { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig };
        let lastError: any;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                const uiError = this.classifyError(error, { ...context, attempt });

                // Don't retry if not retryable or max attempts reached
                if (!uiError.retryable || attempt >= config.maxRetries) {
                    break;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
                    config.maxDelay
                );

                console.warn(`Operation failed, retrying in ${delay}ms`, {
                    attempt: attempt + 1,
                    maxRetries: config.maxRetries,
                    error: uiError.userFriendlyMessage
                });

                await this.sleep(delay);
            }
        }

        // All retries exhausted, throw the classified error
        throw this.classifyError(lastError, context);
    }

    // ===========================================
    // ERROR DETECTION METHODS
    // ===========================================

    private isNetworkError(error: any): boolean {
        const networkMessages = [
            'network error',
            'fetch failed',
            'connection refused',
            'timeout',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND'
        ];

        return networkMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        ) || error.code === 'NETWORK_ERROR';
    }

    private isUserRejectedError(error: any): boolean {
        return error.code === 'ACTION_REJECTED' ||
            error.code === 4001 ||
            error.message?.toLowerCase().includes('user rejected') ||
            error.message?.toLowerCase().includes('user denied');
    }

    private isInsufficientFundsError(error: any): boolean {
        const insufficientMessages = [
            'insufficient funds',
            'insufficient balance',
            'not enough'
        ];

        return insufficientMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        ) || error.code === 'INSUFFICIENT_FUNDS';
    }

    private isGasError(error: any): boolean {
        const gasMessages = [
            'gas required exceeds',
            'out of gas',
            'gas limit',
            'gas estimation failed'
        ];

        return gasMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        );
    }

    private isContractRevertError(error: any): boolean {
        return error.message?.toLowerCase().includes('execution reverted') ||
            error.message?.toLowerCase().includes('transaction failed') ||
            error.code === 'CALL_EXCEPTION';
    }

    private isPermissionError(error: any): boolean {
        const permissionMessages = [
            'not authorized',
            'permission denied',
            'access denied',
            'unauthorized',
            'not owner',
            'not admin',
            'forbidden'
        ];

        return permissionMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        );
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
        ) || error.code === 429;
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

    private isWalletError(error: any): boolean {
        const walletMessages = [
            'wallet not connected',
            'no wallet',
            'wallet connection',
            'connect wallet'
        ];

        return walletMessages.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
        );
    }

    /**
     * Parse contract revert reasons into user-friendly messages
     */
    private parseContractRevertReason(error: any): {
        userMessage: string;
        suggestedAction?: string;
    } {
        const message = error.message?.toLowerCase() || '';

        // Common contract errors from wallyv1
        if (message.includes('notowner')) {
            return {
                userMessage: 'Only the contract owner can perform this action.',
                suggestedAction: 'Contact the contract administrator'
            };
        }

        if (message.includes('noactivepermission')) {
            return {
                userMessage: 'You don\'t have an active permission for this operation.',
                suggestedAction: 'Request permission or check if your permission has expired'
            };
        }

        if (message.includes('permissionexpired')) {
            return {
                userMessage: 'Your permission has expired.',
                suggestedAction: 'Request a new permission to continue'
            };
        }

        if (message.includes('sessionexpired')) {
            return {
                userMessage: 'Your session has expired.',
                suggestedAction: 'Start a new session to continue'
            };
        }

        if (message.includes('ratelimited')) {
            return {
                userMessage: 'Rate limit reached. Please wait before trying again.',
                suggestedAction: 'Wait a few minutes and retry'
            };
        }

        if (message.includes('paused')) {
            return {
                userMessage: 'The contract is currently paused.',
                suggestedAction: 'Wait for the contract to be unpaused or contact support'
            };
        }

        if (message.includes('notwhitelisted')) {
            return {
                userMessage: 'You are not whitelisted for this operation.',
                suggestedAction: 'Contact support to get whitelisted'
            };
        }

        // Generic revert message
        return {
            userMessage: 'The transaction was rejected by the smart contract.',
            suggestedAction: 'Check your parameters and try again'
        };
    }

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================

    private generateErrorId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get error color for UI display
     */
    getErrorColor(severity: ErrorSeverity): string {
        switch (severity) {
            case ErrorSeverity.LOW:
                return 'text-yellow-600';
            case ErrorSeverity.MEDIUM:
                return 'text-orange-600';
            case ErrorSeverity.HIGH:
                return 'text-red-600';
            case ErrorSeverity.CRITICAL:
                return 'text-red-800';
            default:
                return 'text-gray-600';
        }
    }

    /**
     * Get error icon for UI display
     */
    getErrorIcon(category: ErrorCategory): string {
        switch (category) {
            case ErrorCategory.NETWORK:
                return '🌐';
            case ErrorCategory.CONTRACT:
                return '📜';
            case ErrorCategory.VALIDATION:
                return '⚠️';
            case ErrorCategory.PERMISSION:
                return '🔒';
            case ErrorCategory.RATE_LIMIT:
                return '⏱️';
            case ErrorCategory.TIMEOUT:
                return '⏰';
            case ErrorCategory.AUTHENTICATION:
                return '🔐';
            case ErrorCategory.RESOURCE:
                return '💰';
            case ErrorCategory.USER_REJECTED:
                return '❌';
            default:
                return '❓';
        }
    }

    /**
     * Format error for display in UI
     */
    formatErrorForDisplay(error: UIError): {
        title: string;
        message: string;
        color: string;
        icon: string;
        showRetry: boolean;
        actionText?: string;
    } {
        return {
            title: `${this.getErrorIcon(error.category)} ${error.category.replace('_', ' ').toUpperCase()}`,
            message: error.userFriendlyMessage,
            color: this.getErrorColor(error.severity),
            icon: this.getErrorIcon(error.category),
            showRetry: error.retryable,
            actionText: error.suggestedAction
        };
    }
}

// Export singleton instance
export const frontendErrorHandler = new FrontendErrorHandler();
export default frontendErrorHandler;
