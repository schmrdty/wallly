import express from 'express';
import { WallyService } from '../services/wallyService';

const router = express.Router();
const wallyService = new WallyService();

// --- EIP-7702: Temporary Contract Code Routes ---

/**
 * Set temporary contract code for an EOA
 * POST /api/eip7702/setTemporaryCode
 */
router.post('/setTemporaryCode', async (req, res) => {
  try {
    const { account, codeHash, expiresAt, nonce, signature } = req.body;
    
    if (!account || !codeHash || !expiresAt || !nonce || !signature) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await wallyService.setTemporaryCode(account, codeHash, expiresAt, nonce, signature);
    
    if (result.success) {
      res.json({ success: true, transactionHash: result.transactionHash });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Reset temporary contract code
 * POST /api/eip7702/resetTemporaryCode
 */
router.post('/resetTemporaryCode', async (req, res) => {
  try {
    const { account } = req.body;
    
    if (!account) {
      return res.status(400).json({ error: 'Missing account parameter' });
    }

    const result = await wallyService.resetTemporaryCode(account);
    
    if (result.success) {
      res.json({ success: true, transactionHash: result.transactionHash });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Execute with temporary contract code
 * POST /api/eip7702/executeWithTemporaryCode
 */
router.post('/executeWithTemporaryCode', async (req, res) => {
  try {
    const { account, target, data, value } = req.body;
    
    if (!account || !target || !data) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await wallyService.executeWithTemporaryCode(account, target, data, value || '0');
    
    if (result.success) {
      res.json({ success: true, transactionHash: result.transactionHash, result: result.result });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Get temporary code information
 * GET /api/eip7702/getTemporaryCode/:account
 */
router.get('/getTemporaryCode/:account', async (req, res) => {
  try {
    const { account } = req.params;
    
    const result = await wallyService.getTemporaryCode(account);
    
    if (result.success) {
      res.json({ 
        success: true, 
        active: result.active, 
        codeHash: result.codeHash, 
        expiresAt: result.expiresAt 
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// --- EIP-5792: Wallet API Routes ---

/**
 * Request wallet permissions (EIP-5792)
 * POST /api/eip5792/wallet_requestPermissions
 */
router.post('/wallet_requestPermissions', async (req, res) => {
  try {
    const { account, methods, expiresAt, nonce, signature } = req.body;
    
    if (!account || !methods || !expiresAt || !nonce || !signature) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await wallyService.wallet_requestPermissions(account, methods, expiresAt, nonce, signature);
    
    if (result.success) {
      res.json({ success: true, transactionHash: result.transactionHash });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Get wallet permissions (EIP-5792)
 * GET /api/eip5792/wallet_getPermissions/:account
 */
router.get('/wallet_getPermissions/:account', async (req, res) => {
  try {
    const { account } = req.params;
    
    const result = await wallyService.wallet_getPermissions(account);
    
    if (result.success) {
      res.json({ 
        success: true, 
        methods: result.methods, 
        expiresAt: result.expiresAt, 
        active: result.active 
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Execute transaction (EIP-5792: eth_sendTransaction)
 * POST /api/eip5792/eth_sendTransaction
 */
router.post('/eth_sendTransaction', async (req, res) => {
  try {
    const { account, to, value, data } = req.body;
    
    if (!account || !to) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await wallyService.eth_sendTransaction(account, to, value || '0', data || '0x');
    
    if (result.success) {
      res.json({ success: true, transactionHash: result.transactionHash, result: result.result });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Sign data (EIP-5792: eth_sign)
 * POST /api/eip5792/eth_sign
 */
router.post('/eth_sign', async (req, res) => {
  try {
    const { account, dataHash } = req.body;
    
    if (!account || !dataHash) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await wallyService.eth_sign(account, dataHash);
    
    if (result.success) {
      res.json({ success: true, signature: result.signature });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Revoke wallet permissions
 * POST /api/eip5792/wallet_revokePermissions
 */
router.post('/wallet_revokePermissions', async (req, res) => {
  try {
    const { account } = req.body;
    
    if (!account) {
      return res.status(400).json({ error: 'Missing account parameter' });
    }

    const result = await wallyService.wallet_revokePermissions(account);
    
    if (result.success) {
      res.json({ success: true, transactionHash: result.transactionHash });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;