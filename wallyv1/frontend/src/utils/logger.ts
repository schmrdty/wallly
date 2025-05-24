type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  level?: LogLevel;
  redactKeys?: string[];
  sendToExternal?: (level: LogLevel, ...args: any[]) => void;
}

const isBrowser = typeof window !== 'undefined';

const defaultOptions: LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redactKeys: ['password', 'privateKey', 'secret', 'token'],
};

/**
 * Utility: Check if a value is a plain object.
 */
function isPlainObject(val: any): val is Record<string, any> {
  return !!val && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Utility: Redact sensitive keys in an object.
 */
function redact(obj: any, keys: string[]): any {
  if (!isPlainObject(obj)) return obj;
  const clone: Record<string, any> = { ...obj };
  for (const key of Object.keys(clone)) {
    if (keys.includes(key)) {
      clone[key] = '[REDACTED]';
    } else if (isPlainObject(clone[key])) {
      clone[key] = redact(clone[key], keys);
    }
  }
  return clone;
}

/**
 * Utility: Should log at this level?
 */
function shouldLog(level: LogLevel, currentLevel: LogLevel) {
  const order = ['debug', 'info', 'warn', 'error'];
  return order.indexOf(level) >= order.indexOf(currentLevel);
}

export class Logger {
  private level: LogLevel;
  private redactKeys: string[];
  private sendToExternal?: (level: LogLevel, ...args: any[]) => void;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || defaultOptions.level!;
    this.redactKeys = options.redactKeys || defaultOptions.redactKeys!;
    this.sendToExternal = options.sendToExternal;
  }

  private log(level: LogLevel, ...args: any[]) {
    if (!shouldLog(level, this.level)) return;

    // Redact sensitive keys in objects
    const safeArgs = args.map(arg =>
      typeof arg === 'object' ? redact(arg, this.redactKeys) : arg
    );

    if (isBrowser) {
      // Use browser console
      // eslint-disable-next-line no-console
      (console as any)[level](`[${level.toUpperCase()}]`, ...safeArgs);
    } else {
      // Use Node.js console
      // eslint-disable-next-line no-console
      (console as any)[level](`[${level.toUpperCase()}]`, ...safeArgs);
    }

    // Optionally send to external service
    if (this.sendToExternal) {
      this.sendToExternal(level, ...safeArgs);
    }
  }

  debug(...args: any[]) { this.log('debug', ...args); }
  info(...args: any[]) { this.log('info', ...args); }
  warn(...args: any[]) { this.log('warn', ...args); }
  error(...args: any[]) { this.log('error', ...args); }

  /**
   * Log a contract event in a structured way.
   * @param eventName The event name (should match contract event).
   * @param eventData The event data object.
   */
  contractEvent(eventName: string, eventData: Record<string, any>) {
    this.info(`[CONTRACT EVENT] ${eventName}`, redact(eventData, this.redactKeys));
  }

  /**
   * Log a contract error with context.
   * @param errorName The error name (should match contract error).
   * @param context Additional context for debugging.
   */
  contractError(errorName: string, context?: Record<string, any>) {
    this.error(`[CONTRACT ERROR] ${errorName}`, context ? redact(context, this.redactKeys) : undefined);
  }

  // Explicit method for logging sensitive data (use with caution)
  sensitive(level: LogLevel, ...args: any[]) {
    if (!shouldLog(level, this.level)) return;
    this.log(level, ...args);
  }
}

// Singleton instance for app-wide use
export const logger = new Logger();

export function logError(msg: string) {
  if (typeof window !== "undefined") {
    // Optionally send to a logging service
    console.error(msg);
  }
}