import { cookies } from "next/headers";

import { ApiUser, getApiBaseUrl } from "@/lib/api";

const sessionCookieName = "careerpilot_session";

export async function getCurrentUser(): Promise<ApiUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(sessionCookieName);

  if (!session) {
    return null;
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
    headers: {
      Cookie: `${sessionCookieName}=${session.value}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<ApiUser>;
}
