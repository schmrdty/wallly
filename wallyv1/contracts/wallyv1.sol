// SPDX-License-Identifier: MIT
//  __        __
//  \ \      / /    _
//   \ \ /\ / /___ | |  _
//    \ V  V // _ \| | | |
//     \_/\_// /_\ | | | |
//          /_/---\| | | |__   __
//   The           |_| | |\ \ / /
//     Wallet          |_| \ V /
//        Watcher           | |
//            V1.0.0        |_|
/*
 * LEGAL NOTICE:
 * This contract is provided for informational and experimental purposes only.
 * It does not constitute financial advice, investment guidance, or a legally binding agreement.
 * By interacting with this contract, users acknowledge and accept all associated risks.
 * The deployer and developers make no guarantees regarding functionality, security, or future performance.
 * Users are solely responsible for their actions, and blockchain transactions cannot be reversed.
 * By using this contract, users waive any claims against the deployer/s and developer/s.
 */

pragma solidity ^0.8.28;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/core/UserOperationLib.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {BaseAccount} from "@account-abstraction/contracts/core/BaseAccount.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC1271 {
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue);
}
interface IGnosisSafe {
    function checkSignatures(bytes32 dataHash, bytes memory data, bytes memory signatures) external view;
}

// --- Custom Errors ---
error NotSettingsAdmin();
error NotOwner();
error NotWhitelisted();
error NoActivePermission();
error PermissionExpired();
error NoWithdrawalAddress();
error TokenNotWatched();
error TokenNotInList();
error NoDelegate();
error SessionExpired();
error NotAuthorizedDelegate();
error InvalidNonce();
error InvalidSignature();
error ZeroAddress();
error BadDuration();
error BadInput();
error RateLimited();
error NativeTransferFailed();
error ERC20TransferFailed();
error ArrayLengthMismatch();
error FeeTooHigh();
error InvalidSessionTokens();
error NotWhitelistAdmin();
error NotOracleAdmin();
error OracleFallbackDisabled();
error SessionNotExpired();
error EmergencyPaused();

