import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

type AuthSearchParams = {
  error?: string;
  next?: string;
};

type LoginPageProps = {
  searchParams?: Promise<AuthSearchParams>;
};

function getAuthErrorMessage(error?: string): string | null {
  if (error === "missing") {
    return "Enter your email and password to sign in.";
  }

  if (error === "invalid") {
    return "Invalid email or password.";
  }

  if (error === "rate-limit") {
    return "Too many sign-in attempts. Please wait before trying again.";
  }

  if (error === "unavailable") {
    return "CareerPilot could not reach the auth server. Please try again.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
          CareerPilot
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Continue to your private career workspace.
        </p>
        <div className="mt-6">
          <AuthForm
            mode="login"
            initialError={getAuthErrorMessage(params?.error)}
            nextPath={params?.next ?? null}
          />
        </div>
        <p className="mt-5 text-sm text-slate-600">
          New here?{" "}
          <Link
            href="/register"
            className="font-semibold text-lagoon hover:text-teal-800"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
