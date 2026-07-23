import { NextResponse, type NextRequest } from "next/server";

import { isProtectedPath } from "@/lib/protected-routes";

const sessionCookieName = "careerpilot_session";

export function proxy(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(sessionCookieName));

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
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
    "/tasks/:path*",
    "/agent/:path*",
    "/settings/:path*"
  ]
};
