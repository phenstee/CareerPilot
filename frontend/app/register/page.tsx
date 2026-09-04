import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

type AuthSearchParams = {
  error?: string;
};

type RegisterPageProps = {
  searchParams?: Promise<AuthSearchParams>;
};

function getAuthErrorMessage(error?: string): string | null {
  if (error === "missing") {
    return "Enter your name, email, and password to create an account.";
  }

  if (error === "duplicate") {
    return "An account with this email already exists.";
  }

  if (error === "beta") {
    return "Enter a valid beta access code to create an account.";
  }

  if (error === "rate-limit") {
    return "Too many registration attempts. Please wait before trying again.";
  }

  if (error === "unavailable") {
    return "CareerPilot could not reach the auth server. Please try again.";
  }

  return null;
}

export default async function RegisterPage({
  searchParams
}: RegisterPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Create account"
      description="Start with secure account access. Profile and tracker data come next."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-700 hover:text-brand-600"
          >
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm
        mode="register"
        initialError={getAuthErrorMessage(params?.error)}
      />
    </AuthShell>
  );
}
