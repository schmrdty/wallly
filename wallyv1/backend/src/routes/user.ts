import express from 'express';
import redisClient from '../../db/redisClient';
const router = express.Router();

router.post('/prefs', async (req, res) => {
  const { userId, reminderOption } = req.body;
  await redisClient.set(`userPrefs:${userId}`, JSON.stringify({ reminderOption }));
  res.json({ success: true });
});

router.post('/autorenew', async (req, res) => {
  const { userId, enabled } = req.body;
  await redisClient.set(`autorenewEnabled:${userId}`, enabled ? 'true' : 'false');
  res.json({ success: true, autorenew: enabled });
});

export default router;