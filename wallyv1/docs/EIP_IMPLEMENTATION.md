# EIP-7702 and EIP-5792 Implementation in WallyWatcherV1

This document describes the implementation of EIP-7702 (Set EOA code for one transaction) and EIP-5792 (Wallet API) in the WallyWatcherV1 contract.

## Table of Contents

1. [Overview](#overview)
2. [EIP-7702: Temporary Contract Code](#eip-7702-temporary-contract-code)
3. [EIP-5792: Wallet API](#eip-5792-wallet-api)
4. [Security Considerations](#security-considerations)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)

## Overview

The WallyWatcherV1 contract has been enhanced to support two important Ethereum Improvement Proposals:

- **EIP-7702**: Allows Externally Owned Accounts (EOAs) to temporarily set contract code for atomic execution
- **EIP-5792**: Provides standardized wallet API functions for dApp integration

These features enable more sophisticated wallet automation while maintaining security and backward compatibility.

## EIP-7702: Temporary Contract Code

### Purpose

EIP-7702 allows EOAs to temporarily install contract code, enabling atomic operations that would otherwise require multiple transactions. This is particularly useful for complex wallet operations that need to be atomic.

### Key Features

1. **Temporary Code Setting**: Set contract code for an EOA with time-bound expiration
2. **Atomic Execution**: Execute functions with temporary code context
3. **Automatic Cleanup**: Temporary code expires automatically
4. **Permission Integration**: All existing permission checks remain atomic with code changes

### Functions

#### `setTemporaryCode()`
```solidity
function setTemporaryCode(
    address account,
    bytes32 codeHash,
    uint256 expiresAt,
    uint256 nonce,
    bytes memory signature
) external whenNotPaused checkTemporaryCode(account)
```
Sets temporary contract code for an EOA.

**Parameters:**
- `account`: The EOA address to set temporary code for
- `codeHash`: The hash of the contract code to temporarily install
- `expiresAt`: Timestamp when the temporary code expires
- `nonce`: The nonce for signature verification
- `signature`: EIP-712 signature authorizing the temporary code setting

#### `resetTemporaryCode()`
```solidity
function resetTemporaryCode(address account) external whenNotPaused checkTemporaryCode(account)
```
Resets temporary contract code back to original state.

#### `executeWithTemporaryCode()`
```solidity
function executeWithTemporaryCode(
    address account,
    address target,
    bytes calldata data,
    uint256 value
) external whenNotPaused checkTemporaryCode(account) nonReentrant returns (bytes memory)
```
Executes a function call with temporary contract code for atomic execution.

#### `getTemporaryCode()`
```solidity
function getTemporaryCode(address account) external view returns (bool active, bytes32 codeHash, uint256 expiresAt)
```
Gets the current temporary code information for an account.

### Events

- `TemporaryCodeSet(address indexed account, bytes32 indexed codeHash, uint256 expiresAt)`
- `TemporaryCodeReset(address indexed account, bytes32 indexed originalHash)`
- `TemporaryCodeExpired(address indexed account, bytes32 indexed codeHash)`

## EIP-5792: Wallet API

### Purpose

EIP-5792 standardizes wallet API functions to enable better dApp integration and user experience. It provides a consistent interface for wallet operations across different implementations.

### Key Features

1. **Permission Management**: Request and manage wallet method permissions
2. **Standardized Methods**: eth_sendTransaction, eth_sign, and permission functions
3. **Integration Mapping**: Maps internal permission system to EIP-5792 standard
4. **Lifecycle Management**: Proper permission granting, checking, and revocation

### Functions

#### `wallet_requestPermissions()`
```solidity
function wallet_requestPermissions(
    address account,
    string[] calldata methods,
    uint256 expiresAt,
    uint256 nonce,
    bytes memory signature
) external whenNotPaused
```
Requests wallet permissions for specific methods.

#### `wallet_getPermissions()`
```solidity
function wallet_getPermissions(address account) external view returns (
    string[] memory methods,
    uint256 expiresAt,
    bool active
)
```
Gets current wallet permissions for an account.

#### `eth_sendTransaction()`
```solidity
function eth_sendTransaction(
    address account,
    address to,
    uint256 value,
    bytes calldata data
) external whenNotPaused withWalletPermission(account, "eth_sendTransaction") nonReentrant returns (bytes memory)
```
Executes an authorized transaction.

#### `eth_sign()`
```solidity
function eth_sign(
    address account,
    bytes32 dataHash
) external view withWalletPermission(account, "eth_sign") returns (bytes memory signature)
```
Signs data using account's signing capability.

#### `wallet_revokePermissions()`
```solidity
function wallet_revokePermissions(address account) external whenNotPaused
```
Revokes wallet permissions for an account.

### Events

- `WalletPermissionGranted(address indexed account, string[] methods, uint256 expiresAt)`
- `WalletPermissionRevoked(address indexed account)`
- `WalletMethodCalled(address indexed account, string method)`

## Security Considerations

### EIP-7702 Security

1. **Time-bounded Execution**: All temporary code has expiration timestamps
2. **Signature Verification**: EIP-712 signatures required for all operations
3. **Permission Atomicity**: All permission checks remain atomic with code changes
4. **Non-reentrancy**: Critical functions protected against reentrancy attacks
5. **Automatic Cleanup**: Expired temporary code is automatically deactivated

### EIP-5792 Security

1. **Method-specific Permissions**: Granular control over allowed wallet methods
2. **Time-bounded Permissions**: All permissions have expiration timestamps
3. **Access Controls**: Only account owners or authorized parties can manage permissions
4. **Audit Trail**: All method calls are logged for transparency

### General Security

1. **Rate Limiting**: All functions subject to rate limiting controls
2. **Pause Mechanism**: Emergency pause functionality for security incidents
3. **Upgrade Protection**: UUPS upgradeable pattern with proper access controls
4. **Event Logging**: Comprehensive event emission for full traceability

## Usage Examples

### EIP-7702 Example: Atomic Multi-step Operation

```typescript
import { useEIPSupport } from '../hooks/useEIPSupport';

const { setTemporaryCode, executeWithTemporaryCode, resetTemporaryCode } = useEIPSupport();

// 1. Set temporary code for atomic operation
const codeHash = "0x1234..."; // Hash of the contract code
const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
const nonce = 1;
const signature = "0xabcd..."; // EIP-712 signature

await setTemporaryCode(account, codeHash, expiresAt, nonce, signature);

// 2. Execute complex operation atomically
await executeWithTemporaryCode(
    account,
    targetContract,
    encodedFunctionCall,
    ethValue
);

// 3. Reset to original state (optional - auto-expires)
await resetTemporaryCode(account);
```

### EIP-5792 Example: Wallet Permission Management

```typescript
import { useEIPSupport } from '../hooks/useEIPSupport';

const { requestWalletPermissions, sendTransaction, getWalletPermissions } = useEIPSupport();

// 1. Request permissions for wallet methods
const methods = ["eth_sendTransaction", "eth_sign"];
const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 24 hours
const nonce = 1;
const signature = "0xabcd...";

await requestWalletPermissions(account, methods, expiresAt, nonce, signature);

// 2. Check permissions
const permissions = await getWalletPermissions(account);
console.log("Allowed methods:", permissions.methods);

// 3. Use permitted methods
if (permissions.active && permissions.methods.includes("eth_sendTransaction")) {
    await sendTransaction(account, recipientAddress, "0.1", "0x");
}
```

## API Reference

### Backend API Endpoints

#### EIP-7702 Endpoints

- `POST /api/eip7702/setTemporaryCode` - Set temporary contract code
- `POST /api/eip7702/resetTemporaryCode` - Reset temporary code
- `POST /api/eip7702/executeWithTemporaryCode` - Execute with temporary code
- `GET /api/eip7702/getTemporaryCode/:account` - Get temporary code info

#### EIP-5792 Endpoints

- `POST /api/eip5792/wallet_requestPermissions` - Request wallet permissions
- `GET /api/eip5792/wallet_getPermissions/:account` - Get wallet permissions
- `POST /api/eip5792/eth_sendTransaction` - Send transaction
- `POST /api/eip5792/eth_sign` - Sign data
- `POST /api/eip5792/wallet_revokePermissions` - Revoke permissions

### React Hook

The `useEIPSupport` hook provides a convenient interface for all EIP functionality:

```typescript
const {
    loading,
    error,
    
    // EIP-7702 functions
    setTemporaryCode,
    resetTemporaryCode,
    executeWithTemporaryCode,
    getTemporaryCode,
    
    // EIP-5792 functions
    requestWalletPermissions,
    getWalletPermissions,
    sendTransaction,
    signData,
    revokeWalletPermissions
} = useEIPSupport();
```

## Migration and Compatibility

The EIP implementations are fully backward compatible with existing WallyWatcherV1 functionality:

1. **Existing Permissions**: All current permission logic continues to work unchanged
2. **Session Management**: Mini-app sessions are enhanced but not modified
3. **Transfer Functions**: Original transfer functions now support temporary code context
4. **Event Structure**: New events added without changing existing event signatures

The implementation follows Solidity and upgradeable contract best practices, ensuring secure and maintainable code that preserves all existing security guarantees while adding powerful new capabilities.