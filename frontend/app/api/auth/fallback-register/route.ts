import { type NextRequest } from "next/server";

import { getApiBaseUrl } from "@/lib/api";
import { getRequestOrigin } from "@/lib/app-origin";

function redirectTo(request: NextRequest, path: string): Response {
  const location = new URL(path, getRequestOrigin(request));

  return new Response(null, {
    status: 303,
    headers: {
      Location: location.toString()
    }
  });
}

function redirectToRegister(request: NextRequest, error: string): Response {
  const registerUrl = new URL("/register", request.nextUrl);
  registerUrl.searchParams.set("error", error);
  return redirectTo(request, `${registerUrl.pathname}${registerUrl.search}`);
}

export async function POST(request: NextRequest): Promise<Response> {
  const formData = await request.formData();
  const fullName = formData.get("full_name");
  const email = formData.get("email");
  const password = formData.get("password");
  const betaAccessCode = formData.get("beta_access_code");

  if (
    typeof fullName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return redirectToRegister(request, "missing");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
      beta_access_code:
        typeof betaAccessCode === "string" ? betaAccessCode : undefined
    })
  }).catch(() => null);

  if (!response) {
    return redirectToRegister(request, "unavailable");
  }

  if (!response.ok) {
    if (response.status === 403) {
      return redirectToRegister(request, "beta");
    }
    if (response.status === 429) {
      return redirectToRegister(request, "rate-limit");
    }
    return redirectToRegister(
      request,
      response.status === 409 ? "duplicate" : "missing"
    );
  }

  const redirectResponse = redirectTo(request, "/dashboard");
  const setCookie = response.headers.get("set-cookie");

  if (setCookie) {
    redirectResponse.headers.set("set-cookie", setCookie);
  }

  return redirectResponse;
}
