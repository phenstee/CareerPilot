"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login, register } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.")
});

const registerSchema = loginSchema.extend({
  full_name: z.string().trim().min(1, "Your name is required.")
});

type AuthFormValues = {
  full_name?: string;
  email: string;
  password: string;
};

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AuthFormValues>({
    resolver: zodResolver(mode === "register" ? registerSchema : loginSchema),
    defaultValues:
      mode === "register"
        ? { full_name: "", email: "", password: "" }
        : { email: "", password: "" }
  });

  async function onSubmit(values: AuthFormValues) {
    setFormError(null);

    try {
      if (mode === "register") {
        await register({
          full_name: values.full_name ?? "",
          email: values.email,
          password: values.password
        });
      } else {
        await login({ email: values.email, password: values.password });
      }

      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.push(nextPath ?? "/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to authenticate."
      );
    }
  }

  function onInvalid() {
    setFormError("Please fix the highlighted fields and try again.");
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onInvalid)}>
      {mode === "register" ? (
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Full name</span>
          <input
            {...registerField("full_name")}
            autoComplete="name"
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          />
          {errors.full_name ? (
            <span className="mt-1 block text-sm text-coral">
              {errors.full_name.message}
            </span>
          ) : null}
        </label>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          {...registerField("email")}
          type="email"
          autoComplete="email"
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
        />
        {errors.email ? (
          <span className="mt-1 block text-sm text-coral">
            {errors.email.message}
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          {...registerField("password")}
          type="password"
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
        />
        {errors.password ? (
          <span className="mt-1 block text-sm text-coral">
            {errors.password.message}
          </span>
        ) : null}
      </label>

      {formError ? (
        <div className="rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
          {formError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : null}
        {mode === "register" ? "Create account" : "Sign in"}
        {!isSubmitting ? (
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        ) : null}
      </button>
    </form>
  );
}