contract WallyWatcherV1 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable,
    BaseAccount,
    EIP712Upgradeable
{
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // --- EIP712 Typehashes ---
    bytes32 public constant PERMISSION_TYPEHASH = keccak256(
        "Permission(address withdrawalAddress,bool allowEntireWallet,uint256 expiresAt,uint256 nonce)"
    );
    bytes32 public constant META_TX_TYPEHASH = keccak256(
        "MetaTx(address from,address to,uint256 value,bytes data,uint256 fee,address feeToken,address relayer,uint256 nonce)"
    );
    bytes32 public constant DELEGATION_TYPEHASH = keccak256(
        "Delegation(address delegator,address delegatee,uint256 expiresAt,uint256 nonce)"
    );
    bytes32 public constant SESSION_TYPEHASH = keccak256(
        "Session(address user,address app,uint256 expiresAt,uint256 nonce)"
    );
    bytes32 public constant TRANSFER_AUTH_TYPEHASH = keccak256(
        "TransferAuthorization(address owner,address spender,uint256 amount,uint256 deadline,uint256 nonce)"
    );
    bytes32 public constant SETTINGS_ADMIN_ROLE = keccak256("SETTINGS_ADMIN_ROLE");
    
    // --- Granular Admin Roles ---
    bytes32 public constant WHITELIST_ADMIN_ROLE = keccak256("WHITELIST_ADMIN_ROLE");
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");
    bytes32 public constant EMERGENCY_ADMIN_ROLE = keccak256("EMERGENCY_ADMIN_ROLE");

    address public ecdsaSigner;
    address public gnosisSafe;
    IEntryPoint private _entryPoint;

    mapping(address => UserPermission) private permissions;
    address public whitelistToken;
    uint256 public minWhitelistBalance;
    AggregatorV3Interface public chainlinkOracle;
    bool public useChainlink;
    uint256 public defaultDuration;
    uint256 public minDuration;
    uint256 public maxDuration;
    uint256 public globalRateLimit;
    mapping(bytes4 => uint256) public functionRateLimitOverrides;

    // --- Oracle Fallback ---
    event OracleFallbackUsed(uint256 fallbackTimestamp, uint256 attemptedOracleTimestamp);

    // --- Mini-App Delegation ---
    struct MiniAppSession {
        address delegate;
        uint256 expiresAt;
        address[] allowedTokens;
        bool allowWholeWallet;
        bool active;
    }
    mapping(address => MiniAppSession) private miniAppSessions;

    // --- Optimized Structs for Better Storage Packing ---
    
    /// @notice Configuration for individual tokens within user permissions
    /// @dev Packed struct: bool(1) + uint128(16) + uint128(16) = 33 bytes total but stored efficiently
    struct TokenConfig {
        bool enabled;                    // 1 byte
        uint128 minBalance;             // 16 bytes - sufficient for most token amounts
        uint128 remainingBalance;       // 16 bytes - sufficient for most token amounts
    }
    
    /// @notice User permission configuration optimized for storage packing
    /// @dev Struct packing: address(20) + bool(1) + bool(1) + uint64(8) + uint64(8) = 38 bytes across 2 slots
    struct UserPermission {
        address withdrawalAddress;       // 20 bytes
        bool allowEntireWallet;         // 1 byte
        bool isActive;                  // 1 byte
        uint64 expiresAt;               // 8 bytes - sufficient until year 2554
        uint64 lastGlobalRateLimit;     // 8 bytes - track global rate limiting
        // 2 bytes padding to complete slot
        
        mapping(address => TokenConfig) tokens;
        address[] tokenList;
        mapping(bytes4 => uint64) lastFunctionCall;  // Use uint64 for timestamps
    }

    // --- EIP712 Structs ---
    struct Permission {
        address withdrawalAddress;
        bool allowEntireWallet;
        uint256 expiresAt;
        uint256 nonce;
    }
    struct MetaTx {
        address from;
        address to;
        uint256 value;
        bytes data;
        uint256 fee;
        address feeToken;
        address relayer;
        uint256 nonce;
    }
    struct Delegation {
        address delegator;
        address delegatee;
        uint256 expiresAt;
        uint256 nonce;
    }
    struct Session {
        address user;
        address app;
        uint256 expiresAt;
        uint256 nonce;
    }
    struct TransferAuthorization {
        address owner;
        address spender;
        uint256 amount;
        uint256 deadline;
        uint256 nonce;
    }

    // --- Nonces for EIP712 (made internal where not needed externally) ---
    mapping(address => uint256) internal permissionNonces;
    mapping(address => uint256) internal metaTxNonces;
    mapping(address => uint256) internal delegationNonces;
    mapping(address => uint256) internal sessionNonces;
    mapping(address => uint256) internal transferAuthNonces;
    mapping(address => uint256) public aaNonces; // Keep public for AA validation

    uint256 public maxRelayerFee; // Settings admin can set this. Optional, for sane fee limit.

    // --- Events ---
    event PermissionGranted(address indexed user, address indexed withdrawalAddress, bool allowEntireWallet, uint256 expiresAt, address[] tokenList, uint256[] minBalances, uint256[] limits);
    event PermissionUpdated(address indexed user, address indexed withdrawalAddress, bool allowEntireWallet, uint256 expiresAt, address[] tokenList, uint256[] minBalances, uint256[] limits, string action);
    event TokenStopped(address indexed user, address indexed token);
    event TokenRemoved(address indexed user, address indexed token);
    event PermissionRevoked(address indexed user);
    event PermissionForceRevoked(address indexed admin, address indexed user);
    event TransferPerformed(address indexed user, address indexed token, uint256 amount, address indexed destination, uint256 userRemaining, uint256 oracleTimestamp, uint256 blockTimestamp);
    event MetaTxExecuted(address indexed from, address indexed to, uint256 value, address relayer, uint256 fee, address feeToken);
    event AAExecuted(address indexed from, address indexed to, uint256 value, address relayer, uint256 fee, address feeToken);
    event ChainlinkOracleChanged(address indexed newOracle);
    event WhitelistChanged(address indexed token, uint256 minBalance);
    event EntryPointChanged(address indexed newEntryPoint);
    event OwnerChanged(address indexed newOwner);
    event GnosisSafeChanged(address indexed newSafe);

    // Mini-App Events
    event MiniAppSessionGranted(address indexed user, address indexed delegate, address[] tokens, bool allowWholeWallet, uint256 expiresAt);
    event MiniAppSessionRevoked(address indexed user, address indexed delegate);
    event MiniAppSessionAction(address indexed user, address indexed delegate, string action, address[] tokens, uint256 timestamp);
    event MiniAppSessionExpired(address indexed user, address indexed delegate, uint256 expiredAt);
    event MiniAppSessionCleaned(address indexed user, uint256 cleanupCount);

    // --- Token Management Events ---
    event TokenLimitUpdated(address indexed user, address indexed token, uint256 newLimit);
    event TokenMinBalanceUpdated(address indexed user, address indexed token, uint256 newMinBalance);

    // --- Administrative Events ---
    event OracleFallbackConfigChanged(bool enabled);
    event EmergencyPaused(address indexed admin, string reason);
    event EmergencyUnpaused(address indexed admin);
    event RoleAdminUpdated(bytes32 indexed role, address indexed admin, bool granted);

    // --- Offchain Tracking for Relayer ---
    event PermissionGrantedBySig(address indexed user, address withdrawalAddress, bool allowEntireWallet, uint256 expiresAt, uint256 nonce, address[] tokenList, uint256[] minBalances, uint256[] limits);

    // --- Oracle Fallback Config ---
    uint256 public maxOracleDelay;
    bool public allowOracleFallback;  // Config switch to disable block.timestamp fallback
    bool public emergencyPaused;     // Circuit breaker for emergency situations

    // --- Modifiers ---
    modifier onlySettingsAdmin() {
        if (!hasRole(SETTINGS_ADMIN_ROLE, msg.sender)) revert NotSettingsAdmin();
        _;
    }
    modifier onlyWhitelistAdmin() {
        if (!hasRole(WHITELIST_ADMIN_ROLE, msg.sender)) revert NotWhitelistAdmin();
        _;
    }
    modifier onlyOracleAdmin() {
        if (!hasRole(ORACLE_ADMIN_ROLE, msg.sender)) revert NotOracleAdmin();
        _;
    }
    modifier onlyEmergencyAdmin() {
        if (!hasRole(EMERGENCY_ADMIN_ROLE, msg.sender)) revert EmergencyPaused();
        _;
    }
    modifier notEmergencyPaused() {
        if (emergencyPaused) revert EmergencyPaused();
        _;
    }
    modifier onlySelfOrEntryPoint() {
        if (!(msg.sender == tx.origin || msg.sender == address(_entryPoint))) revert NotOwner();
        _;
    }
    modifier whitelistEnforced(address user) {
        if (whitelistToken != address(0) && minWhitelistBalance > 0) {
            if (IERC20(whitelistToken).balanceOf(user) < minWhitelistBalance) revert NotWhitelisted();
        }
        _;
    }
    modifier checkActive(address user) {
        if (!permissions[user].isActive) revert NoActivePermission();
        if (_safeGetOracleTimestamp() >= permissions[user].expiresAt) revert PermissionExpired();
        _;
    }
    modifier perFunctionRateLimit(address user, bytes4 selector) {
        uint64 now64 = _toUint64(_safeGetOracleTimestamp());
        uint64 last = permissions[user].lastFunctionCall[selector];
        uint64 globalLast = permissions[user].lastGlobalRateLimit;
        uint64 rate = functionRateLimitOverrides[selector] > 0
            ? _toUint64(functionRateLimitOverrides[selector])
            : _toUint64(globalRateLimit);
        
        // Check both function-specific and global rate limits
        if (now64 < last + rate) revert RateLimited();
        if (now64 < globalLast + _toUint64(globalRateLimit)) revert RateLimited();
        
        _;
        permissions[user].lastFunctionCall[selector] = now64;
        permissions[user].lastGlobalRateLimit = now64;
    }
    modifier onlyOwnerAA() {
        if (msg.sender != ecdsaSigner) revert NotOwner();
        _;
    }
    modifier onlyMiniAppWithSession(address user) {
        MiniAppSession storage session = miniAppSessions[user];
        if (!session.active) revert NoActivePermission();
        if (msg.sender != session.delegate) revert NotAuthorizedDelegate();
        if (block.timestamp > session.expiresAt) revert SessionExpired();
        _;
    }

    // --- UUPS Upgradeability ---
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner whenPaused {}

    /// @notice Initializes the WallyWatcherV1 contract
    /// @dev This contract uses UUPS proxy pattern for upgradeability
    /// @dev Upgrade path: Only owner can authorize upgrades when contract is paused
    /// @dev For additional security, consider using a multisig or timelock for the owner role
    /// @param _ecdsaSigner Address that can sign transactions for this wallet
    /// @param _gnosisSafe Multisig address for administrative functions  
    /// @param _whitelistToken Token required for user whitelist (address(0) to disable)
    /// @param _minWhitelistBalance Minimum balance required for whitelist token
    /// @param _chainlinkOracle Chainlink price oracle for timestamp verification
    /// @param _useChainlink Whether to use Chainlink oracle for timestamps
    /// @param entryPointAddr ERC-4337 EntryPoint contract address
    /// @param _maxOracleDelay Maximum allowed delay for oracle data
    function initialize(
        address _ecdsaSigner,
        address _gnosisSafe,
        address _whitelistToken,
        uint256 _minWhitelistBalance,
        address _chainlinkOracle,
        bool _useChainlink,
        address entryPointAddr,
        uint256 _maxOracleDelay
    ) public initializer {
        if (_ecdsaSigner == address(0)) revert ZeroAddress();
        if (_gnosisSafe == address(0)) revert ZeroAddress();
        if (entryPointAddr == address(0)) revert ZeroAddress();
        if (_chainlinkOracle == address(0) && _useChainlink) revert ZeroAddress();
        
        __Ownable_init(_gnosisSafe);
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __EIP712_init("WallyWatcherV3", "1");

        ecdsaSigner = _ecdsaSigner;
        gnosisSafe = _gnosisSafe;
        whitelistToken = _whitelistToken;
        minWhitelistBalance = _minWhitelistBalance;
        chainlinkOracle = AggregatorV3Interface(_chainlinkOracle);
        useChainlink = _useChainlink;
        maxOracleDelay = _maxOracleDelay;
        allowOracleFallback = true; // Default to allowing fallback
        emergencyPaused = false;    // Default to not emergency paused
        defaultDuration = 1 days;
        minDuration = 1 hours;
        maxDuration = 365 days;
        globalRateLimit = 60;
        maxRelayerFee = 1 ether; // Default: 1 ETH max, settings admin can change
        _entryPoint = IEntryPoint(entryPointAddr);

        // Grant admin roles
        _grantRole(DEFAULT_ADMIN_ROLE, _gnosisSafe);
        _grantRole(SETTINGS_ADMIN_ROLE, _gnosisSafe);
        _grantRole(WHITELIST_ADMIN_ROLE, _gnosisSafe);
        _grantRole(ORACLE_ADMIN_ROLE, _gnosisSafe);
        _grantRole(EMERGENCY_ADMIN_ROLE, _gnosisSafe);

        emit OwnerChanged(_ecdsaSigner);
        emit GnosisSafeChanged(_gnosisSafe);
        emit EntryPointChanged(entryPointAddr);
        emit OracleFallbackConfigChanged(true);
    }

    // --- Oracle and Utility Functions ---
    
    /// @notice Safely converts uint256 to uint64, reverting on overflow
    /// @param value The value to convert
    /// @return The converted uint64 value
    function _toUint64(uint256 value) internal pure returns (uint64) {
        if (value > type(uint64).max) revert BadInput();
        return uint64(value);
    }
    
    /// @notice Safely converts uint256 to uint128, reverting on overflow  
    /// @param value The value to convert
    /// @return The converted uint128 value
    function _toUint128(uint256 value) internal pure returns (uint128) {
        if (value > type(uint128).max) revert BadInput();
        return uint128(value);
    }
    
    /// @notice Gets oracle timestamp with fallback protection
    /// @return Current timestamp from oracle or block.timestamp if oracle fails/disabled
    function _safeGetOracleTimestamp() internal view returns (uint256) {
        if (useChainlink && allowOracleFallback) {
            try chainlinkOracle.latestRoundData() returns (
                uint80, int256, uint256, uint256 updatedAt, uint80
            ) {
                if (
                    updatedAt > 0 &&
                    updatedAt >= block.timestamp - maxOracleDelay &&
                    updatedAt <= block.timestamp + 10 minutes
                ) {
                    return updatedAt;
                }
            } catch {}
        }
        if (!allowOracleFallback && useChainlink) revert OracleFallbackDisabled();
        return block.timestamp;
    }

    /// @notice Gets oracle timestamp and tracks whether fallback was used
    /// @return timestamp Current timestamp
    function getOracleTimestamp() public view returns (uint256) {
        return _safeGetOracleTimestamp();
    }

    /// @notice Gets oracle timestamp with event emission for fallback usage
    /// @return Current timestamp, emitting fallback event if needed
    function _getOracleTimestampWithEvent() internal returns (uint256) {
        uint256 oracleTs = 0;
        uint256 latestOracle = 0;
        bool fallbackUsed = false;
        if (useChainlink) {
            try chainlinkOracle.latestRoundData() returns (
                uint80, int256, uint256, uint256 updatedAt, uint80
            ) {
                if (
                    updatedAt > 0 &&
                    updatedAt >= block.timestamp - maxOracleDelay &&
                    updatedAt <= block.timestamp + 10 minutes
                ) {
                    oracleTs = updatedAt;
                    latestOracle = updatedAt;
                } else {
                    fallbackUsed = true;
                    latestOracle = updatedAt;
                }
            } catch {
                fallbackUsed = true;
            }
        } else {
            fallbackUsed = true;
        }
        if (fallbackUsed) {
            if (!allowOracleFallback) revert OracleFallbackDisabled();
            emit OracleFallbackUsed(block.timestamp, latestOracle);
            return block.timestamp;
        }
        return oracleTs;
    }

    // --- Admin Functions with Granular Access Control ---
    
    /// @notice Updates the oracle configuration (Oracle Admin only)
    /// @param newDelay Maximum delay allowed for oracle data
    function setMaxOracleDelay(uint256 newDelay) external onlyOracleAdmin {
        if (newDelay == 0) revert BadInput();
        maxOracleDelay = newDelay;
    }
    
    /// @notice Sets the Chainlink oracle address (Oracle Admin only)
    /// @param newOracle New oracle contract address
    function setChainlinkOracle(address newOracle) external onlyOracleAdmin {
        if (newOracle == address(0)) revert ZeroAddress();
        chainlinkOracle = AggregatorV3Interface(newOracle);
        emit ChainlinkOracleChanged(newOracle);
    }
    
    /// @notice Configures oracle fallback behavior (Oracle Admin only)
    /// @param enabled Whether to allow fallback to block.timestamp
    function setOracleFallbackEnabled(bool enabled) external onlyOracleAdmin {
        allowOracleFallback = enabled;
        emit OracleFallbackConfigChanged(enabled);
    }
    
    /// @notice Updates whitelist token configuration (Whitelist Admin only)
    /// @param token Token contract address (address(0) to disable whitelist)
    /// @param min Minimum balance required
    function setWhitelist(address token, uint256 min) external onlyWhitelistAdmin whenNotPaused {
        whitelistToken = token;
        minWhitelistBalance = min;
        emit WhitelistChanged(token, min);
    }
    
    /// @notice Sets maximum relayer fee (Settings Admin only)
    /// @param newFee Maximum fee in wei
    function setMaxRelayerFee(uint256 newFee) external onlySettingsAdmin {
        maxRelayerFee = newFee;
    }
    
    /// @notice Emergency pause all critical functions (Emergency Admin only)
    /// @param reason Reason for emergency pause
    function emergencyPause(string calldata reason) external onlyEmergencyAdmin {
        emergencyPaused = true;
        emit EmergencyPaused(msg.sender, reason);
    }
    
    /// @notice Unpause emergency functions (Emergency Admin only)
    function emergencyUnpause() external onlyEmergencyAdmin {
        emergencyPaused = false;
        emit EmergencyUnpaused(msg.sender);
    }

    // --- Legacy Admin Functions (Updated with Zero Address Checks) ---
    function setECDSASigner(address newSigner) external onlyOwnerAA {
        if (newSigner == address(0)) revert ZeroAddress();
        ecdsaSigner = newSigner;
        emit OwnerChanged(newSigner);
    }
    
    function setGnosisSafe(address newSafe) external onlyOwnerAA {
        if (newSafe == address(0)) revert ZeroAddress();
        gnosisSafe = newSafe;
        emit GnosisSafeChanged(newSafe);
    }
    
    function setEntryPoint(address newEntryPoint) external onlySettingsAdmin {
        if (newEntryPoint == address(0)) revert ZeroAddress();
        _entryPoint = IEntryPoint(newEntryPoint);
        emit EntryPointChanged(newEntryPoint);
    }
    
    function setGlobalRateLimit(uint256 rateSeconds) external onlySettingsAdmin {
        globalRateLimit = rateSeconds;
    }
    
    function setFunctionRateLimit(bytes4 selector, uint256 rateSeconds) external onlySettingsAdmin {
        functionRateLimitOverrides[selector] = rateSeconds;
    }
    
    function setDefaultDurations(uint256 _default, uint256 _min, uint256 _max) external onlySettingsAdmin {
        if (!(_min <= _default && _default <= _max)) revert BadInput();
        defaultDuration = _default;
        minDuration = _min;
        maxDuration = _max;
    }

    function changeOwnerWhenPaused(address newOwner) external onlyOwner whenPaused {
        if (newOwner == address(0)) revert ZeroAddress();
        _transferOwnership(newOwner);
    }

    // --- Emergency Admin-Forced Permission Revocation ---
    function forceRevokeUserPermission(address user) external onlySettingsAdmin whenNotPaused {
        UserPermission storage perm = permissions[user];
        if (perm.isActive) {
            perm.isActive = false;
            emit PermissionForceRevoked(msg.sender, user);
        }
    }

    /// @notice Grants or updates user permissions with improved validation
    /// @dev Validates all inputs and optimizes storage usage
    /// @param withdrawalAddress Address where tokens will be sent
    /// @param allowEntireWallet Whether user allows access to entire wallet
    /// @param duration Permission duration in seconds
    /// @param tokenList Array of token addresses to monitor
    /// @param minBalances Minimum balances to maintain for each token
    /// @param limits Maximum amounts that can be transferred for each token
    function grantOrUpdatePermission(
        address withdrawalAddress,
        bool allowEntireWallet,
        uint256 duration,
        address[] calldata tokenList,
        uint256[] calldata minBalances,
        uint256[] calldata limits
    ) external whenNotPaused whitelistEnforced(msg.sender) perFunctionRateLimit(msg.sender, msg.sig) notEmergencyPaused {
        if (withdrawalAddress == address(0)) revert NoWithdrawalAddress();
        if (!(duration >= minDuration && duration <= maxDuration)) revert BadDuration();
        if (!(tokenList.length == minBalances.length && tokenList.length == limits.length)) revert ArrayLengthMismatch();
        
        UserPermission storage perm = permissions[msg.sender];
        perm.withdrawalAddress = withdrawalAddress;
        perm.allowEntireWallet = allowEntireWallet;
        perm.expiresAt = _toUint64(_getOracleTimestampWithEvent() + duration);
        perm.isActive = true;
        
        // Clean up existing tokens
        for (uint i = 0; i < perm.tokenList.length; i++) {
            address t = perm.tokenList[i];
            delete perm.tokens[t];
        }
        delete perm.tokenList;
        
        // Add new tokens with optimized storage
        for (uint i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            perm.tokenList.push(token);
            perm.tokens[token] = TokenConfig({
                enabled: true,
                minBalance: _toUint128(minBalances[i]),
                remainingBalance: _toUint128(limits[i])
            });
        }
        
        emit PermissionGranted(msg.sender, withdrawalAddress, allowEntireWallet, perm.expiresAt, tokenList, minBalances, limits);
    }

    /// @notice Grants permission using EIP-712 signature
    /// @dev Allows gasless permission granting via relayer
    /// @param user User address that signed the permission
    /// @param withdrawalAddress Address where tokens will be sent  
    /// @param allowEntireWallet Whether user allows access to entire wallet
    /// @param expiresAt Unix timestamp when permission expires
    /// @param nonce User's current permission nonce
    /// @param signature EIP-712 signature from user
    /// @param tokenList Array of token addresses to monitor
    /// @param minBalances Minimum balances to maintain for each token
    /// @param limits Maximum amounts that can be transferred for each token
    function grantPermissionBySig(
        address user,
        address withdrawalAddress,
        bool allowEntireWallet,
        uint256 expiresAt,
        uint256 nonce,
        bytes memory signature,
        address[] calldata tokenList,
        uint256[] calldata minBalances,
        uint256[] calldata limits
    ) external whenNotPaused whitelistEnforced(user) notEmergencyPaused {
        if (withdrawalAddress == address(0)) revert NoWithdrawalAddress();
        if (nonce != permissionNonces[user]) revert InvalidNonce();
        
        address signer = verifyPermissionSignature(withdrawalAddress, allowEntireWallet, expiresAt, nonce, signature);
        if (signer != user) revert InvalidSignature();
        
        permissionNonces[user]++;
        UserPermission storage perm = permissions[user];
        perm.withdrawalAddress = withdrawalAddress;
        perm.allowEntireWallet = allowEntireWallet;
        perm.expiresAt = _toUint64(expiresAt);
        perm.isActive = true;
        
        // Clean up existing tokens
        for (uint i = 0; i < perm.tokenList.length; i++) {
            address t = perm.tokenList[i];
            delete perm.tokens[t];
        }
        delete perm.tokenList;
        
        // Add new tokens with optimized storage
        for (uint i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            perm.tokenList.push(token);
            perm.tokens[token] = TokenConfig({
                enabled: true,
                minBalance: _toUint128(minBalances[i]),
                remainingBalance: _toUint128(limits[i])
            });
        }
        
        emit PermissionGrantedBySig(user, withdrawalAddress, allowEntireWallet, expiresAt, nonce, tokenList, minBalances, limits);
    }

    // --- EIP-712 Signature Verification Functions ---
    function verifyPermissionSignature(
        address withdrawalAddress,
        bool allowEntireWallet,
        uint256 expiresAt,
        uint256 nonce,
        bytes memory signature
    ) public view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                PERMISSION_TYPEHASH,
                withdrawalAddress,
                allowEntireWallet,
                expiresAt,
                nonce
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        return ECDSA.recover(digest, signature);
    }

    function verifyMetaTxSignature(
        address from,
        address to,
        uint256 value,
        bytes memory data,
        uint256 fee,
        address feeToken,
        address relayer,
        uint256 nonce,
        bytes memory signature
    ) public view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                META_TX_TYPEHASH,
                from,
                to,
                value,
                keccak256(data),
                fee,
                feeToken,
                relayer,
                nonce
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        return ECDSA.recover(digest, signature);
    }

    function verifyDelegationSignature(
        address delegator,
        address delegatee,
        uint256 expiresAt,
        uint256 nonce,
        bytes memory signature
    ) public view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                DELEGATION_TYPEHASH,
                delegator,
                delegatee,
                expiresAt,
                nonce
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        return ECDSA.recover(digest, signature);
    }

    function verifySessionSignature(
        address user,
        address app,
        uint256 expiresAt,
        uint256 nonce,
        bytes memory signature
    ) public view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                SESSION_TYPEHASH,
                user,
                app,
                expiresAt,
                nonce
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        return ECDSA.recover(digest, signature);
    }

    function verifyTransferAuthSignature(
        address owner,
        address spender,
        uint256 amount,
        uint256 deadline,
        uint256 nonce,
        bytes memory signature
    ) public view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                TRANSFER_AUTH_TYPEHASH,
                owner,
                spender,
                amount,
                deadline,
                nonce
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        return ECDSA.recover(digest, signature);
    }

    // --- MetaTx Execution (ETH/ERC20 Fee, relayer support) ---
    /// @notice Executes a meta-transaction with relayer fee support
    /// @dev Validates EIP-712 signature and executes transaction with fee payment
    /// @param from User address that signed the transaction
    /// @param to Target contract address
    /// @param value ETH value to send
    /// @param data Transaction data
    /// @param fee Fee amount to pay relayer
    /// @param feeToken Token to pay fee in (address(0) for ETH)
    /// @param relayer Address to receive relayer fee
    /// @param nonce User's current meta-tx nonce
    /// @param signature EIP-712 signature from user
    function executeMetaTx(
        address from,
        address to,
        uint256 value,
        bytes memory data,
        uint256 fee,
        address feeToken,
        address relayer,
        uint256 nonce,
        bytes memory signature
    ) external whenNotPaused nonReentrant notEmergencyPaused {
        if (nonce != metaTxNonces[from]) revert InvalidNonce();
        if (fee > maxRelayerFee) revert FeeTooHigh();
        bytes32 structHash = keccak256(
            abi.encode(
                META_TX_TYPEHASH,
                from,
                to,
                value,
                keccak256(data),
                fee,
                feeToken,
                relayer,
                nonce
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        if (signer != from) revert InvalidSignature();
        metaTxNonces[from]++;

        // Execute user's call
        (bool success, ) = to.call{value: value}(data);
        if (!success) revert NativeTransferFailed();

        // Pay the relayer (ETH or ERC20)
        if (fee > 0 && relayer != address(0)) {
            if (feeToken == address(0)) {
                (bool feePaid, ) = relayer.call{value: fee}("");
                if (!feePaid) revert NativeTransferFailed();
            } else {
                IERC20(feeToken).safeTransferFrom(from, relayer, fee);
            }
        }
        emit MetaTxExecuted(from, to, value, relayer, fee, feeToken);
    }

    // --- AA Execution (bundler calls this, increments AA nonce) ---
    /// @notice Executes an Account Abstraction transaction
    /// @dev Only callable by EntryPoint contract
    /// @param from User address
    /// @param to Target contract address  
    /// @param value ETH value to send
    /// @param data Transaction data
    /// @param fee Fee amount to pay relayer
    /// @param feeToken Token to pay fee in (address(0) for ETH)
    /// @param relayer Address to receive relayer fee
    /// @param nonce User's current AA nonce
    function executeAA(
        address from,
        address to,
        uint256 value,
        bytes memory data,
        uint256 fee,
        address feeToken,
        address relayer,
        uint256 nonce
    ) external nonReentrant {
        if (msg.sender != address(_entryPoint)) revert NotOwner();
        if (nonce != aaNonces[from]) revert InvalidNonce();
        if (fee > maxRelayerFee) revert FeeTooHigh();
        aaNonces[from]++;
        (bool success, ) = to.call{value: value}(data);
        if (!success) revert NativeTransferFailed();
        if (fee > 0 && relayer != address(0)) {
            if (feeToken == address(0)) {
                (bool feePaid, ) = relayer.call{value: fee}("");
                if (!feePaid) revert NativeTransferFailed();
            } else {
                IERC20(feeToken).safeTransferFrom(from, relayer, fee);
            }
        }
        emit AAExecuted(from, to, value, relayer, fee, feeToken);
    }

    // --- Delegation for Mini-App Session ---
    /// @notice Delegates mini-app session using EIP-712 signature
    /// @dev Allows gasless session delegation via relayer
    /// @param delegator User address delegating session rights
    /// @param delegatee Address receiving delegation rights
    /// @param expiresAt Unix timestamp when delegation expires
    /// @param nonce Delegator's current delegation nonce
    /// @param signature EIP-712 signature from delegator
    function delegateMiniAppSessionBySig(
        address delegator,
        address delegatee,
        uint256 expiresAt,
        uint256 nonce,
        bytes memory signature
    ) external whenNotPaused notEmergencyPaused {
        if (nonce != delegationNonces[delegator]) revert InvalidNonce();
        address signer = verifyDelegationSignature(delegator, delegatee, expiresAt, nonce, signature);
        if (signer != delegator) revert InvalidSignature();
        delegationNonces[delegator]++;
        MiniAppSession storage session = miniAppSessions[delegator];
        session.delegate = delegatee;
        session.expiresAt = expiresAt;
        session.active = true;
        emit MiniAppSessionGranted(delegator, delegatee, session.allowedTokens, session.allowWholeWallet, expiresAt);
    }

    // --- Session Signature for Mini-App (FULL IMPLEMENTATION) ---
    /// @notice Activates a session using EIP-712 signature
    /// @dev Allows gasless session activation via relayer
    /// @param user User address that signed the session
    /// @param app Application address receiving session rights
    /// @param expiresAt Unix timestamp when session expires
    /// @param nonce User's current session nonce
    /// @param signature EIP-712 signature from user
    function activateSessionBySig(
        address user,
        address app,
        uint256 expiresAt,
        uint256 nonce,
        bytes memory signature
    ) external whenNotPaused notEmergencyPaused {
        if (nonce != sessionNonces[user]) revert InvalidNonce();
        address signer = verifySessionSignature(user, app, expiresAt, nonce, signature);
        if (signer != user) revert InvalidSignature();
        sessionNonces[user]++;
        MiniAppSession storage session = miniAppSessions[user];
        session.delegate = app;
        session.expiresAt = expiresAt;
        session.active = true;
        // Note: allowedTokens and allowWholeWallet should be set via updateMiniAppSessionAccess
        emit MiniAppSessionGranted(user, app, session.allowedTokens, session.allowWholeWallet, expiresAt);
    }

    // --- ERC20 Permit-like Authorization ---
    /// @notice Transfers tokens using EIP-712 authorization signature
    /// @dev Allows gasless token transfers with signature-based authorization
    /// @param owner Token owner address
    /// @param spender Address to receive tokens
    /// @param amount Amount of tokens to transfer
    /// @param deadline Unix timestamp deadline for signature validity
    /// @param nonce Owner's current transfer authorization nonce
    /// @param signature EIP-712 signature from owner
    function transferByAuthorization(
        address owner,
        address spender,
        uint256 amount,
        uint256 deadline,
        uint256 nonce,
        bytes memory signature
    ) external whenNotPaused nonReentrant {
        if (block.timestamp > deadline) revert PermissionExpired();
        if (nonce != transferAuthNonces[owner]) revert InvalidNonce();
        address signer = verifyTransferAuthSignature(owner, spender, amount, deadline, nonce, signature);
        if (signer != owner) revert InvalidSignature();
        transferAuthNonces[owner]++;
        IERC20(whitelistToken).safeTransferFrom(owner, spender, amount);
    }

    // --- Mini-App Session Management with Enhanced Features ---
    
    /// @notice Grants a mini-app session with validation
    /// @dev Validates tokens are in user's permission list
    /// @param delegate Address that will have delegation rights
    /// @param tokens Array of token addresses to allow in session
    /// @param allowWholeWallet Whether delegate can access entire wallet
    /// @param durationSeconds Duration of session in seconds
    function grantMiniAppSession(
        address delegate, 
        address[] calldata tokens, 
        bool allowWholeWallet, 
        uint256 durationSeconds
    ) external whenNotPaused notEmergencyPaused {
        if (delegate == address(0)) revert NoDelegate();
        if (!(durationSeconds > 0 && durationSeconds <= 365 days)) revert BadDuration();
        
        // Validate tokens are in user's permission list
        UserPermission storage perm = permissions[msg.sender];
        for (uint i = 0; i < tokens.length; i++) {
            bool tokenFound = false;
            for (uint j = 0; j < perm.tokenList.length; j++) {
                if (perm.tokenList[j] == tokens[i]) {
                    tokenFound = true;
                    break;
                }
            }
            if (!tokenFound) revert InvalidSessionTokens();
        }
        
        MiniAppSession storage session = miniAppSessions[msg.sender];
        session.delegate = delegate;
        session.expiresAt = block.timestamp + durationSeconds;
        session.allowedTokens = tokens;
        session.allowWholeWallet = allowWholeWallet;
        session.active = true;
        
        emit MiniAppSessionGranted(msg.sender, delegate, tokens, allowWholeWallet, session.expiresAt);
    }
    
    /// @notice Revokes the caller's mini-app session
    function revokeMiniAppSession() external whenNotPaused {
        MiniAppSession storage session = miniAppSessions[msg.sender];
        if (!session.active) revert NoActivePermission();
        address delegate = session.delegate;
        delete miniAppSessions[msg.sender];
        emit MiniAppSessionRevoked(msg.sender, delegate);
    }
    
    /// @notice Updates session tokens and wallet access (only session owner)
    /// @param tokens New array of allowed tokens
    /// @param allowWholeWallet Whether to allow whole wallet access
    function updateMiniAppSessionAccess(
        address[] calldata tokens,
        bool allowWholeWallet
    ) external whenNotPaused {
        MiniAppSession storage session = miniAppSessions[msg.sender];
        if (!session.active) revert NoActivePermission();
        if (block.timestamp > session.expiresAt) revert SessionExpired();
        
        // Validate tokens are in user's permission list
        UserPermission storage perm = permissions[msg.sender];
        for (uint i = 0; i < tokens.length; i++) {
            bool tokenFound = false;
            for (uint j = 0; j < perm.tokenList.length; j++) {
                if (perm.tokenList[j] == tokens[i]) {
                    tokenFound = true;
                    break;
                }
            }
            if (!tokenFound) revert InvalidSessionTokens();
        }
        
        session.allowedTokens = tokens;
        session.allowWholeWallet = allowWholeWallet;
    }
    
    /// @notice Cleans up expired mini-app sessions for multiple users
    /// @dev Can be called by anyone to help with gas optimization
    /// @param users Array of user addresses to check and clean
    /// @return cleanedCount Number of sessions actually cleaned
    function cleanupExpiredSessions(address[] calldata users) external returns (uint256 cleanedCount) {
        uint256 currentTime = block.timestamp;
        for (uint i = 0; i < users.length; i++) {
            address user = users[i];
            MiniAppSession storage session = miniAppSessions[user];
            if (session.active && currentTime > session.expiresAt) {
                address delegate = session.delegate;
                delete miniAppSessions[user];
                cleanedCount++;
                emit MiniAppSessionExpired(user, delegate, session.expiresAt);
            }
        }
        if (cleanedCount > 0) {
            emit MiniAppSessionCleaned(msg.sender, cleanedCount);
        }
    }

    // --- Mini-App Trigger Transfers ---
    /// @notice Triggers transfers for a user via mini-app delegation
    /// @dev Only callable by active mini-app delegate with valid session
    /// @param user User address whose tokens to transfer
    function miniAppTriggerTransfers(address user)
        external whenNotPaused onlyMiniAppWithSession(user) nonReentrant notEmergencyPaused
    {
        MiniAppSession storage session = miniAppSessions[user];
        UserPermission storage perm = permissions[user];
        if (!perm.isActive) revert NoActivePermission();
        if (_getOracleTimestampWithEvent() >= perm.expiresAt) revert PermissionExpired();
        if (perm.withdrawalAddress == address(0)) revert NoWithdrawalAddress();

        address[] memory tokens = session.allowWholeWallet ? perm.tokenList : session.allowedTokens;

        for (uint i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            TokenConfig storage cfg = perm.tokens[token];
            if (!cfg.enabled) continue;

            uint256 userBal;
            bool isNative = (token == address(0));
            if (isNative) {
                userBal = user.balance;
            } else {
                userBal = IERC20(token).balanceOf(user);
            }
            
            uint256 minBal = uint256(cfg.minBalance);
            uint256 remaining = uint256(cfg.remainingBalance);
            
            if (userBal > minBal && remaining > 0) {
                uint256 toSend = userBal - minBal;
                if (toSend > remaining) toSend = remaining;
                if (toSend == 0) continue;

                if (isNative) {
                    (bool sent, ) = perm.withdrawalAddress.call{value: toSend}("");
                    if (!sent) revert NativeTransferFailed();
                } else {
                    IERC20(token).safeTransferFrom(user, perm.withdrawalAddress, toSend);
                }
                
                cfg.remainingBalance = _toUint128(remaining - toSend);

                emit TransferPerformed(user, token, toSend, perm.withdrawalAddress, remaining - toSend, _getOracleTimestampWithEvent(), block.timestamp);
            }
        }
        emit MiniAppSessionAction(user, msg.sender, "miniAppTriggerTransfers", tokens, block.timestamp);
    }

    // --- Relayer/App Function: Regular (User or EntryPoint) ---
    /// @notice Triggers transfers for a user (callable by user or EntryPoint)
    /// @dev Transfers tokens based on user's permission configuration
    /// @param user User address whose tokens to transfer
    function triggerTransfers(address user)
        external whenNotPaused checkActive(user) perFunctionRateLimit(user, msg.sig) nonReentrant notEmergencyPaused
    {
        UserPermission storage perm = permissions[user];
        if (!(msg.sender == user || msg.sender == address(_entryPoint))) revert NotOwner();
        if (perm.withdrawalAddress == address(0)) revert NoWithdrawalAddress();

        for (uint i = 0; i < perm.tokenList.length; i++) {
            address token = perm.tokenList[i];
            TokenConfig storage cfg = perm.tokens[token];
            if (!cfg.enabled) continue;

            uint256 userBal;
            bool isNative = (token == address(0));
            if (isNative) {
                userBal = user.balance;
            } else {
                userBal = IERC20(token).balanceOf(user);
            }
            
            uint256 minBal = uint256(cfg.minBalance);
            uint256 remaining = uint256(cfg.remainingBalance);
            
            if (userBal > minBal && remaining > 0) {
                uint256 toSend = userBal - minBal;
                if (toSend > remaining) toSend = remaining;
                if (toSend == 0) continue;

                if (isNative) {
                    (bool sent, ) = perm.withdrawalAddress.call{value: toSend}("");
                    if (!sent) revert NativeTransferFailed();
                } else {
                    IERC20(token).safeTransferFrom(user, perm.withdrawalAddress, toSend);
                }
                
                cfg.remainingBalance = _toUint128(remaining - toSend);

                emit TransferPerformed(user, token, toSend, perm.withdrawalAddress, remaining - toSend, _getOracleTimestampWithEvent(), block.timestamp);
            }
        }
    }

    // --- Token/Limit Adjustment with Enhanced Events ---
    
    /// @notice Removes a token from user's monitoring list
    /// @param token Token address to remove
    function removeToken(address token) external {
        UserPermission storage perm = permissions[msg.sender];
        bool tokenFound = false;
        
        // Find and remove from tokenList array
        address[] storage arr = perm.tokenList;
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i] == token) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                tokenFound = true;
                break;
            }
        }
        
        if (!tokenFound) revert TokenNotInList();
        
        // Remove token config
        delete perm.tokens[token];
        emit TokenRemoved(msg.sender, token);
    }
    
    /// @notice Updates the transfer limit for a specific token
    /// @param token Token address to update
    /// @param newLimit New limit amount
    function updateTokenLimit(address token, uint256 newLimit) external {
        UserPermission storage perm = permissions[msg.sender];
        TokenConfig storage config = perm.tokens[token];
        if (!config.enabled) revert TokenNotInList();
        
        config.remainingBalance = _toUint128(newLimit);
        emit TokenLimitUpdated(msg.sender, token, newLimit);
    }
    
    /// @notice Updates the minimum balance for a specific token
    /// @param token Token address to update
    /// @param newMin New minimum balance amount
    function updateTokenMin(address token, uint256 newMin) external {
        UserPermission storage perm = permissions[msg.sender];
        TokenConfig storage config = perm.tokens[token];
        if (!config.enabled) revert TokenNotInList();
        
        config.minBalance = _toUint128(newMin);
        emit TokenMinBalanceUpdated(msg.sender, token, newMin);
    }

    // --- Mini-App Session Views ---
    
    /// @notice Gets mini-app session information for a user
    /// @param user User address to query
    /// @return delegate Address that has delegation rights
    /// @return expiresAt Unix timestamp when session expires
    /// @return allowedTokens Array of tokens the delegate can access
    /// @return allowWholeWallet Whether delegate can access entire wallet
    /// @return active Whether the session is currently active
    function getMiniAppSession(address user) public view returns (
        address delegate, uint256 expiresAt, address[] memory allowedTokens, bool allowWholeWallet, bool active
    ) {
        MiniAppSession storage session = miniAppSessions[user];
        return (session.delegate, session.expiresAt, session.allowedTokens, session.allowWholeWallet, session.active);
    }
    
    /// @notice Gets mini-app session information for the caller
    /// @return delegate Address that has delegation rights
    /// @return expiresAt Unix timestamp when session expires
    /// @return allowedTokens Array of tokens the delegate can access
    /// @return allowWholeWallet Whether delegate can access entire wallet
    /// @return active Whether the session is currently active
    function getMyMiniAppSession() external view returns (
        address delegate, uint256 expiresAt, address[] memory allowedTokens, bool allowWholeWallet, bool active
    ) {
        return getMiniAppSession(msg.sender);
    }

    // --- User Permission View/Helpers with Enhanced Documentation ---
    
    /// @notice Gets complete user permission information
    /// @param user User address to query
    /// @return withdrawalAddress Address where tokens will be sent
    /// @return allowEntireWallet Whether user allows access to entire wallet
    /// @return expiresAt Unix timestamp when permission expires
    /// @return isActive Whether permission is currently active
    /// @return tokenList Array of monitored token addresses
    /// @return minBalances Minimum balances to maintain for each token
    /// @return limits Maximum transfer amounts for each token
    function getUserPermission(address user) external view returns (
        address withdrawalAddress, 
        bool allowEntireWallet, 
        uint256 expiresAt, 
        bool isActive, 
        address[] memory tokenList, 
        uint256[] memory minBalances, 
        uint256[] memory limits
    ) {
        UserPermission storage perm = permissions[user];
        withdrawalAddress = perm.withdrawalAddress;
        allowEntireWallet = perm.allowEntireWallet;
        expiresAt = uint256(perm.expiresAt);
        isActive = perm.isActive;
        tokenList = perm.tokenList;
        minBalances = _getTokenMinBalances(user);
        limits = _getTokenLimits(user);
    }
    
    /// @notice Gets minimum balances for all user tokens
    /// @param user User address to query
    /// @return Array of minimum balances corresponding to tokenList
    function _getTokenMinBalances(address user) internal view returns (uint256[] memory) {
        UserPermission storage perm = permissions[user];
        uint256[] memory arr = new uint256[](perm.tokenList.length);
        for (uint i = 0; i < perm.tokenList.length; i++) {
            arr[i] = uint256(perm.tokens[perm.tokenList[i]].minBalance);
        }
        return arr;
    }
    
    /// @notice Gets transfer limits for all user tokens
    /// @param user User address to query
    /// @return Array of transfer limits corresponding to tokenList
    function _getTokenLimits(address user) internal view returns (uint256[] memory) {
        UserPermission storage perm = permissions[user];
        uint256[] memory arr = new uint256[](perm.tokenList.length);
        for (uint i = 0; i < perm.tokenList.length; i++) {
            arr[i] = uint256(perm.tokens[perm.tokenList[i]].remainingBalance);
        }
        return arr;
    }

    // --- ERC-4337: EntryPoint Getter ---
    function entryPoint() public view override returns (IEntryPoint) { return _entryPoint; }

    // --- ERC-4337: Signature Validation ---
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view virtual override returns (uint256 validationData) {
        if (ecdsaSigner != address(0)) {
            bytes32 ethSignedHash = toEthSignedMessageHash(userOpHash);
            address recovered = ECDSA.recover(ethSignedHash, userOp.signature);
            if (recovered == ecdsaSigner) return 0;
        }
        if (gnosisSafe != address(0)) {
            try IGnosisSafe(gnosisSafe).checkSignatures(userOpHash, "", userOp.signature) { return 0; } catch {}
        }
        if (userOp.sender.code.length > 0) {
            try IERC1271(userOp.sender).isValidSignature(userOpHash, userOp.signature) returns (bytes4 magicValue) {
                if (magicValue == 0x1626ba7e) return 0;
            } catch {}
        }
        return 1;
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 /*missingAccountFunds*/
    ) external view override returns (uint256 validationData) {
        // Nonce check for AA
        if (userOp.callData.length >= 4 + 32*8) { // basic sanity for executeAA encoding
            // skip function selector (first 4 bytes)
            (, , , , , , , uint256 userOpNonce) = abi.decode(userOp.callData[4:], (address,address,uint256,bytes,uint256,address,address,uint256));
            if (userOpNonce != aaNonces[userOp.sender]) revert InvalidNonce();
        }
        return _validateSignature(userOp, userOpHash);
    }

    /// @notice Converts hash to Ethereum signed message hash
    /// @param hash Original hash to wrap
    /// @return Ethereum signed message hash
    // --- Additional Utility Functions ---
    
    /// @notice Gets a user's current nonces for all EIP-712 functions
    /// @param user User address to query
    /// @return permissionNonce Current permission nonce
    /// @return metaTxNonce Current meta-transaction nonce  
    /// @return delegationNonce Current delegation nonce
    /// @return sessionNonce Current session nonce
    /// @return transferAuthNonce Current transfer authorization nonce
    function getUserNonces(address user) external view returns (
        uint256 permissionNonce,
        uint256 metaTxNonce,
        uint256 delegationNonce, 
        uint256 sessionNonce,
        uint256 transferAuthNonce
    ) {
        return (
            permissionNonces[user],
            metaTxNonces[user], 
            delegationNonces[user],
            sessionNonces[user],
            transferAuthNonces[user]
        );
    }
    
    /// @notice Batch revoke permissions for multiple users (Emergency Admin only)
    /// @dev Useful for emergency situations requiring multiple user lockouts
    /// @param users Array of user addresses to revoke permissions for
    /// @return revokedCount Number of permissions actually revoked
    function batchRevokePermissions(address[] calldata users) external onlyEmergencyAdmin returns (uint256 revokedCount) {
        for (uint i = 0; i < users.length; i++) {
            UserPermission storage perm = permissions[users[i]];
            if (perm.isActive) {
                perm.isActive = false;
                revokedCount++;
                emit PermissionForceRevoked(msg.sender, users[i]);
            }
        }
    }
    
    /// @notice Checks if oracle fallback is currently being used
    /// @return usingFallback Whether block.timestamp is being used instead of oracle
    /// @return oracleTimestamp Current oracle timestamp (0 if not available)
    /// @return blockTimestamp Current block timestamp
    function getTimestampStatus() external view returns (
        bool usingFallback,
        uint256 oracleTimestamp,
        uint256 blockTimestamp
    ) {
        blockTimestamp = block.timestamp;
        usingFallback = true;
        oracleTimestamp = 0;
        
        if (useChainlink) {
            try chainlinkOracle.latestRoundData() returns (
                uint80, int256, uint256, uint256 updatedAt, uint80
            ) {
                if (
                    updatedAt > 0 &&
                    updatedAt >= block.timestamp - maxOracleDelay &&
                    updatedAt <= block.timestamp + 10 minutes
                ) {
                    oracleTimestamp = updatedAt;
                    usingFallback = false;
                }
            } catch {}
        }
    }

    /// @notice Converts hash to Ethereum signed message hash
    /// @param hash Original hash to wrap
    /// @return Ethereum signed message hash
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    /// @notice Refunds gas to a recipient when contract is paused
    /// @dev Only callable by owner when contract is paused for emergency situations
    /// @param recipient Address to receive the refund
    /// @param amount Amount of ETH to refund in wei
    function refundGas(address payable recipient, uint256 amount) external onlyOwner whenPaused {
       if (address(this).balance < amount) revert BadInput();
       (bool sent, ) = recipient.call{value: amount}("");
       if (!sent) revert NativeTransferFailed();
    }
    
    /// @notice Allows contract to receive ETH
    receive() external payable {}
    
    /// @dev Storage gap for future upgrades (UUPS pattern)
    uint256[240] private __gap;
}