import express, { Request, Response, NextFunction } from 'express';
import { roundRobinFindToken } from '../services/tokenListService.js';
import {
  startWatchingToken,
  stopWatchingToken,
  resolveToken,
  listWatchedTokens
} from '../controllers/tokenController.js';

const router = express.Router();

// POST /api/token/resolveToken
router.post('/resolveToken', resolveToken);

// POST /api/token/start-watching
router.post('/start-watching', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    await startWatchingToken(req, res);
  } catch (err) {
    _next(err);
  }
});

// POST /api/token/stop-watching
router.post('/stop-watching', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    await stopWatchingToken(req, res);
  } catch (err) {
    _next(err);
  }
});

// GET /api/token/watched
router.get('/watched', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    await listWatchedTokens(req, res);
  } catch (err) {
    _next(err);
  }
});

export default router;
