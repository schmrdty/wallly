import express from 'express';
import { Request, Response } from 'express';
import logger from '../infra/mon/logger.js';
import { jwtAuth } from '../middleware/jwtAuth.js';

const router = express.Router();

// User settings interface
interface UserSettings {
    fid: string;
    notifications?: {
        email?: boolean;
        push?: boolean;
        telegram?: boolean;
        farcaster?: boolean;
    };
    preferences?: {
        currency?: string;
        timezone?: string;
        language?: string;
        autoSave?: boolean;
        emergencyFund?: boolean;
    };
    security?: {
        twoFactor?: boolean;
        sessionTimeout?: number;
    };
}

// In-memory storage for demo (in production, use database)
const userSettingsStore = new Map<string, UserSettings>();

// Get user settings by FID
router.get('/settings/:fid', async (req: Request, res: Response): Promise<void> => {
    try {
        const { fid } = req.params;

        if (!fid) {
            res.status(400).json({ error: 'FID is required' });
            return;
        }

        // Get settings from store or return defaults
        const settings = userSettingsStore.get(fid) || {
            fid,
            notifications: {
                email: true,
                push: true,
                telegram: false,
                farcaster: true,
            },
            preferences: {
                currency: 'USD',
                timezone: 'UTC',
                language: 'en',
                autoSave: true,
                emergencyFund: true,
            },
            security: {
                twoFactor: false,
                sessionTimeout: 3600000, // 1 hour
            },
        };

        logger.info('User settings retrieved', { fid, hasSettings: !!userSettingsStore.get(fid) });
        res.status(200).json(settings);
    } catch (error: any) {
        logger.error('Error retrieving user settings', { fid: req.params.fid, error: error.message });
        res.status(500).json({ error: 'Failed to retrieve user settings' });
    }
});

// Update user settings
router.post('/settings', async (req: Request, res: Response): Promise<void> => {
    try {
        const { fid, ...settingsData } = req.body;

        if (!fid) {
            res.status(400).json({ error: 'FID is required' });
            return;
        }

        // Get existing settings or create new
        const existingSettings = userSettingsStore.get(fid) || {
            fid,
            notifications: {},
            preferences: {},
            security: {},
        };

        // Merge settings
        const updatedSettings: UserSettings = {
            ...existingSettings,
            ...settingsData,
            fid, // Ensure FID is preserved
            notifications: {
                ...existingSettings.notifications,
                ...settingsData.notifications,
            },
            preferences: {
                ...existingSettings.preferences,
                ...settingsData.preferences,
            },
            security: {
                ...existingSettings.security,
                ...settingsData.security,
            },
        };

        // Store updated settings
        userSettingsStore.set(fid, updatedSettings);

        logger.info('User settings updated', { fid, updatedFields: Object.keys(settingsData) });
        res.status(200).json(updatedSettings);
    } catch (error: any) {
        logger.error('Error updating user settings', { error: error.message });
        res.status(500).json({ error: 'Failed to update user settings' });
    }
});

// Update specific setting
router.put('/settings/:fid', async (req: Request, res: Response): Promise<void> => {
    try {
        const { fid } = req.params;
        const settingsData = req.body;

        if (!fid) {
            res.status(400).json({ error: 'FID is required' });
            return;
        }

        // Get existing settings
        const existingSettings = userSettingsStore.get(fid);
        if (!existingSettings) {
            res.status(404).json({ error: 'User settings not found' });
            return;
        }

        // Update settings
        const updatedSettings: UserSettings = {
            ...existingSettings,
            ...settingsData,
            fid, // Ensure FID is preserved
        };

        userSettingsStore.set(fid, updatedSettings);

        logger.info('User settings updated via PUT', { fid, updatedFields: Object.keys(settingsData) });
        res.status(200).json(updatedSettings);
    } catch (error: any) {
        logger.error('Error updating user settings via PUT', { fid: req.params.fid, error: error.message });
        res.status(500).json({ error: 'Failed to update user settings' });
    }
});

// Delete user settings
router.delete('/settings/:fid', async (req: Request, res: Response): Promise<void> => {
    try {
        const { fid } = req.params;

        if (!fid) {
            res.status(400).json({ error: 'FID is required' });
            return;
        }

        const deleted = userSettingsStore.delete(fid);

        if (!deleted) {
            res.status(404).json({ error: 'User settings not found' });
            return;
        }

        logger.info('User settings deleted', { fid });
        res.status(200).json({ message: 'User settings deleted successfully' });
    } catch (error: any) {
        logger.error('Error deleting user settings', { fid: req.params.fid, error: error.message });
        res.status(500).json({ error: 'Failed to delete user settings' });
    }
});

export default router;
