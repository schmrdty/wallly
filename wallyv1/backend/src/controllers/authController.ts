import { Request, Response } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { logError } from '../infra/mon/logger';
import { farcasterService } from '../services/farcasterService';
import { WallyService } from '../services/wallyService';
import { sessionService } from '../services/sessionService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
});

const wallyService = new WallyService();

export const login = async (req: Request, res: Response) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { username, password } = req.body;
    try {
        // Replace with your actual user lookup and password check
        // Sign in with Farcaster (Ethereum signature verification)
        const { message, signature, nonce, domain } = req.body;
        const result = await farcasterService.validateSignature({ domain, nonce, message, signature });

        if (!result.success) {
            return res.status(401).json({ message: 'Invalid signature' });
        }

        // You can use result.fid or result.data as the user identifier
        const user = { id: result.fid, username: result.data?.username || '' };
        if (!user.id) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ token });
    } catch (err) {
        logError(`Login error: ${err}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { userAddress, fid } = req.body;
        await sessionService.revokeSession(userAddress || fid, 'user');
        await wallyService.revokeUserPermission(userAddress || fid);
        res.status(200).json({ message: 'Logged out' });
    } catch (error) {
        logError('Error during Logout', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
};

export const validateSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        const isValid = await sessionService.validateSession(sessionId);

        if (!isValid) {
            return res.status(401).json({ message: 'Session is invalid or expired' });
        }

        res.status(200).json({ message: 'Session is valid' });
    } catch (error) {
        logError('Error during session validation', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
};