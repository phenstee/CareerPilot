"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, Settings, X } from "lucide-react";

import type { ApiUser } from "@/lib/api";
import { logout } from "@/lib/api";
import { Wordmark } from "@/components/ui/wordmark";

type NavItem = {
  label: string;
  href: string;
  /** Other path prefixes that make this item active. */
  matches?: string[];
};

const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Applications", href: "/applications" },
  { label: "Jobs", href: "/jobs" },
  { label: "Prepare", href: "/agents" },
  { label: "Profile", href: "/profile", matches: ["/resume"] }
];

/** Tabs shown under the top bar for grouped sections. Routes are unchanged. */
const sectionTabs: { prefixes: string[]; tabs: NavItem[] }[] = [
  {
    prefixes: ["/agents"],
    tabs: [
      { label: "Overview", href: "/agents" },
      { label: "Find jobs", href: "/agents/job-finder" },
      { label: "Draft application", href: "/agents/job-application" },
      { label: "Interview prep", href: "/agents/job-prep" }
    ]
  },
  {
    prefixes: ["/profile", "/resume"],
    tabs: [
      { label: "Profile", href: "/profile" },
      { label: "Resume", href: "/resume" }
    ]
  }
];

function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActive(pathname: string, item: NavItem) {
  return [item.href, ...(item.matches ?? [])].some((href) =>
    matchesPath(pathname, href)
  );
}

export function AppShell({
  user,
  children
}: {
  user: ApiUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  const section = sectionTabs.find((group) =>
    group.prefixes.some((prefix) => matchesPath(pathname, prefix))
  );

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-surface px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex h-bar max-w-app items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Wordmark href="/dashboard" />
          <nav aria-label="Main" className="hidden md:block">
            <ul className="segmented">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item) ? "page" : undefined}
                    className="segmented-item text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto hidden md:block">
            <AccountMenu
              user={user}
              isLoggingOut={isLoggingOut}
              onLogout={handleLogout}
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="button button-ghost ml-auto h-10 w-10 px-0 md:hidden"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <MobileNav
          pathname={pathname}
          user={user}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
          onClose={() => setMobileOpen(false)}
        />
      ) : null}

      <main id="main">
        {section ? (
          <div className="mx-auto max-w-app px-4 pt-6 sm:px-6 lg:px-8">
            <nav aria-label="Section" className="-mx-1 overflow-x-auto px-1">
              <ul className="segmented">
                {section.tabs.map((tab) => (
                  <li key={tab.href}>
                    <Link
                      href={tab.href}
                      aria-current={pathname === tab.href ? "page" : undefined}
                      className="segmented-item"
                    >
                      {tab.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

function Avatar({ user }: { user: ApiUser | null }) {
  const initial = user?.full_name?.trim().charAt(0).toUpperCase() || "C";
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent font-serif text-sm italic text-white"
    >
      {initial}
    </span>
  );
}

function AccountMenu({
  user,
  isLoggingOut,
  onLogout
}: {
  user: ApiUser | null;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-full py-1 pl-3 pr-1 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
      >
        <span className="max-w-40 truncate">
          {user?.full_name || "Account"}
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
        <Avatar user={user} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-64 animate-rise rounded-2xl border border-line bg-surface p-1.5 shadow-overlay"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">
              {user?.full_name || "CareerPilot user"}
            </p>
            <p className="truncate text-meta text-muted">
              {user?.email || "Signed in"}
            </p>
          </div>
          <div className="my-1 border-t border-line" />
          <Link
            role="menuitem"
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-sunken hover:text-ink"
          >
            <Settings aria-hidden="true" className="h-4 w-4" />
            Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-2 hover:bg-sunken hover:text-ink disabled:opacity-60"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MobileNav({
  pathname,
  user,
  isLoggingOut,
  onLogout,
  onClose
}: {
  pathname: string;
  user: ApiUser | null;
  isLoggingOut: boolean;
  onLogout: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])"
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const links: NavItem[] = [
    primaryNav[0],
    primaryNav[1],
    primaryNav[2],
    primaryNav[3],
    { label: "Find jobs", href: "/agents/job-finder" },
    { label: "Draft application", href: "/agents/job-application" },
    { label: "Interview prep", href: "/agents/job-prep" },
    primaryNav[4],
    { label: "Resume", href: "/resume" },
    { label: "Settings", href: "/settings" }
  ];
  const subLinks = new Set([
    "/agents/job-finder",
    "/agents/job-application",
    "/agents/job-prep",
    "/resume"
  ]);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 right-0 flex w-full max-w-xs animate-rise flex-col bg-canvas shadow-overlay"
      >
        <div className="flex h-bar items-center justify-between border-b border-line px-4">
          <Wordmark href="/dashboard" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="button button-ghost h-10 w-10 px-0"
            aria-label="Close navigation"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {links.map((item) => {
              const active = subLinks.has(item.href)
                ? pathname === item.href
                : isActive(pathname, item) &&
                  !(item.href === "/agents" && pathname !== "/agents") &&
                  !(item.href === "/profile" && pathname === "/resume");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center rounded-full py-2.5 pr-4 text-body font-medium ${
                      subLinks.has(item.href) ? "pl-8" : "pl-4"
                    } ${
                      active
                        ? "bg-surface text-ink shadow-pill"
                        : "text-ink-2 hover:bg-sunken hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {user?.full_name || "CareerPilot user"}
              </p>
              <p className="truncate text-meta text-muted">
                {user?.email || "Signed in"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="button button-secondary mt-3 w-full"
          >
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
