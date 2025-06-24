// src/abis/wallyv1MinimalAbi.ts
export default [
  // grantMiniAppSession
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
  // grantOrUpdatePermission
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
  // grantPermissionBySig
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
  }
];