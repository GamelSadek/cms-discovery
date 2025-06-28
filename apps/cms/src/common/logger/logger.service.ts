import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

@Injectable()
export class CustomLoggerService implements NestLoggerService {
  private context = 'CMS-Discovery';

  log(message: string, context?: string): void {
    this.printMessage(LogLevel.INFO, message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.printMessage(LogLevel.ERROR, message, context, trace);
  }

  warn(message: string, context?: string): void {
    this.printMessage(LogLevel.WARN, message, context);
  }

  debug(message: string, context?: string): void {
    this.printMessage(LogLevel.DEBUG, message, context);
  }

  verbose(message: string, context?: string): void {
    this.printMessage(LogLevel.DEBUG, message, context);
  }

  private printMessage(
    level: LogLevel,
    message: string,
    context?: string,
    trace?: string,
  ): void {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context;
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${ctx}] ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        if (trace) {
          console.error(trace);
        }
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
    }
  }

  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
  ): void {
    this.log(`${method} ${url} ${statusCode} - ${responseTime}ms`, 'HTTP');
  }

  logError(error: Error, context?: string): void {
    this.error(error.message, error.stack, context);
  }

  logDatabaseQuery(query: string, duration: number): void {
    this.debug(`Query executed in ${duration}ms: ${query}`, 'Database');
  }
}
