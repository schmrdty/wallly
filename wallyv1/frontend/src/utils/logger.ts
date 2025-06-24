type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  log: (level: LogLevel, message: string, ...args: any[]) => void;
}

class AppLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  private safeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return arg;
    });
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment && typeof console !== 'undefined') {
      console.debug(this.formatMessage('debug', message), ...this.safeArgs(args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (typeof console !== 'undefined') {
      console.info(this.formatMessage('info', message), ...this.safeArgs(args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (typeof console !== 'undefined') {
      console.warn(this.formatMessage('warn', message), ...this.safeArgs(args));
    }
  }

  error(message: string, ...args: any[]): void {
    if (typeof console !== 'undefined') {
      console.error(this.formatMessage('error', message), ...this.safeArgs(args));
    }
  }

  log(level: LogLevel, message: string, ...args: any[]): void {
    switch (level) {
      case 'debug':
        this.debug(message, ...args);
        break;
      case 'info':
        this.info(message, ...args);
        break;
      case 'warn':
        this.warn(message, ...args);
        break;
      case 'error':
        this.error(message, ...args);
        break;
      default:
        this.info(message, ...args);
    }
  }
}

// Export a singleton instance
export const logger = new AppLogger();

// Export the class for testing
export { AppLogger };

// Export types
export type { Logger, LogLevel };