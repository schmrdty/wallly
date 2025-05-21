import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Helper for catching errors
const handleApiError = (error) => {
    throw new Error(error.response?.data?.message || error.message || 'API Error');
}
// Authentication API calls
export const login = async (credentials) => {
    try {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
export const logout = async () => {
    try {
        const response = await api.post('/auth/logout');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
// Token transfer API calls
export const transferTokens = async (transferData) => {
    try {
        const response = await api.post('/transfers', transferData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
// Session management API calls
export const createSession = async (sessionData) => {
    try {
        const response = await api.post('/sessions', sessionData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
// Session validation API call
export const validateSession = async (sessionId) => {
    try {
        const response = await api.get(`/sessions/${sessionId}/validate`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
// Session revocation API call
export const revokeSession = async (sessionId) => {
    try {
        const response = await api.delete(`/sessions/${sessionId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
// Export data API call
export const exportUserData = async (userId) => {
    try {
        const response = await api.get(`/export/${userId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};