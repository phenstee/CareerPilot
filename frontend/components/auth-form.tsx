"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login, register } from "@/lib/api";
import { sanitizeRedirectPath } from "@/lib/redirects";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.")
});

const registerSchema = loginSchema.extend({
  full_name: z.string().trim().min(1, "Your name is required."),
  beta_access_code: z.string().trim().optional()
});

type AuthFormValues = {
  full_name?: string;
  beta_access_code?: string;
  email: string;
  password: string;
};

type AuthFormProps = {
  mode: "login" | "register";
  initialError?: string | null;
  nextPath?: string | null;
};

export function AuthForm({
  mode,
  initialError = null,
  nextPath
}: AuthFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(initialError);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AuthFormValues>({
    resolver: zodResolver(mode === "register" ? registerSchema : loginSchema),
    defaultValues:
      mode === "register"
        ? { full_name: "", email: "", password: "", beta_access_code: "" }
        : { email: "", password: "" }
  });

  async function onSubmit(values: AuthFormValues) {
    setFormError(null);

    try {
      if (mode === "register") {
        await register({
          full_name: values.full_name ?? "",
          email: values.email,
          password: values.password,
          beta_access_code: values.beta_access_code
        });
      } else {
        await login({ email: values.email, password: values.password });
      }

      const redirectPath =
        nextPath ?? new URLSearchParams(window.location.search).get("next");
      router.push(sanitizeRedirectPath(redirectPath));
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
    <form
      action={
        mode === "register"
          ? "/api/auth/fallback-register"
          : "/api/auth/fallback-login"
      }
      className="space-y-5"
      method="post"
      onSubmit={handleSubmit(onSubmit, onInvalid)}
    >
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      {mode === "register" ? (
        <>
          <label className="block">
            <span className="form-label">Full name</span>
            <input
              {...registerField("full_name")}
              autoComplete="name"
              className="form-control mt-2"
            />
            {errors.full_name ? (
              <span className="mt-1 block text-sm text-danger">
                {errors.full_name.message}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="form-label">Beta access code</span>
            <input
              {...registerField("beta_access_code")}
              autoComplete="off"
              className="form-control mt-2"
            />
          </label>
        </>
      ) : null}

      <label className="block">
        <span className="form-label">Email</span>
        <input
          {...registerField("email")}
          type="email"
          autoComplete="email"
          className="form-control mt-2"
        />
        {errors.email ? (
          <span className="mt-1 block text-sm text-danger">
            {errors.email.message}
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="form-label">Password</span>
        <input
          {...registerField("password")}
          type="password"
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
          className="form-control mt-2"
        />
        {errors.password ? (
          <span className="mt-1 block text-sm text-danger">
            {errors.password.message}
          </span>
        ) : null}
      </label>

      {formError ? (
        <div className="callout-error">
          {formError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="button button-primary w-full"
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
