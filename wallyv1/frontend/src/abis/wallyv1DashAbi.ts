// Minimal ABI for Dashboard: all relevant "granted" functions/events for permission/session display and management
const wallyv1DashAbi = [
  // --- Permission/session events ---
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "delegate", "type": "address" },
      { "indexed": false, "internalType": "address[]", "name": "tokens", "type": "address[]" },
      { "indexed": false, "internalType": "bool", "name": "allowWholeWallet", "type": "bool" },
      { "indexed": false, "internalType": "uint256", "name": "expiresAt", "type": "uint256" }
    ],
    "name": "MiniAppSessionGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "delegate", "type": "address" }
    ],
    "name": "MiniAppSessionRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "withdrawalAddress", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "allowEntireWallet", "type": "bool" },
      { "indexed": false, "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
      { "indexed": false, "internalType": "address[]", "name": "tokenList", "type": "address[]" },
      { "indexed": false, "internalType": "uint256[]", "name": "minBalances", "type": "uint256[]" },
      { "indexed": false, "internalType": "uint256[]", "name": "limits", "type": "uint256[]" }
    ],
    "name": "PermissionGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "PermissionRevoked",
    "type": "event"
  },
  // --- Permission/session view functions ---
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getMiniAppSession",
    "outputs": [
      { "internalType": "address", "name": "delegate", "type": "address" },
      { "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
      { "internalType": "address[]", "name": "allowedTokens", "type": "address[]" },
      { "internalType": "bool", "name": "allowWholeWallet", "type": "bool" },
      { "internalType": "bool", "name": "active", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyMiniAppSession",
    "outputs": [
      { "internalType": "address", "name": "delegate", "type": "address" },
      { "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
      { "internalType": "address[]", "name": "allowedTokens", "type": "address[]" },
      { "internalType": "bool", "name": "allowWholeWallet", "type": "bool" },
      { "internalType": "bool", "name": "active", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getUserPermission",
    "outputs": [
      { "internalType": "address", "name": "withdrawalAddress", "type": "address" },
      { "internalType": "bool", "name": "allowEntireWallet", "type": "bool" },
      { "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "address[]", "name": "tokenList", "type": "address[]" },
      { "internalType": "uint256[]", "name": "minBalances", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "limits", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // --- Permission/session management functions ---
  {
    "inputs": [],
    "name": "revokeMiniAppSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "withdrawalAddress", "type": "address" },
      { "internalType": "bool", "name": "allowEntireWallet", "type": "bool" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" },
      { "internalType": "address[]", "name": "tokenList", "type": "address[]" },
      { "internalType": "uint256[]", "name": "minBalances", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "limits", "type": "uint256[]" }
    ],
    "name": "grantOrUpdatePermission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default wallyv1DashAbi;
