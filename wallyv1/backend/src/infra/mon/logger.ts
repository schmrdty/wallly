import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Winston logger with multiple transports
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // Console for development/debugging
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        // Error log file (persistent)
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
        }),
        // Combined log file (all levels)
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10,
        }),
        // Daily rotating file for all logs
        new DailyRotateFile({
            filename: 'logs/app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
});

// Redact utility (substring, case-insensitive)
function redact(obj: any, patterns: string[]): any {
    if (!obj || typeof obj !== 'object') return obj;
    const lowerPatterns = patterns.map(p => p.toLowerCase());
    const clone = Array.isArray(obj) ? [...obj] : { ...obj };
    for (const key of Object.keys(clone)) {
        const lowerKey = key.toLowerCase();
        if (lowerPatterns.some(pattern => lowerKey.includes(pattern))) {
            clone[key] = '[REDACTED]';
        } else if (typeof clone[key] === 'object') {
            clone[key] = redact(clone[key], patterns);
        }
    }
    return clone;
}

const REDACT_PATTERNS = [
    'password', 'private', 'secret', 'token', 'project_id', 'key', 'api', 'base_url', 'signature',
    'access_token', 'refresh_token', 'client_secret', 'client_id', 'credentials',
];

// Info log
export const logInfo = (message: string, meta?: any) => {
    logger.info(message, redact(meta, REDACT_PATTERNS));
};

// Error log (with error object support)
export const logError = (message: string, error?: unknown) => {
    if (error instanceof Error) {
        logger.error(message, redact({ message: error.message, stack: error.stack }, REDACT_PATTERNS));
    } else if (error) {
        logger.error(message, redact({ error }, REDACT_PATTERNS));
    } else {
        logger.error(message);
    }
};

// Debug log
export const logDebug = (message: string, meta?: any) => {
    logger.debug(message, redact(meta, REDACT_PATTERNS));
};

// Warn log
export const logWarn = (message: string, meta?: any) => {
    logger.warn(message, redact(meta, REDACT_PATTERNS));
};

export default logger;
