import express from 'express';
import { SiweMessage } from 'siwe';
import { sessionService } from '../services/sessionService';
import crypto from 'crypto';

// Extend Express Request interface to include session
declare module 'express-session' {
  interface SessionData {
    nonce?: string;
    siwe?: {
      address: string;
      fid?: string;
      sessionId: string;
      createdAt: string;
      expiresAt: string;
    };
  }
}

const router = express.Router();

const DOMAIN = process.env.DOMAIN || 'wally.schmidtiest.xyz';
const SIWE_URI = process.env.SIWE_URI || `https://${DOMAIN}/login`;

// Helper to generate a secure random nonce
function generateNonce(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    nonce += chars.charAt(bytes[i] % chars.length);
  }
  return nonce;
}

// Endpoint to get a nonce for SIWE
router.get('/nonce', (req, res) => {
  const nonce = generateNonce();
  req.session.nonce = nonce;
  res.json({ nonce });
});

// SIWE login endpoint
router.post('/login', async (req, res) => {
  try {
    const { message, signature } = req.body;
    if (!message || !signature) {
      return res.status(400).json({ error: 'Missing message or signature' });
    }

    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature, nonce: req.session.nonce });

    if (!result.success) {
      return res.status(400).json({ error: 'Invalid SIWE message or signature' });
    }

    const fields = result.data;
    req.session.nonce = undefined;

    if (fields.domain !== DOMAIN) {
      return res.status(400).json({ error: 'Invalid domain' });
    }
    if (fields.uri !== SIWE_URI) {
      return res.status(400).json({ error: 'Invalid SIWE URI' });
    }
    const now = new Date();
    if (fields.expirationTime && new Date(fields.expirationTime) < now) {
      return res.status(400).json({ error: 'SIWE message expired' });
    }
    if (fields.notBefore && new Date(fields.notBefore) > now) {
      return res.status(400).json({ error: 'SIWE message not yet valid' });
    }

    // Create a persistent session in Redis
    const session = await sessionService.createSession(fields.address, true, []); // customize as needed

    // Store sessionId in express-session for frontend reference
    req.session.siwe = {
      address: fields.address,
      sessionId: session.sessionId,
      createdAt: session.createdAt.toString(),
      expiresAt: session.expiresAt.toString(),
    };

    const { sessionId } = session;

    return res.json({
      success: true,
      address: fields.address,
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Invalid SIWE message or signature' });
  }
});

export default router;