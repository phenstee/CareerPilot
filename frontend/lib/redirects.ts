export const DEFAULT_AUTH_REDIRECT = "/dashboard";

const appOrigin = "https://careerpilot.local";

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT
): string {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, appOrigin);
    if (parsed.origin !== appOrigin) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
