export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface LogEvent {
  level: LogLevel;
  message: string;
  fields?: LogFields;
  timestamp: string;
}

function serialize(event: LogEvent): string {
  return JSON.stringify({
    level: event.level,
    message: event.message,
    timestamp: event.timestamp,
    ...event.fields,
  });
}

export function createLogEvent(
  level: LogLevel,
  message: string,
  fields?: LogFields,
  timestamp = new Date().toISOString(),
): LogEvent {
  return { level, message, fields, timestamp };
}

export function formatLogEvent(event: LogEvent): string {
  return serialize(event);
}

export const logger = {
  debug(message: string, fields?: LogFields): void {
    console.debug(serialize(createLogEvent("debug", message, fields)));
  },
  info(message: string, fields?: LogFields): void {
    console.info(serialize(createLogEvent("info", message, fields)));
  },
  warn(message: string, fields?: LogFields): void {
    console.warn(serialize(createLogEvent("warn", message, fields)));
  },
  error(message: string, fields?: LogFields): void {
    console.error(serialize(createLogEvent("error", message, fields)));
  },
};
