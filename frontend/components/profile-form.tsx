"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type UseFormRegisterReturn
} from "react-hook-form";
import { z } from "zod";

import {
  getProfile,
  ProfilePayload,
  ProfileResponse,
  saveProfile
} from "@/lib/api";

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
    z.coerce.number().int().min(1900).max(2100).nullable()
  ),
  targetRolesText: z.string(),
  preferredLocationsText: z.string(),
  technicalSkillsText: z.string(),
  softSkillsText: z.string(),
  courseworkText: z.string(),
  career_goals: z.string().trim().max(4000),
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
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-lagoon"
        />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
        Unable to load your profile. Please sign in again or retry in a moment.
      </div>
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

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Full name"
            registration={form.register("full_name")}
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
          <TextField
            label="Graduation year"
            type="number"
            registration={form.register("graduation_year")}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
        </div>
      </section>

      <EditableList
        title="Projects"
        emptyLabel="Add project"
        onAdd={() => projectFields.append(emptyProject)}
      >
        {projectFields.fields.length === 0 ? (
          <EmptyState label="No projects yet." />
        ) : null}
        {projectFields.fields.map((field, index) => (
          <article
            key={field.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">
                Project {index + 1}
              </h2>
              <IconButton
                label="Remove project"
                onClick={() => projectFields.remove(index)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Name"
                registration={form.register(`projects.${index}.name`)}
              />
              <TextField
                label="Link"
                type="url"
                registration={form.register(`projects.${index}.link`)}
              />
              <TextField
                label="Start date"
                type="date"
                registration={form.register(`projects.${index}.start_date`)}
              />
              <TextField
                label="End date"
                type="date"
                registration={form.register(`projects.${index}.end_date`)}
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextareaField
                label="Technologies"
                registration={form.register(
                  `projects.${index}.technologiesText`
                )}
              />
              <TextareaField
                label="Description"
                registration={form.register(`projects.${index}.description`)}
              />
            </div>
          </article>
        ))}
      </EditableList>

      <EditableList
        title="Experiences"
        emptyLabel="Add experience"
        onAdd={() => experienceFields.append(emptyExperience)}
      >
        {experienceFields.fields.length === 0 ? (
          <EmptyState label="No experiences yet." />
        ) : null}
        {experienceFields.fields.map((field, index) => (
          <article
            key={field.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">
                Experience {index + 1}
              </h2>
              <IconButton
                label="Remove experience"
                onClick={() => experienceFields.remove(index)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Organization"
                registration={form.register(
                  `experiences.${index}.organization`
                )}
              />
              <TextField
                label="Position"
                registration={form.register(`experiences.${index}.position`)}
              />
              <TextField
                label="Start date"
                type="date"
                registration={form.register(`experiences.${index}.start_date`)}
              />
              <TextField
                label="End date"
                type="date"
                registration={form.register(`experiences.${index}.end_date`)}
              />
            </div>
            <div className="mt-4">
              <TextareaField
                label="Description"
                registration={form.register(`experiences.${index}.description`)}
              />
            </div>
          </article>
        ))}
      </EditableList>

      {mutation.isError ? (
        <div className="rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Unable to save profile."}
        </div>
      ) : null}
      {savedMessage ? (
        <p className="text-sm font-medium text-lagoon">{savedMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {mutation.isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Save aria-hidden="true" className="h-4 w-4" />
        )}
        Save profile
      </button>
    </form>
  );
}

function formatProfileDate(value: string | null): string {
  if (!value) return "Present";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
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

  return (
    <section className="space-y-6">
      {savedMessage ? (
        <p className="text-sm font-medium text-lagoon">{savedMessage}</p>
      ) : null}

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
          Saved profile
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">
          {profile.full_name || "Unnamed profile"}
        </h2>
        {headlineParts.length > 0 ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {headlineParts.join(" - ")}
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <ProfileChipSection
            title="Target roles"
            values={profile.target_roles}
          />
          <ProfileChipSection
            title="Preferred locations"
            values={profile.preferred_locations}
          />
          <ProfileChipSection
            title="Technical skills"
            values={profile.technical_skills}
          />
          <ProfileChipSection
            title="Soft skills"
            values={profile.soft_skills}
          />
        </div>
      </article>

      <SummarySection title="Projects">
        {profile.projects.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {profile.projects.map((project, index) => (
              <article
                key={`${project.name}-${index}`}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-ink">
                  {project.name}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  {formatProfileDate(project.start_date)} -{" "}
                  {formatProfileDate(project.end_date)}
                </p>
                {project.technologies.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.technologies.map((technology) => (
                      <DisplayChip key={technology} value={technology} />
                    ))}
                  </div>
                ) : null}
                {project.description ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {project.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState label="No projects saved yet." />
        )}
      </SummarySection>

      <SummarySection title="Experiences">
        {profile.experiences.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {profile.experiences.map((experience, index) => (
              <article
                key={`${experience.organization}-${experience.position}-${index}`}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-ink">
                  {experience.position}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {experience.organization}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  {formatProfileDate(experience.start_date)} -{" "}
                  {formatProfileDate(experience.end_date)}
                </p>
                {experience.description ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {experience.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState label="No experiences saved yet." />
        )}
      </SummarySection>

      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
      >
        <Pencil aria-hidden="true" className="h-4 w-4" />
        Edit profile
      </button>
    </section>
  );
}

function ProfileChipSection({
  title,
  values
}: {
  title: string;
  values: string[];
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {values.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <DisplayChip key={value} value={value} />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Not set</p>
      )}
    </section>
  );
}

function DisplayChip({ value }: { value: string }) {
  return (
    <span className="rounded-md bg-lagoon/10 px-2.5 py-1.5 text-sm font-medium text-lagoon">
      {value}
    </span>
  );
}

function SummarySection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {children}
    </section>
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...registration}
        type={type}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
      />
    </label>
  );
}

function TextareaField({
  label,
  registration
}: {
  label: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        {...registration}
        rows={4}
        className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
      />
    </label>
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

  return (
    <div className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus-within:border-lagoon focus-within:ring-2 focus-within:ring-lagoon/20">
        {values.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {values.map((value) => (
              <span
                key={value}
                className="inline-flex max-w-full items-center gap-2 rounded-md bg-lagoon/10 px-2.5 py-1.5 text-sm font-medium text-lagoon"
              >
                <span className="truncate">{value}</span>
                <button
                  type="button"
                  onClick={() => removeValue(value)}
                  aria-label={`Remove ${value}`}
                  title={`Remove ${value}`}
                  className="inline-flex h-5 w-5 flex-none items-center justify-center rounded text-lagoon transition hover:bg-lagoon/15 focus:outline-none focus:ring-2 focus:ring-lagoon"
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue(inputValue || filteredSuggestions[0] || "");
            }
          }}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent px-0 py-1 text-sm text-ink outline-none placeholder:text-slate-400"
        />
      </div>
      <div className="mt-2 flex min-h-8 flex-wrap gap-2">
        {filteredSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => addValue(suggestion)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-lagoon/50 hover:text-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            {suggestion}
          </button>
        ))}
        {inputValue.trim() &&
        !normalizedValues.has(inputValue.trim().toLowerCase()) ? (
          <button
            type="button"
            onClick={() => addValue(inputValue)}
            className="rounded-md border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-lagoon/50 hover:text-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
          >
            Add {inputValue.trim()}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EditableList({
  title,
  emptyLabel,
  onAdd,
  children
}: {
  title: string;
  emptyLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {emptyLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function IconButton({
  label,
  onClick
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-coral hover:text-coral focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
    >
      <Trash2 aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
      {label}
    </div>
  );
}
