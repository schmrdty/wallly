import { Router, Request, Response, NextFunction } from 'express';
import {
  renewPermission,
  revokePermission,
  previewPermission
} from '../controllers/permissionController.js';

const router = Router();

// GET /api/permission/check
router.get('/check', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address } = req.query;

    if (!address) {
      res.status(400).json({ error: 'Address parameter is required' });
      return;
    }

    // For now, return mock permission status - this can be enhanced later with actual permission checking
    // In a production app, this would query the blockchain contract for actual permission status
    res.json({
      address,
      hasPermission: false,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/permission/renew
router.post('/renew', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await renewPermission(req, res, next);
  } catch (err) {
    next(err);
  }
});

// POST /api/permission/revoke
router.post('/revoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await revokePermission(req, res, next);
  } catch (err) {
    next(err);
  }
});

// POST /api/permission/preview
router.post('/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await previewPermission(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router;
