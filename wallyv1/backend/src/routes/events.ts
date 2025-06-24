import express from 'express';
import { getEvents, getEventStats } from '../controllers/eventController.js';

const router = express.Router();

// Events routes
router.get('/', getEvents);
router.get('/stats', getEventStats);

export default router;
