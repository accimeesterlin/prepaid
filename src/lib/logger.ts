type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

/**
 * Structured logger with PII redaction
 */
class Logger {
  private redactPII(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const piiFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn', 'passwordHash'];
    const redacted = { ...context };

    for (const field of piiFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const redactedContext = this.redactPII(context);

    const logEntry = {
      timestamp,
      level,
      message,
      ...redactedContext,
    };

    const logString = JSON.stringify(logEntry);

    switch (level) {
      case 'debug':
        console.debug(logString);
        break;
      case 'info':
        console.log(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'error':
        console.error(logString);
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
