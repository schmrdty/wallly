import { Router } from 'express';
import {
  createContractSession,
  getUserContractSessions,
  getWalletContractSessions,
  getContractSession,
  revokeContractSession
} from '../controllers/contractSessionController.js';

const router = Router();

// Create a contract session (called after onchain grant)
router.post('/', createContractSession);

// Get a user's contract session
router.get('/user/:userId', getUserContractSessions);

// Get contract session by wallet address
router.get('/wallet/:walletAddress', getWalletContractSessions);

// Get contract session by ID
router.get('/:contractSessionId', getContractSession);

// Revoke a contract session
router.post('/:contractSessionId/revoke', revokeContractSession);

export default router;
