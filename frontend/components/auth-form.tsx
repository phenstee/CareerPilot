"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login, register } from "@/lib/api";
import { sanitizeRedirectPath } from "@/lib/redirects";
import { TextField } from "@/components/ui/field";
import { Spinner } from "@/components/ui/loading-state";

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
        error instanceof Error ? error.message : "That didn't work. Try again."
      );
    }
  }

  function onInvalid() {
    setFormError("Some fields need attention. They're marked above.");
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
          <TextField
            label="Full name"
            autoComplete="name"
            registration={registerField("full_name")}
            error={errors.full_name?.message}
          />
          <TextField
            label="Beta access code"
            autoComplete="off"
            registration={registerField("beta_access_code")}
            error={errors.beta_access_code?.message}
          />
        </>
      ) : null}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        registration={registerField("email")}
        error={errors.email?.message}
      />

      <TextField
        label="Password"
        type="password"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        hint={mode === "register" ? "At least 8 characters." : undefined}
        registration={registerField("password")}
        error={errors.password?.message}
      />

      {formError ? (
        <p role="alert" className="callout-error">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="button button-primary button-lg w-full"
      >
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {mode === "register" ? "Create account" : "Sign in"}
        {!isSubmitting ? (
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        ) : null}
      </button>
    </form>
  );
}
