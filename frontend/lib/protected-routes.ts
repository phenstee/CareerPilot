export const protectedPrefixes = [
  "/dashboard",
  "/profile",
  "/resume",
  "/jobs",
  "/applications",
  "/agents",
  "/agent",
  "/settings"
];

export function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
