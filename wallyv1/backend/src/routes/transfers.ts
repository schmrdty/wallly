import express from 'express';
import { transferTokens } from '../controllers/transferController.js';

const router = express.Router();

router.post('/transfer', async (req, res, next) => {
  try {
    await transferTokens(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
