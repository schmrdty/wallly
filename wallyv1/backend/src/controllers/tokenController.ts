import { Request, Response, NextFunction } from 'express';
import { WallyService } from '../services/wallyService.js';
import { roundRobinFindToken } from '../services/tokenListService.js';
import logger from '../infra/mon/logger.js';

const wallyService = new WallyService();

export const resolveToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tokenData = req.body;
    logger.info('Resolving token:', tokenData);
    // TODO: Implement token resolution logic
    res.json({ success: true, token: tokenData });
  } catch (error) {
    logger.error('Error resolving token:', error);
    next(error);
  }
};

export const startWatchingToken = async (req: Request, res: Response): Promise<void> => {
  const { userAddress, tokenAddress } = req.body;
  try {
    await wallyService.startWatchingToken(userAddress, tokenAddress);
    res.status(200).json({ message: 'Started watching token.' });
  } catch (error) {
    logger.error('Error starting to watch token', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const stopWatchingToken = async (req: Request, res: Response): Promise<void> => {
  const { userAddress, tokenAddress } = req.body;
  try {
    await wallyService.stopWatchingToken(userAddress, tokenAddress);
    res.status(200).json({ message: 'Stopped watching token.' });
  } catch (error) {
    logger.error('Error stopping to watch token', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTokenBalance = async (req: Request, res: Response): Promise<void> => {
  const { userAddress, tokenAddress } = req.body;
  try {
    const balance = await wallyService.getTokenBalance(userAddress, tokenAddress);
    res.status(200).json({ balance });
  } catch (error) {
    logger.error('Error fetching token balance', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTokenBalances = async (req: Request, res: Response): Promise<void> => {
  const { userAddress, tokenAddresses } = req.body;
  try {
    let tokens: string[] = [];
    if (typeof tokenAddresses === 'string') {
      tokens = tokenAddresses.split(',').map(t => t.trim()).filter(Boolean);
    } else if (Array.isArray(tokenAddresses)) {
      tokens = tokenAddresses;
    }
    if (!userAddress || !tokens.length) {
      res.status(400).json({ error: 'userAddress and tokenAddresses are required.' });
      return;
    }
    const balances = await wallyService.getAllTokenBalances(userAddress, tokens);
    res.status(200).json({ balances });
  } catch (error) {
    logger.error('Error fetching token balances', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTokenPrice = async (req: Request, res: Response): Promise<void> => {
  const { tokenAddress } = req.body;
  try {
    const price = await wallyService.getTokenPrice(tokenAddress);
    res.status(200).json({ price });
  } catch (error) {
    logger.error('Error fetching token price', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTokenPrices = async (req: Request, res: Response): Promise<void> => {
  const { tokenAddresses } = req.body;
  try {
    const prices = await wallyService.getTokenPrices(tokenAddresses);
    res.status(200).json({ prices });
  } catch (error) {
    logger.error('Error fetching token prices', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTokenMetadata = async (req: Request, res: Response): Promise<void> => {
  const { tokenAddress } = req.body;
  try {
    const metadata = await wallyService.getTokenMetadata(tokenAddress);
    res.status(200).json({ metadata });
  } catch (error) {
    logger.error('Error fetching token metadata', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTokenMetadataBatch = async (req: Request, res: Response): Promise<void> => {
  const { tokenAddresses } = req.body;
  try {
    const metadata = await wallyService.getTokenMetadataBatch(tokenAddresses);
    res.status(200).json({ metadata });
  } catch (error) {
    logger.error('Error fetching token metadata batch', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTokenAllowance = async (req: Request, res: Response): Promise<void> => {
  const { userAddress, tokenAddress, spenderAddress } = req.body;
  try {
    if (!userAddress || !tokenAddress || !spenderAddress) {
      res.status(400).json({ error: 'userAddress, tokenAddress, and spenderAddress are required.' });
      return;
    }
    const allowance = await wallyService.getTokenAllowance(userAddress, tokenAddress, spenderAddress);
    res.status(200).json({ allowance });
  } catch (error) {
    logger.error('Error fetching token allowance', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTokenAllowances = async (req: Request, res: Response): Promise<void> => {
  const { userAddress, spenderAddress, tokenAddresses } = req.body;
  try {
    let tokens: string[] = [];
    if (typeof tokenAddresses === 'string') {
      tokens = tokenAddresses.split(',').map(t => t.trim()).filter(Boolean);
    } else if (Array.isArray(tokenAddresses)) {
      tokens = tokenAddresses;
    }
    if (!userAddress || !spenderAddress || !tokens.length) {
      res.status(400).json({ error: 'userAddress, spenderAddress, and tokenAddresses are required.' });
      return;
    }
    const allowances = await wallyService.getAllTokenAllowances(userAddress, spenderAddress, tokens);
    res.status(200).json({ allowances });
  } catch (error) {
    logger.error('Error fetching token allowances', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchToken = async (req: Request, res: Response) => {
  const { userAddress, tokenAddress } = req.body;
  try {
    await wallyService.watchToken(userAddress, tokenAddress);
    res.status(200).json({ message: 'Token is being watched.' });
  } catch (error) {
    logger.error('Error watching token', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchToken = async (req: Request, res: Response) => {
  const { userAddress, tokenAddress } = req.body;
  try {
    await wallyService.unwatchToken(userAddress, tokenAddress);
    res.status(200).json({ message: 'Token is no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenWatched = async (req: Request, res: Response) => {
  const { userAddress, tokenAddress } = req.body;
  try {
    const isWatched = await wallyService.isTokenWatched(userAddress, tokenAddress);
    res.status(200).json({ isWatched });
  } catch (error) {
    logger.error('Error checking if token is watched', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenWatchedBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenAddresses } = req.body;
  try {
    const watchedTokens = await wallyService.isTokenWatchedBatch(userAddress, tokenAddresses);
    res.status(200).json({ watchedTokens });
  } catch (error) {
    logger.error('Error checking if tokens are watched', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokensBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenAddresses } = req.body;
  try {
    await wallyService.watchTokensBatch(userAddress, tokenAddresses);
    res.status(200).json({ message: 'Tokens are being watched.' });
  } catch (error) {
    logger.error('Error watching tokens', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokensBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenAddresses } = req.body;
  try {
    await wallyService.unwatchTokensBatch(userAddress, tokenAddresses);
    res.status(200).json({ message: 'Tokens are no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching tokens', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenList = async (req: Request, res: Response) => {
  const { userAddress, tokenList } = req.body;
  try {
    await wallyService.watchTokenList(userAddress, tokenList);
    res.status(200).json({ message: 'Token list is being watched.' });
  } catch (error) {
    logger.error('Error watching token list', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenList = async (req: Request, res: Response) => {
  const { userAddress, tokenList } = req.body;
  try {
    await wallyService.unwatchTokenList(userAddress, tokenList);
    res.status(200).json({ message: 'Token list is no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token list', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatched = async (req: Request, res: Response) => {
  const { userAddress, tokenList } = req.body;
  try {
    const isWatched = await wallyService.isTokenListWatched(userAddress, tokenList);
    res.status(200).json({ isWatched });
  } catch (error) {
    logger.error('Error checking if token list is watched', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatchedBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenLists } = req.body;
  try {
    const watchedTokenLists = await wallyService.isTokenListWatchedBatch(userAddress, tokenLists);
    res.status(200).json({ watchedTokenLists });
  } catch (error) {
    logger.error('Error checking if token lists are watched', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenListsBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenLists } = req.body;
  try {
    await wallyService.watchTokenListsBatch(userAddress, tokenLists);
    res.status(200).json({ message: 'Token lists are being watched.' });
  } catch (error) {
    logger.error('Error watching token lists', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenListsBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenLists } = req.body;
  try {
    await wallyService.unwatchTokenListsBatch(userAddress, tokenLists);
    res.status(200).json({ message: 'Token lists are no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token lists', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenListById = async (req: Request, res: Response) => {
  const { userAddress, tokenListId } = req.body;
  try {
    await wallyService.watchTokenListById(userAddress, tokenListId);
    res.status(200).json({ message: 'Token list is being watched.' });
  } catch (error) {
    logger.error('Error watching token list by ID', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenListById = async (req: Request, res: Response): Promise<void> => {
  const { userAddress, tokenListId } = req.body;
  try {
    await wallyService.unwatchTokenListById(userAddress, tokenListId);
    res.status(200).json({ message: 'Token list is no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token list by ID', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatchedById = async (req: Request, res: Response): Promise<void> => {
  const { userAddress, tokenListId } = req.body;
  try {
    const isWatched = await wallyService.isTokenListWatchedById(userAddress, tokenListId);
    res.status(200).json({ isWatched });
  } catch (error) {
    logger.error('Error checking if token list is watched by ID', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatchedByIdBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListIds } = req.body;
  try {
    const watchedTokenLists = await wallyService.isTokenListWatchedByIdBatch(userAddress, tokenListIds);
    res.status(200).json({ watchedTokenLists });
  } catch (error) {
    logger.error('Error checking if token lists are watched by ID', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenListsByIdBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListIds } = req.body;
  try {
    await wallyService.watchTokenListsByIdBatch(userAddress, tokenListIds);
    res.status(200).json({ message: 'Token lists are being watched.' });
  } catch (error) {
    logger.error('Error watching token lists by ID', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenListsByIdBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListIds } = req.body;
  try {
    await wallyService.unwatchTokenListsByIdBatch(userAddress, tokenListIds);
    res.status(200).json({ message: 'Token lists are no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token lists by ID', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenListByName = async (req: Request, res: Response) => {
  const { userAddress, tokenListName } = req.body;
  try {
    await wallyService.watchTokenListByName(userAddress, tokenListName);
    res.status(200).json({ message: 'Token list is being watched.' });
  } catch (error) {
    logger.error('Error watching token list by name', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenListByName = async (req: Request, res: Response) => {
  const { userAddress, tokenListName } = req.body;
  try {
    await wallyService.unwatchTokenListByName(userAddress, tokenListName);
    res.status(200).json({ message: 'Token list is no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token list by name', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatchedByName = async (req: Request, res: Response) => {
  const { userAddress, tokenListName } = req.body;
  try {
    const isWatched = await wallyService.isTokenListWatchedByName(userAddress, tokenListName);
    res.status(200).json({ isWatched });
  } catch (error) {
    logger.error('Error checking if token list is watched by name', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatchedByNameBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListNames } = req.body;
  try {
    const watchedTokenLists = await wallyService.isTokenListWatchedByNameBatch(userAddress, tokenListNames);
    res.status(200).json({ watchedTokenLists });
  } catch (error) {
    logger.error('Error checking if token lists are watched by name', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenListsByNameBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListNames } = req.body;
  try {
    await wallyService.watchTokenListsByNameBatch(userAddress, tokenListNames);
    res.status(200).json({ message: 'Token lists are being watched.' });
  } catch (error) {
    logger.error('Error watching token lists by name', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenListsByNameBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListNames } = req.body;
  try {
    await wallyService.unwatchTokenListsByNameBatch(userAddress, tokenListNames);
    res.status(200).json({ message: 'Token lists are no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token lists by name', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenListBySymbol = async (req: Request, res: Response) => {
  const { userAddress, tokenListSymbol } = req.body;
  try {
    await wallyService.watchTokenListBySymbol(userAddress, tokenListSymbol);
    res.status(200).json({ message: 'Token list is being watched.' });
  } catch (error) {
    logger.error('Error watching token list by symbol', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenListBySymbol = async (req: Request, res: Response) => {
  const { userAddress, tokenListSymbol } = req.body;
  try {
    await wallyService.unwatchTokenListBySymbol(userAddress, tokenListSymbol);
    res.status(200).json({ message: 'Token list is no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token list by symbol', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatchedBySymbol = async (req: Request, res: Response) => {
  const { userAddress, tokenListSymbol } = req.body;
  try {
    const isWatched = await wallyService.isTokenListWatchedBySymbol(userAddress, tokenListSymbol);
    res.status(200).json({ isWatched });
  } catch (error) {
    logger.error('Error checking if token list is watched by symbol', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatchedBySymbolBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListSymbols } = req.body;
  try {
    const watchedTokenLists = await wallyService.isTokenListWatchedBySymbolBatch(userAddress, tokenListSymbols);
    res.status(200).json({ watchedTokenLists });
  } catch (error) {
    logger.error('Error checking if token lists are watched by symbol', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenListsBySymbolBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListSymbols } = req.body;
  try {
    await wallyService.watchTokenListsBySymbolBatch(userAddress, tokenListSymbols);
    res.status(200).json({ message: 'Token lists are being watched.' });
  } catch (error) {
    logger.error('Error watching token lists by symbol', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenListsBySymbolBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListSymbols } = req.body;
  try {
    await wallyService.unwatchTokenListsBySymbolBatch(userAddress, tokenListSymbols);
    res.status(200).json({ message: 'Token lists are no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token lists by symbol', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenListByAddress = async (req: Request, res: Response) => {
  const { userAddress, tokenListAddress } = req.body;
  try {
    await wallyService.watchTokenListByAddress(userAddress, tokenListAddress);
    res.status(200).json({ message: 'Token list is being watched.' });
  } catch (error) {
    logger.error('Error watching token list by address', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenListByAddress = async (req: Request, res: Response) => {
  const { userAddress, tokenListAddress } = req.body;
  try {
    await wallyService.unwatchTokenListByAddress(userAddress, tokenListAddress);
    res.status(200).json({ message: 'Token list is no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token list by address', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatchedByAddress = async (req: Request, res: Response) => {
  const { userAddress, tokenListAddress } = req.body;
  try {
    const isWatched = await wallyService.isTokenListWatchedByAddress(userAddress, tokenListAddress);
    res.status(200).json({ isWatched });
  } catch (error) {
    logger.error('Error checking if token list is watched by address', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const isTokenListWatchedByAddressBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListAddresses } = req.body;
  try {
    const watchedTokenLists = await wallyService.isTokenListWatchedByAddressBatch(userAddress, tokenListAddresses);
    res.status(200).json({ watchedTokenLists });
  } catch (error) {
    logger.error('Error checking if token lists are watched by address', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const watchTokenListsByAddressBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListAddresses } = req.body;
  try {
    await wallyService.watchTokenListsByAddressBatch(userAddress, tokenListAddresses);
    res.status(200).json({ message: 'Token lists are being watched.' });
  } catch (error) {
    logger.error('Error watching token lists by address', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const unwatchTokenListsByAddressBatch = async (req: Request, res: Response) => {
  const { userAddress, tokenListAddresses } = req.body;
  try {
    await wallyService.unwatchTokenListsByAddressBatch(userAddress, tokenListAddresses);
    res.status(200).json({ message: 'Token lists are no longer being watched.' });
  } catch (error) {
    logger.error('Error unwatching token lists by address', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const listWatchedTokens = async (req: Request, res: Response) => {
  const { userAddress } = req.body;
  try {
    const tokens = await wallyService.listWatchedTokens(userAddress);
    res.status(200).json({ tokens });
  } catch (error) {
    logger.error('Error listing watched tokens', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
