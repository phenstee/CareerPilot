"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";

import { createJob, JobPosting, JobPostingPayload, updateJob } from "@/lib/api";

const jobSchema = z.object({
  title: z.string().trim().min(1, "Job title is required.").max(255),
  company: z.string().trim().min(1, "Company is required.").max(255),
  location: z.string().trim().max(255),
  job_url: z.string().trim().max(1000).optional(),
  employment_type: z.string().trim().max(100),
  description: z
    .string()
    .trim()
    .min(1, "Job description is required.")
    .max(20000),
  notes: z.string().trim().max(10000)
});

type JobFormValues = z.infer<typeof jobSchema>;

type JobFormProps = {
  job?: JobPosting;
};

export function JobForm({ job }: JobFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title ?? "",
      company: job?.company ?? "",
      location: job?.location ?? "",
      job_url: job?.job_url ?? "",
      employment_type: job?.employment_type ?? "",
      description: job?.description ?? "",
      notes: job?.notes ?? ""
    }
  });

  const mutation = useMutation({
    mutationFn: (values: JobFormValues) => {
      const payload: JobPostingPayload = {
        ...values,
        job_url: values.job_url?.trim() || null
      };
      return job ? updateJob(job.id, payload) : createJob(payload);
    },
    onSuccess: (savedJob) => {
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.setQueryData(["job", savedJob.id], savedJob);
      router.push(`/jobs/${savedJob.id}`);
      router.refresh();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to save job."
      );
    }
  });

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <section className="surface p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Job title" registration={form.register("title")} />
          <TextField label="Company" registration={form.register("company")} />
          <TextField
            label="Location"
            registration={form.register("location")}
          />
          <TextField
            label="Employment type"
            registration={form.register("employment_type")}
          />
          <TextField
            label="Job URL"
            type="url"
            registration={form.register("job_url")}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TextareaField
            label="Full job description"
            rows={12}
            registration={form.register("description")}
          />
          <TextareaField
            label="Notes"
            rows={12}
            registration={form.register("notes")}
          />
        </div>
      </section>

      {formError ? (
        <div className="callout-error">
          {formError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="button button-primary"
      >
        {mutation.isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Save aria-hidden="true" className="h-4 w-4" />
        )}
        {job ? "Save changes" : "Save job"}
      </button>
    </form>
  );
}

function TextField({
  label,
  type = "text",
  registration
}: {
  label: string;
  type?: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <input
        {...registration}
        type={type}
        className="form-control mt-2"
      />
    </label>
  );
}

function TextareaField({
  label,
  rows,
  registration
}: {
  label: string;
  rows: number;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <textarea
        {...registration}
        rows={rows}
        className="form-control mt-2"
      />
    </label>
  );
}
