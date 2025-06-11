import { ethers } from 'ethers';
import { wallyv1Address } from '../config';
import WallyV1 from '../artifacts/WallyV1.json';
import { sessionService } from './sessionService';
import { TransferPerformedEvent, PermissionGrantedEvent, PermissionRevokedEvent, MiniAppSessionGrantedEvent, MiniAppSessionRevokedEvent } from '../db/models';
import redisClient from '../db/redisClient';
import { logInfo, logError } from '../infra/monitoring/logger';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(wallyv1Address, WallyV1.abi, provider);

export function startEventListeners() {
    // TransferPerformed
    contract.on('TransferPerformed', async (user, token, amount, destination, userRemaining, oracleTimestamp, blockTimestamp, event) => {
        logInfo(`[Event] TransferPerformed: user=${user}, token=${token}, amount=${amount}, destination=${destination}`);
        await TransferPerformedEvent.create({
            user,
            token,
            amount: amount.toString(),
            destination,
            userRemaining: userRemaining.toString(),
            oracleTimestamp: oracleTimestamp.toString(),
            blockTimestamp: blockTimestamp.toString(),
            transactionHash: event.transactionHash,
        });
        // Optionally: push to Redis for real-time feeds
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'TransferPerformed',
            user, token, amount, destination, userRemaining, oracleTimestamp, blockTimestamp, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
    });

    // TokenStarted
    contract.on('TokenStarted', async (user, token, event) => {
        logInfo(`[Event] TokenStarted: user=${user}, token=${token}`);
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'TokenStarted',
            user, token, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
    });
    // TokenStopped
    contract.on('TokenStopped', async (user, token, event) => {
        logInfo(`[Event] TokenStopped: user=${user}, token=${token}`);
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'TokenStopped',
            user, token, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
    });

    // PermissionUpdated
    contract.on('PermissionUpdated', async (user, withdrawalAddress, allowEntireWallet, expiresAt, tokenList, minBalances, limits, action, event) => {
        logInfo(`[Event] PermissionUpdated: user=${user}, action=${action}`);
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'PermissionUpdated',
            user, withdrawalAddress, allowEntireWallet, expiresAt, tokenList, minBalances, limits, action, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
    });

    // PermissionGranted
    contract.on('PermissionGranted', async (user, withdrawalAddress, allowEntireWallet, expiresAt, tokenList, minBalances, limits, event) => {
        logInfo(`[Event] PermissionGranted: user=${user}, withdrawalAddress=${withdrawalAddress}, allowEntireWallet=${allowEntireWallet}`);
        await PermissionGrantedEvent.create({
            user,
            withdrawalAddress,
            allowEntireWallet,
            expiresAt: new Date(Number(expiresAt) * 1000),
            tokenList,
            minBalances,
            limits,
            transactionHash: event.transactionHash,
        });
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'PermissionGranted',
            user, withdrawalAddress, allowEntireWallet, expiresAt, tokenList, minBalances, limits, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
        await redisClient.lPush(`notifications:${user}`, JSON.stringify({
            title: 'Permission granted',
            message: 'Your permission has been granted.',
            timestamp: Date.now()
        }));
    });

    // PermissionRevoked
    contract.on('PermissionRevoked', async (user, event) => {
        logInfo(`[Event] PermissionRevoked: user=${user}`);
        await PermissionRevokedEvent.create({
            user,
            transactionHash: event.transactionHash,
        });
        await sessionService.revokeSession(user, 'rbac');
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'PermissionRevoked',
            user, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
        await redisClient.lPush(`notifications:${user}`, JSON.stringify({
            title: 'Permission revoked',
            message: 'Your permission has been revoked.',
            timestamp: Date.now()
        }));
    });

    // MiniAppSessionGranted
    contract.on('MiniAppSessionGranted', async (user, delegate, tokens, allowEntireWallet, expiresAt, event) => {
        logInfo(`[Event] MiniAppSessionGranted: user=${user}, delegate=${delegate}, allowEntireWallet=${allowEntireWallet}, tokens=${tokens}, expiresAt=${expiresAt}`);
        await MiniAppSessionGrantedEvent.create({
            user,
            delegate,
            tokens,
            allowEntireWallet,
            expiresAt: new Date(Number(expiresAt) * 1000),
            transactionHash: event.transactionHash,
        });
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'MiniAppSessionGranted',
            user, delegate, tokens, allowEntireWallet, expiresAt, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
    });

    // MiniAppSessionRevoked
    contract.on('MiniAppSessionRevoked', async (user, delegate, event) => {
        logInfo(`[Event] MiniAppSessionRevoked: user=${user}, delegate=${delegate}`);
        await MiniAppSessionRevokedEvent.create({
            user,
            delegate,
            transactionHash: event.transactionHash,
        });
        await sessionService.revokeSession(user, 'rbac');
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'MiniAppSessionRevoked',
            user, delegate, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
    });

    // PermissionForceRevoked
    contract.on('PermissionForceRevoked', async (admin, user, event) => {
        logInfo(`[Event] PermissionForceRevoked: admin=${admin}, user=${user}`);
        await sessionService.revokeSession(user, 'rbac');
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'PermissionForceRevoked',
            admin, user, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
    });

    // SessionExpired (custom event, if present)
    contract.on('SessionExpired', async (user, event) => {
        logInfo(`[Event] SessionExpired: user=${user}`);
        await sessionService.revokeSession(user, 'expired');
        await redisClient.lPush(`userEvents:${user}`, JSON.stringify({
            event: 'SessionExpired',
            user, transactionHash: event.transactionHash, createdAt: Date.now()
        }));
    });

    contract.on('error', (err) => {
        logError(`[Contract Event Listener Error]: ${err}`);
    });

    logInfo('Event listeners started for WallyV1 contract.');
}