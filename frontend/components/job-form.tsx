"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createJob, JobPosting, JobPostingPayload, updateJob } from "@/lib/api";
import { TextareaField, TextField } from "@/components/ui/field";
import { Spinner } from "@/components/ui/loading-state";

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
  onCancel?: () => void;
};

export function JobForm({ job, onCancel }: JobFormProps) {
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

  const errors = form.formState.errors;

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <section className="surface p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Job title"
            required
            placeholder="e.g. Backend Engineering Intern"
            error={errors.title?.message}
            registration={form.register("title")}
          />
          <TextField
            label="Company"
            required
            error={errors.company?.message}
            registration={form.register("company")}
          />
          <TextField
            label="Location"
            placeholder="e.g. Toronto, ON or Remote"
            error={errors.location?.message}
            registration={form.register("location")}
          />
          <TextField
            label="Employment type"
            placeholder="e.g. Internship"
            error={errors.employment_type?.message}
            registration={form.register("employment_type")}
          />
          <TextField
            label="Posting URL"
            type="url"
            placeholder="https://"
            className="md:col-span-2"
            error={errors.job_url?.message}
            registration={form.register("job_url")}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TextareaField
            label="Full job description"
            required
            rows={12}
            hint="Paste the whole posting. Prep and matching read from it."
            error={errors.description?.message}
            registration={form.register("description")}
          />
          <TextareaField
            label="Notes"
            rows={12}
            error={errors.notes?.message}
            registration={form.register("notes")}
          />
        </div>
      </section>

      {formError ? (
        <p role="alert" className="callout-error">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="button button-primary"
        >
          {mutation.isPending ? <Spinner /> : null}
          {job ? "Save changes" : "Save job"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="button button-ghost"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
