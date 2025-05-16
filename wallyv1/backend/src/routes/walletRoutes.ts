import express from 'express';
import { getWalletInfo, createWallet, updateWallet, deleteWallet } from '../controllers/walletController';

const router = express.Router();

router.get('/:id', getWalletInfo);
router.post('/create', createWallet);
router.put('/:id', updateWallet);
router.delete('/:id', deleteWallet);
export default router;