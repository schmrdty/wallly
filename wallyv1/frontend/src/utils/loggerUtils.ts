export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function isPlainObject(val: any): val is Record<string, any> {
  return !!val && typeof val === 'object' && !Array.isArray(val);
}

export function redact(obj: any, keys: string[]): any {
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

export function shouldLog(level: LogLevel, currentLevel: LogLevel) {
  const order = ['debug', 'info', 'warn', 'error'];
  return order.indexOf(level) >= order.indexOf(currentLevel);
}
