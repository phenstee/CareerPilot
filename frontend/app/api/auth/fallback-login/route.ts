import { type NextRequest } from "next/server";

import { getApiBaseUrl } from "@/lib/api";

const localFrontendOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

function getRequestOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  if (origin && localFrontendOrigins.has(origin)) {
    return origin;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    const refererUrl = new URL(referer);
    if (localFrontendOrigins.has(refererUrl.origin)) {
      return refererUrl.origin;
    }
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function safeNextPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }

  return trimmed;
}

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
  const nextPath = safeNextPath(formData.get("next"));

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
    return redirectToLogin(request, "invalid", nextPath);
  }

  const redirectResponse = redirectTo(request, nextPath);
  const setCookie = response.headers.get("set-cookie");

  if (setCookie) {
    redirectResponse.headers.set("set-cookie", setCookie);
  }

  return redirectResponse;
}
