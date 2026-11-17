"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  Bot,
  BriefcaseBusiness,
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  X
} from "lucide-react";

import type { ApiUser } from "@/lib/api";
import { logout } from "@/lib/api";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard
      },
      {
        label: "Jobs",
        href: "/jobs",
        icon: BriefcaseBusiness
      },
      {
        label: "Applications",
        href: "/applications",
        icon: Layers3
      },
      {
        label: "Resume",
        href: "/resume",
        icon: FileText
      }
    ]
  },
  {
    label: "AI",
    items: [
      {
        label: "AI Agents",
        href: "/agents",
        icon: Bot,
        exact: true
      },
      {
        label: "Job Finder",
        href: "/agents/job-finder",
        icon: Search
      },
      {
        label: "Application Agent",
        href: "/agents/job-application",
        icon: FileText
      },
      {
        label: "Job Preparation",
        href: "/agents/job-prep",
        icon: GraduationCap
      }
    ]
  },
  {
    label: "Account",
    items: [
      {
        label: "Profile",
        href: "/profile",
        icon: UserRound
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings
      }
    ]
  }
];

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

  function isActive(item: NavItem) {
    if (
      item.href === "/dashboard" ||
      item.href === "/jobs" ||
      item.href === "/applications" ||
      item.href === "/resume" ||
      item.href === "/profile" ||
      item.href === "/settings"
    ) {
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    }
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(`${item.href}`);
  }

  const userInitial = user?.full_name?.trim().charAt(0).toUpperCase() || "C";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[16rem] lg:flex-col lg:border-r lg:border-sidebar-line lg:bg-sidebar lg:px-3 lg:py-5">
        <Brand />
        <nav className="mt-7 flex-1 space-y-6 overflow-y-auto">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-sidebar-muted/70">
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item)}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <AccountFooter
          user={user}
          userInitial={userInitial}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
        />
      </aside>

      <div className="lg:col-start-2">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
              <Compass aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight text-ink">
              CareerPilot
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink transition hover:bg-surface-muted"
            aria-label="Open navigation"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[88vw] flex-col border-r border-sidebar-line bg-sidebar px-4 py-5 shadow-lift">
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-ink"
                  aria-label="Close navigation"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-7 flex-1 space-y-6 overflow-y-auto">
                {navigation.map((group) => (
                  <div key={group.label}>
                    <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-sidebar-muted/70">
                      {group.label}
                    </p>
                    <div className="mt-2 space-y-1">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.href}
                          item={item}
                          active={isActive(item)}
                          onNavigate={() => setMobileOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
              <AccountFooter
                user={user}
                userInitial={userInitial}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
              />
            </aside>
          </div>
        ) : null}

        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Compass aria-hidden="true" className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-bold tracking-tight text-ink">
          CareerPilot
        </span>
        <span className="block text-[0.68rem] font-medium text-sidebar-muted">
          Career intelligence
        </span>
      </span>
    </Link>
  );
}

function NavLink({
  item,
  active,
  onNavigate
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-brand-50 text-brand-700"
          : "text-sidebar-muted hover:bg-surface-muted hover:text-ink"
      }`}
    >
      <Icon
        aria-hidden="true"
        className={`h-4 w-4 ${active ? "text-brand-600" : "text-sidebar-muted group-hover:text-ink"}`}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function AccountFooter({
  user,
  userInitial,
  isLoggingOut,
  onLogout
}: {
  user: ApiUser | null;
  userInitial: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="mt-6 border-t border-sidebar-line pt-4">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-ink">
          {userInitial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {user?.full_name || "CareerPilot user"}
          </p>
          <p className="truncate text-xs text-sidebar-muted">
            {user?.email || "Signed in"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        className="mt-1 flex w-full items-center justify-start gap-2 rounded-md px-3 py-2 text-sm font-semibold text-sidebar-muted transition hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
