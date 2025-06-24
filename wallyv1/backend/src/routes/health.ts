import express from 'express';
import * as healthController from '../controllers/healthController.js';

const router = express.Router();

router.get('/baseHealth', healthController.baseHealth);
router.get('/serverHealth', healthController.serverHealth);
router.get('/walletHealth', healthController.walletHealth);
router.get('/contractHealth', healthController.contractHealth);
router.get('/blockchainHealth', healthController.blockchainHealth);
router.get('/farcasterHealth', healthController.farcasterHealth);
router.get('/sessionHealth', healthController.sessionHealth);
router.get('/transferHealth', healthController.transferHealth);
router.get('/userHealth', healthController.userHealth);
router.get('/authHealth', healthController.authHealth);
router.get('/tokenListHealth', healthController.tokenListHealth);
router.get('/appHealth', healthController.appHealth);

export default router;
