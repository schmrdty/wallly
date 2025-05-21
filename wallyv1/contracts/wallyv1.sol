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

    struct TokenConfig {
        uint256 minBalance;
        uint256 remainingBalance;
        bool enabled;
    }
    struct UserPermission {
        address withdrawalAddress;
        bool allowEntireWallet;
        uint256 expiresAt;
        mapping(address => TokenConfig) tokens;
        address[] tokenList;
        mapping(address => bool) tokenExists;
        mapping(bytes4 => uint256) lastFunctionCall;
        bool isActive;
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

    // --- Nonces for EIP712 ---
    mapping(address => uint256) public permissionNonces;
    mapping(address => uint256) public metaTxNonces;
    mapping(address => uint256) public delegationNonces;
    mapping(address => uint256) public sessionNonces;
    mapping(address => uint256) public transferAuthNonces;
    mapping(address => uint256) public aaNonces; // AA nonces

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

    // --- Offchain Tracking for Relayer ---
    event PermissionGrantedBySig(address indexed user, address withdrawalAddress, bool allowEntireWallet, uint256 expiresAt, uint256 nonce, address[] tokenList, uint256[] minBalances, uint256[] limits);

    // --- Oracle Fallback Config ---
    uint256 public maxOracleDelay;

    // --- Modifiers ---
    modifier onlySettingsAdmin() {
        if (!hasRole(SETTINGS_ADMIN_ROLE, msg.sender)) revert NotSettingsAdmin();
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
        if (getOracleTimestamp() >= permissions[user].expiresAt) revert PermissionExpired();
        _;
    }
    modifier perFunctionRateLimit(address user, bytes4 selector) {
        uint256 last = permissions[user].lastFunctionCall[selector];
        uint256 rate = functionRateLimitOverrides[selector] > 0
            ? functionRateLimitOverrides[selector]
            : globalRateLimit;
        if (getOracleTimestamp() < last + rate) revert RateLimited();
        _;
        permissions[user].lastFunctionCall[selector] = getOracleTimestamp();
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

    // --- Initializer ---
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
        defaultDuration = 1 days;
        minDuration = 1 hours;
        maxDuration = 365 days;
        globalRateLimit = 60;
        maxRelayerFee = 1 ether; // Default: 1 ETH max, settings admin can change
        _entryPoint = IEntryPoint(entryPointAddr);

        _grantRole(DEFAULT_ADMIN_ROLE, _gnosisSafe);
        _grantRole(SETTINGS_ADMIN_ROLE, _gnosisSafe);

        emit OwnerChanged(_ecdsaSigner);
        emit GnosisSafeChanged(_gnosisSafe);
        emit EntryPointChanged(entryPointAddr);
    }

    // --- Chainlink Oracle Usage ---
    function setMaxOracleDelay(uint256 newDelay) external onlySettingsAdmin {
        if (newDelay == 0) revert BadInput();
        maxOracleDelay = newDelay;
    }
    function setMaxRelayerFee(uint256 newFee) external onlySettingsAdmin {
        maxRelayerFee = newFee;
    }

    function getOracleTimestamp() public view returns (uint256) {
        if (useChainlink) {
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
        return block.timestamp;
    }

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
            emit OracleFallbackUsed(block.timestamp, latestOracle);
            return block.timestamp;
        }
        return oracleTs;
    }

    // --- Admin Functions ---
    function setECDSASigner(address newSigner) external onlyOwnerAA { if (newSigner == address(0)) revert ZeroAddress(); ecdsaSigner = newSigner; emit OwnerChanged(newSigner);}
    function setGnosisSafe(address newSafe) external onlyOwnerAA { if (newSafe == address(0)) revert ZeroAddress(); gnosisSafe = newSafe; emit GnosisSafeChanged(newSafe);}
    function setEntryPoint(address newEntryPoint) external onlySettingsAdmin { _entryPoint = IEntryPoint(newEntryPoint); emit EntryPointChanged(newEntryPoint);}
    function setWhitelist(address token, uint256 min) external onlySettingsAdmin whenNotPaused { whitelistToken = token; minWhitelistBalance = min; emit WhitelistChanged(token, min);}
    function setChainlinkOracle(address newOracle) external onlySettingsAdmin { if (newOracle == address(0)) revert ZeroAddress(); chainlinkOracle = AggregatorV3Interface(newOracle); emit ChainlinkOracleChanged(newOracle);}
    function setGlobalRateLimit(uint256 rateSeconds) external onlySettingsAdmin { globalRateLimit = rateSeconds;}
    function setFunctionRateLimit(bytes4 selector, uint256 rateSeconds) external onlySettingsAdmin { functionRateLimitOverrides[selector] = rateSeconds;}
    function setDefaultDurations(uint256 _default, uint256 _min, uint256 _max) external onlySettingsAdmin { if (!(_min <= _default && _default <= _max)) revert BadInput(); defaultDuration = _default; minDuration = _min; maxDuration = _max;}

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

    // --- Permission Self-Service ---
    function grantOrUpdatePermission(
        address withdrawalAddress,
        bool allowEntireWallet,
        uint256 duration,
        address[] calldata tokenList,
        uint256[] calldata minBalances,
        uint256[] calldata limits
    ) external whenNotPaused whitelistEnforced(msg.sender) perFunctionRateLimit(msg.sender, msg.sig) {
        if (withdrawalAddress == address(0)) revert NoWithdrawalAddress();
        if (!(duration >= minDuration && duration <= maxDuration)) revert BadDuration();
        if (!(tokenList.length == minBalances.length && tokenList.length == limits.length)) revert ArrayLengthMismatch();
        UserPermission storage perm = permissions[msg.sender];
        perm.withdrawalAddress = withdrawalAddress;
        perm.allowEntireWallet = allowEntireWallet;
        perm.expiresAt = _getOracleTimestampWithEvent() + duration;
        perm.isActive = true;
        for (uint i = 0; i < perm.tokenList.length; i++) {
            address t = perm.tokenList[i];
            perm.tokens[t].enabled = false;
            perm.tokenExists[t] = false;
            delete perm.tokens[t];
        }
        delete perm.tokenList;
        for (uint i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            if (!perm.tokenExists[token]) {
                perm.tokenList.push(token);
                perm.tokenExists[token] = true;
            }
            perm.tokens[token] = TokenConfig({
                minBalance: minBalances[i],
                remainingBalance: limits[i],
                enabled: true
            });
        }
        emit PermissionGranted(msg.sender, withdrawalAddress, allowEntireWallet, perm.expiresAt, tokenList, minBalances, limits);
    }

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
    ) external whenNotPaused whitelistEnforced(user) {
        if (nonce != permissionNonces[user]) revert InvalidNonce();
        address signer = verifyPermissionSignature(withdrawalAddress, allowEntireWallet, expiresAt, nonce, signature);
        if (signer != user) revert InvalidSignature();
        permissionNonces[user]++;
        UserPermission storage perm = permissions[user];
        perm.withdrawalAddress = withdrawalAddress;
        perm.allowEntireWallet = allowEntireWallet;
        perm.expiresAt = expiresAt;
        perm.isActive = true;
        for (uint i = 0; i < perm.tokenList.length; i++) {
            address t = perm.tokenList[i];
            perm.tokens[t].enabled = false;
            perm.tokenExists[t] = false;
            delete perm.tokens[t];
        }
        delete perm.tokenList;
        for (uint i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            if (!perm.tokenExists[token]) {
                perm.tokenList.push(token);
                perm.tokenExists[token] = true;
            }
            perm.tokens[token] = TokenConfig({
                minBalance: minBalances[i],
                remainingBalance: limits[i],
                enabled: true
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
    ) external whenNotPaused {
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
    function executeAA(
        address from,
        address to,
        uint256 value,
        bytes memory data,
        uint256 fee,
        address feeToken,
        address relayer,
        uint256 nonce
    ) external {
        require(msg.sender == address(_entryPoint), "Only EntryPoint");
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
    function delegateMiniAppSessionBySig(
        address delegator,
        address delegatee,
        uint256 expiresAt,
        uint256 nonce,
        bytes memory signature
    ) external whenNotPaused {
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
    function activateSessionBySig(
        address user,
        address app,
        uint256 expiresAt,
        uint256 nonce,
        bytes memory signature
    ) external whenNotPaused {
        if (nonce != sessionNonces[user]) revert InvalidNonce();
        address signer = verifySessionSignature(user, app, expiresAt, nonce, signature);
        if (signer != user) revert InvalidSignature();
        sessionNonces[user]++;
        MiniAppSession storage session = miniAppSessions[user];
        session.delegate = app;
        session.expiresAt = expiresAt;
        session.active = true;
        // Optionally set allowedTokens and allowWholeWallet from a trusted offchain source.
        emit MiniAppSessionGranted(user, app, session.allowedTokens, session.allowWholeWallet, expiresAt);
    }

    // --- ERC20 Permit-like Authorization ---
    function transferByAuthorization(
        address owner,
        address spender,
        uint256 amount,
        uint256 deadline,
        uint256 nonce,
        bytes memory signature
    ) external whenNotPaused {
        if (block.timestamp > deadline) revert PermissionExpired();
        if (nonce != transferAuthNonces[owner]) revert InvalidNonce();
        address signer = verifyTransferAuthSignature(owner, spender, amount, deadline, nonce, signature);
        if (signer != owner) revert InvalidSignature();
        transferAuthNonces[owner]++;
        IERC20(whitelistToken).safeTransferFrom(owner, spender, amount);
    }

    // --- Mini-App Session Management ---
    function grantMiniAppSession(address delegate, address[] calldata tokens, bool allowWholeWallet, uint256 durationSeconds)
        external whenNotPaused
    {
        if (delegate == address(0)) revert NoDelegate();
        if (!(durationSeconds > 0 && durationSeconds <= 365 days)) revert BadDuration();
        // Validate tokens are in user's permission list
        for (uint i = 0; i < tokens.length; i++) {
            if (!permissions[msg.sender].tokenExists[tokens[i]]) revert InvalidSessionTokens();
        }
        MiniAppSession storage session = miniAppSessions[msg.sender];
        session.delegate = delegate;
        session.expiresAt = block.timestamp + durationSeconds;
        session.allowedTokens = tokens;
        session.allowWholeWallet = allowWholeWallet;
        session.active = true;
        emit MiniAppSessionGranted(msg.sender, delegate, tokens, allowWholeWallet, session.expiresAt);
    }

    function revokeMiniAppSession() external whenNotPaused {
        MiniAppSession storage session = miniAppSessions[msg.sender];
        if (!session.active) revert NoActivePermission();
        emit MiniAppSessionRevoked(msg.sender, session.delegate);
        delete miniAppSessions[msg.sender];
    }

    // --- Mini-App Trigger Transfers ---
    function miniAppTriggerTransfers(address user)
        external whenNotPaused onlyMiniAppWithSession(user) nonReentrant
    {
        MiniAppSession storage session = miniAppSessions[user];
        UserPermission storage perm = permissions[user];
        if (!perm.isActive) revert NoActivePermission();
        if (_getOracleTimestampWithEvent() >= perm.expiresAt) revert PermissionExpired();
        if (perm.withdrawalAddress == address(0)) revert NoWithdrawalAddress();

        address[] memory tokens = session.allowWholeWallet ? perm.tokenList : session.allowedTokens;

        for (uint i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            if (!perm.tokenExists[token]) continue;
            TokenConfig storage cfg = perm.tokens[token];
            if (!cfg.enabled) continue;

            uint256 userBal;
            bool isNative = (token == address(0));
            if (isNative) {
                userBal = user.balance;
            } else {
                userBal = IERC20(token).balanceOf(user);
            }
            if (userBal > cfg.minBalance && cfg.remainingBalance > 0) {
                uint256 toSend = userBal - cfg.minBalance;
                if (toSend > cfg.remainingBalance) toSend = cfg.remainingBalance;
                if (toSend == 0) continue;

                if (isNative) {
                    (bool sent, ) = perm.withdrawalAddress.call{value: toSend}("");
                    if (!sent) revert NativeTransferFailed();
                } else {
                    IERC20(token).safeTransferFrom(user, perm.withdrawalAddress, toSend);
                }
                cfg.remainingBalance -= toSend;

                emit TransferPerformed(user, token, toSend, perm.withdrawalAddress, cfg.remainingBalance, _getOracleTimestampWithEvent(), block.timestamp);
            }
        }
        emit MiniAppSessionAction(user, msg.sender, "miniAppTriggerTransfers", tokens, block.timestamp);
    }

    // --- Relayer/App Function: Regular (User or EntryPoint) ---
    function triggerTransfers(address user)
        external whenNotPaused checkActive(user) perFunctionRateLimit(user, msg.sig) nonReentrant
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
            if (userBal > cfg.minBalance && cfg.remainingBalance > 0) {
                uint256 toSend = userBal - cfg.minBalance;
                if (toSend > cfg.remainingBalance) toSend = cfg.remainingBalance;
                if (toSend == 0) continue;

                if (isNative) {
                    (bool sent, ) = perm.withdrawalAddress.call{value: toSend}("");
                    if (!sent) revert NativeTransferFailed();
                } else {
                    IERC20(token).safeTransferFrom(user, perm.withdrawalAddress, toSend);
                }
                cfg.remainingBalance -= toSend;

                emit TransferPerformed(user, token, toSend, perm.withdrawalAddress, cfg.remainingBalance, _getOracleTimestampWithEvent(), block.timestamp);
            }
        }
    }

    // --- Token/Limit Adjustment ---
    function removeToken(address token) external {
        require(permissions[msg.sender].tokenExists[token], "Token not in list");
        permissions[msg.sender].tokens[token].enabled = false;
        permissions[msg.sender].tokenExists[token] = false;
        // Remove from tokenList array
        address[] storage arr = permissions[msg.sender].tokenList;
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i] == token) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
        emit TokenRemoved(msg.sender, token);
    }
    function updateTokenLimit(address token, uint256 newLimit) external {
        require(permissions[msg.sender].tokenExists[token], "Token not in list");
        permissions[msg.sender].tokens[token].remainingBalance = newLimit;
        emit TokenStopped(msg.sender, token);
    }
    function updateTokenMin(address token, uint256 newMin) external {
        require(permissions[msg.sender].tokenExists[token], "Token not in list");
        permissions[msg.sender].tokens[token].minBalance = newMin;
        emit TokenStopped(msg.sender, token);
    }

    // --- Mini-App Session Views ---
    function getMiniAppSession(address user) public view returns (
        address delegate, uint256 expiresAt, address[] memory allowedTokens, bool allowWholeWallet, bool active
    ) {
        MiniAppSession storage session = miniAppSessions[user];
        return (session.delegate, session.expiresAt, session.allowedTokens, session.allowWholeWallet, session.active);
    }
    function getMyMiniAppSession() external view returns (
        address delegate, uint256 expiresAt, address[] memory allowedTokens, bool allowWholeWallet, bool active
    ) {
        return getMiniAppSession(msg.sender);
    }

    // --- User Permission View/Helpers ---
    function getUserPermission(address user) external view returns (
        address withdrawalAddress, bool allowEntireWallet, uint256 expiresAt, bool isActive, address[] memory tokenList, uint256[] memory minBalances, uint256[] memory limits
    ) {
        UserPermission storage perm = permissions[user];
        withdrawalAddress = perm.withdrawalAddress;
        allowEntireWallet = perm.allowEntireWallet;
        expiresAt = perm.expiresAt;
        isActive = perm.isActive;
        tokenList = perm.tokenList;
        minBalances = _getTokenMinBalances(user);
        limits = _getTokenLimits(user);
    }
    function _getTokenMinBalances(address user) internal view returns (uint256[] memory) {
        UserPermission storage perm = permissions[user];
        uint256[] memory arr = new uint256[](perm.tokenList.length);
        for (uint i = 0; i < perm.tokenList.length; i++) {
            arr[i] = perm.tokens[perm.tokenList[i]].minBalance;
        }
        return arr;
    }
    function _getTokenLimits(address user) internal view returns (uint256[] memory) {
        UserPermission storage perm = permissions[user];
        uint256[] memory arr = new uint256[](perm.tokenList.length);
        for (uint i = 0; i < perm.tokenList.length; i++) {
            arr[i] = perm.tokens[perm.tokenList[i]].remainingBalance;
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

    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function refundGas(address payable recipient, uint256 amount) external onlyOwner whenPaused {
       require(address(this).balance >= amount, "Insufficient balance");
       (bool sent, ) = recipient.call{value: amount}("");
       require(sent, "Refund failed");
    }
    receive() external payable {}
    uint256[240] private __gap;
}