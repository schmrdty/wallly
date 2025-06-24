import 'dotenv/config';
import wallyv1Abi from '../abis/wallyv1.json' with { type: 'json' };
import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  formatUnits,
  parseEther,
  encodeFunctionData,
  hashMessage as viemHashMessage,
  keccak256,
  toBytes,
  recoverAddress,
  hashTypedData,
  maxUint256,
  erc20Abi,
  parseUnits,
  zeroAddress,
} from 'viem';
import { optimism, base } from 'viem/chains';
import { privateKeyToAccount as viemPrivateKeyToAccount } from 'viem/accounts';
import { fuzzyFindTokenByAddress } from '../utils/helpers.js';
import { loadTokenList } from '../services/tokenListService.js';
import { UserPermission, MiniAppSession, TransferRequest } from '../types/automation.js';
import { siweSignIn } from '../controllers/authController.js';
import { getNextRpcUrl } from '../utils/rpcProvider.js';

const siweChainId = 10; // Optimism Mainnet (Farcaster AuthKit and SIWF verification must use Optimism)

function getChain(chainId: number) {
  if (chainId === 10) return optimism; // Farcaster AuthKit/Sign-in
  if (chainId === 8453) return base;   // App contract actions after auth
  // Add other chains here as needed
  throw new Error(`Unsupported chainId: ${chainId}`);
}

function getViemClient(chainId: number = siweChainId) {
  // Farcaster auth and SIWF verification must use Optimism (chainId 10)
  const rpcUrl = getNextRpcUrl(chainId);
  return createPublicClient({
    chain: getChain(chainId),
    transport: http(rpcUrl),
  });
}

function getWalletClient(chainId: number = siweChainId): any {
  // Farcaster auth and SIWF verification must use Optimism (chainId 10)
  const account = viemPrivateKeyToAccount(PRIVATE_KEY);
  const rpcUrl = getNextRpcUrl(chainId);
  return createWalletClient({
    account,
    chain: getChain(chainId),
    transport: http(rpcUrl),
  });
}

// --- EOA vs Smart Wallet Detection ---
export async function isSmartWallet(address: string): Promise<boolean> {
  try {
    const client = getViemClient();
    const code = await client.getCode({ address: address as `0x${string}` });
    return !!(code && code !== '0x');
  } catch (err) {
    console.error('Error detecting smart wallet:', err);
    throw new Error('Failed to detect wallet type');
  }
}

const contractAddress = process.env.WALLY_CONTRACT_ADDRESS as `0x${string}`;
if (!contractAddress) throw new Error('WALLY_CONTRACT_ADDRESS is not set');

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
if (!PRIVATE_KEY) throw new Error('PRIVATE_KEY is not set for contract writes');

// --- Signature Verification (EOA/EIP-1271) ---
export async function verifySignature(
  address: string,
  message: string,
  signature: string,
  eip712?: { domain: any, types: any, data: any, primaryType?: string } // optional EIP-712 params
): Promise<boolean> {
  const client = getViemClient();
  try {
    const isSmart = await isSmartWallet(address);
    if (!isSmart) {
      // EOA: Use ecrecover (handled by viem verifyMessage)
      return await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
    } else {
      // Smart wallet: Use EIP-1271 isValidSignature
      const isValidSignatureAbi = [
        {
          name: 'isValidSignature',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: '_hash', type: 'bytes32' },
            { name: '_signature', type: 'bytes' }
          ],
          outputs: [{ name: 'magicValue', type: 'bytes4' }]
        }
      ];
      const contract = getContract({
        address: address as `0x${string}`,
        abi: isValidSignatureAbi,
        client,
      });

      // Try EIP-191 personal_sign hash first
      try {
        const hash = hashMessage(message);
        const magicValue = await contract.read.isValidSignature([hash, signature]);
        if (magicValue === '0x1626ba7e') return true;
      } catch (err) {
        // Continue to EIP-712 fallback 
      }

      if (eip712) {
        try {
          if (!eip712.primaryType) throw new Error('primaryType is required for EIP-712 signature verification');
          const hash = hashTypedData({
            domain: eip712.domain,
            types: eip712.types,
            message: eip712.data,
            primaryType: eip712.primaryType
          });
          const magicValue = await contract.read.isValidSignature([hash, signature]);
          if (magicValue === '0x1626ba7e') return true;
        } catch (err) {
          // EIP-712 fallback failed
        }
      }

      // If neither worked, return false
      return false;
    }
  } catch (err) {
    console.error('Signature verification failed:', err);
    return false;
  }
}

