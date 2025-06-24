// checkOnchain.ts
import { createPublicClient, http } from 'viem';
import { optimism } from 'viem/chains';

const client = createPublicClient({
  chain: optimism,
  transport: http('https://mainnet.optimism.io'),
});

async function checkKeyData(fid: number, custodyAddress: string) {
  const contractAddress = '0x00000000fc1237824fb747abde0ff18990e59b7e';
  const abi = [
    {
      name: 'keyDataOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'fid', type: 'uint256' },
        { name: 'key', type: 'bytes' },
      ],
      outputs: [{ name: '', type: 'bytes' }],
    },
  ];

  try {
    const result = await client.readContract({
      address: contractAddress,
      abi,
      functionName: 'keyDataOf',
      args: [fid, custodyAddress],
    });
    console.log('Onchain Data:', result);
  } catch (error) {
    console.error('Error fetching onchain data:', error);
  }
}

// Replace with your FID and custody address
checkKeyData(213310, '0x7385E1A824A405cBB13B64829BF1509CD2A471F7');