import axios from 'axios';
import { logger } from './logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper for catching errors
interface ApiError {
    response?: {
        data?: {
            message?: string;
            [key: string]: any;
        };
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
 * @param error The error object.
 */
const handleApiError = (error: ApiError): never => {
    logger.error('API Error', error);
    throw new Error(error.response?.data?.message || error.message || 'API Error');
};

/**
 * Authentication API: Login
 */
export const login = async (credentials: any): Promise<any> => {
    try {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    } catch (error: any) {
        if (isApiError(error)) handleApiError(error);
        throw error;
    }
};

/**
 * Authentication API: Logout
 */
export const logout = async (): Promise<any> => {
    try {
        const response = await api.post('/auth/logout');
        return response.data;
    } catch (error: any) {
        if (isApiError(error)) handleApiError(error);
        throw error;
    }
};

/**
 * Token transfer API: Transfer tokens
 */
export const transferTokens = async (transferData: any): Promise<any> => {
    try {
        const response = await api.post('/transfers', transferData);
        logger.contractEvent('TransferRequested', transferData);
        return response.data;
    } catch (error: any) {
        logger.contractError('TransferFailed', transferData);
        if (isApiError(error)) handleApiError(error);
        throw error;
    }
};

/**
 * Session management API: Create session
 */
export const createSession = async (sessionData: any): Promise<any> => {
    try {
        const response = await api.post('/sessions', sessionData);
        logger.contractEvent('SessionCreated', sessionData);
        return response.data;
    } catch (error: any) {
        logger.contractError('SessionCreateFailed', sessionData);
        if (isApiError(error)) handleApiError(error);
        throw error;
    }
};

/**
 * Session management API: Validate session
 */
export const validateSession = async (sessionId: string): Promise<any> => {
    try {
        const response = await api.get(`/sessions/${sessionId}/validate`);
        return response.data;
    } catch (error: any) {
        if (isApiError(error)) handleApiError(error);
        throw error;
    }
};

/**
 * Session management API: Revoke session
 */
export const revokeSession = async (sessionId: string): Promise<any> => {
    try {
        const response = await api.delete(`/sessions/${sessionId}`);
        logger.contractEvent('SessionRevoked', { sessionId });
        return response.data;
    } catch (error: any) {
        logger.contractError('SessionRevokeFailed', { sessionId });
        if (isApiError(error)) handleApiError(error);
        throw error;
    }
};

/**
 * Export user data API
 */
export const exportUserData = async (userId: string): Promise<any> => {
    try {
        const response = await api.get(`/export/${userId}`);
        return response.data;
    } catch (error: any) {
        if (isApiError(error)) handleApiError(error);
        throw error;
    }
};

interface FarcasterAuthResult {
    farcasterToken: string;
    farcasterId: string;
    [key: string]: any;
}

/**
 * Farcaster authentication API
 */
export const authenticateWithFarcaster = async (result: FarcasterAuthResult): Promise<any> => {
    if (!result) {
        throw new Error('No result provided for Farcaster authentication');
    }
    if (!result.farcasterToken) {
        throw new Error('No Farcaster token provided');
    }
    if (!result.farcasterId) {
        throw new Error('No Farcaster ID provided');
    }
    try {
        const response = await api.post('/auth/farcaster', result);
        logger.contractEvent('FarcasterAuthenticated', result);
        return response.data;
    } catch (error: any) {
        logger.contractError('FarcasterAuthFailed', result);
        if (isApiError(error)) handleApiError(error);
        throw error;
    }
};