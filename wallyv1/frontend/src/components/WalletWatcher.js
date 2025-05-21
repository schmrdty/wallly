import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { api } from "../utils/api";
import { formatCurrency, formatDate, formatTransactionId } from '../utils/formatters';

// Replace with your deployed contract address and ABI
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const CONTRACT_ABI = [
  // Only the relevant events for brevity
  "event TransferPerformed(address indexed user, address indexed token, uint256 amount, address indexed destination, uint256 userRemaining, uint256 oracleTimestamp, uint256 blockTimestamp)",
  "event PermissionGranted(address indexed user, address withdrawalAddress, bool allowEntireWallet, uint256 expiresAt, address[] tokenList, uint256[] minBalances, uint256[] limits)",
  "event PermissionRevoked(address indexed user)",
  "function getUserPermission(address user) view returns (address withdrawalAddress, bool allowEntireWallet, uint256 expiresAt, bool isActive, address[] tokenList, uint256[] minBalances, uint256[] limits)",
  "function getMiniAppSession(address user) view returns (address delegate, uint256 expiresAt, address[] allowedTokens, bool allowWholeWallet, bool active)"
  // ...add more events as needed
];

const TransactionList = ({ transactions }) => {
    if (!transactions || transactions.length === 0) {
        return <div>No transactions found.</div>;
    }
    return (
        <div className="transaction-list">
            <h2>Transaction History</h2>
            <ul>
                {transactions.map((transaction, index) => (
                    <li key={index}>
                        <p><strong>Transaction ID:</strong> {formatTransactionId(transaction.id)}</p>
                        <p><strong>Amount:</strong> {formatCurrency(transaction.amount)}</p>
                        <p><strong>Date:</strong> {formatDate(transaction.date)}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const WalletWatcher = ({ walletAddress }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState(null);
  const [session, setSession] = useState(null);

  // Fetch current permission/session status
  useEffect(() => {
    if (!window.ethereum || !walletAddress) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
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
      }
    };
    fetchStatus();
  }, [walletAddress]);

  // Listen for new on-chain events
  useEffect(() => {
    if (!window.ethereum || !walletAddress) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const transferListener = (
      user, token, amount, destination, userRemaining, oracleTimestamp, blockTimestamp, event
    ) => {
      if (user.toLowerCase() !== walletAddress.toLowerCase()) return;
      setEvents(prev => [
        {
          type: "TransferPerformed",
          token,
          amount: amount.toString(),
          destination,
          userRemaining: userRemaining.toString(),
          oracleTimestamp: Number(oracleTimestamp),
          blockTimestamp: Number(blockTimestamp),
          tx: event.transactionHash,
        },
        ...prev,
      ]);
    };

    const permissionGrantedListener = (
      user, withdrawalAddress, allowEntireWallet, expiresAt, tokenList, minBalances, limits, event
    ) => {
      if (user.toLowerCase() !== walletAddress.toLowerCase()) return;
      setEvents(prev => [
        {
          type: "PermissionGranted",
          withdrawalAddress,
          allowEntireWallet,
          expiresAt: Number(expiresAt),
          tokenList,
          minBalances,
          limits,
          tx: event.transactionHash,
        },
        ...prev,
      ]);
      // Refresh permission status
      contract.getUserPermission(walletAddress).then(perm => setPermission({
        withdrawalAddress: perm.withdrawalAddress,
        allowEntireWallet: perm.allowEntireWallet,
        expiresAt: Number(perm.expiresAt),
        isActive: perm.isActive,
        tokenList: perm.tokenList,
        minBalances: perm.minBalances,
        limits: perm.limits
      }));
    };

    const permissionRevokedListener = (user, event) => {
      if (user.toLowerCase() !== walletAddress.toLowerCase()) return;
      setEvents(prev => [
        {
          type: "PermissionRevoked",
          tx: event.transactionHash,
        },
        ...prev,
      ]);
      // Refresh permission status
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
          Expires: {new Date(permission.expiresAt * 1000).toLocaleString()}<br />
          Allowed Tokens: {permission.tokenList.join(", ")}
        </div>
      )}
      {session && session.active && (
        <div style={{ marginBottom: 16 }}>
          <strong>Mini-App Session:</strong><br />
          Delegate: {session.delegate}<br />
          Expires: {new Date(session.expiresAt * 1000).toLocaleString()}<br />
          Allowed Tokens: {session.allowedTokens.join(", ")}<br />
          Allow Whole Wallet: {session.allowWholeWallet ? "Yes" : "No"}
        </div>
      )}
      <ul>
        {events.map((event, idx) => (
          <li key={idx}>
            <strong>{event.type}</strong>
            {event.type === "TransferPerformed" && (
              <>
                : Sent {event.amount} of {event.token} to {event.destination} (Remaining: {event.userRemaining})<br />
                Oracle Time: {new Date(event.oracleTimestamp * 1000).toLocaleString()}<br />
                Block Time: {new Date(event.blockTimestamp * 1000).toLocaleString()}<br />
                Tx: <a href={`https://basescan.org/tx/${event.tx}`} target="_blank" rel="noopener noreferrer">{event.tx}</a>
              </>
            )}
            {event.type === "PermissionGranted" && (
              <>
                : Permission granted to {event.withdrawalAddress} (Expires: {new Date(event.expiresAt * 1000).toLocaleString()})<br />
                Tokens: {event.tokenList.join(", ")}
              </>
            )}
            {event.type === "PermissionRevoked" && (
              <>: Permission revoked</>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WalletWatcher;

/*  // Fetch historical events from backend
  useEffect(() => {
    let cancelled = false;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/events?user=${walletAddress}`);
        if (!cancelled) setEvents(response.data || []);
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    if (walletAddress) fetchEvents();
    return () => { cancelled = true; };
  }, [walletAddress]);
*/
  // Listen for new on-chain events
  useEffect(() => {
    if (!window.ethereum || !walletAddress) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Listen for TransferPerformed
    const transferListener = (
      user, token, amount, destination, userRemaining, oracleTimestamp, blockTimestamp, event
    ) => {
      if (user.toLowerCase() !== walletAddress.toLowerCase()) return;
      setEvents(prev => [
        {
          type: "TransferPerformed",
          token,
          amount: amount.toString(),
          destination,
          userRemaining: userRemaining.toString(),
          oracleTimestamp: Number(oracleTimestamp),
          blockTimestamp: Number(blockTimestamp),
          tx: event.transactionHash,
        },
        ...prev,
      ]);
    };

    // Listen for PermissionGranted
    const permissionGrantedListener = (
      user, withdrawalAddress, allowEntireWallet, expiresAt, tokenList, minBalances, limits, event
    ) => {
      if (user.toLowerCase() !== walletAddress.toLowerCase()) return;
      setEvents(prev => [
        {
          type: "PermissionGranted",
          withdrawalAddress,
          allowEntireWallet,
          expiresAt: Number(expiresAt),
          tokenList,
          minBalances,
          limits,
          tx: event.transactionHash,
        },
        ...prev,
      ]);
    };

    // Listen for PermissionRevoked
    const permissionRevokedListener = (user, event) => {
      if (user.toLowerCase() !== walletAddress.toLowerCase()) return;
      setEvents(prev => [
        {
          type: "PermissionRevoked",
          tx: event.transactionHash,
        },
        ...prev,
      ]);
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
      <ul>
        {events.map((event, idx) => (
          <li key={idx}>
            <strong>{event.type}</strong>
            {event.type === "TransferPerformed" && (
              <>
                : Sent {event.amount} of {event.token} to {event.destination} (Remaining: {event.userRemaining})<br />
                Oracle Time: {new Date(event.oracleTimestamp * 1000).toLocaleString()}<br />
                Block Time: {new Date(event.blockTimestamp * 1000).toLocaleString()}<br />
                Tx: <a href={`https://basescan.org/tx/${event.tx}`} target="_blank" rel="noopener noreferrer">{event.tx}</a>
              </>
            )}
            {event.type === "PermissionGranted" && (
              <>
                : Permission granted to {event.withdrawalAddress} (Expires: {new Date(event.expiresAt * 1000).toLocaleString()})<br />
                Tokens: {event.tokenList.join(", ")}
              </>
            )}
            {event.type === "PermissionRevoked" && (
              <>: Permission revoked</>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export { TransactionList, WalletWatcher };