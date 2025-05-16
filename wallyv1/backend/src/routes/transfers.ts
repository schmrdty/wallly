import express from 'express';
import { transferTokens, batchTransferTokens, metaTransferTokens } from '../controllers/transferController';

const router = express.Router();

router.post('/transfer', transferTokens);
router.post('/batch-transfer', batchTransferTokens);
router.post('/meta-transfer', metaTransferTokens);

export default router;