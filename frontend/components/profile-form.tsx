"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  getProfile,
  ProfilePayload,
  ProfileResponse,
  saveProfile
} from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState, errorMessage } from "@/components/ui/error-state";
import { LoadingState, Spinner } from "@/components/ui/loading-state";
import { TextField, TextareaField } from "@/components/ui/field";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required."),
  description: z.string().trim().max(4000),
  technologiesText: z.string(),
  link: z.string().trim().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

const experienceSchema = z.object({
  organization: z.string().trim().min(1, "Organization is required."),
  position: z.string().trim().min(1, "Position is required."),
  description: z.string().trim().max(4000),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

const profileSchema = z.object({
  full_name: z.string().trim().max(255),
  school: z.string().trim().max(255),
  program: z.string().trim().max(255),
  graduation_year: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce
      .number({ invalid_type_error: "Enter a year, like 2027." })
      .int("Enter a year, like 2027.")
      .min(1900, "Enter a year between 1900 and 2100.")
      .max(2100, "Enter a year between 1900 and 2100.")
      .nullable()
  ),
  targetRolesText: z.string(),
  preferredLocationsText: z.string(),
  technicalSkillsText: z.string(),
  softSkillsText: z.string(),
  courseworkText: z.string(),
  career_goals: z
    .string()
    .trim()
    .max(4000, "Keep career goals under 4,000 characters."),
  projects: z.array(projectSchema),
  experiences: z.array(experienceSchema)
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const emptyProject = {
  name: "",
  description: "",
  technologiesText: "",
  link: "",
  start_date: "",
  end_date: ""
};

const emptyExperience = {
  organization: "",
  position: "",
  description: "",
  start_date: "",
  end_date: ""
};

const schoolSuggestions = [
  "University of Waterloo",
  "University of Toronto",
  "Toronto Metropolitan University",
  "York University",
  "McMaster University",
  "Western University",
  "Queen's University",
  "University of British Columbia",
  "McGill University",
  "Carleton University",
  "University of Ottawa",
  "Wilfrid Laurier University"
];

const programSuggestions = [
  "Computer Science",
  "Software Engineering",
  "Computer Engineering",
  "Data Science",
  "Mathematics",
  "Statistics",
  "Information Technology",
  "Management Engineering",
  "Systems Design Engineering",
  "Business Administration",
  "Economics",
  "Honors Mathematics"
];

const roleSuggestions = [
  "Software Engineer Intern",
  "Full Stack Developer Intern",
  "Backend Developer Intern",
  "Frontend Developer Intern",
  "AI Engineer Intern",
  "Machine Learning Intern",
  "Data Analyst Intern",
  "Data Scientist Intern",
  "Product Manager Intern",
  "Business Analyst Intern",
  "QA Engineer Intern",
  "DevOps Intern"
];

const locationSuggestions = [
  "Toronto, ON",
  "Waterloo, ON",
  "Kitchener, ON",
  "Ottawa, ON",
  "Vancouver, BC",
  "Montreal, QC",
  "Calgary, AB",
  "New York, NY",
  "San Francisco, CA",
  "Seattle, WA",
  "Remote",
  "Hybrid"
];

const technicalSkillSuggestions = [
  "Python",
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "FastAPI",
  "SQL",
  "PostgreSQL",
  "Git",
  "Docker",
  "AWS",
  "Machine Learning",
  "Data Structures",
  "Algorithms",
  "REST APIs"
];

const softSkillSuggestions = [
  "Communication",
  "Teamwork",
  "Leadership",
  "Problem solving",
  "Adaptability",
  "Time management",
  "Critical thinking",
  "Attention to detail",
  "Collaboration",
  "Public speaking",
  "Mentorship",
  "Ownership"
];

function splitLines(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function splitTags(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function joinLines(values: string[]): string {
  return values.join("\n");
}

function toDateOrNull(value?: string): string | null {
  return value?.trim() ? value : null;
}

function toFormValues(profile: ProfileResponse): ProfileFormValues {
  return {
    full_name: profile.full_name,
    school: profile.school,
    program: profile.program,
    graduation_year: profile.graduation_year,
    targetRolesText: joinLines(profile.target_roles),
    preferredLocationsText: joinLines(profile.preferred_locations),
    technicalSkillsText: joinLines(profile.technical_skills),
    softSkillsText: joinLines(profile.soft_skills),
    courseworkText: joinLines(profile.coursework),
    career_goals: profile.career_goals,
    projects: profile.projects.map((project) => ({
      name: project.name,
      description: project.description,
      technologiesText: joinLines(project.technologies),
      link: project.link ?? "",
      start_date: project.start_date ?? "",
      end_date: project.end_date ?? ""
    })),
    experiences: profile.experiences.map((experience) => ({
      organization: experience.organization,
      position: experience.position,
      description: experience.description,
      start_date: experience.start_date ?? "",
      end_date: experience.end_date ?? ""
    }))
  };
}

function toPayload(values: ProfileFormValues): ProfilePayload {
  return {
    full_name: values.full_name,
    school: values.school,
    program: values.program,
    graduation_year: values.graduation_year ?? null,
    target_roles: splitTags(values.targetRolesText),
    preferred_locations: splitTags(values.preferredLocationsText),
    technical_skills: splitTags(values.technicalSkillsText),
    soft_skills: splitTags(values.softSkillsText),
    coursework: splitLines(values.courseworkText),
    career_goals: values.career_goals,
    projects: values.projects.map((project) => ({
      name: project.name,
      description: project.description,
      technologies: splitLines(project.technologiesText),
      link: project.link?.trim() || null,
      start_date: toDateOrNull(project.start_date),
      end_date: toDateOrNull(project.end_date)
    })),
    experiences: values.experiences.map((experience) => ({
      organization: experience.organization,
      position: experience.position,
      description: experience.description,
      start_date: toDateOrNull(experience.start_date),
      end_date: toDateOrNull(experience.end_date)
    }))
  };
}

export function ProfileForm() {
  const queryClient = useQueryClient();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      school: "",
      program: "",
      graduation_year: null,
      targetRolesText: "",
      preferredLocationsText: "",
      technicalSkillsText: "",
      softSkillsText: "",
      courseworkText: "",
      career_goals: "",
      projects: [],
      experiences: []
    }
  });
  const errors = form.formState.errors;

  const projectFields = useFieldArray({
    control: form.control,
    name: "projects"
  });
  const experienceFields = useFieldArray({
    control: form.control,
    name: "experiences"
  });
  const watchedSchool = useWatch({ control: form.control, name: "school" });
  const watchedProgram = useWatch({ control: form.control, name: "program" });
  const watchedTargetRoles = useWatch({
    control: form.control,
    name: "targetRolesText"
  });
  const watchedPreferredLocations = useWatch({
    control: form.control,
    name: "preferredLocationsText"
  });
  const watchedTechnicalSkills = useWatch({
    control: form.control,
    name: "technicalSkillsText"
  });
  const watchedSoftSkills = useWatch({
    control: form.control,
    name: "softSkillsText"
  });
  const targetRoles = useMemo(
    () => splitTags(watchedTargetRoles),
    [watchedTargetRoles]
  );
  const preferredLocations = useMemo(
    () => splitTags(watchedPreferredLocations),
    [watchedPreferredLocations]
  );
  const technicalSkills = useMemo(
    () => splitTags(watchedTechnicalSkills),
    [watchedTechnicalSkills]
  );
  const softSkills = useMemo(
    () => splitTags(watchedSoftSkills),
    [watchedSoftSkills]
  );

  useEffect(() => {
    if (profileQuery.data) {
      form.reset(toFormValues(profileQuery.data));
    }
  }, [form, profileQuery.data]);

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) => saveProfile(toPayload(values)),
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
      form.reset(toFormValues(profile));
      setSavedMessage("Profile saved.");
      setIsEditing(false);
    }
  });

  if (profileQuery.isLoading) {
    return <LoadingState label="Loading your profile" rows={4} />;
  }

  if (profileQuery.isError) {
    return (
      <ErrorState
        message="Your profile couldn't be loaded. If this keeps happening, sign out and back in."
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  if (profileQuery.data?.id && !isEditing) {
    return (
      <ProfileSummary
        profile={profileQuery.data}
        savedMessage={savedMessage}
        onEdit={() => {
          form.reset(toFormValues(profileQuery.data));
          setIsEditing(true);
          setSavedMessage(null);
        }}
      />
    );
  }

  const hasSavedProfile = Boolean(profileQuery.data?.id);

  return (
    <form
      className="space-y-8"
      noValidate
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      {!hasSavedProfile ? (
        <p className="max-w-prose text-body text-ink-2">
          Start with your target roles and skills. Job matching and interview
          prep use them first, and everything else can be added later.
        </p>
      ) : null}

      <FormSection
        title="About you"
        description="Shown at the top of your profile."
      >
        <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
          <TextField
            label="Full name"
            autoComplete="name"
            registration={form.register("full_name")}
            error={errors.full_name?.message}
          />
          <TextField
            label="Graduation year"
            type="number"
            placeholder="e.g. 2027"
            registration={form.register("graduation_year")}
            error={errors.graduation_year?.message}
          />
          <SuggestionChipField
            label="School"
            values={watchedSchool ? [watchedSchool] : []}
            suggestions={schoolSuggestions}
            placeholder="Type your school"
            onChange={(values) =>
              form.setValue("school", values[0] ?? "", {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          />
          <SuggestionChipField
            label="Degree or program"
            values={watchedProgram ? [watchedProgram] : []}
            suggestions={programSuggestions}
            placeholder="Type your program"
            onChange={(values) =>
              form.setValue("program", values[0] ?? "", {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          />
        </div>
      </FormSection>

      <FormSection
        title="What you're looking for"
        description="Job search ranks results against these."
      >
        <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
          <SuggestionChipField
            label="Target roles"
            values={targetRoles}
            suggestions={roleSuggestions}
            placeholder="Type a role"
            allowMultiple
            onChange={(values) =>
              form.setValue("targetRolesText", joinLines(values), {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          />
          <SuggestionChipField
            label="Preferred locations"
            values={preferredLocations}
            suggestions={locationSuggestions}
            placeholder="Type a location"
            allowMultiple
            onChange={(values) =>
              form.setValue("preferredLocationsText", joinLines(values), {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          />
          <TextareaField
            className="md:col-span-2"
            label="Career goals"
            rows={3}
            placeholder="e.g. Backend work on data-heavy products, ideally on a small team."
            hint="A sentence or two in your own words."
            registration={form.register("career_goals")}
            error={errors.career_goals?.message}
          />
        </div>
      </FormSection>

      <FormSection
        title="Skills and coursework"
        description="Used to match you to postings and to spot gaps before an interview."
      >
        <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
          <SuggestionChipField
            label="Technical skills"
            values={technicalSkills}
            suggestions={technicalSkillSuggestions}
            placeholder="Type a skill"
            allowMultiple
            onChange={(values) =>
              form.setValue("technicalSkillsText", joinLines(values), {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          />
          <SuggestionChipField
            label="Soft skills"
            values={softSkills}
            suggestions={softSkillSuggestions}
            placeholder="Type a soft skill"
            allowMultiple
            onChange={(values) =>
              form.setValue("softSkillsText", joinLines(values), {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          />
          <TextareaField
            className="md:col-span-2"
            label="Relevant coursework"
            rows={4}
            placeholder={"e.g. Data Structures\nDatabase Systems"}
            hint="One course per line, or separate them with commas."
            registration={form.register("courseworkText")}
          />
        </div>
      </FormSection>

      <FormSection
        title="Projects"
        action={
          <button
            type="button"
            onClick={() => projectFields.append(emptyProject)}
            className="button button-secondary button-sm"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add project
          </button>
        }
      >
        {projectFields.fields.length === 0 ? (
          <p className="text-sm text-muted">
            No projects yet. Class, personal and hackathon projects all count.
          </p>
        ) : (
          <ol className="space-y-4">
            {projectFields.fields.map((field, index) => {
              const fieldErrors = errors.projects?.[index];
              return (
                <li
                  key={field.id}
                  className="rounded-xl border border-line bg-canvas p-4 sm:p-5"
                >
                  <ItemHeader
                    title={`Project ${index + 1}`}
                    removeLabel={`Remove project ${index + 1}`}
                    onRemove={() => projectFields.remove(index)}
                  />
                  <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
                    <TextField
                      label="Name"
                      required
                      registration={form.register(`projects.${index}.name`)}
                      error={fieldErrors?.name?.message}
                    />
                    <TextField
                      label="Link"
                      type="url"
                      placeholder="https://"
                      registration={form.register(`projects.${index}.link`)}
                      error={fieldErrors?.link?.message}
                    />
                    <TextField
                      label="Start date"
                      type="date"
                      registration={form.register(
                        `projects.${index}.start_date`
                      )}
                    />
                    <TextField
                      label="End date"
                      type="date"
                      hint="Leave empty if it's ongoing."
                      registration={form.register(`projects.${index}.end_date`)}
                    />
                    <TextareaField
                      label="Technologies"
                      rows={3}
                      hint="One per line, or separate them with commas."
                      registration={form.register(
                        `projects.${index}.technologiesText`
                      )}
                    />
                    <TextareaField
                      label="Description"
                      rows={3}
                      registration={form.register(
                        `projects.${index}.description`
                      )}
                      error={fieldErrors?.description?.message}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </FormSection>

      <FormSection
        title="Experience"
        action={
          <button
            type="button"
            onClick={() => experienceFields.append(emptyExperience)}
            className="button button-secondary button-sm"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add experience
          </button>
        }
      >
        {experienceFields.fields.length === 0 ? (
          <p className="text-sm text-muted">
            No experience yet. Jobs, internships, research and volunteer roles
            all count.
          </p>
        ) : (
          <ol className="space-y-4">
            {experienceFields.fields.map((field, index) => {
              const fieldErrors = errors.experiences?.[index];
              return (
                <li
                  key={field.id}
                  className="rounded-xl border border-line bg-canvas p-4 sm:p-5"
                >
                  <ItemHeader
                    title={`Experience ${index + 1}`}
                    removeLabel={`Remove experience ${index + 1}`}
                    onRemove={() => experienceFields.remove(index)}
                  />
                  <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
                    <TextField
                      label="Position"
                      required
                      registration={form.register(
                        `experiences.${index}.position`
                      )}
                      error={fieldErrors?.position?.message}
                    />
                    <TextField
                      label="Organization"
                      required
                      registration={form.register(
                        `experiences.${index}.organization`
                      )}
                      error={fieldErrors?.organization?.message}
                    />
                    <TextField
                      label="Start date"
                      type="date"
                      registration={form.register(
                        `experiences.${index}.start_date`
                      )}
                    />
                    <TextField
                      label="End date"
                      type="date"
                      hint="Leave empty if you're still there."
                      registration={form.register(
                        `experiences.${index}.end_date`
                      )}
                    />
                    <TextareaField
                      className="md:col-span-2"
                      label="Description"
                      rows={3}
                      registration={form.register(
                        `experiences.${index}.description`
                      )}
                      error={fieldErrors?.description?.message}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-canvas/95 px-4 py-4 backdrop-blur-sm sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
        {mutation.isError ? (
          <p role="alert" className="mb-3 text-sm text-danger">
            {errorMessage(
              mutation.error,
              "Your profile didn't save. Try again."
            )}
          </p>
        ) : Object.keys(errors).length > 0 ? (
          <p role="alert" className="mb-3 text-sm text-danger">
            Some fields need attention. They&apos;re marked above.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="button button-primary"
          >
            {mutation.isPending ? <Spinner className="h-4 w-4" /> : null}
            {mutation.isPending ? "Saving…" : "Save profile"}
          </button>
          {hasSavedProfile ? (
            <button
              type="button"
              onClick={() => {
                if (profileQuery.data) {
                  form.reset(toFormValues(profileQuery.data));
                }
                mutation.reset();
                setIsEditing(false);
              }}
              className="button button-ghost"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="surface p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="section-title">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-meta text-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ItemHeader({
  title,
  removeLabel,
  onRemove
}: {
  title: string;
  removeLabel: string;
  onRemove: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="button button-danger button-sm"
      >
        Remove
      </button>
    </div>
  );
}

function formatProfileDate(value: string | null): string {
  if (!value) return "Present";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function dateRange(start: string | null, end: string | null) {
  if (!start && !end) return null;
  if (!start) return `Until ${formatProfileDate(end)}`;
  return `${formatProfileDate(start)} – ${formatProfileDate(end)}`;
}

function ProfileSummary({
  profile,
  savedMessage,
  onEdit
}: {
  profile: ProfileResponse;
  savedMessage: string | null;
  onEdit: () => void;
}) {
  const headlineParts = [
    profile.program,
    profile.school,
    profile.graduation_year ? `Class of ${profile.graduation_year}` : ""
  ].filter(Boolean);
  const name = profile.full_name || "Your profile";

  return (
    <div className="space-y-6">
      {savedMessage ? (
        <p role="status" className="text-sm font-medium text-success">
          {savedMessage}
        </p>
      ) : null}

      <section
        aria-labelledby="profile-name"
        className="surface overflow-hidden"
      >
        <div className="flex flex-col gap-5 border-b border-line bg-accent-deep px-5 py-6 text-cream sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-highlight font-serif text-3xl italic text-ink"
            >
              {name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2
                id="profile-name"
                className="font-serif text-title-1 font-medium leading-tight text-cream"
              >
                {name}
              </h2>
              <p className="mt-1 text-sm leading-6 text-cream-muted">
                {headlineParts.length > 0
                  ? headlineParts.join(" · ")
                  : "School and program not set"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="button bg-cream text-ink hover:bg-white focus-visible:outline-cream sm:flex-none"
          >
            Edit profile
          </button>
        </div>

        {profile.career_goals ? (
          <blockquote className="border-b border-line px-5 py-5 sm:px-6">
            <p className="max-w-prose border-l-2 border-highlight pl-4 font-serif text-lg italic leading-7 text-ink">
              {profile.career_goals}
            </p>
          </blockquote>
        ) : null}

        <dl className="grid gap-x-8 gap-y-6 px-5 py-6 sm:px-6 lg:grid-cols-2">
          <ChipGroup title="Target roles" values={profile.target_roles} />
          <ChipGroup
            title="Preferred locations"
            values={profile.preferred_locations}
          />
          <ChipGroup
            title="Technical skills"
            values={profile.technical_skills}
            tone="brand"
          />
          <ChipGroup title="Soft skills" values={profile.soft_skills} />
          <ChipGroup
            title="Relevant coursework"
            values={profile.coursework}
            className="lg:col-span-2"
          />
        </dl>
      </section>

      <SummarySection title="Projects" count={profile.projects.length}>
        {profile.projects.length > 0 ? (
          <ol className="divide-y divide-line">
            {profile.projects.map((project, index) => {
              const range = dateRange(project.start_date, project.end_date);
              return (
                <li
                  key={`${project.name}-${index}`}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-body font-semibold text-ink">
                      {project.link ? (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm hover:text-accent"
                        >
                          {project.name}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        project.name
                      )}
                    </h3>
                    {range ? (
                      <p className="tabular flex-none text-meta text-muted">
                        {range}
                      </p>
                    ) : null}
                  </div>
                  {project.description ? (
                    <p className="mt-1.5 max-w-prose whitespace-pre-wrap text-sm leading-6 text-ink-2">
                      {project.description}
                    </p>
                  ) : null}
                  {project.technologies.length > 0 ? (
                    <ul
                      className="mt-3 flex flex-wrap gap-1.5"
                      aria-label="Technologies"
                    >
                      {project.technologies.map((technology) => (
                        <li key={technology} className="badge badge-neutral">
                          {technology}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState
            title="No projects yet"
            description="Projects give interview prep something concrete to point to. Add them with Edit profile."
          />
        )}
      </SummarySection>

      <SummarySection title="Experience" count={profile.experiences.length}>
        {profile.experiences.length > 0 ? (
          <ol className="divide-y divide-line">
            {profile.experiences.map((experience, index) => {
              const range = dateRange(
                experience.start_date,
                experience.end_date
              );
              return (
                <li
                  key={`${experience.organization}-${experience.position}-${index}`}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-body font-semibold text-ink">
                      {experience.position}
                      <span className="font-normal text-muted">
                        {" "}
                        at {experience.organization}
                      </span>
                    </h3>
                    {range ? (
                      <p className="tabular flex-none text-meta text-muted">
                        {range}
                      </p>
                    ) : null}
                  </div>
                  {experience.description ? (
                    <p className="mt-1.5 max-w-prose whitespace-pre-wrap text-sm leading-6 text-ink-2">
                      {experience.description}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState
            title="No experience yet"
            description="Jobs, internships, research and volunteer roles all count. Add them with Edit profile."
          />
        )}
      </SummarySection>
    </div>
  );
}

function ChipGroup({
  title,
  values,
  tone = "neutral",
  className = ""
}: {
  title: string;
  values: string[];
  tone?: "neutral" | "brand";
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-meta font-medium text-muted">{title}</dt>
      <dd className="mt-2">
        {values.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {values.map((value) => (
              <li
                key={value}
                className={`badge h-7 px-3 text-meta ${
                  tone === "brand" ? "badge-brand" : "badge-neutral"
                }`}
              >
                {value}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Not added yet</p>
        )}
      </dd>
    </div>
  );
}

function SummarySection({
  title,
  count,
  children
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="surface p-5 sm:p-6">
      <h2 id={headingId} className="section-title mb-4">
        {title}
        {count > 0 ? (
          <span className="ml-2 font-serif text-count font-medium text-muted">
            {count}
          </span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}

function SuggestionChipField({
  label,
  values,
  suggestions,
  placeholder,
  allowMultiple = false,
  onChange
}: {
  label: string;
  values: string[];
  suggestions: string[];
  placeholder: string;
  allowMultiple?: boolean;
  onChange: (values: string[]) => void;
}) {
  const id = useId();
  const [inputValue, setInputValue] = useState("");
  const normalizedValues = useMemo(
    () => new Set(values.map((value) => value.toLowerCase())),
    [values]
  );
  const filteredSuggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    return suggestions
      .filter((suggestion) => {
        if (normalizedValues.has(suggestion.toLowerCase())) return false;
        if (!query) return true;
        return suggestion.toLowerCase().includes(query);
      })
      .slice(0, 6);
  }, [inputValue, normalizedValues, suggestions]);

  function addValue(value: string) {
    const cleaned = value.trim();
    if (!cleaned) return;
    if (allowMultiple) {
      if (!normalizedValues.has(cleaned.toLowerCase())) {
        onChange([...values, cleaned]);
      }
    } else {
      onChange([cleaned]);
    }
    setInputValue("");
  }

  function removeValue(value: string) {
    onChange(values.filter((item) => item !== value));
  }

  const typed = inputValue.trim();
  const showAddTyped = typed && !normalizedValues.has(typed.toLowerCase());

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="rounded-lg border border-line-strong bg-surface px-2 py-1.5 transition-shadow focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20">
        {values.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 px-1 pb-1.5 pt-0.5">
            {values.map((value) => (
              <li
                key={value}
                className="inline-flex h-7 max-w-full items-center gap-1 rounded-full bg-accent-subtle pl-3 pr-1 text-meta font-medium text-accent"
              >
                <span className="truncate">{value}</span>
                <button
                  type="button"
                  onClick={() => removeValue(value)}
                  aria-label={`Remove ${value}`}
                  className="flex h-5 w-5 flex-none items-center justify-center rounded-full hover:bg-accent hover:text-white"
                >
                  <X aria-hidden="true" className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <input
          id={id}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue(inputValue || filteredSuggestions[0] || "");
            }
          }}
          placeholder={placeholder}
          aria-describedby={`${id}-hint`}
          className="h-7 w-full border-0 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-muted focus-visible:outline-none"
        />
      </div>
      <p id={`${id}-hint`} className="sr-only">
        Press Enter to add. Suggestions follow.
      </p>
      {filteredSuggestions.length > 0 || showAddTyped ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {showAddTyped ? (
            <button
              type="button"
              onClick={() => addValue(inputValue)}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-accent px-2.5 text-meta font-medium text-accent hover:bg-accent-subtle"
            >
              <Plus aria-hidden="true" className="h-3 w-3" />
              Add &ldquo;{typed}&rdquo;
            </button>
          ) : null}
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addValue(suggestion)}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-line px-2.5 text-meta text-ink-2 transition-colors hover:border-accent hover:text-accent"
            >
              <Plus aria-hidden="true" className="h-3 w-3" />
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
