import { Router } from 'express';
import {
    initiateFarcasterAuth,
    handleFarcasterCallback,
    processNeynarWebhook,
} from '../controllers/authController.js';

const authRouter = Router();

authRouter.get('/farcaster/login', initiateFarcasterAuth);
authRouter.get('/farcaster/callback', handleFarcasterCallback);
authRouter.post('/webhooks/neynar', processNeynarWebhook);

export default authRouter;
