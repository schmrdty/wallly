import React, { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import wallyv1Abi from '../abis/wallyv1.json';
import { getWalletTokensAndBalances } from '../utils/walletHelpers';
import { parseUnits } from 'ethers/lib/utils';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

// Helper: Convert days/hours to seconds
function durationToSeconds(days: string, hours: string): number {
  const d = parseInt(days, 10) || 0;
  const h = parseInt(hours, 10) || 0;
  return d * 86400 + h * 3600;
}

// Helper: Build tokenList/minBalances/limits based on user intent
async function buildPermissionFields({
  walletAddress,
  allowEntireWallet,
  allowWholeWallet,
  minBalanceInput,
}: {
  walletAddress: string;
  allowEntireWallet: boolean;
  allowWholeWallet: boolean;
  minBalanceInput: string;
}) {
  // Fetch all tokens and balances for the wallet
  const tokensAndBalances = await getWalletTokensAndBalances(walletAddress);
  let tokenList: string[] = [];
  let minBalances: string[] = [];
  let limits: string[] = [];

  if (allowEntireWallet && allowWholeWallet) {
    // All tokens, minBalances = 0
    tokenList = tokensAndBalances.filter(t => t.balance > 0).map(t => t.address);
    minBalances = tokenList.map(() => '0');
    limits = tokenList.map(() => '0'); // or max uint256 if needed
  } else if (allowEntireWallet && !allowWholeWallet) {
    // All tokens, minBalances = user input
    const min = minBalanceInput || '0';
    tokenList = tokensAndBalances.filter(t => t.balance > 0).map(t => t.address);
    minBalances = tokenList.map(() => min);
    limits = tokenList.map(() => '0');
  } else if (!allowEntireWallet && allowWholeWallet) {
    // User must select tokens, minBalances = 0
    // UI should require tokenList input
    // minBalances = 0 for each selected token
    // limits = 0 for each selected token
    // (handled in form below)
  } else {
    // User must select tokens and minBalances
    // (handled in form below)
  }
  return { tokenList, minBalances, limits };
}

// Helper: Convert to uint256 string
function toUint256String(val: string | number, decimals = 18): string {
  try {
    return parseUnits(val.toString(), decimals).toString();
  } catch {
    return '0';
  }
}

export function WallyWriter() {
  const { address, isConnected } = useAccount();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    withdrawalAddress: address ?? '',
    allowEntireWallet: false,
    allowWholeWallet: false,
    durationDays: '1',
    durationHours: '0',
    tokenList: '' as string, // comma separated
    minBalances: '' as string, // comma separated
    limits: '' as string, // comma separated
    preview: null as any,
    previewing: false,
    errorFields: [] as string[],
  });

  const { writeContract, isPending } = useWriteContract();

  // Preview contract interaction
  const handlePreview = async () => {
    setError(null);
    setForm(f => ({ ...f, previewing: true, errorFields: [] }));
    try {
      let tokenList: string[] = [];
      let minBalances: string[] = [];
      let limits: string[] = [];
      let errorFields: string[] = [];

      if (form.allowEntireWallet && form.allowWholeWallet) {
        const result = await buildPermissionFields({
          walletAddress: address!,
          allowEntireWallet: true,
          allowWholeWallet: true,
          minBalanceInput: '0',
        });
        tokenList = result.tokenList;
        minBalances = tokenList.map(() => toUint256String('0'));
        limits = tokenList.map(() => toUint256String('0'));
        if (tokenList.length === 0) errorFields.push('tokenList');
      } else if (form.allowEntireWallet && !form.allowWholeWallet) {
        const min = form.minBalances || '0';
        const result = await buildPermissionFields({
          walletAddress: address!,
          allowEntireWallet: true,
          allowWholeWallet: false,
          minBalanceInput: min,
        });
        tokenList = result.tokenList;
        minBalances = tokenList.map(() => toUint256String(min));
        limits = tokenList.map(() => toUint256String('0'));
        if (tokenList.length === 0) errorFields.push('tokenList');
      } else if (!form.allowEntireWallet && form.allowWholeWallet) {
        tokenList = form.tokenList.split(',').map(s => s.trim()).filter(Boolean);
        minBalances = tokenList.map(() => toUint256String('0'));
        limits = tokenList.map(() => toUint256String('0'));
        if (tokenList.length === 0) errorFields.push('tokenList');
      } else {
        tokenList = form.tokenList.split(',').map(s => s.trim()).filter(Boolean);
        minBalances = form.minBalances.split(',').map(s => toUint256String(s.trim()));
        limits = form.limits.split(',').map(s => toUint256String(s.trim()));
        if (tokenList.length === 0) errorFields.push('tokenList');
        if (minBalances.length !== tokenList.length) errorFields.push('minBalances');
        if (limits.length !== tokenList.length) errorFields.push('limits');
      }

      if (errorFields.length > 0) {
        setForm(f => ({ ...f, previewing: false, errorFields }));
        setError('Please check your input fields: ' + errorFields.join(', '));
        return;
      }

      setForm(f => ({
        ...f,
        preview: {
          withdrawalAddress: form.withdrawalAddress,
          allowEntireWallet: form.allowEntireWallet,
          allowWholeWallet: form.allowWholeWallet,
          durationSeconds: durationToSeconds(form.durationDays, form.durationHours),
          tokenList,
          minBalances,
          limits,
        },
        previewing: false,
        errorFields: [],
      }));
    } catch (err: any) {
      setError(err.message || 'Preview failed');
      setForm(f => ({ ...f, previewing: false }));
    }
  };

  // Submit contract write
  const handleWrite = async () => {
    setError(null);
    setTxHash(null);
    if (!form.preview) {
      setError('Please preview your contract interaction first.');
      return;
    }
    try {
      await writeContract({
        address: contractAddress,
        abi: wallyv1Abi,
        functionName: 'grantOrUpdatePermission',
        args: [
          form.preview.withdrawalAddress,
          form.preview.allowEntireWallet,
          form.preview.durationSeconds,
          form.preview.tokenList,
          form.preview.minBalances,
          form.preview.limits,
        ],
      });
      setTxHash('Transaction submitted!');
    } catch (err: any) {
      setError(err.message || 'Contract write failed');
    }
  };

  return (
    <div>
      <ConnectButton />
      {!isConnected && <div>Please connect your wallet to interact with Wally.</div>}
      {isConnected && (
        <div>
          <h3>Grant or Update Permission</h3>
          <form
            onSubmit={e => {
              e.preventDefault();
              handlePreview();
            }}
          >
            <input
              placeholder="Withdrawal Address"
              value={form.withdrawalAddress}
              onChange={e => setForm(f => ({ ...f, withdrawalAddress: e.target.value }))}
              required
            />
            <label>
              Allow Entire Wallet:
              <select
                value={form.allowEntireWallet ? 'true' : 'false'}
                onChange={e => setForm(f => ({ ...f, allowEntireWallet: e.target.value === 'true' }))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
            <label>
              Allow Whole Wallet:
              <select
                value={form.allowWholeWallet ? 'true' : 'false'}
                onChange={e => setForm(f => ({ ...f, allowWholeWallet: e.target.value === 'true' }))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
            <label>
              Duration:
              <input
                type="number"
                min={0}
                placeholder="Days"
                value={form.durationDays}
                onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
                style={{ width: 80, marginRight: 8 }}
              />
              <input
                type="number"
                min={0}
                max={23}
                placeholder="Hours"
                value={form.durationHours}
                onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))}
                style={{ width: 80 }}
              />
            </label>
            {!form.allowEntireWallet && (
              <>
                <input
                  placeholder="Token List (comma separated)"
                  value={form.tokenList}
                  onChange={e => setForm(f => ({ ...f, tokenList: e.target.value }))}
                  required
                />
              </>
            )}
            {(!form.allowEntireWallet || !form.allowWholeWallet) && (
              <input
                placeholder="Min Balances (comma separated, match token order)"
                value={form.minBalances}
                onChange={e => setForm(f => ({ ...f, minBalances: e.target.value }))}
                required={!form.allowWholeWallet}
              />
            )}
            {!form.allowWholeWallet && (
              <input
                placeholder="Limits (comma separated, match token order)"
                value={form.limits}
                onChange={e => setForm(f => ({ ...f, limits: e.target.value }))}
              />
            )}
            {form.errorFields.length > 0 && (
              <div style={{ color: 'red' }}>
                Please check: {form.errorFields.join(', ')}
              </div>
            )}
            <button type="submit" disabled={form.previewing}>
              {form.previewing ? 'Previewing...' : 'Preview Contract'}
            </button>
          </form>
          {form.preview && (
            <div style={{ border: '1px solid #ccc', padding: 16, marginTop: 16 }}>
              <h4>Preview</h4>
              <pre>{JSON.stringify(form.preview, null, 2)}</pre>
              <button onClick={handleWrite} disabled={isPending || !!form.errorFields.length}>
                {isPending ? 'Submitting...' : 'Submit Transaction'}
              </button>
            </div>
          )}
          {txHash && (
            <div>
              Tx submitted: <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a>
            </div>
          )}
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
