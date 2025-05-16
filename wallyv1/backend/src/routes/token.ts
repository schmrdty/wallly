import express from 'express';
import { roundRobinFindToken } from '../services/tokenListService';
import { startWatchingToken, stopWatchingToken, resolveToken, listWatchedTokens } from '../controllers/tokenController';

const router = express.Router();

router.post('/resolve', async (req, res) => {
  const { query } = req.body;
  try {
    const token = await roundRobinFindToken(query);
    if (token) {
      res.json({ valid: true, ...token });
    } else {
      res.json({ valid: false, message: 'Token not found.' });
    }
  } catch (err) {
    res.status(500).json({ valid: false, message: 'Error resolving token.' });
  }
});

router.post('/start-watching', startWatchingToken);
router.post('/stop-watching', stopWatchingToken);
router.get('/watched', listWatchedTokens);

export default router;