export class WallyService {
  private watcherContract: any;
  private writerContract: any;
  private client: any;
  private walletClient: any;

  constructor() {
    this.client = getViemClient();
    this.walletClient = getWalletClient();
    this.watcherContract = getContract({
      address: contractAddress,
      abi: wallyv1Abi,
      client: this.client,
    });
    this.writerContract = getContract({
      address: contractAddress,
      abi: wallyv1Abi,
      client: this.walletClient,
    });
  }

  async getUserPermission(wallet: string): Promise<UserPermission> {
    try {
      const permission = await this.watcherContract.read.getUserPermission([wallet]);
      return {
        withdrawalAddress: permission.withdrawalAddress,
        allowEntireWallet: permission.allowEntireWallet,
        expiresAt: Number(permission.expiresAt),
        isActive: permission.isActive,
        tokenList: permission.tokenList || [],
        minBalances: permission.minBalances || [],
        limits: permission.limits || [],
      };
    } catch (error) {
      console.error('Error getting user permission:', error);
      throw error;
    }
  }

  async getMiniAppSession(wallet: string): Promise<MiniAppSession> {
    try {
      const session = await this.watcherContract.read.getMiniAppSession([wallet]);
      return {
        delegate: session.delegate,
        expiresAt: Number(session.expiresAt),
        allowedTokens: session.allowedTokens || [],
        allowWholeWallet: session.allowWholeWallet,
        active: session.active,
      };
    } catch (error) {
      console.error('Error getting mini app session:', error);
      throw error;
    }
  }

  async executeTransfer(transfer: TransferRequest): Promise<any> {
    try {
      const { wallet, token, recipient, amount } = transfer;

      if (token === zeroAddress) {
        // Native token transfer
        return await this.writerContract.write.executeNativeTransfer([
          wallet,
          recipient,
          parseEther(amount)
        ]);
      } else {
        // ERC20 transfer
        const decimals = await this.client.readContract({
          address: token as `0x${string}`,
          abi: erc20Abi,
          functionName: 'decimals',
        });
        const parsedAmount = parseUnits(amount, decimals);

        return await this.writerContract.write.executeERC20Transfer([
          wallet,
          token,
          recipient,
          parsedAmount
        ]);
      }
    } catch (error) {
      console.error('Error executing transfer:', error);
      throw error;
    }
  }

  async executeBatchTransfer(transfers: TransferRequest[]): Promise<any> {
    try {
      const batchData = transfers.map(transfer => ({
        wallet: transfer.wallet,
        token: transfer.token,
        recipient: transfer.recipient,
        amount: transfer.token === zeroAddress
          ? parseEther(transfer.amount)
          : parseUnits(transfer.amount, 18) // Default to 18 decimals, should fetch real decimals
      }));

      return await this.writerContract.write.executeBatchTransfer([batchData]);
    } catch (error) {
      console.error('Error executing batch transfer:', error);
      throw error;
    }
  }

  async validatePermissions(wallet: string): Promise<boolean> {
    try {
      const permission = await this.getUserPermission(wallet);
      const now = Date.now() / 1000;
      return permission.isActive && permission.expiresAt > now;
    } catch (error) {
      console.error('Error validating permissions:', error);
      return false;
    }
  }

