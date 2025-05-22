import express from 'express';
import redisClient from '../db/redisClient';
const router = express.Router();

// POST user preferences
router.post('/prefs', async (req, res) => {
  const { userId, reminderOption } = req.body;
  await redisClient.set(`userPrefs:${userId}`, JSON.stringify({ reminderOption }));
  res.json({ success: true });
});

// POST enable or disable autorenew
router.post('/autorenew', async (req, res) => {
  const { userId, enabled } = req.body;
  await redisClient.set(`autorenewEnabled:${userId}`, enabled ? 'true' : 'false');
  res.json({ success: true, autorenew: enabled });
});

// GET user settings
router.get('/settings/:userId', async (req, res) => {
  const { userId } = req.params;
  const data = await redisClient.get(`user:settings:${userId}`);
  res.json(data ? JSON.parse(data) : {});
});

// POST update user settings
router.post('/settings', async (req, res) => {
  const { userId, ...settings } = req.body;
  await redisClient.set(`user:settings:${userId}`, JSON.stringify(settings));
  res.json({ message: 'Settings updated' });
});

export default router;