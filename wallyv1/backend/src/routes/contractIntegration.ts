import { Router } from 'express';
import {
    getUserRole,
    grantPermission,
    grantPermissionBySig,
    grantSession,
    activateSessionBySig,
    delegateSessionBySig,
    triggerTransfer,
    triggerMiniAppTransfer,
    transferByAuthorization,
    executeContract,
    executeBatch,
    executeMetaTx,
    batchExecute,
    verifyPermissionSignature,
    verifySessionSignature,
    estimateGas,
    simulateTransaction,
    getEvents,
    forceRevokePermission,
    setWhitelist,
    grantRole,
    revokeRole, getTransactionStatus,
    cancelTransaction
} from '../controllers/contractIntegrationController.js';

const router = Router();

// Test route to verify contract routes are working
router.get('/', (req, res) => {
    res.json({ message: 'Contract integration routes are working!' });
});

// User role routes
router.get('/user/:address/role/:role', getUserRole);

// Permission routes
router.post('/permission/grant', grantPermission);
router.post('/permission/grant-by-sig', grantPermissionBySig);

// Session routes
router.post('/session/grant', grantSession);
router.post('/session/activate-by-sig', activateSessionBySig);
router.post('/session/delegate-by-sig', delegateSessionBySig);

// Transfer routes
router.post('/transfer/trigger', triggerTransfer);
router.post('/transfer/mini-app-trigger', triggerMiniAppTransfer);
router.post('/transfer/by-authorization', transferByAuthorization);

// Execution routes
router.post('/execute', executeContract);
router.post('/execute-batch', executeBatch);
router.post('/execute-meta-tx', executeMetaTx);
router.post('/batch/execute', batchExecute);

// Verification routes
router.post('/verify/permission-signature', verifyPermissionSignature);
router.post('/verify/session-signature', verifySessionSignature);

// Gas and simulation routes
router.post('/estimate-gas', estimateGas);
router.post('/simulate', simulateTransaction);

// Event routes
router.get('/events/:eventName', getEvents);

// Admin routes
router.post('/admin/force-revoke-permission', forceRevokePermission);
router.post('/admin/set-whitelist', setWhitelist);
router.post('/admin/grant-role', grantRole);
router.post('/admin/revoke-role', revokeRole);

// Transaction status routes
router.get('/transaction/:transactionId/status', getTransactionStatus);
router.post('/transaction/:transactionId/cancel', cancelTransaction);

export default router;
