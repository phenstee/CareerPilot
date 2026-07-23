"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  CareerTask,
  CareerTaskPayload,
  createTask,
  deleteTask,
  listApplications,
  listTasks,
  TASK_PRIORITIES,
  TaskPriority,
  updateTask,
  completeTask
} from "@/lib/api";

type TaskFormState = Omit<CareerTaskPayload, "suggested_deadline"> & {
  suggested_deadline: string;
};

const emptyTask: TaskFormState = {
  application_id: null,
  title: "",
  explanation: "",
  priority: "Medium",
  estimated_effort: "",
  related_skill: "",
  suggested_deadline: "",
  is_completed: false
};

function formatDate(value: string | null): string {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function todayDateOnly(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function isTaskOverdue(task: CareerTask): boolean {
  if (task.is_completed || !task.suggested_deadline) return false;
  return new Date(`${task.suggested_deadline}T00:00:00`) < todayDateOnly();
}

function toFormState(task: CareerTask): TaskFormState {
  return {
    application_id: task.application_id,
    title: task.title,
    explanation: task.explanation,
    priority: task.priority,
    estimated_effort: task.estimated_effort,
    related_skill: task.related_skill,
    suggested_deadline: task.suggested_deadline ?? "",
    is_completed: task.is_completed
  };
}

function toPayload(values: TaskFormState): CareerTaskPayload {
  return {
    ...values,
    suggested_deadline: values.suggested_deadline || null
  };
}

export function TasksManager() {
  const queryClient = useQueryClient();
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [editingTask, setEditingTask] = useState<CareerTask | null>(null);
  const [values, setValues] = useState<TaskFormState>(emptyTask);
  const [formError, setFormError] = useState<string | null>(null);
  const tasksQuery = useQuery({
    queryKey: ["tasks", includeCompleted],
    queryFn: () => listTasks({ include_completed: includeCompleted })
  });
  const applicationsQuery = useQuery({
    queryKey: ["applications", "task-options"],
    queryFn: () => listApplications()
  });

  const openTasks = useMemo(
    () => (tasksQuery.data?.items ?? []).filter((task) => !task.is_completed),
    [tasksQuery.data?.items]
  );
  const overdueTasks = useMemo(
    () => (tasksQuery.data?.items ?? []).filter(isTaskOverdue),
    [tasksQuery.data?.items]
  );

  const saveMutation = useMutation({
    mutationFn: (nextValues: TaskFormState) =>
      editingTask
        ? updateTask(editingTask.id, toPayload(nextValues))
        : createTask(toPayload(nextValues)),
    onSuccess: () => {
      setFormError(null);
      setEditingTask(null);
      setValues(emptyTask);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to save task."
      );
    }
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  function startEditing(task: CareerTask) {
    setEditingTask(task);
    setValues(toFormState(task));
    setFormError(null);
  }

  function cancelEditing() {
    setEditingTask(null);
    setValues(emptyTask);
    setFormError(null);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate(values);
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">
            {editingTask ? "Edit task" : "New task"}
          </h2>
          {editingTask ? (
            <button
              type="button"
              onClick={cancelEditing}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Cancel
            </button>
          ) : null}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input
            value={values.title}
            onChange={(event) =>
              setValues({ ...values, title: event.target.value })
            }
            required
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Priority</span>
            <select
              value={values.priority}
              onChange={(event) =>
                setValues({
                  ...values,
                  priority: event.target.value as TaskPriority
                })
              }
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Suggested deadline
            </span>
            <input
              value={values.suggested_deadline}
              onChange={(event) =>
                setValues({
                  ...values,
                  suggested_deadline: event.target.value
                })
              }
              type="date"
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">
            Related application
          </span>
          <select
            value={values.application_id ?? ""}
            onChange={(event) =>
              setValues({
                ...values,
                application_id: event.target.value || null
              })
            }
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          >
            <option value="">No application</option>
            {applicationsQuery.data?.items.map((application) => (
              <option key={application.id} value={application.id}>
                {application.company} - {application.job_title}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Related skill
            </span>
            <input
              value={values.related_skill}
              onChange={(event) =>
                setValues({ ...values, related_skill: event.target.value })
              }
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">
            Explanation
          </span>
          <textarea
            value={values.explanation}
            onChange={(event) =>
              setValues({ ...values, explanation: event.target.value })
            }
            rows={6}
            className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          />
        </label>

        <label className="mt-4 flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            checked={values.is_completed}
            onChange={(event) =>
              setValues({ ...values, is_completed: event.target.checked })
            }
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-lagoon focus:ring-lagoon"
          />
          Completed
        </label>

        {formError ? (
          <div className="mt-4 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saveMutation.isPending ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : editingTask ? (
            <Save aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Plus aria-hidden="true" className="h-4 w-4" />
          )}
          {editingTask ? "Save task" : "Create task"}
        </button>
      </form>

      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-ink">
                {openTasks.length} open task{openTasks.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Prioritize deadlines, interview prep, follow-ups, and skill
                work.
              </p>
            </div>
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                {overdueTasks.length} overdue task
                {overdueTasks.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-xs text-red-700/80">
                Past suggested deadline and still open
              </p>
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              checked={includeCompleted}
              onChange={(event) => setIncludeCompleted(event.target.checked)}
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-lagoon focus:ring-lagoon"
            />
            Show completed
          </label>
        </div>

        {tasksQuery.isLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Loader2
              aria-hidden="true"
              className="h-5 w-5 animate-spin text-lagoon"
            />
          </div>
        ) : null}

        {tasksQuery.isError ? (
          <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
            Unable to load tasks.
          </div>
        ) : null}

        {tasksQuery.data && tasksQuery.data.total === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            No tasks in this view.
          </div>
        ) : null}

        <div className="grid gap-3">
          {tasksQuery.data?.items.map((task) => {
            const overdue = isTaskOverdue(task);
            return (
              <article
                key={task.id}
                className={`rounded-lg border bg-white p-4 shadow-sm ${
                  overdue ? "border-red-200" : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-lagoon/10 px-2 py-1 text-xs font-semibold text-lagoon">
                        {task.priority}
                      </span>
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                          <AlertTriangle
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                          Overdue
                        </span>
                      ) : null}
                      {task.is_completed ? (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          Completed
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-ink">
                      {task.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {task.application_company
                        ? `${task.application_company} - ${task.application_role}`
                        : task.related_skill || "General career task"}
                    </p>
                    {task.explanation ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {task.explanation}
                      </p>
                    ) : null}
                    <p
                      className={`mt-3 text-sm ${
                        overdue
                          ? "font-semibold text-red-700"
                          : "text-slate-500"
                      }`}
                    >
                      {formatDate(task.suggested_deadline)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {!task.is_completed ? (
                      <button
                        type="button"
                        onClick={() => completeMutation.mutate(task.id)}
                        disabled={completeMutation.isPending}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-lagoon hover:text-lagoon focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                        Complete
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => startEditing(task)}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(task.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-coral hover:text-coral focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
