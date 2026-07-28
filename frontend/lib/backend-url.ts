const dockerOnlyBackendHosts = new Set(["backend"]);

function isDockerInternalUrl(value: string): boolean {
  try {
    return dockerOnlyBackendHosts.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function getConfiguredBackendUrl(): string {
  const internalUrl = process.env.BACKEND_INTERNAL_URL;
  const isDockerRuntime = process.env.CAREERPILOT_DOCKER === "true";

  if (internalUrl && (isDockerRuntime || !isDockerInternalUrl(internalUrl))) {
    return internalUrl;
  }

  return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
}
