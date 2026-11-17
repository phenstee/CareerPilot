"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
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
import { InsightSummary, RecommendationPanel } from "@/components/insights";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState, Spinner } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

const categoryLabels: Record<InterviewQuestion["category"], string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  job_description: "Job description",
  projects_resume: "Projects and resume"
};

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

  const header = (
    <PageHeader
      breadcrumb={{
        href: `/applications/${params.id}`,
        label: activeSession?.job_title ?? "Application"
      }}
      title="Interview practice"
      description={
        activeSession
          ? `${activeSession.job_title} at ${activeSession.company}. Answer one question at a time and get feedback on each.`
          : "Generate questions written for this application, then answer one at a time and get feedback on each."
      }
    />
  );

  if (sessionsQuery.isPending) {
    return (
      <>
        {header}
        <LoadingState label="Loading practice sessions" rows={3} />
      </>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <>
        {header}
        <ErrorState
          message="Your practice sessions didn't load. Check your connection and try again."
          onRetry={() => sessionsQuery.refetch()}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-sidebar">
        <aside className="min-w-0 space-y-4">
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="button button-primary w-full"
          >
            {createMutation.isPending ? <Spinner /> : null}
            Generate practice questions
          </button>
          <InterviewTaskStatus task={activeTask} />

          <div>
            <h2 className="mb-2 text-sm font-semibold text-ink">Sessions</h2>
            {sessions.length > 0 ? (
              <div className="surface divide-y divide-line overflow-hidden">
                {sessions.map((session) => {
                  const active = activeSession?.id === session.id;
                  return (
                    <button
                      key={session.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setQuestionIndex(0);
                        setAnswerText("");
                      }}
                      className={`relative block w-full px-4 py-3 text-left text-sm transition-colors duration-150 ${
                        active
                          ? "bg-accent-subtle before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-accent before:content-['']"
                          : "hover:bg-canvas"
                      }`}
                    >
                      <span className="block font-medium text-ink">
                        {session.questions.length}{" "}
                        {session.questions.length === 1
                          ? "question"
                          : "questions"}
                      </span>
                      <span className="tabular mt-0.5 block text-meta text-muted">
                        {formatDateTime(session.created_at)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">No sessions yet.</p>
            )}
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          {formError ? (
            <p role="alert" className="callout-error">
              {formError}
            </p>
          ) : null}

          {activeSession && activeQuestion ? (
            <>
              <article
                aria-labelledby="question-heading"
                className="surface p-5 sm:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-meta font-medium text-ink-2">
                    <span className="tabular">
                      Question {questionIndex + 1} of{" "}
                      {activeSession.questions.length}
                    </span>
                    <span aria-hidden="true"> · </span>
                    {categoryLabels[activeQuestion.category]}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionIndex((value) => Math.max(0, value - 1))
                      }
                      disabled={questionIndex === 0}
                      className="button button-secondary button-sm w-8 px-0"
                      aria-label="Previous question"
                    >
                      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionIndex((value) =>
                          Math.min(
                            activeSession.questions.length - 1,
                            value + 1
                          )
                        )
                      }
                      disabled={
                        questionIndex === activeSession.questions.length - 1
                      }
                      className="button button-secondary button-sm w-8 px-0"
                      aria-label="Next question"
                    >
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h2
                  id="question-heading"
                  className="mt-4 font-serif text-2xl font-medium leading-snug text-ink"
                >
                  {activeQuestion.question_text}
                </h2>
                {activeQuestion.rationale ? (
                  <p className="mt-3 text-sm leading-6 text-ink-2">
                    <span className="font-medium text-ink">
                      Why it&apos;s asked:
                    </span>{" "}
                    {activeQuestion.rationale}
                  </p>
                ) : null}

                <form
                  className="mt-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    answerMutation.mutate();
                  }}
                >
                  <label htmlFor="practice-answer" className="form-label">
                    Your answer
                  </label>
                  <textarea
                    id="practice-answer"
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    rows={9}
                    placeholder="Answer as you would out loud. A rough draft is fine."
                    className="form-control"
                  />
                  <button
                    type="submit"
                    disabled={
                      answerMutation.isPending || answerText.trim().length === 0
                    }
                    className="button button-primary mt-4"
                  >
                    {answerMutation.isPending ? <Spinner /> : null}
                    Get feedback
                  </button>
                </form>
              </article>

              <FeedbackPanel question={activeQuestion} />
              <SessionOverview session={activeSession} />
            </>
          ) : (
            <EmptyState
              title="No practice questions yet"
              description="Generate a set of questions for this application. They're based on the posting, your profile and your resume."
              action={
                <Link
                  href={`/applications/${params.id}`}
                  className="button button-secondary"
                >
                  Back to application
                </Link>
              }
            />
          )}
        </section>
      </div>
    </>
  );
}

function InterviewTaskStatus({ task }: { task: AsyncTask | null }) {
  if (!task) {
    return null;
  }

  const text =
    task.status === "QUEUED"
      ? "Queued…"
      : task.status === "RUNNING"
        ? "Generating…"
        : task.status === "RETRYING"
          ? `Temporary issue, retrying (${task.attempt_count} of ${task.max_attempts})…`
          : task.status === "SUCCEEDED"
            ? "Done."
            : (task.last_error_message ?? "Generation failed. Try again.");
  const failed = task.status === "FAILED";
  const working = !failed && task.status !== "SUCCEEDED";

  return (
    <p
      role="status"
      className={`flex items-center gap-2 text-sm ${
        failed ? "callout-error" : "text-ink-2"
      }`}
    >
      {working ? <Spinner className="h-4 w-4 text-accent" /> : null}
      {text}
    </p>
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
    <article aria-labelledby="feedback-heading" className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="feedback-heading" className="section-title">
          Feedback on your answer
        </h3>
        {latestAnswer ? (
          <p className="tabular text-meta text-muted">
            {formatDateTime(latestAnswer.created_at)}
          </p>
        ) : null}
      </div>
      {latestAnswer ? (
        <>
          <p className="mt-4 rounded-lg bg-accent-subtle px-4 py-3 text-sm leading-6 text-ink">
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
          Answer this question to see what was strong, what was unclear and what
          was missing.
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
    success: "bg-success",
    warning: "bg-highlight",
    danger: "bg-danger",
    brand: "bg-accent",
    ai: "bg-stage-prep"
  } as const;

  if (items.length === 0) return null;

  return (
    <details className="group rounded-lg border border-line bg-surface" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${toneStyles[tone]}`}
          />
          <span className="text-sm font-semibold text-ink">{title}</span>
          <span className="tabular text-meta text-muted">{items.length}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 text-muted transition-transform duration-150 group-open:rotate-180"
        />
      </summary>
      <ul className="space-y-2 border-t border-line px-4 pb-4 pt-3">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex gap-2 text-sm leading-6 text-ink-2"
          >
            <span
              aria-hidden="true"
              className="mt-2.5 h-1 w-1 flex-none rounded-full bg-muted"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
