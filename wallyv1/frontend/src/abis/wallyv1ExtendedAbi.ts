// Extended ABI with EIP-7702 and EIP-5792 support
export default [
  // Original functions
  {
    "inputs": [
      { "internalType": "address", "name": "delegate", "type": "address" },
      { "internalType": "address[]", "name": "tokens", "type": "address[]" },
      { "internalType": "bool", "name": "allowWholeWallet", "type": "bool" },
      { "internalType": "uint256", "name": "durationSeconds", "type": "uint256" }
    ],
    "name": "grantMiniAppSession",
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
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "address", "name": "withdrawalAddress", "type": "address" },
      { "internalType": "bool", "name": "allowEntireWallet", "type": "bool" },
      { "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
      { "internalType": "uint256", "name": "nonce", "type": "uint256" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" },
      { "internalType": "address[]", "name": "tokenList", "type": "address[]" },
      { "internalType": "uint256[]", "name": "minBalances", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "limits", "type": "uint256[]" }
    ],
    "name": "grantPermissionBySig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // EIP-7702: Temporary Contract Code Functions
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "bytes32", "name": "codeHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
      { "internalType": "uint256", "name": "nonce", "type": "uint256" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "setTemporaryCode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "resetTemporaryCode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "address", "name": "target", "type": "address" },
      { "internalType": "bytes", "name": "data", "type": "bytes" },
      { "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "executeWithTemporaryCode",
    "outputs": [
      { "internalType": "bytes", "name": "", "type": "bytes" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "getTemporaryCode",
    "outputs": [
      { "internalType": "bool", "name": "active", "type": "bool" },
      { "internalType": "bytes32", "name": "codeHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "expiresAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // EIP-5792: Wallet API Functions
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "string[]", "name": "methods", "type": "string[]" },
      { "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
      { "internalType": "uint256", "name": "nonce", "type": "uint256" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "wallet_requestPermissions",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "wallet_getPermissions",
    "outputs": [
      { "internalType": "string[]", "name": "methods", "type": "string[]" },
      { "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
      { "internalType": "bool", "name": "active", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "eth_sendTransaction",
    "outputs": [
      { "internalType": "bytes", "name": "", "type": "bytes" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "bytes32", "name": "dataHash", "type": "bytes32" }
    ],
    "name": "eth_sign",
    "outputs": [
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "wallet_revokePermissions",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": true, "internalType": "bytes32", "name": "codeHash", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "expiresAt", "type": "uint256" }
    ],
    "name": "TemporaryCodeSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": true, "internalType": "bytes32", "name": "originalHash", "type": "bytes32" }
    ],
    "name": "TemporaryCodeReset",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": true, "internalType": "bytes32", "name": "codeHash", "type": "bytes32" }
    ],
    "name": "TemporaryCodeExpired",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": false, "internalType": "string[]", "name": "methods", "type": "string[]" },
      { "indexed": false, "internalType": "uint256", "name": "expiresAt", "type": "uint256" }
    ],
    "name": "WalletPermissionGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "WalletPermissionRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "method", "type": "string" }
    ],
    "name": "WalletMethodCalled",
    "type": "event"
  }
];