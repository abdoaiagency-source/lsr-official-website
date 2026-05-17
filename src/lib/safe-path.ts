const CONTROL_OR_BACKSLASH = /[\u0000-\u001F\u007F\\]/;

export function safeInternalPath(value: unknown, fallback = "/operations") {
  if (typeof value !== "string") return fallback;
  if (CONTROL_OR_BACKSLASH.test(value)) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const origin = "https://lsr.local";
    const parsed = new URL(value, origin);
    if (parsed.origin !== origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
