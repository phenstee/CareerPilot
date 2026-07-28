import { NextResponse, type NextRequest } from "next/server";

import { isProtectedPath } from "@/lib/protected-routes";
import { sanitizeRedirectPath } from "@/lib/redirects";

const sessionCookieName = "careerpilot_session";

export function proxy(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(sessionCookieName));

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      sanitizeRedirectPath(
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      )
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/resume/:path*",
    "/jobs/:path*",
    "/applications/:path*",
    "/agents/:path*",
    "/settings/:path*"
  ]
};
