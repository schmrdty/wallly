import { api } from './api';
import { logger } from './logger';

// Use in-memory storage for sessionId (more secure than localStorage)
let sessionId: string | null = null;

/**
 * Set the current session ID in memory.
 * @param id Session ID string
 */
export function setSessionId(id: string): void {
  sessionId = id;
}

/**
 * Get the current session ID from memory.
 * @returns Session ID string or null
 */
export function getSessionId(): string | null {
  return sessionId;
}

/**
 * Clear the current session ID from memory.
 */
export function clearSessionId(): void {
  sessionId = null;
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
  if (!sessionId) return false;
  try {
    const res = await api.get<SessionValidationResponse>(`/sessions/${sessionId}/validate`);
    return res.data.isValid;
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
  if (!sessionId) return;
  try {
    await api.delete(`/sessions/${sessionId}`);
    clearSessionId();
  } catch (err) {
    logger.error('Failed to revoke session', { sessionId, error: err });
  }
}