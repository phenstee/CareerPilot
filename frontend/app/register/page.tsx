import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
          CareerPilot
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Create account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Start with secure account access. Profile and tracker data arrive
          next.
        </p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-lagoon hover:text-teal-800"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