  async getBalance(walletAddress: string, tokenAddress?: string): Promise<bigint> {
    try {
      if (!tokenAddress || tokenAddress === zeroAddress) {
        return await this.client.getBalance({ address: walletAddress as `0x${string}` });
      } else {
        return await this.client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`]
        });
      }
    } catch (error) {
      console.error('Error getting balance:', error);
      return BigInt(0);
    }
  }

  // --- READ: Use public client for reads ---
  async getTokenBalance(userAddress: string, tokenAddress: string) {
    try {
      const tokenList = await loadTokenList();
      const token = fuzzyFindTokenByAddress(tokenAddress, tokenList);
      if (!token || token.address.toLowerCase() !== tokenAddress.toLowerCase()) {
        throw new Error('Invalid token address');
      }
      const erc20Abi = [
        { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
        { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }
      ];
      const viemClient = getViemClient();
      const erc20 = getContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        client: viemClient,
      });
      const balance = await erc20.read.balanceOf([userAddress as `0x${string}`]);
      let decimals: number;
      if ('decimals' in token && typeof (token as any).decimals === 'number') {
        decimals = (token as any).decimals;
      } else {
        decimals = await erc20.read.decimals() as number;
      }
      return formatUnits(balance as bigint, decimals);
    } catch (err) {
      console.error('getTokenBalance error:', err);
      throw err;
    }
  }

  async getAllTokenBalances(userAddress: string, tokenAddressesArray: string[]) {
    try {
      const tokenList = await loadTokenList();
      const tokens = tokenAddressesArray.map(address => fuzzyFindTokenByAddress(address, tokenList)).filter(Boolean);
      if (tokens.length === 0) {
        throw new Error('Invalid token addresses');
      }
      const erc20Abi = [
        { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
        { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }
      ];
      const viemClient = getViemClient();

      // For each token address, get balance and decimals
      const balances = await Promise.all(
        tokenAddressesArray.map(async (tokenAddress) => {
          const token = fuzzyFindTokenByAddress(tokenAddress, tokenList);
          if (!token || token.address.toLowerCase() !== tokenAddress.toLowerCase()) {
            throw new Error(`Invalid token address: ${tokenAddress}`);
          }
          const erc20 = getContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            client: viemClient,
          });
          const balance = await erc20.read.balanceOf([userAddress as `0x${string}`]);
          let decimals: number;
          if ('decimals' in token && typeof (token as any).decimals === 'number') {
            decimals = (token as any).decimals;
          } else {
            decimals = await erc20.read.decimals() as number;
          }
          return {
            tokenAddress,
            balance: formatUnits(balance as bigint, decimals),
          };
        })
      );
      return balances;
    } catch (err) {
      console.error('getAllTokenBalances error:', err);
      throw err;
    }
  }

  // --- WRITE: Use wallet client for writes (EOA or relayer) ---
  async activateSessionBySig(user: string, app: string, expiresAt: bigint, nonce: bigint, signature: string) {
    try {
      const txHash = await this.walletClient.writeContract({
        address: contractAddress,
        abi: wallyv1Abi,
        functionName: 'activateSessionBySig',
        args: [
          user,
          app,
          expiresAt,
          nonce,
          signature
        ]
      });
      return { success: true, transactionHash: txHash };
    } catch (err: any) {
      console.error('activateSessionBySig error:', err);
      return { success: false, error: err?.reason || err?.message || 'Unknown error' };
    }
  }

  // --- Smart Session Automation (using backend.mdc pattern) ---
  async executeSmartSession(
    userAddress: string,
    chainId: number,
    contractAddress: string,
    abi: any,
    functionName: string,
    args: any[],
    context: any
  ) {
    // Stub: implement as needed
    throw new Error('executeSmartSession not implemented');
  }

  async transferTokens(
    from: string,
    tokenAddress: string,
    to: string,
    amount: string | number,
    signature?: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    // Stub: implement as needed
    throw new Error('transferTokens not implemented');
  }

  // --- Token Watching ---
  async startWatchingToken(userAddress: string, tokenAddress: string) { throw new Error('startWatchingToken not implemented'); }
  async stopWatchingToken(userAddress: string, tokenAddress: string) { throw new Error('stopWatchingToken not implemented'); }
  async watchToken(userAddress: string, tokenAddress: string) { return this.startWatchingToken(userAddress, tokenAddress); }
  async unwatchToken(userAddress: string, tokenAddress: string) { return this.stopWatchingToken(userAddress, tokenAddress); }
  async isTokenWatched(userAddress: string, tokenAddress: string) { throw new Error('isTokenWatched not implemented'); }
  async isTokenWatchedBatch(userAddress: string, tokenAddresses: string[]) { throw new Error('isTokenWatchedBatch not implemented'); }
  async watchTokensBatch(userAddress: string, tokenAddresses: string[]) { throw new Error('watchTokensBatch not implemented'); }
  async unwatchTokensBatch(userAddress: string, tokenAddresses: string[]) { throw new Error('unwatchTokensBatch not implemented'); }
  async listWatchedTokens(userAddress: string) { throw new Error('listWatchedTokens not implemented'); }

  // --- Token List Watching (stubs, implement as needed) ---
  async watchTokenList(userAddress: string, tokenList: string[]) { throw new Error('watchTokenList not implemented'); }
  async unwatchTokenList(userAddress: string, tokenList: string[]) { throw new Error('unwatchTokenList not implemented'); }
  async isTokenListWatched(userAddress: string, tokenList: string[]) { throw new Error('isTokenListWatched not implemented'); }
  async isTokenListWatchedBatch(userAddress: string, tokenLists: string[][]) { throw new Error('isTokenListWatchedBatch not implemented'); }
  async watchTokenListsBatch(userAddress: string, tokenLists: string[][]) { throw new Error('watchTokenListsBatch not implemented'); }
  async unwatchTokenListsBatch(userAddress: string, tokenLists: string[][]) { throw new Error('unwatchTokenListsBatch not implemented'); }
  async watchTokenListById(userAddress: string, tokenListId: string) { throw new Error('watchTokenListById not implemented'); }
  async unwatchTokenListById(userAddress: string, tokenListId: string) { throw new Error('unwatchTokenListById not implemented'); }
  async isTokenListWatchedById(userAddress: string, tokenListId: string) { throw new Error('isTokenListWatchedById not implemented'); }
  async isTokenListWatchedByIdBatch(userAddress: string, tokenListIds: string[]) { throw new Error('isTokenListWatchedByIdBatch not implemented'); }
  async watchTokenListsByIdBatch(userAddress: string, tokenListIds: string[]) { throw new Error('watchTokenListsByIdBatch not implemented'); }
  async unwatchTokenListsByIdBatch(userAddress: string, tokenListIds: string[]) { throw new Error('unwatchTokenListsByIdBatch not implemented'); }
  async watchTokenListByName(userAddress: string, tokenListName: string) { throw new Error('watchTokenListByName not implemented'); }
  async unwatchTokenListByName(userAddress: string, tokenListName: string) { throw new Error('unwatchTokenListByName not implemented'); }
  async isTokenListWatchedByName(userAddress: string, tokenListName: string) { throw new Error('isTokenListWatchedByName not implemented'); }
  async isTokenListWatchedByNameBatch(userAddress: string, tokenListNames: string[]) { throw new Error('isTokenListWatchedByNameBatch not implemented'); }
  async watchTokenListsByNameBatch(userAddress: string, tokenListNames: string[]) { throw new Error('watchTokenListsByNameBatch not implemented'); }
  async unwatchTokenListsByNameBatch(userAddress: string, tokenListNames: string[]) { throw new Error('unwatchTokenListsByNameBatch not implemented'); }
  async watchTokenListBySymbol(userAddress: string, tokenListSymbol: string) { throw new Error('watchTokenListBySymbol not implemented'); }
  async unwatchTokenListBySymbol(userAddress: string, tokenListSymbol: string) { throw new Error('unwatchTokenListBySymbol not implemented'); }
  async isTokenListWatchedBySymbol(userAddress: string, tokenListSymbol: string) { throw new Error('isTokenListWatchedBySymbol not implemented'); }
  async isTokenListWatchedBySymbolBatch(userAddress: string, tokenListSymbols: string[]) { throw new Error('isTokenListWatchedBySymbolBatch not implemented'); }
  async watchTokenListsBySymbolBatch(userAddress: string, tokenListSymbols: string[]) { throw new Error('watchTokenListsBySymbolBatch not implemented'); }
  async unwatchTokenListsBySymbolBatch(userAddress: string, tokenListSymbols: string[]) { throw new Error('unwatchTokenListsBySymbolBatch not implemented'); }
  async watchTokenListByAddress(userAddress: string, tokenListAddress: string) { throw new Error('watchTokenListByAddress not implemented'); }
  async unwatchTokenListByAddress(userAddress: string, tokenListAddress: string) { throw new Error('unwatchTokenListByAddress not implemented'); }
  async isTokenListWatchedByAddress(userAddress: string, tokenListAddress: string) { throw new Error('isTokenListWatchedByAddress not implemented'); }
  async isTokenListWatchedByAddressBatch(userAddress: string, tokenListAddresses: string[]) { throw new Error('isTokenListWatchedByAddressBatch not implemented'); }
  async watchTokenListsByAddressBatch(userAddress: string, tokenListAddresses: string[]) { throw new Error('watchTokenListsByAddressBatch not implemented'); }
  async unwatchTokenListsByAddressBatch(userAddress: string, tokenListAddresses: string[]) { throw new Error('unwatchTokenListsByAddressBatch not implemented'); }

  // --- Token Allowance ---
  async getTokenAllowance(userAddress: string, tokenAddress: string, spender: string): Promise<string> {
    try {
      const client = getViemClient();
      const erc20Abi = [
        { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] }
      ];
      const allowance = await client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, spender],
      }) as bigint;
      return allowance.toString();
    } catch (err) {
      console.error('getTokenAllowance error:', err);
      throw err;
    }
  }

  async getAllTokenAllowances(userAddress: string, spender: string, tokenAddressesArray: string[]) {
    const allowances: Record<string, string> = {};
    for (const tokenAddress of tokenAddressesArray) {
      try {
        allowances[tokenAddress as `0x${string}`] = await this.getTokenAllowance(userAddress, tokenAddress, spender);
      } catch (err) {
        allowances[tokenAddress as `0x${string}`] = 'error';
      }
    }
    return allowances;
  }

  // --- Token Metadata ---
  async getTokenMetadata(tokenAddress: string) {
    try {
      const client = getViemClient();
      const erc20Abi = [
        { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
        { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
        { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }
      ];
      const [name, symbol, decimals] = await Promise.all([
        client.readContract({ address: tokenAddress as `0x${string}`, abi: erc20Abi, functionName: 'name', args: [] }),
        client.readContract({ address: tokenAddress as `0x${string}`, abi: erc20Abi, functionName: 'symbol', args: [] }),
        client.readContract({ address: tokenAddress as `0x${string}`, abi: erc20Abi, functionName: 'decimals', args: [] }),
      ]);
      return { name, symbol, decimals };
    } catch (err) {
      console.error('getTokenMetadata error:', err);
      throw err;
    }
  }

  async getTokenMetadataBatch(tokenAddresses: string[]) {
    const metadata: Record<string, any> = {};
    for (const tokenAddress of tokenAddresses) {
      try {
        metadata[tokenAddress] = await this.getTokenMetadata(tokenAddress);
      } catch (err) {
        metadata[tokenAddress] = { error: 'Failed to fetch metadata' };
      }
    }
    return metadata;
  }

  // --- Token Price (stub, implement with your price API) ---
  async getTokenPrice(tokenAddress: string) {
    throw new Error('getTokenPrice not implemented');
  }
  async getTokenPrices(tokenAddresses: string[]) {
    throw new Error('getTokenPrices not implemented');
  }

  async grantMiniAppSession(userId: string, delegate: string, tokenList: string[], expiresAt: string): Promise<void> {
    // Implement your logic here
    // Example: Save session to DB or update user permissions
  }

  async revokeMiniAppSession(userId: string, delegate: string): Promise<void> {
    // Implement your logic here
    // Example: Remove session from DB or update user permissions
  }

  async miniAppTriggerTransfers(userId: string, delegate: string): Promise<void> {
    // Implement your logic here
    // Example: Trigger transfer logic for the user
  }
}

/**
 * Hash a message according to EIP-191 (personal_sign).
 */
function hashMessage(message: string): `0x${string}` {
  const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
  const prefixedMessage = prefix + message;
  return keccak256(toBytes(prefixedMessage));
}

/**
 * Verifies an EOA signature for a given address and message.
 * Returns true if the signature is valid and matches the address.
 */
async function verifyMessage({
  address,
  message,
  signature,
}: {
  address: `0x${string}`;
  message: string;
  signature: `0x${string}`;
}): Promise<boolean> {
  try {
    const msgHash = viemHashMessage(message);
    const recovered = await recoverAddress({
      hash: msgHash,
      signature,
    });
    return recovered.toLowerCase() === address.toLowerCase();
  } catch (err) {
    return false;
  }
}

export const wallyService = new WallyService();

