import express from 'express';
import { createSession, validateSession, revokeSession } from '../controllers/sessionController';

const router = express.Router();

router.post('/', createSession);
router.get('/validate', validateSession);
router.post('/revoke', revokeSession);

export default router;