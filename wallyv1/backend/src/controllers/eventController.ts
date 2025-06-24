import { Request, Response } from 'express';
import logger from '../infra/mon/logger.js';
import { enhancedEventMonitoringService } from '../services/enhancedEventMonitoringService.js';

export const getEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const eventType = req.query.type as string;
        const severity = req.query.severity as string;

        let events: any[] = [];

        if (eventType) {
            events = await enhancedEventMonitoringService.getEventsByType(eventType, limit);
        } else if (severity) {
            events = await enhancedEventMonitoringService.getEventsBySeverity(severity, limit);
        } else {
            // Get recent events
            const since = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
            events = await enhancedEventMonitoringService.getEventsSince(since);
        }

        // Format events for frontend
        const formattedEvents = events.map((event: any) => ({
            id: `${event.transactionHash}_${event.logIndex}`,
            type: event.event,
            message: event.event,
            timestamp: new Date(event.blockTimestamp || event.createdAt),
            source: 'backend' as const,
            user: event.user,
            data: {
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                severity: event.severity,
                category: event.eventType
            }
        }));

        res.status(200).json(formattedEvents);
    } catch (error) {
        logger.error('Error getting events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getEventStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = enhancedEventMonitoringService.getEventStats();
        res.status(200).json(stats);
    } catch (error) {
        logger.error('Error getting event stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
