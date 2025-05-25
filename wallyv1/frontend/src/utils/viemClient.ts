import { createPublicClient, http, getContract, parseAbi, decodeEventLog } from 'viem';
import wallyv1Abi from '../abis/wallyv1.json';
import { readContract } from 'viem/actions';
import { getRpcUrl } from './rpcService';

// You can expand this to support multiple chains if needed
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
const chainId = 8453; // Base Mainnet
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

if (!rpcUrl) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_RPC_URL is not set. Please set it in your .env file for production use.');
  } else {
    // eslint-disable-next-line no-console
    console.warn('No NEXT_PUBLIC_RPC_URL provided. Viem will use a public endpoint, which is not recommended for production.');
  }
}

if (!contractAddress) {
  throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not set. Please set it in your .env file.');
}

export const viemClient = createPublicClient({
  chain: {
    id: chainId,
    name: 'Base Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl!] } },
    blockExplorers: { default: { name: 'Basescan', url: 'https://basescan.org' } },
  },
  transport: http(getRpcUrl()),
});

// Contract instance for WallyWatcherV1
export const wallyContract = getContract({
  address: contractAddress,
  abi: wallyv1Abi,
  client: viemClient,
});

//- Read contract view function
export async function readWallyView(functionName: string, args: any[] = []) {
  // Correct: spread the arguments so each is a separate parameter
  return wallyContract.read[functionName]();
}
// Helper: Call contract (write) function (requires wallet client, not public client)
// This is a placeholder for when you add wallet integration
// export async function writeWallyFunction(functionName: string, args: any[], account: Address) {
//   return wallyContract.write[functionName](...args, { account });
// }

//- Get contract events (logs)
export async function getWallyEvents(eventName: string, options: { fromBlock?: bigint, toBlock?: bigint, args?: any } = {}) {
  const eventAbi = (parseAbi(wallyv1Abi as any).filter((e: any) => e.type === 'event') as any[]).find((e: any) => e.name === eventName);
  if (!eventAbi) {
    throw new Error(`Event "${eventName}" not found in ABI`);
  }
  return viemClient.getLogs({
    address: contractAddress,
    event: eventAbi,
    ...options,
  });
}

//- Decode a log (raw log to event object)
export function decodeWallyEventLog(eventName: string, log: any) {
  return decodeEventLog({
    abi: wallyv1Abi as any,
    eventName,
    ...log,
  });
}

//- Get latest block number
export async function getLatestBlockNumber() {
  return viemClient.getBlockNumber();
}
function getUserPermission(address: any, user: any) {
    throw new Error('Function not implemented.');
}

