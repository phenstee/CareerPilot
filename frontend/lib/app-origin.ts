import { type NextRequest } from "next/server";

const localFrontendOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

function configuredAppOrigin(): string | null {
  const value = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function getRequestOrigin(request: NextRequest): string {
  const configured = configuredAppOrigin();
  if (configured) {
    return configured;
  }

  const origin = request.headers.get("origin");
  if (origin && localFrontendOrigins.has(origin)) {
    return origin;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (localFrontendOrigins.has(refererUrl.origin)) {
        return refererUrl.origin;
      }
    } catch {
      return request.nextUrl.origin;
    }
  }

  return request.nextUrl.origin;
}
