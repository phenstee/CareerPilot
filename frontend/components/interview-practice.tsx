"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Loader2,
  Mic,
  Send,
  Sparkles
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AsyncTask,
  answerInterviewQuestion,
  createInterviewSession,
  InterviewQuestion,
  InterviewSession,
  listInterviewSessions
} from "@/lib/api";
import {
  InsightSummary,
  RecommendationPanel
} from "@/components/insights";

const categoryLabels: Record<InterviewQuestion["category"], string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  job_description: "Job description",
  projects_resume: "Projects and resume"
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function InterviewPractice() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<AsyncTask | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ["interviews", params.id],
    queryFn: () => listInterviewSessions(params.id)
  });

  const sessions = useMemo(
    () => sessionsQuery.data?.items ?? [],
    [sessionsQuery.data?.items]
  );
  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === selectedSessionId) ??
      sessions[0] ??
      null,
    [selectedSessionId, sessions]
  );
  const activeQuestion = activeSession?.questions[questionIndex] ?? null;

  const createMutation = useMutation({
    mutationFn: () => createInterviewSession(params.id, setActiveTask),
    onSuccess: (session) => {
      setSelectedSessionId(session.id);
      setQuestionIndex(0);
      setAnswerText("");
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["interviews", params.id] });
    },
    onError: (error) => {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to generate interview prep."
      );
    }
  });

  const answerMutation = useMutation({
    mutationFn: () => {
      if (!activeSession || !activeQuestion) {
        throw new Error("Choose a question first.");
      }
      return answerInterviewQuestion({
        sessionId: activeSession.id,
        questionId: activeQuestion.id,
        answerText
      });
    },
    onSuccess: () => {
      setAnswerText("");
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["interviews", params.id] });
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to submit answer."
      );
    }
  });

  if (sessionsQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-border bg-surface">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-brand-600"
        />
      </div>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <div className="callout-error">
        Unable to load interview prep.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="surface p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
            <Mic aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Interview sessions
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Generate questions from this application, then practice one answer
              at a time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="button button-primary mt-5 w-full"
        >
          {createMutation.isPending ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          )}
          Generate prep session
        </button>

        {sessions.length > 0 ? (
          <div className="mt-5 space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => {
                  setSelectedSessionId(session.id);
                  setQuestionIndex(0);
                  setAnswerText("");
                }}
                className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
                  activeSession?.id === session.id
                    ? "border-brand-500 bg-brand-50 text-ink"
                    : "border-border bg-surface text-muted hover:border-border-strong"
                }`}
              >
                <span className="block font-semibold">
                  {session.questions.length} questions
                </span>
                <span className="mt-1 block text-xs text-muted-subtle">
                  {formatDate(session.created_at)} - {session.provider}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-border-strong bg-surface-muted p-4 text-sm leading-6 text-muted">
            No interview prep sessions yet.
          </div>
        )}
      </aside>

      <section className="space-y-5">
        {formError ? (
          <div className="callout-error">
            {formError}
          </div>
        ) : null}

        <InterviewTaskStatus task={activeTask} />

        {activeSession && activeQuestion ? (
          <>
            <SessionOverview session={activeSession} />

            <article className="surface p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="page-eyebrow">
                    Question {questionIndex + 1} of{" "}
                    {activeSession.questions.length}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">
                    {categoryLabels[activeQuestion.category]}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionIndex((value) => Math.max(0, value - 1))
                    }
                    disabled={questionIndex === 0}
                    className="button button-secondary h-10 w-10 px-0"
                    aria-label="Previous question"
                  >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionIndex((value) =>
                        Math.min(activeSession.questions.length - 1, value + 1)
                      )
                    }
                    disabled={
                      questionIndex === activeSession.questions.length - 1
                    }
                    className="button button-secondary h-10 w-10 px-0"
                    aria-label="Next question"
                  >
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-5 text-xl leading-8 text-ink">
                {activeQuestion.question_text}
              </p>
              {activeQuestion.rationale ? (
                <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-sm leading-6 text-muted">
                  {activeQuestion.rationale}
                </p>
              ) : null}

              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  answerMutation.mutate();
                }}
              >
                <label className="block">
                  <span className="form-label">
                    Practice answer
                  </span>
                  <textarea
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    rows={9}
                    placeholder="Type your answer here..."
                    className="form-control mt-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={
                    answerMutation.isPending || answerText.trim().length === 0
                  }
                  className="button button-primary mt-4"
                >
                  {answerMutation.isPending ? (
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                  ) : (
                    <Send aria-hidden="true" className="h-4 w-4" />
                  )}
                  Submit for feedback
                </button>
              </form>
            </article>

            <FeedbackPanel question={activeQuestion} />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface p-8 text-sm leading-6 text-muted">
            Generate an interview prep session to start practicing.
          </div>
        )}
      </section>
    </div>
  );
}

function InterviewTaskStatus({ task }: { task: AsyncTask | null }) {
  if (!task) {
    return null;
  }

  const text =
    task.status === "QUEUED"
      ? "Queued..."
      : task.status === "RUNNING"
        ? "Generating..."
        : task.status === "RETRYING"
          ? `Temporary issue - retrying (${task.attempt_count}/${task.max_attempts})...`
          : task.status === "SUCCEEDED"
            ? "Completed."
            : (task.last_error_message ?? "Generation failed. Try again.");

  return (
    <div className="callout-info">
      {text}
    </div>
  );
}

function SessionOverview({ session }: { session: InterviewSession }) {
  return (
    <>
      <InsightSummary
        title={session.job_title}
        description={`Interview prep for ${session.company}.`}
        strengths={session.strong_topics}
        gaps={session.weak_areas}
      />
      <RecommendationPanel
        title="Preparation plan"
        items={session.preparation_plan}
      />
    </>
  );
}

function FeedbackPanel({ question }: { question: InterviewQuestion }) {
  const latestAnswer = question.answers.at(-1);

  return (
    <article className="surface p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" className="h-4 w-4 text-ai-deep" />
        <h3 className="text-lg font-semibold text-ink">Answer feedback</h3>
      </div>
      {latestAnswer ? (
        <>
          <p className="mt-2 text-xs text-muted-subtle">
            {formatDate(latestAnswer.created_at)} - {latestAnswer.provider}
          </p>
          <p className="mt-4 rounded-xl border border-ai-soft bg-ai-soft/70 px-4 py-3 text-sm leading-6 text-ink">
            {latestAnswer.feedback.overall_feedback}
          </p>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <FeedbackGroup
              title="Strong"
              items={latestAnswer.feedback.strong_points}
              tone="success"
            />
            <FeedbackGroup
              title="Unclear"
              items={latestAnswer.feedback.unclear_points}
              tone="warning"
            />
            <FeedbackGroup
              title="Missing"
              items={latestAnswer.feedback.missing_points}
              tone="danger"
            />
            <FeedbackGroup
              title="Stronger structure"
              items={latestAnswer.feedback.stronger_answer_structure}
              tone="brand"
            />
            <FeedbackGroup
              title="Improved outline"
              items={latestAnswer.feedback.improved_outline}
              tone="ai"
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted">
          Submit an answer for this question to see structured feedback.
        </p>
      )}
    </article>
  );
}

function FeedbackGroup({
  title,
  items,
  tone
}: {
  title: string;
  items: string[];
  tone: "success" | "warning" | "danger" | "brand" | "ai";
}) {
  const toneStyles = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    brand: "text-brand-600",
    ai: "text-ai-deep"
  } as const;

  if (items.length === 0) return null;

  return (
    <details className="group rounded-xl border border-border bg-surface p-4 transition hover:border-brand-100">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-[0.1em] ${toneStyles[tone]}`}>
            {title}
          </span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-bold text-muted">
            {items.length}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 text-muted-subtle transition group-open:rotate-180"
        />
      </summary>
      <ul className="mt-3 space-y-2 border-t border-border pt-3">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex gap-2 text-sm leading-6 text-muted"
          >
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-current opacity-50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
