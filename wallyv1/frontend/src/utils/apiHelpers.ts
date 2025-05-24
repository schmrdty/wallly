import { logger } from './logger';

export interface ApiError {
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

export function isApiError(error: any): error is ApiError {
    return typeof error === 'object' && (
        'response' in error || 'message' in error
    );
}

export const handleApiError = (error: ApiError): never => {
    logger.error('API Error', error);
    throw new Error(error.response?.data?.message || error.message || 'API Error');
};
