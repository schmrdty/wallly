import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { formatCurrency, formatDate, formatTransactionId } from '../utils/formatters';
import useWallet from '../hooks/useWallet';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
const CONTRACT_ABI = [
  // Only the relevant events for brevity
  "event TransferPerformed(address indexed user, address indexed token, uint256 amount, address indexed destination, uint256 userRemaining, uint256 oracleTimestamp, uint256 blockTimestamp)",
  "event PermissionGranted(address indexed user, address withdrawalAddress, bool allowEntireWallet, uint256 expiresAt, address[] tokenList, uint256[] minBalances, uint256[] limits)",
  "event PermissionRevoked(address indexed user)",
  "function getUserPermission(address user) view returns (address withdrawalAddress, bool allowEntireWallet, uint256 expiresAt, bool isActive, address[] tokenList, uint256[] minBalances, uint256[] limits)",
  "function getMiniAppSession(address user) view returns (address delegate, uint256 expiresAt, address[] allowedTokens, bool allowWholeWallet, bool active)"
  // ...add more events as needed
];

interface Permission {
  withdrawalAddress: string;
  allowEntireWallet: boolean;
  expiresAt: number;
  isActive: boolean;
  tokenList: string[];
  minBalances: string[];
  limits: string[];
}

interface Session {
  delegate: string;
  expiresAt: number;
  allowedTokens: string[];
  allowWholeWallet: boolean;
  active: boolean;
}

type WalletEvent =
  | {
      type: "TransferPerformed";
      token: string;
      amount: string;
      destination: string;
      userRemaining: string;
      oracleTimestamp: number;
      blockTimestamp: number;
      tx: string;
    }
  | {
      type: "PermissionGranted";
      withdrawalAddress: string;
      allowEntireWallet: boolean;
      expiresAt: number;
      tokenList: string[];
      minBalances: string[];
      limits: string[];
      tx: string;
    }
  | {
      type: "PermissionRevoked";
      tx: string;
    };

export const WalletEventList: React.FC<{ events: WalletEvent[] }> = ({ events }) => (
  <ul>
    {events.map((event, idx) => (
      <li key={idx}>
        <strong>{event.type}</strong>
        {event.type === "TransferPerformed" && (
          <>
            : Sent {event.amount} of {event.token} to {event.destination} (Remaining: {event.userRemaining})<br />
            Oracle Time: {formatDate(event.oracleTimestamp * 1000)}<br />
            Block Time: {formatDate(event.blockTimestamp * 1000)}<br />
            Tx: <a href={`https://basescan.org/tx/${event.tx}`} target="_blank" rel="noopener noreferrer">{event.tx}</a>
          </>
        )}
        {event.type === "PermissionGranted" && (
          <>
            : Permission granted to {event.withdrawalAddress} (Expires: {formatDate(event.expiresAt * 1000)})<br />
            Tokens: {event.tokenList.join(", ")}
          </>
        )}
        {event.type === "PermissionRevoked" && (
          <>: Permission revoked</>
        )}
      </li>
    ))}
  </ul>
);

