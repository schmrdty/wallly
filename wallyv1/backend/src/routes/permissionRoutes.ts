import express from 'express';
import {
  renewPermission,
  revokePermission,
  previewPermission
} from '../controllers/permissionController';

const router = express.Router();

router.post('/renew', renewPermission);
router.post('/revoke', revokePermission);
router.post('/preview', previewPermission);

export default router;