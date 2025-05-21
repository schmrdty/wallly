import express from 'express';
import { sessionService } from '../services/sessionService';

const router = express.Router();

// Validate session
router.get('/:sessionId/validate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const isValid = await sessionService.validateSession(sessionId);
    res.json({ isValid });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to validate session' });
  }
});

// Revoke session
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await sessionService.revokeSession(sessionId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to revoke session' });
  }
});

export default router;