"use client";

import { useId, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type FieldProps = {
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
};

function FieldFrame({
  id,
  label,
  error,
  hint,
  required,
  className = "",
  children
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-muted">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="form-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="form-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({
  registration,
  type = "text",
  placeholder,
  autoComplete,
  ...field
}: FieldProps & {
  registration: UseFormRegisterReturn;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <FieldFrame id={id} {...field}>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={describedBy(id, field.error, field.hint)}
        aria-required={field.required || undefined}
        className="form-control"
        {...registration}
      />
    </FieldFrame>
  );
}

export function TextareaField({
  registration,
  rows = 4,
  placeholder,
  ...field
}: FieldProps & {
  registration: UseFormRegisterReturn;
  rows?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <FieldFrame id={id} {...field}>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={describedBy(id, field.error, field.hint)}
        aria-required={field.required || undefined}
        className="form-control"
        {...registration}
      />
    </FieldFrame>
  );
}
