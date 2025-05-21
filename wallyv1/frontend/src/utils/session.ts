import { api } from './api';

// Use in-memory storage for sessionId (more secure than localStorage)
let sessionId: string | null = null;

export function setSessionId(id: string) {
  sessionId = id;
}

export function getSessionId() {
  return sessionId;
}

export function clearSessionId() {
  sessionId = null;
}

// Validate session
export async function validateSession() {
  if (!sessionId) return false;
  try {
    const res = await api.get(`/sessions/${sessionId}/validate`);
    return res.data.isValid;
  } catch {
    return false;
  }
}

// Revoke session
export async function revokeSession() {
  if (!sessionId) return;
  try {
    await api.delete(`/sessions/${sessionId}`);
    clearSessionId();
  } catch (err) {
    // Optionally handle/log error
  }
}