import express from 'express';
import { getFunFeed } from '../controllers/funFeedController.js';

const router = express.Router();

// GET /api/funfeed - Get latest 5 casts from Farcaster "made history" channel
router.get('/', (req, res, next) => {
    Promise.resolve(getFunFeed(req, res)).catch(next);
});

export default router;
