import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService.js';
import { findTokenByAddress, fuzzyFindTokenByAddress } from '../services/tokenListService.js';
import { wallyService } from '../services/wallyService.js';
import logger from '../infra/mon/logger.js';

export const getTokenBalance = async (req: Request, res: Response) => {
    const { userAddress, tokenAddress } = req.body;

    try {
        const isValidSession = await sessionService.validateSession(userAddress);
        if (!isValidSession) {
            return res.status(401).json({ message: 'Invalid session or signature.' });
        }

        const token = findTokenByAddress(tokenAddress);
        if (!token) {
            const suggestion = fuzzyFindTokenByAddress(tokenAddress);
            return res.status(400).json({
                message: 'Invalid token address.',
                suggestion: suggestion ? suggestion.address : null,
                symbol: suggestion ? suggestion.symbol : undefined
            });
        }
        if (token.address.toLowerCase() !== tokenAddress.toLowerCase()) {
            return res.status(400).json({ message: 'Invalid token address.', suggestion: token.address, symbol: token.symbol });
        }

        const balance = await wallyService.getTokenBalance(userAddress, tokenAddress);
        res.status(200).json({ balance });
    } catch (error: any) {
        logger.error(`Error occurred while fetching balance: ${error}`);
        return res.status(500).json({ message: 'An error occurred while fetching the balance.', error: error.message });
    }
};

export const transferTokens = async (req: Request, res: Response) => {
    const { userAddress, tokenAddress, amount, signature, to } = req.body;

    try {
        const isValidSession = await sessionService.validateSession(userAddress);
        if (!isValidSession) {
            return res.status(401).json({ message: 'Invalid session or signature.' });
        }

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Invalid transfer amount.' });
        }

        const token = findTokenByAddress(tokenAddress);
        if (!token) {
            const suggestion = fuzzyFindTokenByAddress(tokenAddress);
            return res.status(400).json({
                message: 'Invalid token address.',
                suggestion: suggestion ? suggestion.address : null,
                symbol: suggestion ? suggestion.symbol : undefined
            });
        }
        if (token.address.toLowerCase() !== tokenAddress.toLowerCase()) {
            return res.status(400).json({
                message: 'Invalid token address.',
                suggestion: token.address,
                symbol: token.symbol
            });
        }

        const transferResult = await wallyService.transferTokens(
            userAddress,
            tokenAddress,
            to,
            amount,
            signature
        );
        if (!transferResult) {
            return res.status(500).json({ message: 'Transfer failed due to an unknown error.' });
        }
        if (transferResult.success) {
            return res.status(200).json({ message: 'Transfer successful.', transactionHash: transferResult.transactionHash });
        } else {
            return res.status(500).json({ message: 'Transfer failed.', error: transferResult.error });
        }
    } catch (error: any) {
        logger.error(`Error occurred during transfer: ${error}`);
        return res.status(500).json({ message: 'An error occurred during the transfer.', error: error.message });
    }
};

// Handler for getting balances of one or more tokens
export async function getAllTokenBalancesHandler(req: Request, res: Response) {
    try {
        const { userAddress, tokenAddressesArray } = req.body;

        let tokens: string[] = [];
        if (typeof tokenAddressesArray === 'string') {
            tokens = tokenAddressesArray.split(',').map(t => t.trim()).filter(Boolean);
        } else if (Array.isArray(tokenAddressesArray)) {
            tokens = tokenAddressesArray;
        }

        if (!userAddress || !tokens.length) {
            return res.status(400).json({ error: 'userAddress and tokenAddressesArray are required.' });
        }

        if (tokens.length === 1) {
            const balance = await wallyService.getTokenBalance(userAddress, tokens[0]);
            return res.json({ token: tokens[0], balance });
        }

        if (tokens.length > 1) {
            const balances = await wallyService.getAllTokenBalances(userAddress, tokens);
            if (!balances || balances.length === 0) {
                return res.status(404).json({ message: 'No token balances found.' });
            }
            return res.json({ balances });
        }

        return res.status(400).json({ error: 'No token addresses provided' });
    } catch (err) {
        console.error('getTokenBalancesHandler error:', err);
        const errorMessage = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : 'Internal server error';
        res.status(500).json({ error: errorMessage });
    }
};

export const getTokenAllowance = async (req: Request, res: Response) => {
    const { userAddress, tokenAddress, spenderAddress } = req.body;

    try {
        const isValidSession = await sessionService.validateSession(userAddress);
        if (!isValidSession) {
            return res.status(401).json({ message: 'Invalid session or signature.' });
        }

        const token = findTokenByAddress(tokenAddress);
        if (!token) {
            const suggestion = fuzzyFindTokenByAddress(tokenAddress);
            return res.status(400).json({
                message: 'Invalid token address.',
                suggestion: suggestion ? suggestion.address : null,
                symbol: suggestion ? suggestion.symbol : undefined
            });
        }
        if (token.address.toLowerCase() !== tokenAddress.toLowerCase()) {
            return res.status(400).json({ message: 'Invalid token address.', suggestion: token.address, symbol: token.symbol });
        }

        const allowance = await wallyService.getTokenAllowance(userAddress, tokenAddress, spenderAddress);
        res.status(200).json({ allowance });
    } catch (error: any) {
        logger.error(`Error occurred while fetching allowance: ${error}`);
        return res.status(500).json({ message: 'An error occurred while fetching the allowance.', error: error.message });
    }
};

export const getAllTokenAllowancesHandler = async (req: Request, res: Response) => {
    try {
        const { userAddress, spenderAddress, tokenAddressesArray } = req.body;

        let tokens: string[] = [];
        if (typeof tokenAddressesArray === 'string') {
            tokens = tokenAddressesArray.split(',').map(t => t.trim()).filter(Boolean);
        } else if (Array.isArray(tokenAddressesArray)) {
            tokens = tokenAddressesArray;
        }

        if (!userAddress || !spenderAddress || !tokens.length) {
            return res.status(400).json({ error: 'userAddress, spenderAddress, and tokenAddressesArray are required.' });
        }

        if (tokens.length === 1) {
            const allowance = await wallyService.getTokenAllowance(userAddress, tokens[0], spenderAddress);
            return res.json({ token: tokens[0], allowance });
        }

        if (tokens.length > 1) {
            const allowances = await wallyService.getAllTokenAllowances(userAddress, spenderAddress, tokens);
            if (!allowances || Object.keys(allowances).length === 0) {
                return res.status(404).json({ message: 'No token allowances found.' });
            }
            return res.json({ allowances });
        }

        return res.status(400).json({ error: 'No token addresses provided' });
    } catch (err) {
        console.error('getAllTokenAllowancesHandler error:', err);
        const errorMessage = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : 'Internal server error';
        res.status(500).json({ error: errorMessage });
    }
};
