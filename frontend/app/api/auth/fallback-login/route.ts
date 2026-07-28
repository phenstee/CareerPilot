import { type NextRequest } from "next/server";

import { getApiBaseUrl } from "@/lib/api";
import { getRequestOrigin } from "@/lib/app-origin";
import { sanitizeRedirectPath } from "@/lib/redirects";

function redirectTo(request: NextRequest, path: string): Response {
  const location = new URL(path, getRequestOrigin(request));

  return new Response(null, {
    status: 303,
    headers: {
      Location: location.toString()
    }
  });
}

function redirectToLogin(
  request: NextRequest,
  error: string,
  nextPath: string
): Response {
  const loginUrl = new URL("/login", request.nextUrl);
  loginUrl.searchParams.set("error", error);

  if (nextPath !== "/dashboard") {
    loginUrl.searchParams.set("next", nextPath);
  }

  return redirectTo(request, `${loginUrl.pathname}${loginUrl.search}`);
}

export async function POST(request: NextRequest): Promise<Response> {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const rawNextPath = formData.get("next");
  const nextPath = sanitizeRedirectPath(
    typeof rawNextPath === "string" ? rawNextPath : null
  );

  if (typeof email !== "string" || typeof password !== "string") {
    return redirectToLogin(request, "missing", nextPath);
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  }).catch(() => null);

  if (!response) {
    return redirectToLogin(request, "unavailable", nextPath);
  }

  if (!response.ok) {
    if (response.status === 429) {
      return redirectToLogin(request, "rate-limit", nextPath);
    }
    return redirectToLogin(request, "invalid", nextPath);
  }

  const redirectResponse = redirectTo(request, nextPath);
  const setCookie = response.headers.get("set-cookie");

  if (setCookie) {
    redirectResponse.headers.set("set-cookie", setCookie);
  }

  return redirectResponse;
}
