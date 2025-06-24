import { createConfig, http } from '@wagmi/core';
import { optimism, base } from '@wagmi/core/chains';
import * as wallyv1Abi from '../abis/wallyv1.json';
import { useBalance, useSignMessage, useSendTransaction } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { type Address } from 'viem';
import { parseUnits } from 'viem';
import { createPublicClient, http as viemHttp } from 'viem';
import { type AbiEvent } from 'viem';

// Create viem client for Optimism
export const viemClientOptimism = createPublicClient({
  chain: optimism,
  transport: viemHttp(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://optimism-mainnet.public.blastapi.io'),
});

// Create viem client for Base
export const viemClientBase = createPublicClient({
  chain: base,
  transport: viemHttp(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://base-mainnet.public.blastapi.io'),
});

const chainId = 8453; // Base Mainnet

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

if (!contractAddress) {
  throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not set. Please set it in your .env file.');
}

// Corrected chain configuration with HTTP transport
export const wagmiClient = createConfig({
  chains: [optimism, base],
  transports: {
    [optimism.id]: http(),
    [base.id]: http(),
  },
});

// Contract instance for WallyWatcherV1
export const wallyContract = {
  address: contractAddress,
  abi: wallyv1Abi,
};

// NOTE: Farcaster AuthKit and sign-in must use Optimism (chainId 10)
// Only use Base for app contract actions after authentication

//- Read contract view function
export async function readWallyView(functionName: string, args: any[] = [], chain: 'optimism' | 'base' = 'optimism') {
  // For Farcaster AuthKit/sign-in, always use Optimism
  const client = chain === 'optimism' ? viemClientOptimism : viemClientBase;
  return client.readContract({
    address: contractAddress,
    abi: wallyv1Abi,
    functionName,
    args,
  });
}

// Corrected event ABI handling
export async function getWallyEvents(eventName: string, options: { fromBlock?: bigint, toBlock?: bigint, args?: any } = {}, chain: 'optimism' | 'base' = 'optimism') {
  const client = chain === 'optimism' ? viemClientOptimism : viemClientBase;
  const eventAbi = wallyv1Abi.find((e: any) => e.type === 'event' && e.name === eventName);
  if (!eventAbi || eventAbi.type !== 'event') {
    throw new Error(`Event '${eventName}' not found in ABI or is not a valid event`);
  }
  return client.getLogs({
    address: contractAddress,
    event: eventAbi as AbiEvent,
    ...options,
  });
}

//- Decode a log (raw log to event object)
export function decodeWallyEventLog(eventName: string, log: any) {
  // Use wagmi utilities for decoding logs
  throw new Error('decodeWallyEventLog needs to be implemented using wagmi utilities.');
}

//- Get latest block number
export async function getLatestBlockNumber(chain: 'optimism' | 'base' = 'optimism') {
  const client = chain === 'optimism' ? viemClientOptimism : viemClientBase;
  return client.getBlockNumber();
}

// Fetch wallet balance
export function useFetchBalance() {
  const { address, isConnected } = useAppKitAccount();
  const { refetch } = useBalance({ address: address as Address });

  const handleGetBalance = async () => {
    if (!isConnected) throw new Error('Wallet not connected');
    const balance = await refetch();
    console.log(`${balance?.data?.value.toString()} ${balance?.data?.symbol.toString()}`);
  };

  return handleGetBalance;
}

// Sign a message
export function useSignMessageHandler() {
  const { signMessageAsync } = useSignMessage();
  const { address, isConnected } = useAppKitAccount();

  const handleSignMsg = async () => {
    if (!isConnected) throw new Error('Wallet not connected');
    const msg = 'Hello Reown AppKit!';
    const sig = await signMessageAsync({ message: msg, account: address as Address });
    console.log('Signature:', sig);
  };

  return handleSignMsg;
}

// Send a transaction
export function useSendTransactionHandler() {
  const { sendTransaction } = useSendTransaction();
  const { isConnected } = useAppKitAccount();

  const handleSendTx = async () => {
    if (!isConnected) throw new Error('Wallet not connected');
    try {
      await sendTransaction({
        to: contractAddress as Address,
        value: parseUnits('0.0001', 9), // Corrected decimals for gwei
      });
    } catch (err) {
      console.error('Error sending transaction:', err);
    }
  };

  return handleSendTx;
}

