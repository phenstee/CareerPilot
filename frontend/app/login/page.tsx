import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
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
    <AuthShell
      title="Sign in"
      description="Continue to your private career workspace."
      footer={
        <>
          New here?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-700 hover:text-brand-600"
          >
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm
        mode="login"
        initialError={getAuthErrorMessage(params?.error)}
        nextPath={params?.next ?? null}
      />
    </AuthShell>
  );
}
