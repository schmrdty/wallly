import axios from 'axios';
import { logger } from './logger';

// Simple API instance to avoid circular dependency
const sessionApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000
});

// Use localStorage for sessionId persistence
const SESSION_KEY = 'wally_session_id';

export function setSessionId(id: string): void {
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch (err) {
    logger.warn('Failed to store session ID in localStorage:', err);
  }
}

export function getSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch (err) {
    logger.warn('Failed to read session ID from localStorage:', err);
    return null;
  }
}

export function clearSessionId(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    logger.warn('Failed to clear session ID from localStorage:', err);
  }
}

interface SessionValidationResponse {
  isValid: boolean;
  [key: string]: any;
}

/**
 * Validate the current session by checking with the backend.
 * @returns Promise<boolean> indicating if the session is valid
 */
export async function validateSession(): Promise<boolean> {
  const sessionId = getSessionId();
  if (!sessionId) return false;
  try {
    const res = await sessionApi.post('/api/auth/validate', { sessionId });
    // If the request succeeds, the session is valid
    return true;
  } catch (err) {
    logger.warn('Session validation failed', { sessionId, error: err });
    return false;
  }
}

/**
 * Revoke the current session by calling the backend and clearing memory.
 * Logs errors if revocation fails.
 */
export async function revokeSession(): Promise<void> {
  const sessionId = getSessionId();
  if (!sessionId) return;
  try {
    await sessionApi.delete(`/api/sessions/${sessionId}`);
    clearSessionId();
  } catch (err) {
    logger.error('Failed to revoke session', { sessionId, error: err });
  }
}