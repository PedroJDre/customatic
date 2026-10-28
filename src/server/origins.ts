const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

/** "https://www.acme.com/path" → "www.acme.com". Accepts bare hosts and "*.acme.com" patterns too. */
export function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.startsWith("*.")) {
    const rest = normalizeOrigin(trimmed.slice(2));
    return rest ? `*.${rest}` : null;
  }
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return url.hostname || null;
  } catch {
    return null;
  }
}

/**
 * Can a widget on `origin` send feedback to an app with these allowed domains?
 * - No domains configured: any site can (fine while you set things up).
 * - localhost always works, so you can test before going live.
 * - "acme.com" also matches "www.acme.com"; "*.acme.com" matches any subdomain.
 */
export function originAllowed(origin: string | null, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  if (!origin) return false;
  const host = normalizeOrigin(origin);
  if (!host) return false;
  if (LOCAL_HOSTS.has(host) || host.endsWith(".localhost")) return true;
  return allowed.some((entry) => {
    const pattern = normalizeOrigin(entry);
    if (!pattern) return false;
    if (pattern.startsWith("*.")) return host.endsWith(pattern.slice(1));
    return host === pattern || host === `www.${pattern}`;
  });
}
