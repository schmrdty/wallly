import { Router } from 'express';
import {
  createSession,
  getSession,
  extendSession,
  validateSessionById
} from '../controllers/sessionController.js';

const router = Router();

// Create a new session
router.post('/', createSession);

// Get session details
router.get('/:sessionId', getSession);

// Validate session
router.get('/:sessionId/validate', validateSessionById);

// Extend session expiration
router.post('/:sessionId/extend', extendSession);

export default router;
