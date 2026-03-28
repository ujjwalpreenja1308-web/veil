// Structured logger — every error is logged with context, never swallowed silently.
// In production this outputs JSON lines. In development it outputs readable text.

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

function log(level: LogLevel, msg: string, ctx: Record<string, unknown> = {}) {
  const entry: LogEntry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...ctx,
  };

  const line = process.env.NODE_ENV === "production"
    ? JSON.stringify(entry)
    : `[${entry.ts}] ${level.toUpperCase().padEnd(5)} ${msg}${Object.keys(ctx).length ? " " + JSON.stringify(ctx) : ""}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => log("info",  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log("warn",  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),

  /** Log an Error object with stack trace and optional context. */
  exception(msg: string, err: unknown, ctx: Record<string, unknown> = {}) {
    const errCtx: Record<string, unknown> = { ...ctx };
    if (err instanceof Error) {
      errCtx.error = err.message;
      errCtx.stack = err.stack;
      errCtx.name = err.name;
    } else {
      errCtx.error = String(err);
    }
    log("error", msg, errCtx);
  },
};
