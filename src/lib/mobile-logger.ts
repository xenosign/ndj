"use client";

const WATCHED_PREFIXES = ["[FCM]", "[NI]", "[NotificationToast]"];

function toSerializable(val: unknown): unknown {
  if (val instanceof Error) {
    return { name: val.name, message: val.message, stack: val.stack };
  }
  return val;
}

function sendLog(level: "log" | "warn" | "error", args: unknown[]) {
  const first = args[0];
  const message = String(first ?? "");
  const prefix = WATCHED_PREFIXES.find((p) => message.startsWith(p)) ?? null;
  if (!prefix) return;

  const extra = args.slice(1).map(toSerializable);

  fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      level,
      prefix,
      message,
      data: extra.length > 0 ? extra : null,
      userAgent: navigator.userAgent,
    }),
  }).catch(() => {});
}

let initialized = false;

export function initMobileLogger() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const origLog = console.log.bind(console);
  const origWarn = console.warn.bind(console);
  const origError = console.error.bind(console);

  console.log = (...args: unknown[]) => {
    origLog(...args);
    sendLog("log", args);
  };
  console.warn = (...args: unknown[]) => {
    origWarn(...args);
    sendLog("warn", args);
  };
  console.error = (...args: unknown[]) => {
    origError(...args);
    sendLog("error", args);
  };
}