const WalletWatcher: React.FC = () => {
  const { walletAddress, isConnected } = useWallet();
  const [events, setEvents] = useState<WalletEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<Permission | null>(null);
const [session, setSession] = useState<Session | null>(null);
const [error, setError] = useState<string | null>(null);
// Fetch current permission/session status
useEffect(() => {
  if (!window.ethereum || !walletAddress) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const fetchStatus = async () => {
      try {
        const perm = await contract.getUserPermission(walletAddress);
        setPermission({
          withdrawalAddress: perm.withdrawalAddress,
          allowEntireWallet: perm.allowEntireWallet,
          expiresAt: Number(perm.expiresAt),
          isActive: perm.isActive,
          tokenList: perm.tokenList,
          minBalances: perm.minBalances,
          limits: perm.limits
        });
        const sess = await contract.getMiniAppSession(walletAddress);
        setSession({
          delegate: sess.delegate,
          expiresAt: Number(sess.expiresAt),
          allowedTokens: sess.allowedTokens,
          allowWholeWallet: sess.allowWholeWallet,
          active: sess.active
        });
      } catch (e) {
        setPermission(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [walletAddress]);

  // Listen for new on-chain events
  useEffect(() => {
    if (!window.ethereum || !walletAddress) return;
    // Fix: Explicitly cast window.ethereum to 'any' or 'ExternalProvider'
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const transferListener = (
      user: string, token: string, amount: ethers.BigNumber, destination: string, userRemaining: ethers.BigNumber,
      oracleTimestamp: ethers.BigNumber, blockTimestamp: ethers.BigNumber, event: any
    ) => {
      if (user.toLowerCase() !== walletAddress.toLowerCase()) return;
      setEvents(prev => [
        {
          type: "TransferPerformed",
          token,
          amount: amount.toString(),
          destination,
          userRemaining: userRemaining.toString(),
          oracleTimestamp: oracleTimestamp.toNumber(),
          blockTimestamp: blockTimestamp.toNumber(),
          tx: event.transactionHash,
        },
        ...prev,
      ]);
    };

    const permissionGrantedListener = (
      user: string, withdrawalAddress: string, allowEntireWallet: boolean, expiresAt: ethers.BigNumber,
      tokenList: string[], minBalances: string[], limits: string[], event: any
    ) => {
      if (user.toLowerCase() !== walletAddress.toLowerCase()) return;
      setEvents(prev => [
        {
          type: "PermissionGranted",
          withdrawalAddress,
          allowEntireWallet,
          expiresAt: expiresAt.toNumber(),
          tokenList,
          minBalances,
          limits,
          tx: event.transactionHash,
        },
        ...prev,
      ]);
      contract.getUserPermission(walletAddress).then((perm: any) => setPermission({
        withdrawalAddress: perm.withdrawalAddress,
        allowEntireWallet: perm.allowEntireWallet,
        expiresAt: Number(perm.expiresAt),
        isActive: perm.isActive,
        tokenList: perm.tokenList,
        minBalances: perm.minBalances,
        limits: perm.limits
      }));
    };

    const permissionRevokedListener = (user: string, event: any) => {
      if (user.toLowerCase() !== walletAddress.toLowerCase()) return;
      setEvents(prev => [
        {
          type: "PermissionRevoked",
          tx: event.transactionHash,
        },
        ...prev,
      ]);
      contract.getUserPermission(walletAddress).then(() => setPermission(null));
    };

    contract.on("TransferPerformed", transferListener);
    contract.on("PermissionGranted", permissionGrantedListener);
    contract.on("PermissionRevoked", permissionRevokedListener);

    return () => {
      contract.off("TransferPerformed", transferListener);
      contract.off("PermissionGranted", permissionGrantedListener);
      contract.off("PermissionRevoked", permissionRevokedListener);
    };
  }, [walletAddress]);

  if (!walletAddress) return <div>Please connect your wallet to start watching.</div>;
  if (loading) return <div>Loading wallet events...</div>;

  return (
    <div>
      <h2>Wallet Watcher</h2>
      {permission && (
        <div style={{ marginBottom: 16 }}>
          <strong>Permission Status:</strong><br />
          Status: {permission.isActive ? "Active" : "Inactive"}<br />
          Withdrawal Address: {permission.withdrawalAddress}<br />
          Expires: {formatDate(permission.expiresAt * 1000)}<br />
          Allowed Tokens: {permission.tokenList.join(", ")}
        </div>
      )}
      {session && session.active && (
        <div style={{ marginBottom: 16 }}>
          <strong>Mini-App Session:</strong><br />
          Delegate: {session.delegate}<br />
          Expires: {formatDate(session.expiresAt * 1000)}<br />
          Allowed Tokens: {session.allowedTokens.join(", ")}<br />
          Allow Whole Wallet: {session.allowWholeWallet ? "Yes" : "No"}
        </div>
      )}
      <WalletEventList events={events} />
    </div>
  );
};

export default WalletWatcher;