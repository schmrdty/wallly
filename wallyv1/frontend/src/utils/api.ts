import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger';
import { getSessionId } from './session';

// Base URL for the API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

// Create axios instance with default config
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Increased timeout for Farcaster auth
    headers: {
        'Content-Type': 'application/json',
    },
});

// Exponential backoff delay function
const getRetryDelay = (attempt: number): number => {
    return RETRY_DELAY_BASE * Math.pow(2, attempt) + Math.random() * 1000;
};

// Retry wrapper function
const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
    shouldRetry: (error: any) => boolean = () => true
): Promise<T> => {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Don't retry on the last attempt or if we shouldn't retry this error
            if (attempt === maxRetries || !shouldRetry(error)) {
                break;
            }

            // Log retry attempt
            logger.warn(`Request failed, retrying in ${getRetryDelay(attempt)}ms (attempt ${attempt + 1}/${maxRetries})`, {
                error: error.message,
                status: error.response?.status
            });

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
        }
    }

    throw lastError;
};

// Determine if an error should be retried
const shouldRetryError = (error: any): boolean => {
    // Don't retry client errors (4xx) except 408, 429
    if (error.response?.status >= 400 && error.response?.status < 500) {
        return error.response?.status === 408 || error.response?.status === 429;
    }

    // Retry network errors and server errors (5xx)
    return error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.response?.status >= 500;
};

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const sessionId = getSessionId();
        if (sessionId) {
            config.headers.Authorization = `Bearer ${sessionId}`;
        }

        logger.debug('API Request:', {
            method: config.method,
            url: config.url,
            baseURL: config.baseURL
        });

        return config;
    },
    (error) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        logger.debug('API Response:', {
            status: response.status,
            url: response.config.url
        });
        return response;
    },
    (error) => {
        // Enhanced error handling
        if (error.code === 'ERR_NETWORK') {
            logger.error('Network Error - Backend may be offline:', {
                url: error.config?.url,
                baseURL: error.config?.baseURL,
                message: 'Check if backend server is running'
            });
        } else if (error.response?.status === 404) {
            logger.error('API Endpoint not found:', error.config?.url);
        } else if (error.response?.status >= 500) {
            logger.error('Server Error:', error.response?.status);
        } else {
            logger.error('API Error:', {
                status: error.response?.status,
                message: error.message,
                url: error.config?.url
            });
        }

        return Promise.reject(error);
    }
);

// Health check function
export const healthCheck = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        logger.warn('Health check failed, backend may be offline');
        return {
            status: 'offline',
            message: 'Backend server unavailable',
            uptime: 0
        };
    }
};

// Test connection function
export const testConnection = async () => {
    try {
        const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/health', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
    } catch (error) {
        logger.warn('Connection test failed');
        return false;
    }
};

export { api };

// Authentication endpoints
export const login = async (credentials: any): Promise<any> => {
    try {
        const response = await api.post('/api/auth/login', credentials);
        return response.data;
    } catch (error) {
        if (isApiError(error)) {
            handleApiError(error);
        }
        throw error;
    }
};

export const logout = async (): Promise<any> => {
    try {
        const response = await api.post('/api/auth/logout');
        return response.data;
    } catch (error) {
        if (isApiError(error)) {
            handleApiError(error);
        }
        throw error;
    }
};

// Session management
export const createSession = async (sessionData: any): Promise<any> => {
    try {
        const response = await api.post('/api/sessions', sessionData);
        return response.data;
    } catch (error) {
        if (isApiError(error)) {
            handleApiError(error);
        }
        throw error;
    }
};

export const validateSession = async (sessionId: string): Promise<any> => {
    try {
        const response = await api.get(`/api/sessions/${sessionId}/validate`);
        logger.info('SessionValidated', { sessionId });
        return response.data;
    } catch (error) {
        if (isApiError(error)) {
            handleApiError(error);
        }
        throw error;
    }
};

export const revokeSession = async (sessionId: string): Promise<any> => {
    try {
        const response = await api.delete(`/api/sessions/${sessionId}`);
        logger.info('SessionRevoked', { sessionId });
        return response.data;
    } catch (error: any) {
        logger.error('SessionRevokeFailed', { sessionId });
        if (isApiError(error)) handleApiError(error);
        throw error;
    }
};

// User data
export const exportUserData = async (userId: string): Promise<any> => {
    try {
        const response = await api.get(`/api/user/export/${userId}`, {
            responseType: 'blob'
        });
        return response;
    } catch (error) {
        if (isApiError(error)) {
            handleApiError(error);
        }
        throw error;
    }
};

// Farcaster-specific interfaces
interface FarcasterAuthResult {
    message: string;
    signature: string;
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    bio?: string;
    address?: string;
}

/**
 * Farcaster authentication API
 */
export const authenticateWithFarcaster = async (result: FarcasterAuthResult): Promise<any> => {
    if (!result) {
        throw new Error('No result provided for Farcaster authentication');
    }

    if (!result.message || !result.signature) {
        throw new Error('Message and signature are required for Farcaster authentication');
    }

    if (!result.fid) {
        throw new Error('FID is required for Farcaster authentication');
    }

    try {
        const response = await api.post('/api/auth/farcaster', {
            message: result.message,
            signature: result.signature,
            fid: result.fid,
            username: result.username,
            displayName: result.displayName,
            pfpUrl: result.pfpUrl,
            bio: result.bio,
            address: result.address
        });

        logger.info('FarcasterAuthenticated', { fid: result.fid });
        return response.data;
    } catch (error) {
        logger.error('FarcasterAuthFailed', { fid: result.fid });
        if (isApiError(error)) {
            handleApiError(error);
        }
        throw error;
    }
};

/**
 * Farcaster Quick Auth API - Alternative authentication method
 */
export const authenticateWithQuickAuth = async (token: string): Promise<any> => {
    if (!token) {
        throw new Error('Token is required for Quick Auth authentication');
    }

    try {
        const response = await api.post('/api/auth/farcaster/quickauth', { token });
        logger.info('QuickAuthAuthenticated');
        return response.data;
    } catch (error) {
        logger.error('QuickAuthFailed');
        if (isApiError(error)) {
            handleApiError(error);
        }
        throw error;
    }
};

// Token operations
export const transferTokens = async (transferData: any): Promise<any> => {
    try {
        const response = await api.post('/api/transfers', transferData);
        return response.data;
    } catch (error) {
        if (isApiError(error)) {
            handleApiError(error);
        }
        throw error;
    }
};

// Helper for catching errors
interface ApiError {
    response?: {
        data?: {
            message?: string;
            [key: string]: any;
        };
        status?: number;
        [key: string]: any;
    };
    message?: string;
    [key: string]: any;
}

/**
 * Type guard for API errors.
 */
function isApiError(error: any): error is ApiError {
    return typeof error === 'object' && (
        'response' in error || 'message' in error
    );
}

/**
 * Handles API errors and logs them.
 */
export const handleApiError = (error: ApiError): never => {
    logger.error('API Error', error);
    const message = error.response?.data?.message || error.message || 'API Error';
    throw new Error(message);
};